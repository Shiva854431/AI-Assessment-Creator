import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import connectDB from './config/database';
import { connectRedis } from './config/redis';
import Assignment from './models/Assignment';
import { generateQuestionPaper } from './services/aiGenerator';
import { io as ioClient } from 'socket.io-client';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Only initialize worker if REDIS_HOST is set
let worker: Worker | null = null;

if (process.env.REDIS_HOST) {
  worker = new Worker(
    'question-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;

      try {
        await connectDB();
        await connectRedis();

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found');
        }

        // Update status to processing
        assignment.status = 'processing';
        await assignment.save();

        // Notify frontend via WebSocket
        const socket = ioClient('http://localhost:3001');
        socket.emit('assignment-status', {
          assignmentId,
          status: 'processing',
        });

        // Generate question paper
        const questionPaper = await generateQuestionPaper({
          title: assignment.title,
          subject: assignment.subject,
          questionTypes: assignment.questionTypes,
          numberOfQuestions: assignment.numberOfQuestions,
          marksPerQuestion: assignment.marksPerQuestion,
          instructions: assignment.instructions,
        });

        // Update assignment with generated paper
        assignment.questionPaper = questionPaper;
        assignment.status = 'completed';
        await assignment.save();

        // Notify frontend of completion
        socket.emit('assignment-status', {
          assignmentId,
          status: 'completed',
          questionPaper,
        });

        socket.disconnect();

        return { success: true, questionPaper };
      } catch (error) {
        console.error('Worker Error:', error);

        const assignment = await Assignment.findById(assignmentId);
        if (assignment) {
          assignment.status = 'failed';
          await assignment.save();
        }

        const socket = ioClient('http://localhost:3001');
        socket.emit('assignment-status', {
          assignmentId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        socket.disconnect();

        throw error;
      }
    },
    {
      connection: redisConnection,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
  });

  console.log('Worker started and listening for jobs...');
} else {
  console.warn('REDIS_HOST not set, worker not initialized');
}
