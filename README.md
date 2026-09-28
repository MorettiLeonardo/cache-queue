# Questionnaire Backend — does a write-behind queue actually make an API scale?

A quiz API built as a testbed for one question: **if you stop writing to PostgreSQL on
the request path and stage everything in Redis behind a BullMQ queue, how much more
load can the service take?**

The interesting part is not the architecture. It is that the first honest measurement
said **no** — the queued version served *fewer* complete quiz sessions than the
synchronous one it was supposed to beat. Finding out why, and fixing it, is what this
repository documents.

> Learning project. Everything below was measured on a single Node process with
> PostgreSQL, Redis and the load generator sharing one laptop. The absolute numbers
> belong to that machine; the comparison between the two architectures is what
> transfers.

---

## Stack

Node.js · TypeScript · Express 5 · PostgreSQL 16 · Redis 7 · BullMQ · Grafana k6 · Docker

## The two architectures

Both live behind a single environment flag, so an A/B run differs in exactly one thing.

**`WRITE_BEHIND=false` — synchronous**

```
POST /answer  →  5 PostgreSQL queries  →  200 OK
POST /finish  →  5 PostgreSQL queries  →  200 completed (score included)
```

**`WRITE_BEHIND=true` — write-behind**

```
POST /answer  →  Redis HSETNX          →  200 OK          (0 queries)
POST /finish  →  snapshot → BullMQ     →  202 processing  (0 queries, score included)
                      ↓
                  worker process → one transaction per participation
```

`processing` exists only in the cache. The PostgreSQL `CHECK` constraint still sees
only `in_progress` or `completed`, so the change needed no migration.

Duplicate answers are rejected atomically by `HSETNX`, and the worker is idempotent:
answers insert with `ON CONFLICT DO NOTHING`, the participation row is taken
`FOR UPDATE`, completion is guarded on `status <> 'completed'`, and the score is
recomputed from `user_answers` rather than trusted from the job payload. A job may
safely run twice.

---

## Round 1 — 500 virtual users

One quiz journey = 10 HTTP requests and ~37 sequential PostgreSQL queries.

| | Synchronous | Write-behind | |
|---|---|---|---|
| Throughput | 1,320 req/s | **2,004 req/s** | +51.8% |
| Quiz sessions completed | 16,874 | **25,066** | +48.5% |
| p(95) latency | 464 ms | **240 ms** | −48.2% |
| `POST /answer` average | 315.5 ms | **139.9 ms** | −55.7% |
| Errors | 0 | 0 | |

A convincing win. Ship it.

## Round 2 — 1,000 virtual users, where it fell apart

| | Synchronous | Write-behind | |
|---|---|---|---|
| Throughput | 1,695 req/s | **3,386 req/s** | +99.7% |
| p(95) latency | 786 ms | **139 ms** | −82.3% |
| `POST /answer` average | 537.0 ms | **97.1 ms** | −81.9% |
| **Quiz sessions completed** | 21,659 | **22,683** | **+4.7%** |
| Journey duration | 4,506 ms | 4,303 ms | −4.5% |
| Thresholds passed | 9 / 9 | **8 / 9** | |

Throughput doubled and every individual request got four to five times faster — yet
only 4.7% more people finished a quiz, and the end-to-end journey barely moved.

Worse, comparing against round 1: the write-behind build served **25,066 sessions at
500 VUs and only 22,683 at 1,000 VUs**. Doubling the users made it serve 9.5% *fewer*
complete sessions. The synchronous build, over the same change, went *up* 28%.

### Why

Two causes, both self-inflicted.

**1. 95% of the extra throughput was the design talking to itself.** `POST /finish`
returned `202 processing` without the score, so every client polled
`GET /participations/:id` until the worker committed. That poll count went from 1 per
journey to **11.02**, adding 228,334 requests — 95% of the entire throughput gain.
The capacity freed by removing database queries was immediately eaten by the polling
that removal created.

