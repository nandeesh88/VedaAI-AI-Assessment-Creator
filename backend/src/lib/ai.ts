import Groq from 'groq-sdk';
import { CreateAssignmentInput, GeneratedPaper, GeneratedSection } from '../types';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export function buildPrompt(input: CreateAssignmentInput): string {
  const questionBreakdown = input.questionTypes
    .map((qt) => `  - ${qt.label}: ${qt.questions} question(s), ${qt.marks} mark(s) each`)
    .join('\n');

  const totalQuestions = input.questionTypes.reduce((s, qt) => s + qt.questions, 0);
  const totalMarks = input.questionTypes.reduce((s, qt) => s + qt.questions * qt.marks, 0);

  return `You are an expert teacher creating a structured exam question paper.

Create a question paper with the following specifications:
- Subject: ${input.subject || 'General Science'}
- Topic/Chapter: ${input.topic || 'General Topics'}
- Class: ${input.className || '8th Grade'}
- School: ${input.schoolName || 'Delhi Public School'}
- Duration: ${input.duration || '3 hours'}
- Due Date: ${input.dueDate || 'N/A'}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

Question breakdown by type and section:
${questionBreakdown}

Additional instructions:
${input.additionalInfo || 'Generate well-balanced questions covering the topic.'}
${input.extractedText ? `\nReference material extracted from uploaded document (use this to generate relevant questions):\n"""\n${input.extractedText}\n"""` : ''}

CRITICAL: Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation. Just raw JSON.

The JSON must follow this exact schema:
{
  "schoolName": "string",
  "subject": "string",
  "className": "string",
  "duration": "string",
  "totalMarks": number,
  "generalInstructions": ["string"],
  "sections": [
    {
      "title": "Section A",
      "questionType": "Short Answer Questions",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "totalMarks": number,
      "questions": [
        {
          "number": 1,
          "text": "Full question text here",
          "difficulty": "easy",
          "marks": number
        }
      ]
    }
  ]
}

Rules:
1. Group questions into sections by question type (Section A, Section B, etc.)
2. Each question must have a difficulty: "easy", "medium", or "hard"
3. Distribute difficulties roughly: 30% easy, 50% medium, 20% hard
4. Questions must be specific, educational, and relevant to the topic
5. generalInstructions should have 3-5 standard exam instructions
6. Marks per question must match the specified marks for that question type
7. DO NOT include answer keys in the output`;
}

export async function generateQuestionPaper(input: CreateAssignmentInput): Promise<GeneratedPaper> {
  const prompt = buildPrompt(input);

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are an expert teacher and exam paper creator. You always respond with valid JSON only. No markdown, no backticks, no explanation text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content?.trim() || '';

  // Strip markdown code fences if present
  const jsonText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: GeneratedPaper;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error('[AI] Failed to parse JSON response:', jsonText.substring(0, 500));
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  return sanitizePaper(parsed, input);
}

function sanitizePaper(paper: unknown, input: CreateAssignmentInput): GeneratedPaper {
  const p = paper as Partial<GeneratedPaper>;

  const sections: GeneratedSection[] = (p.sections || []).map((sec, idx) => {
    const questions = (sec.questions || []).map((q, qIdx) => ({
      number: q.number || qIdx + 1,
      text: q.text || 'Question text unavailable',
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as
        | 'easy'
        | 'medium'
        | 'hard',
      marks: typeof q.marks === 'number' ? q.marks : 1,
    }));

    return {
      title: sec.title || `Section ${String.fromCharCode(65 + idx)}`,
      questionType: sec.questionType || 'Questions',
      instruction: sec.instruction || 'Attempt all questions.',
      totalMarks: sec.totalMarks || questions.reduce((s, q) => s + q.marks, 0),
      questions,
    };
  });

  return {
    schoolName: p.schoolName || input.schoolName || 'Delhi Public School',
    subject: p.subject || input.subject || 'General',
    className: p.className || input.className || '8th',
    duration: p.duration || input.duration || '3 hours',
    totalMarks:
      p.totalMarks ||
      input.questionTypes.reduce((s, qt) => s + qt.questions * qt.marks, 0),
    sections,
    generalInstructions: p.generalInstructions || [
      'All questions are compulsory unless stated otherwise.',
      'Write neatly and clearly.',
      'Begin each answer on a new page.',
      'Marks are indicated against each question.',
    ],
  };
}
