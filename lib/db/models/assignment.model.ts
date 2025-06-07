// lib/db/models/assignment.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type QuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'file_upload';

export interface IAssignmentQuestion {
  _id?: Types.ObjectId;
  questionText: string;
  questionType: QuestionType;
  options?: { _id?: Types.ObjectId; text: string; isCorrect?: boolean; }[];
  points?: number;
  sortOrder?: number;
}

const AssignmentQuestionSchema: Schema<IAssignmentQuestion> = new Schema({
  questionText: { type: String, required: true },
  questionType: { type: String, enum: ['multiple_choice', 'short_answer', 'essay', 'file_upload'], required: true, },
  options: [{ text: { type: String, required: true }, isCorrect: { type: Boolean, default: false }, }],
  points: { type: Number, default: 10 },
  sortOrder: { type: Number, default: 0 },
});

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  teacher: Types.ObjectId; // Author of the assignment content
  title: string;
  description?: string;
  subjectId: Types.ObjectId; // <<< NEW: Ref 'Subject'
  questions: Types.DocumentArray<IAssignmentQuestion>;
  dueDate?: Date; // This could be a master due date or removed if per-class due dates are primary
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema<IAssignment> = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true }, // <<< NEW
    questions: [AssignmentQuestionSchema],
    dueDate: { type: Date },
  },
  { timestamps: true }
);

AssignmentSchema.index({ teacher: 1, subjectId: 1 }); // Updated index

const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;