| Requests | Synchronous | Write-behind |
|---|---|---|
| Total | 238,250 | 476,824 |
| `GET /participations/:id` (polling) | 21,659 | **249,993** |
| Everything else | 216,591 | 226,831 |

**2. The worker was inside the API process.** "Move the work off the request path"
had moved it onto the same single-threaded event loop. Finalization lag went from
306 ms at 500 VUs to **3,121 ms** at 1,000 VUs, and p(95) crossed the 5 s threshold
at 5,632 ms — the one failure in the table above.

The tell was `GET /health`, which touches neither database nor cache: **7.8 ms → 15.5
ms**. The bottleneck had moved from PostgreSQL connection-pool queueing — where
requests wait *idle* — to CPU on the event loop, where they do not.

---

## The two fixes

**Return the score from `/finish`.** The staged answers are already in Redis when
finish is called, so the score is known right there. Nobody needs to wait for
durability to see their result. Polling dropped from 11.02 per journey to a 5%
instrumentation sample.

**Run the worker as its own process.** `npm run worker`, with the API started as
`RUN_WORKER=false`. The flag already existed; the entrypoint did not.

## Round 3 — measuring capacity properly

Rounds 1 and 2 used a **closed model**: a fixed VU count with think time. There,
throughput is a *result* of latency, so it can never answer "how many users can this
hold" — only "how fast do these N users cycle".

Round 3 uses an **open model** (`constant-arrival-rate`): journeys arrive at a fixed
rate whether or not the server keeps up, and `dropped_iterations` reports the moment
capacity runs out.

| Arrival rate | Sync delivered | Sync dropped | Sync journey | Queue delivered | Queue dropped | Queue journey |
|---|---|---|---|---|---|---|
| 150/s | 149.8/s | 0 | 46 ms | 149.1/s | 0 | 39 ms |
| **250/s** | **147.0/s** | **1,626** | **5,480 ms** | **248.5/s** | **0** | **70 ms** |
| 350/s | 179.4/s | 5,817 | 8,869 ms | 293.5/s | 1,116 | 2,812 ms |
| 450/s | 176.6/s | 9,680 | 9,341 ms | 296.0/s | 4,653 | 5,121 ms |
| 550/s | 183.4/s | 13,637 | 9,780 ms | 304.0/s | 8,273 | 5,437 ms |

**Sustained ceiling: ~150–180 journeys/s synchronous, ~250–300 with the queue — about
+67%.**

At 250/s, the load where the synchronous build collapses, the queued build delivers
248.5 of 250 requested with a 70 ms journey, against a 5,480 ms journey and 1,626
dropped sessions. That is the comparison round 2 failed to produce.

**And below ~150 journeys/s the two are equivalent** — 46 ms against 39 ms, zero drops
either way. The queue only starts paying for itself above that line.

## Round 4 — 5,000 virtual users

| | Synchronous | Write-behind | |
|---|---|---|---|
| Quiz sessions completed | 23,864 | **42,679** | +78.9% |
| Throughput | 1,758 req/s | **3,038 req/s** | +72.8% |
| Journey average | 19,756 ms | **11,126 ms** | −43.7% |
| Journey p(95) | 27,551 ms | **15,947 ms** | −42.1% |
| `POST /answer` average | 2,855 ms | **167 ms** | −94.2% |
| Thresholds passed | 4 / 9 | **6 / 9** | |

The closed model at 5,000 VUs delivered 170 and 305 journeys/s — landing on exactly
the plateaus the open-model sweep had found independently. Two different methods,
same ceiling.

Worth stating plainly: **neither build is healthy here.** An 11-second journey is not
a service doing its job. 5,000 VUs is roughly 5× the sustainable rate, and what this
round measures is which architecture degrades more gracefully.

One more caveat about that number: a k6 VU is not a person. It runs a whole quiz in
milliseconds and repeats; a human takes minutes. By Little's Law, 150 journeys/s with
a 3-minute quiz is about **27,000 people taking the quiz simultaneously**. The 5,000
VUs in this round are closer to 100,000 real users than to 5,000.

