import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Grafana k6 stress test — Questionnaire Backend
 *
 * Simulates PEAK_VUS concurrent users (default 500) running the full quiz journey:
 *   GET  /health
 *   GET  /api/questions
 *   POST /api/users
 *   POST /api/participations/start
 *   POST /api/participations/:id/answer   (x5, random questions)
 *   POST /api/participations/:id/finish
 *   GET  /api/participations/:id
 */

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const journeysCompleted = new Counter('journeys_completed');
const journeysAborted = new Counter('journeys_aborted');
const journeyFailRate = new Rate('journey_fail_rate');
const journeyDuration = new Trend('journey_duration_ms', true);
const answersSubmitted = new Counter('answers_submitted');
const correctAnswers = new Counter('answers_correct');

// Finishing is asynchronous: the request only enqueues. These measure how long
// the queue actually takes to make a participation durable.
const finalizeLag = new Trend('finalize_lag_ms', true);
const finalizePolls = new Trend('finalize_polls');
const finalizeTimeouts = new Counter('finalize_timeouts');

// The finish response now carries the score. This counts the times it did not
// match what this VU graded locally — it must stay at zero.
const scoreMismatches = new Counter('score_mismatches');
const durabilityChecks = new Counter('durability_checks');


// Per-endpoint latency, so the report can attribute cost to a specific route.
// A Trend carries no sample count in the summary, so each one is paired with a
// Counter to report how many requests hit that endpoint.
function endpointMetric(name) {
  return {
    trend: new Trend(`ep_${name}_ms`, true),
    reqs: new Counter(`ep_${name}_reqs`),
  };
}

const EP = {
  health: endpointMetric('health'),
  list_questions: endpointMetric('list_questions'),
  create_user: endpointMetric('create_user'),
  start_participation: endpointMetric('start_participation'),
  answer: endpointMetric('answer'),
  finish: endpointMetric('finish'),
  get_participation: endpointMetric('get_participation'),
};

function record(key, res) {
  EP[key].trend.add(res.timings.duration);
  EP[key].reqs.add(1);
}

// ---------------------------------------------------------------------------
// Load profile: ramps to PEAK_VUS concurrent virtual users (default 500).
// The shape is fixed — 20% warm-up, 60% ramp, then a 60s sustained peak — so
// runs at different peaks stay comparable to each other.
// ---------------------------------------------------------------------------
const PEAK_VUS = Number(__ENV.PEAK_VUS || 500);
const atPeak = (fraction) => Math.max(1, Math.round(PEAK_VUS * fraction));

// EXECUTOR=vus (default) is a CLOSED model: a fixed VU count with think time.
// Throughput there is a *result* of latency, so it cannot answer "how many
// users can this hold" — only "how fast do these N users cycle".
//
// EXECUTOR=arrival is an OPEN model: journeys arrive at a fixed rate whether or
// not the server keeps up. Iterations k6 cannot start on time are reported as
// dropped_iterations, the honest signal that capacity ran out.
const EXECUTOR = __ENV.EXECUTOR || 'vus';
const ARRIVAL_RATE = Number(__ENV.ARRIVAL_RATE || 150);
const ARRIVAL_DURATION = __ENV.ARRIVAL_DURATION || '50s';
const MAX_VUS = Number(__ENV.MAX_VUS || 2000);

const closedModel = {
  executor: 'ramping-vus',
  gracefulRampDown: '10s',
  stages: [
    { duration: '20s', target: atPeak(0.2) }, // warm-up
    { duration: '20s', target: atPeak(0.6) }, // ramp
    { duration: '20s', target: PEAK_VUS },    // ramp to peak
    { duration: '60s', target: PEAK_VUS },    // sustained peak
    { duration: '20s', target: 0 },           // cool-down
  ],
};

