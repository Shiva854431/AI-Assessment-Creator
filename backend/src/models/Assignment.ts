import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  instructions: string;
  fileUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  questionPaper?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    questionTypes: {
      type: [String],
      required: true,
    },
    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    marksPerQuestion: {
      type: Number,
      required: true,
      min: 1,
    },
    instructions: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    questionPaper: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
