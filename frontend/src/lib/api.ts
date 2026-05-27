import { Assignment, CreateAssignmentPayload, GeneratedPaper } from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:4000' : '');

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined in production');
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
  file?: File | null
): Promise<{ assignmentId: string; jobId: string; status: string }> {
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      formData.append(key, String(value));
    }
  });
  formData.append('questionTypes', JSON.stringify(payload.questionTypes));
  if (file) formData.append('file', file);

  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create assignment');
  }
  return data;
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${API_URL}/api/assignments`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch assignments');
  }
  return data.assignments;
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Assignment not found');
  }
  return data.assignment;
}

export async function fetchResult(id: string): Promise<GeneratedPaper> {
  const res = await fetch(`${API_URL}/api/assignments/${id}/result`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Result not available');
  }
  return data.result;
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete');
}
