import { Worker, type Job } from 'bullmq';
import { createQueueConnection } from '../../config/redis.js';
import { ParticipationRepository } from '../repository/ParticipationRepository.js';
import { ParticipationCache } from '../cache/ParticipationCache.js';
import {
  FINISH_QUEUE_NAME,
  type FinishParticipationJob,
  type FinishJobResult,
} from '../../types/queue/FinishQueue.types.js';
import { ParticipationStatus } from '../../types/entities/Participation.types.js';

const CONCURRENCY = Number(process.env.FINISH_QUEUE_CONCURRENCY || 25);

let workerInstance: Worker<FinishParticipationJob, FinishJobResult> | null = null;

export function startFinishWorker(): Worker<FinishParticipationJob, FinishJobResult> {
  if (workerInstance) {
    return workerInstance;
  }

  const repository = new ParticipationRepository();
  const cache = new ParticipationCache();

  workerInstance = new Worker<FinishParticipationJob, FinishJobResult>(
    FINISH_QUEUE_NAME,
    async (job: Job<FinishParticipationJob>): Promise<FinishJobResult> => {
      const { participation_id, answers } = job.data;

      const result = await repository.persistFinishedParticipation(participation_id, answers);

      if (!result) {

        await cache.clear(participation_id);
        return {
          participation_id,
          score: 0,
          answered_count: 0,
          persisted_answers: 0,
          already_completed: false,
        };
      }


      await cache.clearAnswers(participation_id);
      await cache.setStatus(participation_id, ParticipationStatus.COMPLETED);

      return {
        participation_id,
        score: result.score,
        answered_count: result.answeredCount,
        persisted_answers: result.persistedAnswers,
        already_completed: result.alreadyCompleted,
      };
    },
    {
      connection: createQueueConnection(),
      concurrency: CONCURRENCY,
    }
  );

  workerInstance.on('failed', (job, err) => {
    const attempts = job?.opts?.attempts ?? 0;
    const made = job?.attemptsMade ?? 0;
    const exhausted = made >= attempts;

    console.error(
      `[FinishWorker] job ${job?.id} failed (attempt ${made}/${attempts})${
        exhausted ? ' — no retries left, moved to failed set' : ', will retry'
      }: ${err.message}`
    );
  });

  workerInstance.on('error', (err) => {
    console.error('[FinishWorker] worker error:', err.message);
  });

  console.log(`⚙️  Finish worker listening on "${FINISH_QUEUE_NAME}" (concurrency ${CONCURRENCY})`);

  return workerInstance;
}

export async function stopFinishWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}
