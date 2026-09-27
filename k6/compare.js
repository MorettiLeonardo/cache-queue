#!/usr/bin/env node
/**
 * Builds COMPARISON.md from two k6 summary files.
 *
 *   node k6/compare.js k6/k6-summary-sync.json k6/k6-summary-writebehind.json
 *
 * Both runs must come from the same stress-test.js and the same load profile —
 * the whole point is that only the server architecture differs.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { argv } from 'node:process';

const [, , beforePath, afterPath, outPath = 'k6/COMPARISON.md'] = argv;

if (!beforePath || !afterPath) {
  console.error('usage: node k6/compare.js <before.json> <after.json> [out.md]');
  process.exit(1);
}

const before = JSON.parse(readFileSync(beforePath, 'utf8'));
const after = JSON.parse(readFileSync(afterPath, 'utf8'));

const val = (summary, metric, key, fallback = 0) => {
  const m = summary.metrics?.[metric];
  const v = m?.values?.[key];
  return typeof v === 'number' ? v : fallback;
};

const int = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const ms = (n) => `${n.toFixed(2)} ms`;

/** Percentage change, phrased so that "better" is always explicit. */
function delta(b, a, lowerIsBetter) {
  if (b === 0) return { text: '—', better: false };
  const pct = ((a - b) / b) * 100;
  const better = lowerIsBetter ? pct < 0 : pct > 0;
  const sign = pct > 0 ? '+' : '';
  return { text: `${sign}${pct.toFixed(1)}%`, better, pct };
}

function row(label, b, a, fmt, lowerIsBetter) {
  const d = delta(b, a, lowerIsBetter);
  const mark = d.text === '—' ? '' : d.better ? ' ✅' : ' ⚠️';
  return `| ${label} | ${fmt(b)} | **${fmt(a)}** | **${d.text}**${mark} |`;
}

const ENDPOINTS = [
  ['GET /health', 'health'],
  ['GET /api/questions', 'list_questions'],
  ['POST /api/users', 'create_user'],
  ['POST /api/participations/start', 'start_participation'],
  ['POST /api/participations/:id/answer', 'answer'],
  ['POST /api/participations/:id/finish', 'finish'],
  ['GET /api/participations/:id', 'get_participation'],
];

// Sequential PostgreSQL round-trips per request, in each architecture.
const QUERIES = {
  health: [0, 0],
  list_questions: [3, 3],
  create_user: [2, 2],
  start_participation: [2, 2],
  answer: [5, 0],
  finish: [5, 0],
  get_participation: [2, 0],
};

const throughputRows = [
  row('Throughput (req/s)', val(before, 'http_reqs', 'rate'), val(after, 'http_reqs', 'rate'), (n) => `${n.toFixed(2)}`, false),
  row('Total requests', val(before, 'http_reqs', 'count'), val(after, 'http_reqs', 'count'), int, false),
  row('Quiz journeys completed', val(before, 'journeys_completed', 'count'), val(after, 'journeys_completed', 'count'), int, false),
  row('Answers submitted', val(before, 'answers_submitted', 'count'), val(after, 'answers_submitted', 'count'), int, false),
  row('Iterations', val(before, 'iterations', 'count'), val(after, 'iterations', 'count'), int, false),
].join('\n');

const latencyRows = [
  row('Average', val(before, 'http_req_duration', 'avg'), val(after, 'http_req_duration', 'avg'), ms, true),
  row('Median p(50)', val(before, 'http_req_duration', 'med'), val(after, 'http_req_duration', 'med'), ms, true),
  row('p(90)', val(before, 'http_req_duration', 'p(90)'), val(after, 'http_req_duration', 'p(90)'), ms, true),
  row('p(95)', val(before, 'http_req_duration', 'p(95)'), val(after, 'http_req_duration', 'p(95)'), ms, true),
  row('p(99)', val(before, 'http_req_duration', 'p(99)'), val(after, 'http_req_duration', 'p(99)'), ms, true),
  row('Max', val(before, 'http_req_duration', 'max'), val(after, 'http_req_duration', 'max'), ms, true),
  row('Server time (TTFB avg)', val(before, 'http_req_waiting', 'avg'), val(after, 'http_req_waiting', 'avg'), ms, true),
].join('\n');

const endpointRows = ENDPOINTS.map(([label, name]) => {
  const t = `ep_${name}_ms`;
  const b = val(before, t, 'avg');
  const a = val(after, t, 'avg');
  const d = delta(b, a, true);
  const [qb, qa] = QUERIES[name];
  const mark = d.better ? '✅' : '⚠️';
  return `| \`${label}\` | ${qb} → ${qa} | ${ms(b)} | **${ms(a)}** | ${ms(val(before, t, 'p(95)'))} | **${ms(val(after, t, 'p(95)'))}** | **${d.text}** ${mark} |`;
}).join('\n');

