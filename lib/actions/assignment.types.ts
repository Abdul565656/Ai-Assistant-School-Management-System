// lib/actions/assignment.types.ts
import { z } from 'zod';
import { Types } from 'mongoose'; // Keep for PopulatedAssignment if ObjectIds are used there

export type ModelQuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'file_upload';

export const modelQuestionTypeValues: [ModelQuestionType, ...ModelQuestionType[]] = [
  'multiple_choice', 'short_answer', 'essay', 'file_upload',
];

// --- ZOD SCHEMAS (for form validation) ---

// Inferred type for a single option, as validated by Zod from the form
export type QuestionOptionFromForm = z.infer<typeof QuestionOptionSchema>;
const QuestionOptionSchema = z.object({
  id: z.string().uuid("Client-side option ID is invalid (for RHF keying)."),
  text: z.string().min(1, "Option text cannot be empty."),
  isCorrect: z.boolean(),
});

// Inferred type for a single question, as validated by Zod from the form
export type QuestionFromForm = z.infer<typeof QuestionSchema>;
const QuestionSchema = z.object({
  id: z.string().uuid("Client-side question ID is invalid (for RHF keying)."),
  questionText: z.string().min(1, "Question text cannot be empty."),
  questionType: z.enum(modelQuestionTypeValues, {
    errorMap: () => ({ message: "Please select a valid question type." }),
  }),
  points: z.coerce.number() // Converts string input from form to number
    .min(0, "Points cannot be negative.")
    .optional(), // Allows the field to be undefined (Mongoose default can then apply)
  options: z.array(QuestionOptionSchema).optional(), // Options array is optional for the question itself
})
.refine(data => { // Validation: MCQs need options
  if (data.questionType === 'multiple_choice') {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: "Multiple choice questions must have at least two options.",
  path: ["options"], // Error applied to the options array of a question
})
.refine(data => { // Validation: MCQs need one correct answer
  if (data.questionType === 'multiple_choice') {
    // Ensure options exist before checking for a correct one
    return data.options && data.options.some(opt => opt.isCorrect);
  }
  return true;
}, {
  message: "One option must be marked as correct for multiple choice questions.",
  path: ["options"], // Error applied to the options array of a question
});

// Zod Schema for the entire assignment creation form
export const CreateAssignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required.").trim(),
  description: z.string().trim().optional(), // trim before optional
  subjectId: z.string().min(1, "Subject is required."), // Expecting ObjectId as string
  dueDate: z.date().optional(),
  questions: z.array(QuestionSchema)
    .min(1, "At least one question is required.")
    .max(50, "Maximum of 50 questions allowed."), // Example constraint
});

// This is the type of the data AFTER Zod validation, used for submitting to the server action
export type CreateAssignmentFormValues = z.infer<typeof CreateAssignmentFormSchema>;


// --- REACT HOOK FORM SPECIFIC TYPES (for useForm's internal state TFieldValues) ---
export interface RHFQuestionOption {
  id: string; // Client-side UUID for React Hook Form keying
  text: string;
  isCorrect: boolean;
}

export interface RHFQuestion {
  id: string; // Client-side UUID for React Hook Form keying
  questionText: string;
  questionType: ModelQuestionType;
  points?: number; // RHF internal state can be number | undefined
  options?: RHFQuestionOption[];
}

// This is the type for useForm<TFieldValues> -> useForm<FormValuesForRHF, ...>
export interface FormValuesForRHF {
  title: string;
  description?: string;
  subjectId: string; // Initialized with "" in RHF defaultValues, Zod ensures it's selected
  dueDate?: Date;
  questions: RHFQuestion[];
}


// --- SERVER ACTION RESPONSE TYPES ---
export interface ServerActionResponse {
    success: boolean;
    message?: string;
    assignmentId?: string;     // If creation is successful
    formError?: string;        // For general form-level errors from server
    fieldErrors?: FieldErrorsMap; // For field-specific errors from server
}

// Type for fieldErrors object that can be used with RHF's setError
export type FieldErrorsMap = {
  [path: string]: string | string[] | { message?: string } | undefined;
} & {
  root?: { serverError?: string }; // For errors not tied to a specific field path
};


// --- DISPLAY TYPES (for page.tsx and other display components, like getAssignmentById response) ---
// These represent data after it's fetched and potentially serialized (e.g., ObjectIds to strings)

export interface SerializedQuestionOption {
  _id?: string; // Mongoose _id, as string
  text: string;
  isCorrect?: boolean;
}

export interface SerializedQuestion {
  _id?: string; // Mongoose _id, as string
  questionText: string;
  questionType: ModelQuestionType;
  options?: SerializedQuestionOption[];
  points?: number;
  // sortOrder?: number; // If you use it
}

export interface PopulatedAssignment {
  _id: string; // Mongoose _id, as string
  teacher: {
    _id: string; // Mongoose _id, as string
    name?: string;
    email?: string;
  };
  subjectId: { // Assuming subject is populated for display
    _id: string; // Mongoose _id, as string
    name: string;
  };
  title: string;
  description?: string;
  questions: SerializedQuestion[];
  dueDate?: string;   // Dates are often strings after JSON serialization
  createdAt: string; // Dates are often strings after JSON serialization
  updatedAt: string; // Dates are often strings after JSON serialization
}