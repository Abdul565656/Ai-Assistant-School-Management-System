// lib/actions/class.actions.ts
"use server";

import connectToDB from "@/lib/db/connectDB";
import Class, { IClass } from "@/lib/db/models/class.model";
import User, { IUser } from "@/lib/db/models/user.model";
import Subject from "@/lib/db/models/subject.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose, { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// Assuming assignment.types.ts is in the same directory or adjust path
import { ModelQuestionType } from "./assignment.types"; // Example, if needed for other actions not shown

// Type for the processed class object for listing teachers' classes
export type ListedTeacherClass = {
    _id: string;
    name: string;
    teacherId: string;
    subjectId: string;
    subjectName?: string;
    studentCount?: number;
    students: string[]; // Array of student ID strings
    year?: string;
    classCode?: string;
    createdAt: Date;
    updatedAt: Date;
};

// Main response type for class actions
export interface ClassServerActionResponse {
    success: boolean;
    message?: string;
    class?: IClass | null; // For single raw class operations (e.g., after creation before full serialization for display)
    listedClass?: ListedTeacherClass | null; // For a single processed class
    classes?: ListedTeacherClass[] | null; // Use the new type here for lists
    error?: string;
    fieldErrors?: { [key: string]: string };
}

// Specific response type for getClassDetailsForTeacherAction
export type PopulatedClassForManagePage = {
    _id: string;
    name: string;
    teacherId: { _id: string; name?: string; email?: string };
    subjectId: { _id: string; name: string };
    students: { _id: string; name?: string; email?: string }[]; // No nulls after filter
    year?: string;
    classCode?: string;
    createdAt: Date;
    updatedAt: Date;
};
export interface ClassDetailsResponse {
    success: boolean;
    message?: string;
    class?: PopulatedClassForManagePage | null;
    error?: string;
}


const CreateClassFormSchema = z.object({
    name: z.string().min(1, "Class name is required.").trim(),
    subjectId: z.string().min(1, "Subject is required.").refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid subject ID format." }),
    year: z.string().trim().optional(), // Corrected: trim() before optional()
});

export async function createClassAction(
    prevState: ClassServerActionResponse | undefined,
    formData: FormData
): Promise<ClassServerActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; role?: string };

        if (!userFromSession?.id || userFromSession.role !== 'teacher') {
            return { success: false, error: "Unauthorized: Only teachers can create classes." };
        }
        if (typeof userFromSession.id !== 'string' || !mongoose.Types.ObjectId.isValid(userFromSession.id)) {
            return { success: false, error: "Invalid teacher ID in session." };
        }
        const teacherId = new Types.ObjectId(userFromSession.id);

        const validatedFields = CreateClassFormSchema.safeParse({
            name: formData.get('name'),
            subjectId: formData.get('subjectId'),
            year: formData.get('year'),
        });

        if (!validatedFields.success) {
            const fieldErrors: { [key: string]: string } = {};
            validatedFields.error.issues.forEach(issue => {
                if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
            });
            return { success: false, message: "Validation failed. Please check the fields.", fieldErrors: fieldErrors };
        }

        const { name, subjectId: subjectIdString, year } = validatedFields.data;
        // subjectIdString is already validated as a valid ObjectId string by Zod .refine()
        const subjectObjectId = new Types.ObjectId(subjectIdString);

        await connectToDB();

        const subjectExists = await Subject.findById(subjectObjectId);
        if (!subjectExists) {
            return { success: false, fieldErrors: { subjectId: "Selected subject does not exist." } };
        }

        const newClass = new Class({
            name: name,
            teacherId: teacherId,
            subjectId: subjectObjectId,
            year: year || undefined,
            students: [],
        });
        const savedClass = await newClass.save();

        await User.findByIdAndUpdate(teacherId, { $addToSet: { teachingClasses: savedClass._id } });
        revalidatePath("/teacher/classes");
        return { success: true, message: "Class created successfully.", class: JSON.parse(JSON.stringify(savedClass)) };
    } catch (error: any) {
        console.error("Error creating class:", error);
        if (error.code === 11000) {
            return { success: false, message: "A class with this name or other unique detail might already exist.", error: "Duplicate entry." };
        }
        return { success: false, error: error.message || "Database error: Failed to create class." };
    }
}

export async function getTeacherClassesAction(): Promise<ClassServerActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; role?: string };
        if (!userFromSession?.id || userFromSession.role !== 'teacher') return { success: false, error: "Unauthorized." };
        if (!mongoose.Types.ObjectId.isValid(userFromSession.id)) return { success: false, error: "Invalid teacher ID." };
        const teacherId = new Types.ObjectId(userFromSession.id);

        await connectToDB();
        const rawClasses = await Class.find({ teacherId: teacherId })
            .populate<{ subjectId: { _id: Types.ObjectId; name: string } }>({ path: 'subjectId', select: 'name _id' })
            .sort({ year: -1, name: 1 })
            .lean<IClass[]>(); // IClass includes ObjectId for sub-documents

        const classesWithDetails: ListedTeacherClass[] = rawClasses.map(c => {
            const subject = c.subjectId as unknown as { _id: Types.ObjectId; name: string }; // Cast populated subject
            return {
                _id: c._id.toString(),
                name: c.name,
                teacherId: c.teacherId.toString(),
                subjectId: subject?._id?.toString() || "", // subjectId is string
                subjectName: subject?.name || 'N/A',
                studentCount: c.students?.length || 0,
                students: c.students.map(sId => sId.toString()), // array of student ID strings
                year: c.year || undefined,
                classCode: c.classCode || undefined,
                createdAt: c.createdAt, // Keep as Date object
                updatedAt: c.updatedAt, // Keep as Date object
            };
        });
        return { success: true, classes: classesWithDetails };
    } catch (error: any) {
        console.error("Error fetching teacher classes:", error);
        return { success: false, error: error.message || "Database error: Failed to fetch classes.", classes: [] };
    }
}