const reliabilityRows = [
  `| HTTP error rate | ${(val(before, 'http_req_failed', 'rate') * 100).toFixed(2)}% | **${(val(after, 'http_req_failed', 'rate') * 100).toFixed(2)}%** |`,
  `| Checks passed | ${int(val(before, 'checks', 'passes'))} / ${int(val(before, 'checks', 'passes') + val(before, 'checks', 'fails'))} | **${int(val(after, 'checks', 'passes'))} / ${int(val(after, 'checks', 'passes') + val(after, 'checks', 'fails'))}** |`,
  `| Journeys aborted | ${int(val(before, 'journeys_aborted', 'count'))} | **${int(val(after, 'journeys_aborted', 'count'))}** |`,
  `| Journeys never completed | ${int(val(before, 'finalize_timeouts', 'count'))} | **${int(val(after, 'finalize_timeouts', 'count'))}** |`,
].join('\n');

const throughputGain = delta(val(before, 'http_reqs', 'rate'), val(after, 'http_reqs', 'rate'), false);
const journeyGain = delta(val(before, 'journeys_completed', 'count'), val(after, 'journeys_completed', 'count'), false);
const p95Gain = delta(val(before, 'http_req_duration', 'p(95)'), val(after, 'http_req_duration', 'p(95)'), true);
const answerGain = delta(val(before, 'ep_answer_ms', 'avg'), val(after, 'ep_answer_ms', 'avg'), true);
const extraJourneys = val(after, 'journeys_completed', 'count') - val(before, 'journeys_completed', 'count');

const md = `# Before / After — Redis Cache + Finish Queue

Two runs of the **same** \`k6/stress-test.js\`, same 500-VU profile, same machine,
minutes apart. The only variable is the server's \`WRITE_BEHIND\` flag.

| | Run A — before | Run B — after |
|---|---|---|
| Mode | \`WRITE_BEHIND=false\` | \`WRITE_BEHIND=true\` |
| Answers written | synchronously to PostgreSQL | staged in Redis |
| Finishing | inline, returns 200 \`completed\` | queued to BullMQ, returns 202 \`processing\` |
| Worker | disabled | in-process, concurrency 25 |

---

## Headline

| Metric | Before | After | Change |
|---|---|---|---|
${throughputRows}

**${throughputGain.text} throughput** and **${journeyGain.text} completed quiz sessions** — ${int(extraJourneys)} more sessions in the same 140 seconds.

---

## Latency (\`http_req_duration\`)

| Statistic | Before | After | Change |
|---|---|---|---|
${latencyRows}

p(95) improved by **${p95Gain.text}**. Network time is negligible in both runs, so TTFB is effectively all server-side work.

---

## Per endpoint

"DB" is the number of *sequential* PostgreSQL round-trips the handler makes in each architecture.

| Endpoint | DB | Avg before | Avg after | p(95) before | p(95) after | Avg change |
|---|---|---|---|---|---|---|
${endpointRows}

The endpoints that lost their queries are the ones that moved: \`/answer\` dropped **${answerGain.text}**. \`GET /health\` touches neither database nor cache, so any change there reflects the Node event loop alone.

---

## Reliability

| Metric | Before | After |
|---|---|---|
${reliabilityRows}

---

## Cost of the new design

Write-behind is not free; these are the figures that pay for the gains above.

| Metric | Value |
|---|---|
| Enqueue latency \`POST /finish\` p(95) | ${ms(val(after, 'ep_finish_ms', 'p(95)'))} |
| Finalization lag avg (202 → durable) | ${ms(val(after, 'finalize_lag_ms', 'avg'))} |
| Finalization lag p(95) | ${ms(val(after, 'finalize_lag_ms', 'p(95)'))} |
| Finalization lag max | ${ms(val(after, 'finalize_lag_ms', 'max'))} |
| Avg polls until completed | ${val(after, 'finalize_polls', 'avg').toFixed(2)} |
| Extra polling requests vs before | ${int(val(after, 'ep_get_participation_reqs', 'count') - val(before, 'ep_get_participation_reqs', 'count'))} |

Finalization lag is sampled by polling, so it is quantized to the poll interval and reads as an **upper bound**. An average of ${val(after, 'finalize_polls', 'avg').toFixed(2)} polls means most participations were already durable at the first check.

The trade is explicit: **a score that is eventually consistent, by a few hundred milliseconds, in exchange for ${throughputGain.text} throughput and ${p95Gain.text} p(95).**

---

*Generated by \`k6/compare.js\` from \`${beforePath}\` and \`${afterPath}\`.*
`;

writeFileSync(outPath, md);
console.log(`Wrote ${outPath}`);
console.log(`  throughput ${throughputGain.text} | journeys ${journeyGain.text} | p95 ${p95Gain.text} | answer avg ${answerGain.text}`);
