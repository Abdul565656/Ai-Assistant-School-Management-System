// lib/db/models/user.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string; // Should be unique if used for login
  emailVerified?: Date;
  image?: string;
  role: UserRole;
  hashedPassword?: string;
  // Student specific
  enrolledClasses?: Types.ObjectId[]; // Array of Class ObjectIds
  // Teacher specific
  teachingClasses?: Types.ObjectId[]; // Array of Class ObjectIds
  createdAt: Date;
  updatedAt: Date;
  // Add other fields that your NextAuth adapter might manage (e.g., accounts, sessions)
  // For example, if using a general user schema for NextAuth.js:
  // accounts: [{ type: Schema.Types.ObjectId, ref: 'Account' }]; // If you have an Account model for OAuth
  // sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }]; // If you have a Session model
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true }, // Make email required and unique
    emailVerified: { type: Date },
    image: { type: String },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
      default: 'student',
    },
    hashedPassword: { type: String }, // Only if using credentials provider
    enrolledClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    teachingClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    // accounts: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    // sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
  },
  { timestamps: true }
);

// Optional: Ensure email is indexed for faster lookups if you search by it often.
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;