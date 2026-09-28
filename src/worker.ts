import dotenv from 'dotenv';
import { initDatabase, closeDatabase } from './config/database.js';
import { pingRedis, closeRedis } from './config/redis.js';
import { startFinishWorker, stopFinishWorker } from './app/queue/finishWorker.js';
import { closeFinishQueue } from './app/queue/finishQueue.js';

dotenv.config();

/**
 * Standalone finish worker.
 *
 * The same worker the API can host in-process, run as its own process instead.
 * Start the API with RUN_WORKER=false and this alongside it, and finalization
 * stops competing with request handling for the API's event loop.
 */
async function bootstrap(): Promise<void> {
  await initDatabase();

  const redisOk = await pingRedis();
  if (!redisOk) {
    throw new Error(
      'Redis is unreachable — start it with `docker compose up -d redis` and check REDIS_URL'
    );
  }

  startFinishWorker();
  console.log('👷 Standalone finish worker ready — no HTTP server in this process');
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error('Shutdown timed out after 15s, forcing exit');
    process.exit(1);
  }, 15000);

  try {
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
  console.error('Failed to start worker:', err);
  process.exit(1);
});