---

## Durability

Write-behind is only acceptable if every staged answer survives. Row counts taken
directly from PostgreSQL before and after each run, checked against k6's own counters:

| Run | Sessions (DB Δ / k6) | Answers (DB Δ / k6) |
|---|---|---|
| Capacity sweep | 55,961 / 55,961 | 279,805 / 279,805 |

Exact in every run. Zero duplicate rows, zero participations with `score >
total_questions`, zero failed jobs, and the score returned by `/finish` matched what
k6 graded locally across every journey of every run — **0 mismatches**.

### The trade-off that only appeared at 5,000 VUs

Durability is deferred until `/finish`. Journeys abandoned mid-flight — VUs killed
during ramp-down — left **714 answers across 222 participations in Redis only**, held
by the cache TTL and never persisted. The synchronous build had already written those
to PostgreSQL the moment they were submitted.

That is not a bug; it is the definition of write-behind. What 5,000 VUs revealed is
that "deferred" becomes "at risk" when clients disappear under overload. Closing it
needs a sweeper that finalizes `in_progress` participations holding staged answers.

---

## What I take away from this

**A queue is a shock absorber for bursts, not a capacity multiplier.** If the worker
consumes slower than producers produce, the queue grows without bound and the latency
goes with it. It defers work; it does not create throughput.

**A queue does not make requests free.** Accepting the connection, parsing JSON,
routing, validating and responding all stay on the event loop. `/health` getting
*slower* while every other endpoint got faster is the whole lesson in one number.

**Watch the metric that means someone was served.** Throughput doubled while the
number of people who finished a quiz stayed flat. Requests per second is an easy
number to improve and an easy number to be fooled by.

**Queue age, not queue depth.** Depth never signalled the problem; finalization lag
did. A queue of 10,000 draining in 2 seconds is healthy; 50 items stuck for 5 minutes
is not.

**Measure the thing you are claiming.** A closed-model test cannot answer a capacity
question no matter how many VUs you add.

## Next steps, in order of measured impact

1. **Cluster the API — one process per core.** The event loop is the wall, and the
   machine has 16 cores serving one. Biggest remaining win, and it benefits both
   architectures.
2. **PgBouncer or a smaller per-process pool.** Prerequisite for the above: N
   processes × a 50-connection pool exhausts `max_connections`. Clustering without
   this trades a bottleneck for an outage.
3. **Cache `GET /api/questions`.** 3 queries per journey and 4,277 ms at 5,000 VUs,
   for a question bank that is static.
4. **Sweeper for orphaned participations.** Closes the 714-answer window above.
5. **Backpressure over unbounded queueing.** At 5,000 VUs everyone waited 11 seconds.
   Serving 300/s within SLO and returning 429 to the rest is the better failure mode —
   shed at the door (`/users`, `/start`), never mid-quiz (`/answer`, `/finish`).

---

## Running it

```bash
docker compose up -d          # PostgreSQL + Redis
npm install
npm run seed                  # 85 questions
npm run dev                   # API on :3000
```

Split the worker out for the write-behind path:

```bash
RUN_WORKER=false npm run dev  # API
npm run worker                # dedicated worker process
```

`curl localhost:3000/health/ready` reports the active mode, Redis status and queue
depth. Load testing lives in [`k6/README.md`](k6/README.md).

## Layout

```
src/
  app/
    cache/        Redis read/write for participations and question grading data
    controllers/  HTTP layer
    queue/        BullMQ queue and finish worker
    repository/   PostgreSQL access
    services/     business rules, both architectures behind WRITE_BEHIND
  config/         database and redis connections, schema bootstrap
  types/          entities, DTOs, service contracts
  server.ts       API entrypoint
  worker.ts       standalone finish worker
k6/               load test, comparison tooling, methodology
```
