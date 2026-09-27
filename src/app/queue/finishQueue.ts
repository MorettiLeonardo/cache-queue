import { Queue, JobsOptions } from 'bullmq';
import { createQueueConnection } from '../../config/redis.js';
import {
  FINISH_QUEUE_NAME,
  FINISH_JOB_NAME,
  type FinishParticipationJob,
} from '../../types/queue/FinishQueue.types.js';

const ATTEMPTS = Number(process.env.FINISH_QUEUE_ATTEMPTS || 5);

let queueInstance: Queue<FinishParticipationJob> | null = null;

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: ATTEMPTS,
  backoff: { type: 'exponential', delay: 500 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 },
};

export function getFinishQueue(): Queue<FinishParticipationJob> {
  if (!queueInstance) {
    queueInstance = new Queue<FinishParticipationJob>(FINISH_QUEUE_NAME, {
      connection: createQueueConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return queueInstance;
}

export async function enqueueFinish(job: FinishParticipationJob): Promise<void> {
  await getFinishQueue().add(FINISH_JOB_NAME, job, {
    jobId: `finish-${job.participation_id}`,
  });
}

export interface FinishQueueDepth {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export async function getQueueDepth(): Promise<FinishQueueDepth> {
  const counts = await getFinishQueue().getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed'
  );

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
  };
}

export async function closeFinishQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
