import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type StudentAssignmentStatus = 'pending' | 'in_progress' | 'submitted' | 'graded' | 'returned';

export interface IStudentAssignment extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId; // Ref to the main Assignment
  studentId: Types.ObjectId;    // Ref to the User (student)
  classId: Types.ObjectId;      // Ref to the Class this assignment was given through
  teacherId: Types.ObjectId;    // Ref to the User (teacher who assigned it)
  assignedDate: Date;
  dueDate: Date;
  status: StudentAssignmentStatus;
  submittedAt?: Date;
  submissionContent?: {
    text?: string;
    files?: { url: string; name: string; type: string; }[]; // Example for file uploads
  };
  grade?: number;
  teacherFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentAssignmentSchema: Schema<IStudentAssignment> = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Teacher who made this specific assignment instance
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'graded', 'returned'],
      default: 'pending',
      required: true,
    },
    submittedAt: { type: Date },
    submissionContent: {
      text: { type: String },
      files: [{
        url: { type: String },
        name: { type: String },
        type: { type: String },
      }],
    },
    grade: { type: Number },
    teacherFeedback: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
StudentAssignmentSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true }); // A student should only have one instance of an assignment
StudentAssignmentSchema.index({ classId: 1, status: 1 });
StudentAssignmentSchema.index({ studentId: 1, dueDate: 1 });
StudentAssignmentSchema.index({ teacherId: 1, status: 1 });


const StudentAssignment: Model<IStudentAssignment> =
  mongoose.models.StudentAssignment ||
  mongoose.model<IStudentAssignment>('StudentAssignment', StudentAssignmentSchema);

export default StudentAssignment;