const openModel = {
  executor: 'constant-arrival-rate',
  rate: ARRIVAL_RATE,
  timeUnit: '1s',
  duration: ARRIVAL_DURATION,
  // Journeys are short when the server is healthy, so a small pool covers the
  // rate; k6 grows it toward maxVUs as latency rises, and only reports dropped
  // iterations once even maxVUs cannot keep the schedule.
  preAllocatedVUs: Math.min(MAX_VUS, Math.max(50, ARRIVAL_RATE)),
  maxVUs: MAX_VUS,
  gracefulStop: '20s',
};

export const options = {
  scenarios: { journey: EXECUTOR === 'arrival' ? openModel : closedModel },

  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
    journey_fail_rate: ['rate<0.05'],
    ep_create_user_ms: ['p(95)<1500'],
    ep_answer_ms: ['p(95)<1500'],
    ep_finish_ms: ['p(95)<2000'],
    // End-to-end durability: enqueue -> worker -> visible as completed.
    finalize_lag_ms: ['p(95)<5000'],
    checks: ['rate>0.95'],
  },
  // p(99) is NOT in k6's default trend stats — without this it reports 0.
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false,
  noConnectionReuse: false,
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3000';
const ANSWERS_PER_JOURNEY = Number(__ENV.ANSWERS_PER_JOURNEY || 5);
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// How long a VU waits for the finish queue before giving up (default 10s).
const FINALIZE_POLL_INTERVAL = Number(__ENV.FINALIZE_POLL_INTERVAL || 0.2);
const FINALIZE_MAX_POLLS = Number(__ENV.FINALIZE_MAX_POLLS || 50);

// Fraction of journeys that poll to confirm the answers reached PostgreSQL.
// The user already has their score from the finish response, so this is pure
// instrumentation — sampling it keeps the measurement without the load.
const DURABILITY_SAMPLE = Number(__ENV.DURABILITY_SAMPLE || 1);


// ---------------------------------------------------------------------------
// setup(): build a real question bank from the API instead of hardcoding IDs
// ---------------------------------------------------------------------------
export function setup() {
  const res = http.get(`${BASE_URL}/api/questions?page=1&limit=100`);

  if (res.status !== 200) {
    fail(`setup: cannot reach API at ${BASE_URL} (status ${res.status})`);
  }

  const body = JSON.parse(res.body);
  const bank = (body.data || [])
    .filter((q) => q.options && q.options.length > 0)
    .map((q) => ({ id: q.id, optionIds: q.options.map((o) => o.id) }));

  if (bank.length === 0) {
    fail('setup: question bank is empty — run `npm run seed` before the test');
  }

  console.log(`setup: loaded ${bank.length} questions (total reported: ${body.total})`);
  return { bank, startedAt: new Date().toISOString() };
}

