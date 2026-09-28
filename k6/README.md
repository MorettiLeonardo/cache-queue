# Load testing

`stress-test.js` drives one full quiz journey per iteration:

```
GET  /health
GET  /api/questions?page=1&limit=20
POST /api/users
POST /api/participations/start
POST /api/participations/:id/answer   x5
POST /api/participations/:id/finish
```

That is 10 HTTP requests and ~37 sequential PostgreSQL queries per journey when
`WRITE_BEHIND=false`.

Run artefacts (`k6-summary*.json`, `STRESS_TEST_REPORT*.md`, `COMPARISON*.md`)
are generated on every run and are git-ignored on purpose — they carry
timestamps and would bury every diff. Run the test to regenerate them.

## Load models

The script supports two, and the distinction matters when reading results.

**`EXECUTOR=vus` (default) — closed model.** A fixed number of VUs with think
time. Throughput is a *result* of latency here, so this cannot answer "how many
users can the service hold" — only "how fast do these N users cycle".

```bash
docker run --rm -v "$PWD/k6:/scripts" \
  -e OUT_DIR=/scripts -e RUN_LABEL=sync -e PEAK_VUS=1000 \
  grafana/k6:latest run /scripts/stress-test.js
```

**`EXECUTOR=arrival` — open model.** Journeys arrive at a fixed rate whether or
not the server keeps up. Iterations k6 cannot start on schedule are reported as
`dropped_iterations`, which is the honest signal that capacity ran out. Use this
to find the ceiling: step the rate up until iterations start dropping.

```bash
docker run --rm -v "$PWD/k6:/scripts" \
  -e OUT_DIR=/scripts -e RUN_LABEL=cap-r250 \
  -e EXECUTOR=arrival -e ARRIVAL_RATE=250 -e ARRIVAL_DURATION=40s \
  -e DURABILITY_SAMPLE=0.05 \
  grafana/k6:latest run /scripts/stress-test.js
```

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `BASE_URL` | `http://host.docker.internal:3000` | target API |
| `EXECUTOR` | `vus` | `vus` (closed) or `arrival` (open) |
| `PEAK_VUS` | `500` | peak VUs, closed model only |
| `ARRIVAL_RATE` | `150` | journeys/s, open model only |
| `ARRIVAL_DURATION` | `50s` | hold time, open model only |
| `MAX_VUS` | `2000` | VU ceiling before iterations drop |
| `ANSWERS_PER_JOURNEY` | `5` | questions answered per journey |
| `DURABILITY_SAMPLE` | `1` | fraction of journeys that poll to confirm the answers reached PostgreSQL |
| `RUN_LABEL` | — | suffix for the output files |
| `OUT_DIR` | `/scripts` | where summaries are written |

`DURABILITY_SAMPLE` exists because `POST /finish` returns the final score
directly. The user never waits for the worker, so polling is instrumentation
rather than part of the journey — sampling it keeps the measurement without
generating the load.

## Comparing two runs

```bash
node k6/compare.js k6/k6-summary-sync.json k6/k6-summary-writebehind.json \
  k6/COMPARISON.md
```

Both summaries must come from the same load profile; the point of the
comparison is that only the server architecture differs, and it is selected by
a single flag:

| | `WRITE_BEHIND=false` | `WRITE_BEHIND=true` |
|---|---|---|
| Answers written | synchronously to PostgreSQL | staged in Redis |
| Finishing | inline, 200 `completed` | queued to BullMQ, 202 `processing` |

Check which mode is live with `curl localhost:3000/health/ready`.

## Findings so far

Measured on one Node process, with PostgreSQL, Redis and the load generator all
on the same machine. The absolute numbers are specific to that setup; the
comparison between the two architectures is what transfers.

**Sustained capacity**, from the open-model sweep — the last rate holding zero
dropped iterations:

| Architecture | Ceiling |
|---|---|
| Synchronous | ~150–180 journeys/s |
| Write-behind, worker in its own process | ~250–300 journeys/s |

At 250 journeys/s the synchronous build delivers 147/s and drops 1,626
iterations, with a 5,480 ms journey; write-behind delivers 248.5/s, drops
nothing, and the journey takes 70 ms.

**Below ~150 journeys/s the two are equivalent** (46 ms vs 39 ms journeys, zero
drops either way), so the queue only pays for itself above that.

Two things had to be true before write-behind beat the synchronous path at all:

1. `POST /finish` returns the score straight from the staged answers. Without
   it, clients poll `GET /participations/:id` until the worker commits — 11
   polls per journey at 1,000 VUs, which consumed 95% of the throughput the
   queue had just freed.
2. The worker runs as its own process (`npm run worker`, API with
   `RUN_WORKER=false`). Hosted inside the API it competes for the same event
   loop, and finalization lag went from 306 ms to 3,121 ms between 500 and
   1,000 VUs.

**Known trade-off.** Durability is deferred until `/finish`. Under heavy
overload, journeys abandoned mid-flight leave their answers in Redis only —
714 answers across 222 participations at 5,000 VUs, held by the cache TTL. The
synchronous path had already written those to PostgreSQL. A sweeper that
finalizes `in_progress` participations holding staged answers would close this.
