// lib/db/models/submission.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IUser } from './user.model';
import { IAssignment, IAssignmentQuestion } from './assignment.model'; // IAssignmentQuestion for questionId type

export interface IAnswer { // Not extending Document as it's a subdocument
  _id?: Types.ObjectId;
  questionId: Types.ObjectId | IAssignmentQuestion['_id']; // Reference to the specific question _id within the assignment
  answerText?: string;
  selectedOption?: string; // Could be the text or an ID of the option
  // selectedOptions?: string[]; // For multi-select
  fileUrl?: string;
}

const AnswerSchema: Schema<IAnswer> = new Schema({
  questionId: { type: Schema.Types.ObjectId, required: true }, // This should refer to the _id of a question in the Assignment.questions array
  answerText: { type: String },
  selectedOption: { type: String },
  fileUrl: { type: String }
}, { _id: true }); // _id: true is default for subdocuments, you can make it false if not needed.


export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  assignment: Types.ObjectId | IAssignment;
  student: Types.ObjectId | IUser;
  answers: Types.DocumentArray<IAnswer>;
  submittedAt: Date;
  score?: number;
  aiFeedback?: string;
  teacherFeedback?: string;
  gradedAt?: Date;
  status: 'submitted' | 'graded' | 'resubmitted' | 'late';
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema<ISubmission> = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [AnswerSchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
    },
    aiFeedback: {
      type: String,
    },
    teacherFeedback: {
      type: String,
    },
    gradedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmitted', 'late'],
      default: 'submitted',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;