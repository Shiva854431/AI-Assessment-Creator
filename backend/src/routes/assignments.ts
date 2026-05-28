import { Router, Request, Response } from 'express';
import Assignment from '../models/Assignment';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateQuestionPaper } from '../services/aiGenerator';

const router = Router();

// In-memory storage for assignments (demo mode)
const assignmentsStorage: any[] = [];

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

// Validation schema
const assignmentSchema = Joi.object({
  title: Joi.string().required().min(3),
  subject: Joi.string().required().min(2),
  dueDate: Joi.date().iso().required(),
  questionTypes: Joi.array().items(Joi.string()).min(1).required(),
  numberOfQuestions: Joi.number().integer().min(1).max(50).required(),
  marksPerQuestion: Joi.number().integer().min(1).required(),
  instructions: Joi.string().required().min(10),
  fileUrl: Joi.string().allow('').optional(),
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload endpoint
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Create assignment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = assignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log('Creating assignment with subject:', value.subject);

    // Generate question paper using AI
    const questionPaper = await generateQuestionPaper({
      title: value.title,
      subject: value.subject,
      questionTypes: value.questionTypes,
      numberOfQuestions: value.numberOfQuestions,
      marksPerQuestion: value.marksPerQuestion,
      instructions: value.instructions,
      fileContent: value.fileUrl ? '' : undefined, // TODO: Extract file content if fileUrl provided
    });

    console.log('Generated question paper subject:', questionPaper.subject);

    const assignment = {
      ...value,
      _id: `assignment-${Date.now()}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionPaper,
    };

    // Store in memory
    assignmentsStorage.push(assignment);

    res.status(201).json({
      success: true,
      assignment,
      message: 'Assignment created with AI-generated question paper',
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, assignments: assignmentsStorage });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = assignmentsStorage.find(a => a._id === req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ success: true, assignment });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update assignment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Demo mode: Return success
    res.json({ success: true, message: 'Assignment updated (demo mode)' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Demo mode: Return success
    res.json({ success: true, message: 'Assignment deleted (demo mode)' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Regenerate question paper
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { title, subject, questionTypes, numberOfQuestions, marksPerQuestion, instructions } = req.body;
    
    // Validate required fields
    if (!title || !subject || !questionTypes || !numberOfQuestions || !marksPerQuestion || !instructions) {
      return res.status(400).json({ error: 'Missing required fields for regeneration' });
    }
    
    const questionPaper = await generateQuestionPaper({
      title,
      subject,
      questionTypes,
      numberOfQuestions,
      marksPerQuestion,
      instructions,
    });

    res.json({
      success: true,
      questionPaper,
      message: 'Question paper regenerated successfully',
    });
  } catch (error) {
    console.error('Error regenerating question paper:', error);
    res.status(500).json({ error: 'Failed to regenerate question paper' });
  }
});

export default router;
