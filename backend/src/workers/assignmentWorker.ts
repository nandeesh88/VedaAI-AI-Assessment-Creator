import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { ASSIGNMENT_QUEUE, getAssignmentQueue } from '../lib/queue';
import { cacheSet, getRedisConnectionOptions } from '../lib/redis';
import { generateQuestionPaper } from '../lib/ai';
import { broadcastToAssignment } from '../lib/websocket';
import { Assignment } from '../models/Assignment';

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('[Worker] MongoDB connected');
}

async function processAssignmentJob(job: Job): Promise<void> {
  const { assignmentId } = job.data;
  console.log(`[Worker] Processing job for assignment: ${assignmentId}`);

  // Update status → processing
  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
  broadcastToAssignment(assignmentId, {
    type: 'job_status',
    assignmentId,
    status: 'processing',
    progress: 10,
    message: 'Preparing your question paper...',
  });

  await job.updateProgress(10);

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  broadcastToAssignment(assignmentId, {
    type: 'job_status',
    assignmentId,
    status: 'processing',
    progress: 30,
    message: 'Generating questions with AI...',
  });

  await job.updateProgress(30);

  // Call AI
  const result = await generateQuestionPaper({
    subject: assignment.subject,
    topic: assignment.topic,
    additionalInfo: assignment.additionalInfo,
    dueDate: assignment.dueDate,
    questionTypes: assignment.questionTypes,
    schoolName: assignment.schoolName,
    className: assignment.className,
    duration: assignment.duration,
    extractedText: assignment.extractedText,
  });

  await job.updateProgress(80);

  broadcastToAssignment(assignmentId, {
    type: 'job_status',
    assignmentId,
    status: 'processing',
    progress: 80,
    message: 'Structuring the question paper...',
  });

  // Save result
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    result,
  });

  // Cache result for fast access
  await cacheSet(`result:${assignmentId}`, result, 86400); // 24hr cache

  await job.updateProgress(100);

  // Notify frontend
  broadcastToAssignment(assignmentId, {
    type: 'job_completed',
    assignmentId,
    status: 'completed',
    progress: 100,
    message: 'Question paper ready!',
    result,
  });

  console.log(`[Worker] Completed assignment: ${assignmentId}`);
}

async function startWorker() {
  await connectDB();

  // Ensure queue is initialized
  getAssignmentQueue();

  const worker = new Worker(
    ASSIGNMENT_QUEUE,
    async (job: Job) => {
      await processAssignmentJob(job);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    if (job?.data?.assignmentId) {
      const { assignmentId } = job.data;
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });
      broadcastToAssignment(assignmentId, {
        type: 'job_failed',
        assignmentId,
        status: 'failed',
        error: err.message,
        message: 'Generation failed. Please try again.',
      });
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  console.log('[Worker] Assignment worker started, waiting for jobs...');
}

startWorker().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
