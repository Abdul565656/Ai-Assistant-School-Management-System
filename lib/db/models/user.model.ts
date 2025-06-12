import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string; 
  emailVerified?: Date;
  image?: string;
  role: UserRole;
  hashedPassword?: string;
 enrolledClasses?: Types.ObjectId[]; 
  teachingClasses?: Types.ObjectId[]; 
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true }, 
    emailVerified: { type: Date },
    image: { type: String },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
      default: 'student',
    },
    hashedPassword: { type: String }, 
    enrolledClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    teachingClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;