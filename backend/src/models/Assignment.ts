import mongoose, { Schema, Document } from 'mongoose';
import { GeneratedPaper, JobStatus } from '../types';

export interface IAssignment extends Document {
  subject: string;
  topic: string;
  additionalInfo: string;
  dueDate?: string;
  schoolName: string;
  className: string;
  duration: string;
  questionTypes: Array<{
    id: string;
    label: string;
    questions: number;
    marks: number;
  }>;
  totalQuestions: number;
  totalMarks: number;
  extractedText: string;
  status: JobStatus;
  jobId?: string;
  result?: GeneratedPaper;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    subject: { type: String, default: 'General' },
    topic: { type: String, default: 'General Topics' },
    additionalInfo: { type: String, default: '' },
    dueDate: { type: String },
    schoolName: { type: String, default: 'Delhi Public School' },
    className: { type: String, default: '8th' },
    duration: { type: String, default: '3 hours' },
    questionTypes: [
      {
        id: String,
        label: String,
        questions: Number,
        marks: Number,
      },
    ],
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    extractedText: { type: String, default: '' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    jobId: { type: String },
    result: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
