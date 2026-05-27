export interface QuestionType {
  id: string;
  label: string;
  questions: number;
  marks: number;
}

export interface CreateAssignmentInput {
  subject?: string;
  topic?: string;
  additionalInfo?: string;
  dueDate?: string;
  questionTypes: QuestionType[];
  schoolName?: string;
  className?: string;
  duration?: string;
  extractedText?: string;
}

export interface GeneratedQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

export interface GeneratedSection {
  title: string;
  questionType: string;
  instruction: string;
  questions: GeneratedQuestion[];
  totalMarks: number;
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  duration: string;
  totalMarks: number;
  sections: GeneratedSection[];
  generalInstructions: string[];
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface WebSocketMessage {
  type: 'job_status' | 'job_completed' | 'job_failed';
  assignmentId: string;
  status?: JobStatus;
  progress?: number;
  message?: string;
  result?: GeneratedPaper;
  error?: string;
}
