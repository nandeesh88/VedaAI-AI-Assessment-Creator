export interface QuestionType {
  id: string;
  label: string;
  questions: number;
  marks: number;
}

export interface CreateAssignmentPayload {
  subject: string;
  topic: string;
  additionalInfo: string;
  dueDate: string;
  schoolName: string;
  className: string;
  duration: string;
  questionTypes: QuestionType[];
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

export interface Assignment {
  _id: string;
  subject: string;
  topic: string;
  dueDate?: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: GeneratedPaper;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
