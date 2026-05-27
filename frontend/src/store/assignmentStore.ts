import { create } from 'zustand';
import { Assignment, CreateAssignmentPayload, GeneratedPaper, JobStatus, QuestionType } from '@/types';

interface AssignmentFormState {
  subject: string;
  topic: string;
  additionalInfo: string;
  dueDate: string;
  schoolName: string;
  className: string;
  duration: string;
  uploadedFileName: string | null;
  questionTypes: QuestionType[];
}

interface GenerationState {
  status: JobStatus | null;
  progress: number;
  message: string;
  assignmentId: string | null;
  result: GeneratedPaper | null;
  error: string | null;
}

interface AssignmentStore {
  // List of all assignments
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;

  // Form state
  form: AssignmentFormState;
  setFormField: <K extends keyof AssignmentFormState>(key: K, value: AssignmentFormState[K]) => void;
  setQuestionTypes: (questionTypes: QuestionType[]) => void;
  updateQuestionType: (id: string, field: 'questions' | 'marks', value: number) => void;
  removeQuestionType: (id: string) => void;
  addQuestionType: () => void;
  resetForm: () => void;

  // Generation state
  generation: GenerationState;
  setGenerationStatus: (status: JobStatus, progress: number, message: string) => void;
  setGenerationResult: (result: GeneratedPaper) => void;
  setGenerationError: (error: string) => void;
  setAssignmentId: (id: string) => void;
  resetGeneration: () => void;
}

const defaultForm: AssignmentFormState = {
  subject: '',
  topic: '',
  additionalInfo: '',
  dueDate: '',
  schoolName: 'Delhi Public School',
  className: '8th',
  duration: '3 hours',
  uploadedFileName: null,
  questionTypes: [
    { id: 'mcq', label: 'Multiple Choice Questions', questions: 3, marks: 1 },
    { id: 'short', label: 'Short Questions', questions: 3, marks: 2 },
    { id: 'diagram', label: 'Diagram/Graph-Based Questions', questions: 3, marks: 5 },
    { id: 'numerical', label: 'Numerical Problems', questions: 5, marks: 5 },
  ],
};

const defaultGeneration: GenerationState = {
  status: null,
  progress: 0,
  message: '',
  assignmentId: null,
  result: null,
  error: null,
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) =>
    set((s) => ({ assignments: [assignment, ...s.assignments] })),

  form: defaultForm,
  setFormField: (key, value) =>
    set((s) => ({ form: { ...s.form, [key]: value } })),
  setQuestionTypes: (questionTypes) =>
    set((s) => ({ form: { ...s.form, questionTypes } })),
  updateQuestionType: (id, field, value) =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: s.form.questionTypes.map((qt) =>
          qt.id === id ? { ...qt, [field]: Math.max(0, value) } : qt
        ),
      },
    })),
  removeQuestionType: (id) =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: s.form.questionTypes.filter((qt) => qt.id !== id),
      },
    })),
  addQuestionType: () =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: [
          ...s.form.questionTypes,
          {
            id: `custom-${Date.now()}`,
            label: 'New Question Type',
            questions: 1,
            marks: 1,
          },
        ],
      },
    })),
  resetForm: () => set({ form: defaultForm }),

  generation: defaultGeneration,
  setGenerationStatus: (status, progress, message) =>
    set((s) => ({ generation: { ...s.generation, status, progress, message } })),
  setGenerationResult: (result) =>
    set((s) => ({ generation: { ...s.generation, result, status: 'completed', progress: 100 } })),
  setGenerationError: (error) =>
    set((s) => ({ generation: { ...s.generation, error, status: 'failed' } })),
  setAssignmentId: (assignmentId) =>
    set((s) => ({ generation: { ...s.generation, assignmentId } })),
  resetGeneration: () => set({ generation: defaultGeneration }),
}));
