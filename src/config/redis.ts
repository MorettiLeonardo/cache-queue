import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let cacheClient: Redis | null = null;
const queueClients: Redis[] = [];

export function getRedis(): Redis {
  if (!cacheClient) {
    cacheClient = new Redis(REDIS_URL, {
      lazyConnect: false,
      enableAutoPipelining: true,
      connectTimeout: 10000,
    });

    cacheClient.on('error', (err: Error) => {
      console.error('[Redis] cache client error:', err.message);
    });
  }

  return cacheClient;
}

export function createQueueConnection(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] queue client error:', err.message);
  });

  queueClients.push(client);
  return client;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await getRedis().ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  const clients = [...queueClients];
  queueClients.length = 0;

  if (cacheClient) {
    clients.push(cacheClient);
    cacheClient = null;
  }

  await Promise.allSettled(clients.map((c) => c.quit()));
}
