import { Queue } from 'bullmq';
import { createClient } from 'redis';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

let redisClient: any = null;
let questionGenerationQueue: Queue | null = null;

export async function connectRedis() {
  // Only initialize Redis client if REDIS_HOST is set
  if (!process.env.REDIS_HOST) {
    console.warn('REDIS_HOST not set, skipping Redis connection');
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: redisConnection.host,
        port: redisConnection.port,
      },
    });

    redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  // Create queue only after successful connection
  if (!questionGenerationQueue) {
    questionGenerationQueue = new Queue('question-generation', {
      connection: redisConnection,
    });
  }

  return questionGenerationQueue;
}

export function getQueue() {
  return questionGenerationQueue;
}










