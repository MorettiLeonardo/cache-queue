process.env.NODE_ENV = 'test';
import app from './src/server.js';
import { initDatabase, closeDatabase } from './src/config/database.js';
import { closeRedis } from './src/config/redis.js';
import { closeFinishQueue } from './src/app/queue/finishQueue.js';
import { stopFinishWorker } from './src/app/queue/finishWorker.js';
import http from 'node:http';
import { ParticipationStatus } from './src/types/entities/Participation.types.js';
import { TransientParticipationStatus } from './src/types/cache/ParticipationCache.types.js';

/**
 * Finishing is asynchronous — poll the participation until the queue worker has
 * persisted it. Returns null if it never completes within the timeout.
 */
async function pollUntilCompleted(
  baseUrl: string,
  participationId: number,
  timeoutMs = 10000
): Promise<any | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/participations/${participationId}`);
    if (res.status === 200) {
      const body = (await res.json()) as any;
      if (body.data?.status === ParticipationStatus.COMPLETED) {
        return body.data;
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  return null;
}

async function runTests() {
  console.log('🧪 Starting API Verification Tests...\n');

  await initDatabase();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json() as { status: string };
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Health Check endpoint returns 200 OK');

    // 2. List all questions
    const listRes = await fetch(`${baseUrl}/api/questions?limit=100`);
    const listData = await listRes.json() as any;
    assert(listRes.status === 200 && listData.success === true, 'GET /api/questions returns success: true');
    assert(listData.total === 85, `GET /api/questions returned 85 total questions (got ${listData.total})`);
    assert(listData.data.length === 85, `GET /api/questions returned array of 85 items (got ${listData.data.length})`);

    // 3. Security check: Ensure is_correct and explanation are not exposed in list
    const firstQ = listData.data[0];
    const leakedCorrectFlag = firstQ.options.some((o: any) => 'is_correct' in o);
    const leakedExplanation = 'explanation' in firstQ;
    assert(!leakedCorrectFlag, 'Security: is_correct is NOT leaked in question options');
    assert(!leakedExplanation, 'Security: explanation is NOT leaked in question listing');

    // 4. Filter by category
    const pyRes = await fetch(`${baseUrl}/api/questions?category=Python`);
    const pyData = await pyRes.json() as any;
    assert(pyData.total === 14, `Category filter: Python returned 14 questions (got ${pyData.total})`);

    // 5. Get single question by ID
    const singleRes = await fetch(`${baseUrl}/api/questions/1`);
    const singleData = await singleRes.json() as any;
    assert(singleRes.status === 200 && singleData.data.id === 1, 'GET /api/questions/1 returns question 1');
    assert(singleData.data.options.length === 4, 'Question 1 has 4 options');

    // 6. Answer correctly
    // Question 1: typeof NaN in JS is 'number', which is option 1
    const correctRes = await fetch(`${baseUrl}/api/questions/1/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_option_id: 1 })
    });
    const correctData = await correctRes.json() as any;
    assert(correctRes.status === 200, 'POST /api/questions/1/answer returns 200');
    assert(correctData.data.is_correct === true, 'Correct answer evaluates to is_correct: true');
    assert(typeof correctData.data.explanation === 'string' && correctData.data.explanation.length > 0, 'Returns explanation upon answering');

    // 7. Answer incorrectly
    const wrongRes = await fetch(`${baseUrl}/api/questions/1/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_option_id: 2 })
    });
    const wrongData = await wrongRes.json() as any;
    assert(wrongData.data.is_correct === false, 'Incorrect option evaluates to is_correct: false');
    assert(wrongData.data.correct_option_id === 1, 'Returns the actual correct_option_id');

    // 8. Error handling: Non-existent question 404
    const notFoundRes = await fetch(`${baseUrl}/api/questions/9999`);
    assert(notFoundRes.status === 404, 'Non-existent question returns 404 Not Found');

    // 9. Error handling: Invalid option belonging to another question 422
    const invalidOptRes = await fetch(`${baseUrl}/api/questions/1/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_option_id: 9999 })
    });
    assert(invalidOptRes.status === 422, 'Option from outside question returns 422 Unprocessable');

    // 10. Create User
    const userRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Developer', email: 'alice@example.com' })
    });
    const userData = await userRes.json() as any;
    assert(userRes.status === 201 && userData.success === true, 'POST /api/users creates a user');
    const userId = userData.data.id;
    assert(typeof userId === 'number', 'User ID is returned');

    // 11. Start Participation for user
    const startRes = await fetch(`${baseUrl}/api/participations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const startData = await startRes.json() as any;
    assert(startRes.status === 201 && startData.data.status === ParticipationStatus.IN_PROGRESS, 'POST /api/participations/start starts a session');
    const participationId = startData.data.participation_id;

    // 12. Answer Question 1 correctly in participation session
    const partAns1 = await fetch(`${baseUrl}/api/participations/${participationId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: 1, selected_option_id: 1 })
    });
    const partAns1Data = await partAns1.json() as any;
    assert(partAns1.status === 200 && partAns1Data.data.is_correct === true, 'User answers question 1 correctly in session');

    // 13. Answer Question 2 incorrectly in participation session
    const partAns2 = await fetch(`${baseUrl}/api/participations/${participationId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: 2, selected_option_id: 6 })
    });
    const partAns2Data = await partAns2.json() as any;
    assert(partAns2.status === 200 && partAns2Data.data.is_correct === false, 'User answers question 2 incorrectly in session');

    // 14. Prevent duplicate answering of same question in same session
    const dupRes = await fetch(`${baseUrl}/api/participations/${participationId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: 1, selected_option_id: 1 })
    });
    assert(dupRes.status === 422, 'Prevents answering the same question twice in a session');

    // 15. Finish participation — enqueues, does not complete inline
    const finishRes = await fetch(`${baseUrl}/api/participations/${participationId}/finish`, {
      method: 'POST'
    });
    const finishData = await finishRes.json() as any;
    assert(finishRes.status === 202, 'POST /api/participations/:id/finish returns 202 Accepted');
    assert(finishData.data.status === TransientParticipationStatus.PROCESSING, 'Finish reports status: processing');
    assert(finishData.data.queued_answers === 2, `Queues the cached answers (2, got ${finishData.data.queued_answers})`);
    assert(finishData.data.enqueued === true, 'Finish reports the job was enqueued');

    // 15b. The worker drains the queue and persists the participation
    const completed = await pollUntilCompleted(baseUrl, participationId);
    assert(completed !== null, 'Finish queue completes the participation');
    assert(completed?.status === ParticipationStatus.COMPLETED, 'Worker marks participation as completed');
    assert(completed?.score === 1, `Calculates correct score (1/2, got ${completed?.score})`);
    assert(completed?.total_questions_answered === 2, 'Tracks total questions answered (2)');
    assert(completed?.percentage === 50, `Calculates accurate accuracy percentage (50%, got ${completed?.percentage}%)`);
    assert(completed?.finished_at !== null, 'Records finished_at timestamp');

    // 15c. Finishing again is a no-op rather than an error
    const refinishRes = await fetch(`${baseUrl}/api/participations/${participationId}/finish`, {
      method: 'POST'
    });
    const refinishData = await refinishRes.json() as any;
    assert(refinishRes.status === 200 && refinishData.data.enqueued === false, 'Finishing an already completed session is idempotent');

    // 16. Prevent answering in an already completed session
    const postFinishAns = await fetch(`${baseUrl}/api/participations/${participationId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: 3, selected_option_id: 9 })
    });
    assert(postFinishAns.status === 422, 'Rejects answers after participation is finished');

    // 17. Get participation summary by ID
    const getPartRes = await fetch(`${baseUrl}/api/participations/${participationId}`);
    const getPartData = await getPartRes.json() as any;
    assert(getPartRes.status === 200 && getPartData.data.user_name === 'Alice Developer', 'GET /api/participations/:id returns summary with user data');

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    server.close();
    // The worker and Redis clients hold the event loop open — drain them too.
    await stopFinishWorker();
    await closeFinishQueue();
    await closeRedis();
    await closeDatabase();
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
