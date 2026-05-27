import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { addAssignmentJob } from '../lib/queue';
import { cacheGet, cacheSet } from '../lib/redis';
import { GeneratedPaper } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const parsePdf = pdfParse as unknown as (buffer: Buffer) => Promise<{ text?: string }>;

// Validation schema
const CreateAssignmentSchema = z.object({
  subject: z.string().optional().default('General Science'),
  topic: z.string().optional().default('General Topics'),
  additionalInfo: z.string().optional().default(''),
  dueDate: z.string().optional(),
  schoolName: z.string().optional().default('Delhi Public School'),
  className: z.string().optional().default('8th'),
  duration: z.string().optional().default('3 hours'),
  questionTypes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        questions: z.number().min(0),
        marks: z.number().min(0),
      })
    )
    .min(1, 'At least one question type is required'),
});

// POST /api/assignments - Create assignment & enqueue job
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let bodyData: unknown = req.body;
    if (typeof req.body.data === 'string') {
      try {
        bodyData = JSON.parse(req.body.data);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in form field "data"',
        });
      }
    }
    const parsed = CreateAssignmentSchema.safeParse(bodyData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const totalQuestions = data.questionTypes.reduce((s, qt) => s + qt.questions, 0);
    const totalMarks = data.questionTypes.reduce((s, qt) => s + qt.questions * qt.marks, 0);
    let extractedText = '';

    if (req.file) {
      try {
        const pdfData = await parsePdf(req.file.buffer);
        extractedText = pdfData.text?.slice(0, 3000) || '';
        console.log('[API] Extracted PDF text:', extractedText.substring(0, 100));
      } catch (e) {
        console.log('[API] PDF parse failed, continuing without it');
      }
    }

    if (totalQuestions === 0) {
      return res.status(400).json({
        success: false,
        error: 'Total questions must be greater than 0',
      });
    }

    const assignment = await Assignment.create({
      ...data,
      extractedText,
      totalQuestions,
      totalMarks,
      status: 'queued',
    });

    // Add to BullMQ
    const jobId = await addAssignmentJob(assignment._id.toString());
    await Assignment.findByIdAndUpdate(assignment._id, { jobId });

    console.log(`[API] Created assignment ${assignment._id}, job ${jobId}`);

    return res.status(201).json({
      success: true,
      assignmentId: assignment._id.toString(),
      jobId,
      status: 'queued',
    });
  } catch (err) {
    console.error('[API] Create assignment error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/assignments - List all assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .select('-result') // Don't send full result in list
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, assignments });
  } catch (err) {
    console.error('[API] List assignments error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/assignments/:id - Get single assignment with result
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `assignment:${id}`;
    const cached = await cacheGet<{ assignment: unknown }>(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached, fromCache: true });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const response = { success: true, assignment };

    // Cache completed assignments
    if (assignment.status === 'completed') {
      await cacheSet(cacheKey, response, 3600);
    }

    return res.json(response);
  } catch (err) {
    console.error('[API] Get assignment error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/assignments/:id/result - Get just the generated result
router.get('/:id/result', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try cache
    const cached = await cacheGet<GeneratedPaper>(`result:${id}`);
    if (cached) {
      return res.json({ success: true, result: cached, fromCache: true });
    }

    const assignment = await Assignment.findById(id).select('status result errorMessage');
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (assignment.status === 'failed') {
      return res.status(422).json({
        success: false,
        error: assignment.errorMessage || 'Generation failed',
      });
    }

    if (assignment.status !== 'completed' || !assignment.result) {
      return res.status(202).json({
        success: false,
        status: assignment.status,
        message: 'Still generating...',
      });
    }

    return res.json({ success: true, result: assignment.result });
  } catch (err) {
    console.error('[API] Get result error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[API] Delete assignment error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
