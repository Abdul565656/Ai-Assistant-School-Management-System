// lib/actions/auth.actions.ts
"use server";

import connectDB from "@/lib/db/connectDB";
import User, { UserRole } from "@/lib/db/models/user.model";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100).trim(),
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["student", "teacher"]),
});

export type SignUpFormState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
    _form?: string[]; // For general form errors
  };
};

export async function signUpUser(
  prevState: SignUpFormState | undefined,
  formData: FormData
): Promise<SignUpFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const validation = SignUpSchema.safeParse(rawFormData);

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid form data. Please check the fields.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, role } = validation.data;

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: email }); // email is already lowercased by Zod transform
    if (existingUser) {
      return { success: false, message: "An account with this email already exists.", errors: { email: ["Email already in use."] } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      hashedPassword,
      role: role as UserRole,
    });

    // Optionally revalidate a path if new user listings are shown publicly, etc.
    // revalidatePath('/');
    return { success: true, message: "Account created successfully! You can now sign in." };

  } catch (error: any) {
    console.error("Sign up error:", error);
    if (error.code === 11000) { // MongoDB duplicate key error for email
        return { success: false, message: "An account with this email already exists.", errors: { email: ["Email already in use."] } };
    }
    return { success: false, message: "An unexpected error occurred. Please try again.", errors: { _form: ["Server error, please try again later."] } };
  }
}