function pickDistinct(bank, count) {
  const pool = bank.slice();
  const picked = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// ---------------------------------------------------------------------------
// Virtual user journey
// ---------------------------------------------------------------------------
export default function (data) {
  const journeyStart = Date.now();
  const bank = data.bank;

  let aborted = false;

  group('01_health', function () {
    const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
    record('health', res);
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('02_list_questions', function () {
    const res = http.get(`${BASE_URL}/api/questions?page=1&limit=20`, {
      tags: { endpoint: 'list_questions' },
    });
    record('list_questions', res);
    const ok = check(res, {
      'questions 200': (r) => r.status === 200,
      'questions payload non-empty': (r) => {
        try {
          const b = JSON.parse(r.body);
          return Array.isArray(b.data) && b.data.length > 0;
        } catch (e) {
          return false;
        }
      },
    });
    if (!ok) aborted = true;
  });

  if (aborted) return abort(journeyStart);

  // --- Create user -----------------------------------------------------------
  let userId;
  group('03_create_user', function () {
    const payload = JSON.stringify({
      name: `k6 user ${__VU}-${__ITER}`,
      email: `k6_${__VU}_${__ITER}_${Date.now()}_${Math.floor(Math.random() * 1e9)}@loadtest.local`,
    });
    const res = http.post(`${BASE_URL}/api/users`, payload, {
      headers: JSON_HEADERS,
      tags: { endpoint: 'create_user' },
    });
    record('create_user', res);
    const ok = check(res, { 'create user 201': (r) => r.status === 201 });
    if (!ok) {
      aborted = true;
      return;
    }
    try {
      userId = JSON.parse(res.body).data.id;
    } catch (e) {
      aborted = true;
    }
  });

  if (aborted || !userId) return abort(journeyStart);

  // --- Start participation ---------------------------------------------------
  let participationId;
  group('04_start_participation', function () {
    const res = http.post(
      `${BASE_URL}/api/participations/start`,
      JSON.stringify({ user_id: userId }),
      { headers: JSON_HEADERS, tags: { endpoint: 'start_participation' } }
    );
    record('start_participation', res);
    const ok = check(res, {
      'start participation 201': (r) => r.status === 201,
      'participation in_progress': (r) => {
        try {
          return JSON.parse(r.body).data.status === 'in_progress';
        } catch (e) {
          return false;
        }
      },
    });
    if (!ok) {
      aborted = true;
      return;
    }
    try {
      participationId = JSON.parse(res.body).data.participation_id;
    } catch (e) {
      aborted = true;
    }
  });

  if (aborted || !participationId) return abort(journeyStart);

  // --- Answer N distinct random questions ------------------------------------
  let localCorrect = 0;

  group('05_answer_questions', function () {
    const questions = pickDistinct(bank, ANSWERS_PER_JOURNEY);

    for (const q of questions) {
      const optionId = q.optionIds[Math.floor(Math.random() * q.optionIds.length)];
      const res = http.post(
        `${BASE_URL}/api/participations/${participationId}/answer`,
        JSON.stringify({ question_id: q.id, selected_option_id: optionId }),
        {
          headers: JSON_HEADERS,
          tags: { endpoint: 'answer', name: 'POST /api/participations/:id/answer' },
        }
      );
      record('answer', res);

      const ok = check(res, {
        'answer 200': (r) => r.status === 200,
        'answer has verdict': (r) => {
          try {
            return typeof JSON.parse(r.body).data.is_correct === 'boolean';
          } catch (e) {
            return false;
          }
        },
      });

      if (ok) {
        answersSubmitted.add(1);
        try {
          if (JSON.parse(res.body).data.is_correct) {
            correctAnswers.add(1);
            localCorrect++;
          }
        } catch (e) {
          // verdict already validated by the check above
        }
      }
    }
  });

  // --- Finish: the score comes back with the response ------------------------
  // The staged answers are already in Redis when /finish is called, so the
  // score is known right there. The queue only has to make it durable.
  let finishOk = false;
  const finishSentAt = Date.now();

  group('06_finish_participation', function () {
    const res = http.post(`${BASE_URL}/api/participations/${participationId}/finish`, null, {
      headers: JSON_HEADERS,
      tags: { endpoint: 'finish', name: 'POST /api/participations/:id/finish' },
    });
    record('finish', res);

    finishOk = check(res, {
      'finish accepted (202/200)': (r) => r.status === 202 || r.status === 200,
      'status processing or completed': (r) => {
        try {
          const s = JSON.parse(r.body).data.status;
          return s === 'processing' || s === 'completed';
        } catch (e) {
          return false;
        }
      },
      'score returned with the response': (r) => {
        try {
          return typeof JSON.parse(r.body).data.score === 'number';
        } catch (e) {
          return false;
        }
      },
      'score matches what k6 graded': (r) => {
        try {
          return JSON.parse(r.body).data.score === localCorrect;
        } catch (e) {
          return false;
        }
      },
    });

    try {
      if (JSON.parse(res.body).data.score !== localCorrect) scoreMismatches.add(1);
    } catch (e) {
      scoreMismatches.add(1);
    }
  });

  // The user has their score at this point. Everything after is instrumentation.
  const userVisibleMs = Date.now() - journeyStart;

  // --- Durability: confirm the worker persisted it, on a sample of journeys --
  let durable = true;

  if (finishOk && Math.random() < DURABILITY_SAMPLE) {
    group('07_verify_durable', function () {
      durable = false;
      durabilityChecks.add(1);
      let polls = 0;

      for (let i = 0; i < FINALIZE_MAX_POLLS; i++) {
        const res = http.get(`${BASE_URL}/api/participations/${participationId}`, {
          tags: { endpoint: 'get_participation', name: 'GET /api/participations/:id' },
        });
        record('get_participation', res);
        polls++;

        if (res.status !== 200) break;

        let status;
        try {
          status = JSON.parse(res.body).data.status;
        } catch (e) {
          break;
        }

        if (status === 'completed') {
          durable = true;
          break;
        }

        sleep(FINALIZE_POLL_INTERVAL);
      }

      finalizePolls.add(polls);

      if (durable) {
        finalizeLag.add(Date.now() - finishSentAt);
      } else {
        finalizeTimeouts.add(1);
      }

      check(null, { 'participation reached completed': () => durable });
    });
  }

  if (finishOk && durable) {
    journeysCompleted.add(1);
    journeyFailRate.add(false);
  } else {
    journeysAborted.add(1);
    journeyFailRate.add(true);
  }

  // What the user waited for: start of journey until the score was in hand.
  journeyDuration.add(userVisibleMs);

  // Think time belongs to the closed model only. Under an arrival rate the
  // pacing comes from the executor, and sleeping here would just inflate the
  // VU pool without changing the load the server sees.
  if (EXECUTOR !== 'arrival') {
    sleep(Math.random() * 0.6 + 0.2);
  }
}


function abort(journeyStart) {
  journeysAborted.add(1);
  journeyFailRate.add(true);
  journeyDuration.add(Date.now() - journeyStart);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
export function handleSummary(data) {
  const OUT = __ENV.OUT_DIR || '/scripts';
  // Label a run to keep its artefacts separate (used for the A/B comparison).
  const LABEL = __ENV.RUN_LABEL ? `-${__ENV.RUN_LABEL}` : '';

  const num = (metric, key, fallback = 0) => {
    const m = data.metrics[metric];
    if (m && m.values && typeof m.values[key] === 'number') return m.values[key];
    return fallback;
  };
  const ms = (v) => `${v.toFixed(2)} ms`;
  // goja (k6's JS runtime) has no ICU, so toLocaleString() cannot take a locale.
  const int = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const totalReqs = num('http_reqs', 'count');
  const rps = num('http_reqs', 'rate');
  const failRate = num('http_req_failed', 'rate') * 100;
  const iterations = num('iterations', 'count');
  const checksPassed = num('checks', 'passes');
  const checksFailed = num('checks', 'fails');
  const checkRate = num('checks', 'rate') * 100;
  const maxVUs = num('vus_max', 'max');
  const dataRecv = num('data_received', 'count');
  const dataSent = num('data_sent', 'count');

  const completed = num('journeys_completed', 'count');
  const abortedN = num('journeys_aborted', 'count');
  const answers = num('answers_submitted', 'count');
  const correct = num('answers_correct', 'count');

  const verdict = (v, limit) => (v < limit ? '✅ PASS' : '❌ FAIL');

  const endpoints = [
    ['GET /health', 'health'],
    ['GET /api/questions', 'list_questions'],
    ['POST /api/users', 'create_user'],
    ['POST /api/participations/start', 'start_participation'],
    ['POST /api/participations/:id/answer', 'answer'],
    ['POST /api/participations/:id/finish', 'finish'],
    ['GET /api/participations/:id', 'get_participation'],
  ];

  const endpointRows = endpoints
    .map(([label, name]) => {
      const t = `ep_${name}_ms`;
      const count = num(`ep_${name}_reqs`, 'count');
      return `| \`${label}\` | ${int(count)} | ${ms(num(t, 'avg'))} | ${ms(num(t, 'med'))} | ${ms(
        num(t, 'p(95)')
      )} | ${ms(num(t, 'p(99)'))} | ${ms(num(t, 'max'))} |`;
    })
    .join('\n');

  const thresholdRows = Object.keys(data.metrics)
    .filter((k) => data.metrics[k].thresholds)
    .flatMap((k) =>
      Object.keys(data.metrics[k].thresholds).map((t) => {
        const ok = data.metrics[k].thresholds[t].ok;
        return `| \`${k}\` | \`${t}\` | ${ok ? '✅ PASS' : '❌ FAIL'} |`;
      })
    )
    .join('\n');

  const report = `# Grafana k6 Stress Test Report — 500 Virtual Users

**System under test:** Questionnaire Backend (Node.js / Express 5 / PostgreSQL 16)
**Generated:** ${new Date().toISOString()}
**Target:** \`${BASE_URL}\`

---

## 1. Executive summary

| Metric | Value |
|---|---|
| Peak concurrent virtual users | **${int(maxVUs)}** |
| Total HTTP requests | **${int(totalReqs)}** |
| Throughput | **${rps.toFixed(2)} req/s** |
| HTTP error rate | **${failRate.toFixed(2)}%** |
| Completed user journeys | **${int(completed)}** |
| Aborted user journeys | **${int(abortedN)}** |
| Iterations executed | **${int(iterations)}** |
| Checks passed | **${int(checksPassed)} / ${int(checksPassed + checksFailed)} (${checkRate.toFixed(2)}%)** |
| Data received / sent | ${(dataRecv / 1048576).toFixed(1)} MB / ${(dataSent / 1048576).toFixed(1)} MB |

---

## 2. Load profile

| Stage | Duration | Target VUs |
|---|---|---|
| Warm-up | 20s | 0 → 100 |
| Ramp | 20s | 100 → 300 |
| Ramp to peak | 20s | 300 → 500 |
| **Sustained peak** | **60s** | **500** |
| Cool-down | 20s | 500 → 0 |

Total duration: **140 seconds**.

Each iteration executes a full quiz journey of ${
    4 + ANSWERS_PER_JOURNEY + 2
  } HTTP requests: health check → list questions → create user → start participation → ${ANSWERS_PER_JOURNEY} answers → finish → read summary.

---

## 3. Global latency distribution (\`http_req_duration\`)

| Statistic | Value | SLA | Result |
|---|---|---|---|
| Average | ${ms(num('http_req_duration', 'avg'))} | < 500 ms | ${verdict(
    num('http_req_duration', 'avg'),
    500
  )} |
| Minimum | ${ms(num('http_req_duration', 'min'))} | — | — |
| Median (p50) | ${ms(num('http_req_duration', 'med'))} | < 300 ms | ${verdict(
    num('http_req_duration', 'med'),
    300
  )} |
| p(90) | ${ms(num('http_req_duration', 'p(90)'))} | < 800 ms | ${verdict(
    num('http_req_duration', 'p(90)'),
    800
  )} |
| p(95) | ${ms(num('http_req_duration', 'p(95)'))} | < 1500 ms | ${verdict(
    num('http_req_duration', 'p(95)'),
    1500
  )} |
| p(99) | ${ms(num('http_req_duration', 'p(99)'))} | < 3000 ms | ${verdict(
    num('http_req_duration', 'p(99)'),
    3000
  )} |
| Max | ${ms(num('http_req_duration', 'max'))} | — | — |

Connection breakdown (avg): blocked ${ms(num('http_req_blocked', 'avg'))}, connecting ${ms(
    num('http_req_connecting', 'avg')
  )}, sending ${ms(num('http_req_sending', 'avg'))}, waiting (TTFB) ${ms(
    num('http_req_waiting', 'avg')
  )}, receiving ${ms(num('http_req_receiving', 'avg'))}.

---

## 4. Latency per endpoint

| Endpoint | Requests | Avg | Median | p(95) | p(99) | Max |
|---|---|---|---|---|---|---|
${endpointRows}

---

## 5. Business outcomes

| Metric | Value |
|---|---|
| Quiz sessions completed end-to-end | **${int(completed)}** |
| Sessions aborted mid-journey | **${int(abortedN)}** |
| Answers submitted | **${int(answers)}** |
| Correct answers | **${int(correct)}** (${
    answers > 0 ? ((correct / answers) * 100).toFixed(1) : '0.0'
  }% — random option selection, ~25% expected) |
| Avg end-to-end journey time | **${ms(num('journey_duration_ms', 'avg'))}** |
| p(95) journey time | **${ms(num('journey_duration_ms', 'p(95)'))}** |

---

## 5b. Finish queue (write-behind durability)

Answers are written to Redis only; \`POST /finish\` enqueues a BullMQ job and returns 202. These figures measure the gap between that 202 and the participation becoming \`completed\` in PostgreSQL.

| Metric | Value |
|---|---|
| Enqueue latency (\`POST /finish\`) avg | **${ms(num('ep_finish_ms', 'avg'))}** |
| Enqueue latency p(95) | **${ms(num('ep_finish_ms', 'p(95)'))}** |
| Finalization lag avg | **${ms(num('finalize_lag_ms', 'avg'))}** |
| Finalization lag p(95) | **${ms(num('finalize_lag_ms', 'p(95)'))}** |
| Finalization lag p(99) | **${ms(num('finalize_lag_ms', 'p(99)'))}** |
| Finalization lag max | **${ms(num('finalize_lag_ms', 'max'))}** |
| Avg polls until completed | **${num('finalize_polls', 'avg').toFixed(2)}** |
| Journeys that never completed | **${int(num('finalize_timeouts', 'count'))}** |

> Finalization lag is measured by polling every ${FINALIZE_POLL_INTERVAL * 1000} ms, so it is quantized to that interval and should be read as an **upper bound** — a job drained 5 ms after the first poll still reports one full interval.

---

## 6. Threshold results

| Metric | Threshold | Result |
|---|---|---|
${thresholdRows}

---

*Generated by Grafana k6 via \`k6/stress-test.js\`.*
`;

  const stdout = `
════════════════════════════════════════════════════════════
  k6 STRESS TEST — 500 VUs — Questionnaire Backend
════════════════════════════════════════════════════════════
  Requests      : ${int(totalReqs)}  (${rps.toFixed(2)} req/s)
  Error rate    : ${failRate.toFixed(2)}%
  Checks        : ${int(checksPassed)}/${int(checksPassed + checksFailed)} (${checkRate.toFixed(
    2
  )}%)
  Journeys OK   : ${int(completed)}   aborted: ${int(abortedN)}
  Latency       : avg ${ms(num('http_req_duration', 'avg'))} | p95 ${ms(
    num('http_req_duration', 'p(95)')
  )} | p99 ${ms(num('http_req_duration', 'p(99)'))} | max ${ms(num('http_req_duration', 'max'))}
  Answer p95    : ${ms(num('ep_answer_ms', 'p(95)'))}   (cache-only path)
  Finish p95    : ${ms(num('ep_finish_ms', 'p(95)'))}   (enqueue only)
  Queue lag p95 : ${ms(num('finalize_lag_ms', 'p(95)'))}   timeouts: ${int(
    num('finalize_timeouts', 'count')
  )}
════════════════════════════════════════════════════════════
`;

  const out = {};
  out[`${OUT}/STRESS_TEST_REPORT${LABEL}.md`] = report;
  out[`${OUT}/k6-summary${LABEL}.json`] = JSON.stringify(data, null, 2);
  out.stdout = stdout;
  return out;
}
