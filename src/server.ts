import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Server } from 'http';
import { initDatabase, closeDatabase } from './config/database.js';
import { pingRedis, closeRedis } from './config/redis.js';
import apiRouter from './app/routes/index.js';
import { errorHandler } from './app/middlewares/errorHandler.js';
import { requestLogger } from './app/middlewares/requestLogger.js';
import { QuestionCache } from './app/cache/QuestionCache.js';
import { getQueueDepth, closeFinishQueue } from './app/queue/finishQueue.js';
import { startFinishWorker, stopFinishWorker } from './app/queue/finishWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RUN_WORKER = process.env.RUN_WORKER !== 'false';
const WRITE_BEHIND = process.env.WRITE_BEHIND !== 'false';

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/ready', async (_req, res) => {
  const [redisOk, depth] = await Promise.all([
    pingRedis(),
    getQueueDepth().catch(() => null)
  ]);

  const ready = redisOk && depth !== null;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    uptime: process.uptime(),
    redis: redisOk ? 'up' : 'down',
    mode: WRITE_BEHIND ? 'write-behind' : 'synchronous',
    worker: RUN_WORKER && WRITE_BEHIND ? 'running' : 'disabled',
    queue: depth
  });
});

app.use('/api', apiRouter);

app.use(errorHandler);

let server: Server | undefined;

export async function bootstrap(): Promise<void> {
  await initDatabase();

  const redisOk = await pingRedis();
  if (!redisOk) {

    throw new Error(
      'Redis is unreachable — start it with `docker compose up -d redis` and check REDIS_URL'
    );
  }

  if (WRITE_BEHIND) {

    const warmed = await new QuestionCache().warmAll();
    console.log(`🔥 Question cache warmed with ${warmed} questions`);

    if (RUN_WORKER) {
      startFinishWorker();
    }
  } else {
    console.log('⚠️  WRITE_BEHIND=false — synchronous writes, cache and queue bypassed');
  }

  if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
      console.log(`🚀 Questionnaire Backend is running on http://localhost:${PORT}`);
      console.log(`📚 Questions API: http://localhost:${PORT}/api/questions`);
      console.log(`🩺 Readiness:     http://localhost:${PORT}/health/ready`);
    });
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error('Shutdown timed out after 15s, forcing exit');
    process.exit(1);
  }, 15000);

  try {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }

    await stopFinishWorker();
    await closeFinishQueue();
    await closeRedis();
    await closeDatabase();

    clearTimeout(timeout);
    console.log('Shutdown complete.');
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