export async function getClassDetailsForTeacherAction(classId: string): Promise<ClassDetailsResponse> {
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; role?: string };
        if (!userFromSession?.id || userFromSession.role !== 'teacher') return { success: false, error: "Unauthorized." };
        if (!mongoose.Types.ObjectId.isValid(userFromSession.id)) return { success: false, error: "Invalid teacher ID."};
        const teacherId = new Types.ObjectId(userFromSession.id);

        if (!mongoose.Types.ObjectId.isValid(classId)) return { success: false, error: "Invalid class ID format." };
        const classObjectId = new Types.ObjectId(classId);

        await connectToDB();
        const foundClass = await Class.findOne({ _id: classObjectId, teacherId: teacherId })
            .populate<{ subjectId: { _id: Types.ObjectId; name: string } }>({ path: 'subjectId', select: 'name _id' })
            .populate<{ teacherId: { _id: Types.ObjectId; name?: string; email?: string } }>({ path: 'teacherId', select: 'name email _id' })
            .populate<{ students: ({ _id: Types.ObjectId; name?: string; email?: string } | null)[] }>({ path: 'students', select: 'name email _id', options: { sort: { name: 1 } } })
            .lean();

        if (!foundClass) return { success: false, error: "Class not found or not authorized." };

        const populatedTeacher = foundClass.teacherId as { _id: Types.ObjectId; name?: string; email?: string };
        const populatedSubject = foundClass.subjectId as { _id: Types.ObjectId; name: string };
        const populatedStudents = (foundClass.students || []) as ({ _id: Types.ObjectId; name?: string; email?: string } | null)[];

        if (!populatedTeacher || !populatedSubject) {
             return { success: false, error: "Class data is incomplete (teacher or subject missing)." };
        }

        const classToReturn: PopulatedClassForManagePage = {
            _id: foundClass._id.toString(),
            name: foundClass.name,
            teacherId: {
                _id: populatedTeacher._id.toString(),
                name: populatedTeacher.name,
                email: populatedTeacher.email,
            },
            subjectId: {
                _id: populatedSubject._id.toString(),
                name: populatedSubject.name,
            },
            students: populatedStudents
                .filter((student): student is { _id: Types.ObjectId; name?: string; email?: string } => student !== null) // Type guard
                .map(student => ({
                    _id: student._id.toString(),
                    name: student.name,
                    email: student.email,
            })),
            year: foundClass.year || undefined,
            classCode: foundClass.classCode || undefined,
            createdAt: foundClass.createdAt,
            updatedAt: foundClass.updatedAt,
        };
        return { success: true, class: classToReturn };
    } catch (error: any) {
        console.error("Error in getClassDetailsForTeacherAction:", error);
        return { success: false, error: error.message || "Database error: Failed to fetch class details." };
    }
}

const AddStudentFormSchema = z.object({ studentEmail: z.string().email("Invalid email address.").trim() });
export async function addStudentToClassAction(
    classId: string, // Passed directly
    prevState: ClassServerActionResponse | undefined, // For useFormState if used, can be undefined
    formData: FormData
): Promise<ClassServerActionResponse> { // Return main response type
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; role?: string };
        if (!userFromSession?.id || userFromSession.role !== 'teacher') return { success: false, error: "Unauthorized." };
        if (!mongoose.Types.ObjectId.isValid(userFromSession.id)) return { success: false, error: "Invalid teacher ID."};
        const teacherId = new Types.ObjectId(userFromSession.id);

        if (!mongoose.Types.ObjectId.isValid(classId)) return { success: false, error: "Invalid class ID." };
        const classObjectId = new Types.ObjectId(classId);

        const validatedFields = AddStudentFormSchema.safeParse({ studentEmail: formData.get('studentEmail') });

        if (!validatedFields.success) {
            const fieldErrors: { [key: string]: string } = {};
            validatedFields.error.issues.forEach(issue => { if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message; });
            return { success: false, message: "Validation failed.", fieldErrors: fieldErrors };
        }
        const { studentEmail } = validatedFields.data;

        await connectToDB();
        const targetClass = await Class.findOne({ _id: classObjectId, teacherId: teacherId });
        if (!targetClass) return { success: false, error: "Class not found or not authorized." };

        const studentUser = await User.findOne({ email: studentEmail }).lean<IUser>();
        if (!studentUser) return { success: false, fieldErrors: { studentEmail: "No student found with this email." }, message: "Student not found." };
        if (studentUser.role !== 'student') return { success: false, fieldErrors: { studentEmail: "This email does not belong to a student." }, message: "User is not a student." };

        if (targetClass.students.some(sId => sId.equals(studentUser._id))) {
             return { success: false, message: "Student already in this class.", fieldErrors: { studentEmail: "Student already enrolled." } };
        }

        await Class.findByIdAndUpdate(classObjectId, { $addToSet: { students: studentUser._id } });
        await User.findByIdAndUpdate(studentUser._id, { $addToSet: { enrolledClasses: classObjectId } });

        revalidatePath(`/teacher/classes/${classId}/manage`);
        return { success: true, message: `Student "${studentUser.name || studentUser.email}" added successfully.` };
    } catch (error: any) {
        console.error("Error adding student:", error);
        return { success: false, error: error.message || "Database error: Failed to add student." };
    }
}