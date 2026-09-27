# Before / After — Redis Cache + Finish Queue

Two runs of the **same** `k6/stress-test.js`, same 500-VU profile, same machine,
minutes apart. The only variable is the server's `WRITE_BEHIND` flag.

| | Run A — before | Run B — after |
|---|---|---|
| Mode | `WRITE_BEHIND=false` | `WRITE_BEHIND=true` |
| Answers written | synchronously to PostgreSQL | staged in Redis |
| Finishing | inline, returns 200 `completed` | queued to BullMQ, returns 202 `processing` |
| Worker | disabled | in-process, concurrency 25 |

---

## Headline

| Metric | Before | After | Change |
|---|---|---|---|
| Throughput (req/s) | 1320.18 | **2004.21** | **+51.8%** ✅ |
| Total requests | 185,615 | **281,933** | **+51.9%** ✅ |
| Quiz journeys completed | 16,874 | **25,066** | **+48.5%** ✅ |
| Answers submitted | 84,370 | **125,330** | **+48.5%** ✅ |
| Iterations | 16,874 | **25,066** | **+48.5%** ✅ |

**+51.8% throughput** and **+48.5% completed quiz sessions** — 8,192 more sessions in the same 140 seconds.

---

## Latency (`http_req_duration`)

| Statistic | Before | After | Change |
|---|---|---|---|
| Average | 215.56 ms | **122.41 ms** | **-43.2%** ✅ |
| Median p(50) | 188.81 ms | **136.78 ms** | **-27.6%** ✅ |
| p(90) | 453.30 ms | **215.21 ms** | **-52.5%** ✅ |
| p(95) | 463.93 ms | **240.14 ms** | **-48.2%** ✅ |
| p(99) | 480.64 ms | **276.85 ms** | **-42.4%** ✅ |
| Max | 510.59 ms | **384.66 ms** | **-24.7%** ✅ |
| Server time (TTFB avg) | 215.44 ms | **122.30 ms** | **-43.2%** ✅ |

p(95) improved by **-48.2%**. Network time is negligible in both runs, so TTFB is effectively all server-side work.

---

## Per endpoint

"DB" is the number of *sequential* PostgreSQL round-trips the handler makes in each architecture.

| Endpoint | DB | Avg before | Avg after | p(95) before | p(95) after | Avg change |
|---|---|---|---|---|---|---|
| `GET /health` | 0 → 0 | 9.70 ms | **23.85 ms** | 13.24 ms | **42.29 ms** | **+145.9%** ⚠️ |
| `GET /api/questions` | 3 → 3 | 193.12 ms | **157.91 ms** | 290.03 ms | **298.44 ms** | **-18.2%** ✅ |
| `POST /api/users` | 2 → 2 | 132.70 ms | **115.28 ms** | 198.86 ms | **213.27 ms** | **-13.1%** ✅ |
| `POST /api/participations/start` | 2 → 2 | 132.70 ms | **124.09 ms** | 198.93 ms | **226.41 ms** | **-6.5%** ✅ |
| `POST /api/participations/:id/answer` | 5 → 0 | 315.51 ms | **139.91 ms** | 472.64 ms | **240.68 ms** | **-55.7%** ✅ |
| `POST /api/participations/:id/finish` | 5 → 0 | 193.39 ms | **116.46 ms** | 290.12 ms | **185.03 ms** | **-39.8%** ✅ |
| `GET /api/participations/:id` | 2 → 0 | 131.93 ms | **111.97 ms** | 197.71 ms | **200.96 ms** | **-15.1%** ✅ |

The endpoints that lost their queries are the ones that moved: `/answer` dropped **-55.7%**. `GET /health` touches neither database nor cache, so any change there reflects the Node event loop alone.

---

## Reliability

| Metric | Before | After |
|---|---|---|
| HTTP error rate | 0.00% | **0.00%** |
| Checks passed | 320,606 / 320,606 | **476,254 / 476,254** |
| Journeys aborted | 0 | **0** |
| Journeys never completed | 0 | **0** |

---

## Cost of the new design

Write-behind is not free; these are the figures that pay for the gains above.

| Metric | Value |
|---|---|
| Enqueue latency `POST /finish` p(95) | 185.03 ms |
| Finalization lag avg (202 → durable) | 306.12 ms |
| Finalization lag p(95) | 599.00 ms |
| Finalization lag max | 1001.00 ms |
| Avg polls until completed | 1.25 |
| Extra polling requests vs before | 14,398 |

Finalization lag is sampled by polling, so it is quantized to the poll interval and reads as an **upper bound**. An average of 1.25 polls means most participations were already durable at the first check.

The trade is explicit: **a score that is eventually consistent, by a few hundred milliseconds, in exchange for +51.8% throughput and -48.2% p(95).**

---

## Durability — both runs verified in PostgreSQL

Row deltas measured directly against the database, immediately before and after each run:

| | Run A (before) | Run B (after) |
|---|---|---|
| Participations written | +16,874 | +25,066 |
| Answers written | +84,370 | +125,330 |
| k6 answer counter | 84,370 | 125,330 |
| Match | ✅ exact | ✅ exact |
| Participations left `in_progress` | 0 | 0 |
| `UNIQUE(participation_id, question_id)` violations | 0 | 0 |
| Leftover `participation:*:answers` keys in Redis | n/a | 0 |
| Failed queue jobs | n/a | 0 |

Write-behind persisted **every one of the 125,330 staged answers exactly once**, with no participation left unfinished and no cache key left behind. Peak Redis memory was 20.7 MB against a 512 MB cap.

---

## Reading `GET /health`

It is the only endpoint that got *slower* — 9.70 ms → 23.85 ms (**+146%**) — and it is the most informative number in the comparison. It touches no database and no cache, so its latency is a clean read on how busy the Node process is.

- **Before**, the limit was PostgreSQL **connection-pool queueing**: 500 virtual users contending for a pool capped at 50. Requests spent their time waiting for a connection, not using CPU, so the event loop stayed relatively free and `/health` answered in under 10 ms.
- **After**, that contention is gone — the hot path makes no queries at all. The process now pushes 2,004 req/s through a **single core**, and the event loop itself is the constraint.

The bottleneck moved from the database to the CPU. That reorders what to do next: running Node under `cluster`/PM2 with one worker per core was the third recommendation in the baseline report and is now the first.

---

## Reproduce this comparison

```bash
# Run A — synchronous
WRITE_BEHIND=false npm run start
docker run --rm -v "$PWD/k6:/scripts" -e OUT_DIR=/scripts -e RUN_LABEL=sync \
  grafana/k6:latest run /scripts/stress-test.js

# Run B — write-behind
WRITE_BEHIND=true npm run start
docker run --rm -v "$PWD/k6:/scripts" -e OUT_DIR=/scripts -e RUN_LABEL=writebehind \
  grafana/k6:latest run /scripts/stress-test.js

# Regenerate this document
node k6/compare.js k6/k6-summary-sync.json k6/k6-summary-writebehind.json k6/COMPARISON.md
```

Confirm which mode the server is in at any time with `curl localhost:3000/health/ready` — it reports `"mode": "write-behind"` or `"synchronous"`.

---

*Sections up to "Cost of the new design" are generated by `k6/compare.js` from `k6-summary-sync.json` and `k6-summary-writebehind.json`, and are overwritten when it is re-run. The sections after it were added from direct PostgreSQL and Redis measurements.*
