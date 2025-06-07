// lib/db/models/class.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  teacherId: Types.ObjectId; // Ref 'User'
  subjectId: Types.ObjectId; // Ref 'Subject'
  students: Types.ObjectId[]; // Array of User ObjectIds who are students
  year?: string;
  classCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema: Schema<IClass> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    year: { type: String, trim: true },
    classCode: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

ClassSchema.index({ teacherId: 1, subjectId: 1 });
// Optional: If class names should be unique per teacher
// ClassSchema.index({ teacherId: 1, name: 1 }, { unique: true });

const Class: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);

export default Class;