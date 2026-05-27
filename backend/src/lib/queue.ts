import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './redis';

export const ASSIGNMENT_QUEUE = 'assignment-generation';

let assignmentQueue: Queue | null = null;

export function getAssignmentQueue(): Queue {
  if (!assignmentQueue) {
    assignmentQueue = new Queue(ASSIGNMENT_QUEUE, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return assignmentQueue;
}

export async function addAssignmentJob(assignmentId: string): Promise<string> {
  const queue = getAssignmentQueue();
  const job = await queue.add('generate', { assignmentId }, { jobId: assignmentId });
  return job.id || assignmentId;
}
