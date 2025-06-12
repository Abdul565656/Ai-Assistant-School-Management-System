"use server";

import connectToDB from "@/lib/db/connectDB";
import Assignment from "@/lib/db/models/assignment.model";
import Class from "@/lib/db/models/class.model"; 
import StudentAssignment, { IStudentAssignment } from "@/lib/db/models/studentAssignment.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import mongoose, { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
    CreateAssignmentFormValues,
    ServerActionResponse,
    PopulatedAssignment,
    SerializedQuestion, // Used by PopulatedAssignment
    SerializedQuestionOption // Used by SerializedQuestion
} from "./assignment.types";


// --- FUNCTION TO CREATE AN ASSIGNMENT ---
export async function createAssignmentAction(
    data: CreateAssignmentFormValues
): Promise<ServerActionResponse> {
    "use server";
    console.log("createAssignmentAction received data:", JSON.stringify(data, null, 2));

    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        // Ensure your session user type matches this, especially the id property
        const userFromSession = session?.user as { id?: string; _id?: string; role?: string; email?: string; name?: string; };

        const teacherIdString = userFromSession?.id || userFromSession?._id;

        if (!teacherIdString || userFromSession.role !== 'teacher') {
            return { success: false, message: "Unauthorized: Only teachers can create assignments." };
        }
        if (!mongoose.Types.ObjectId.isValid(teacherIdString)) {
            return { success: false, message: "Invalid teacher ID format in session." };
        }
        if (!mongoose.Types.ObjectId.isValid(data.subjectId)) {
            return { success: false, message: "Invalid subject ID format." };
        }

        const teacherObjectId = new Types.ObjectId(teacherIdString);
        const subjectObjectId = new Types.ObjectId(data.subjectId);

        const questionsForDb = data.questions.map(q => {
            // The `id` from RHF is client-side only, Mongoose will generate `_id`
            const { id, ...restOfQuestion } = q;
            return {
                ...restOfQuestion,
                _id: new mongoose.Types.ObjectId(), // Generate new ObjectId for subdocument
                points: q.points ?? 10, // Default points if undefined, ensure your model schema reflects this default too
                options: q.options ? q.options.map(opt => {
                    const { id: optionId, ...restOfOption } = opt;
                    return { ...restOfOption, _id: new mongoose.Types.ObjectId() };
                }) : undefined,
            };
        });

        const newAssignment = new Assignment({
            title: data.title,
            description: data.description,
            subjectId: subjectObjectId,
            teacher: teacherObjectId,
            dueDate: data.dueDate, // This is the general due date from assignment creation
            questions: questionsForDb,
        });

        await newAssignment.save();

        revalidatePath("/teacher/assignments");
        // Also revalidate the newly created assignment's detail page if you navigate there immediately
        revalidatePath(`/teacher/assignments/${newAssignment._id.toString()}`);

        return {
            success: true,
            message: "Assignment created successfully!",
            assignmentId: newAssignment._id.toString(),
        };

    } catch (error: any) {
        console.error("Error in createAssignmentAction:", error);
        if (error instanceof mongoose.Error.ValidationError) {
            const fieldErrors: { [key: string]: string } = {};
            for (const field in error.errors) {
                fieldErrors[field] = error.errors[field].message;
            }
            return { success: false, message: "Validation failed. Please check the fields.", fieldErrors };
        }
        return {
            success: false,
            message: "Failed to create assignment.",
            formError: error.message || "An unexpected server error occurred."
        };
    }
}


// --- FUNCTION TO GET AN ASSIGNMENT BY ITS ID ---
export async function getAssignmentById(
    assignmentId: string
): Promise<PopulatedAssignment | null> {
    "use server";
    try {
        await connectToDB();

        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            console.error("Invalid assignment ID format provided to getAssignmentById:", assignmentId);
            return null;
        }

        const assignmentObjectId = new Types.ObjectId(assignmentId);

        const assignment = await Assignment.findById(assignmentObjectId)
            .populate<{ teacher: { _id: Types.ObjectId; name?: string; email?: string } }>({ path: "teacher", select: "name email _id" })
            .populate<{ subjectId: { _id: Types.ObjectId; name: string } }>({ path: "subjectId", select: "name _id" })
            .lean(); // .lean() is important for plain JS objects

        if (!assignment) {
            console.warn(`Assignment with ID ${assignmentId} not found.`);
            return null;
        }
        
        // Transform to match PopulatedAssignment, ensuring all ObjectIds and Dates are strings
        // Your PopulatedAssignment type already expects strings for _id, dates, and populated _ids.
        const serializableAssignment: PopulatedAssignment = {
            ...assignment,
            _id: assignment._id.toString(),
            teacher: {
                _id: assignment.teacher._id.toString(),
                name: assignment.teacher.name,
                email: assignment.teacher.email,
            },
            subjectId: {
                _id: assignment.subjectId._id.toString(),
                name: assignment.subjectId.name,
            },
            questions: assignment.questions.map(q => ({
                ...q,
                _id: q._id?.toString(), // question _id might be optional if using DocumentArray defaults
                options: q.options?.map(opt => ({
                    ...opt,
                    _id: opt._id?.toString(),
                })),
            })),
            dueDate: assignment.dueDate?.toISOString(), // Convert Date to ISO string
            createdAt: assignment.createdAt.toISOString(),
            updatedAt: assignment.updatedAt.toISOString(),
        };

        return serializableAssignment;

    } catch (error: any) {
        console.error(`Error fetching assignment by ID ${assignmentId}:`, error);
        return null;
    }
}


// --- ACTION TO ASSIGN AN ASSIGNMENT TO CLASSES ---

export interface AssignActionResponse {
    success: boolean;
    message?: string;
    error?: string; // General error message
    fieldErrors?: { [key: string]: string }; // For Zod validation errors
    assignedCount?: number;
}

// Zod schema for validating the form data for assigning assignments
const AssignAssignmentFormSchema = z.object({
    assignmentId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid assignment ID." }),
    classIds: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid class ID in selection." }))
                 .min(1, "At least one class must be selected."),
    dueDate: z.coerce.date({ errorMap: () => ({ message: "Due date is required and must be a valid date."}) }),
    publishDate: z.coerce.date().optional(), // Date assignment becomes visible/active
});


export async function assignAssignmentToClassesAction(
    prevState: AssignActionResponse | undefined, // For useFormState
    formData: FormData
): Promise<AssignActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; _id?: string; role?: string };
        const teacherIdFromSession = userFromSession?.id || userFromSession?._id;

        if (!teacherIdFromSession || userFromSession.role !== 'teacher') {
            return { success: false, error: "Unauthorized: Only teachers can assign work." };
        }
        if (!mongoose.Types.ObjectId.isValid(teacherIdFromSession)) {
             return { success: false, error: "Invalid teacher ID in session." };
        }
        const teacherObjectId = new Types.ObjectId(teacherIdFromSession);

        const classIdStrings = formData.getAll('classIds') as string[]; // FormData.getAll returns string[]

        const validatedFields = AssignAssignmentFormSchema.safeParse({
            assignmentId: formData.get('assignmentId'),
            classIds: classIdStrings,
            dueDate: formData.get('dueDate'),
            publishDate: formData.get('publishDate'),
        });

        if (!validatedFields.success) {
            const fieldErrors: { [key: string]: string } = {};
            let generalMessage = "Validation failed. Please check the form.";
            validatedFields.error.issues.forEach(issue => {
                const path = issue.path.join('.'); // e.g., "classIds.0" or "dueDate"
                fieldErrors[path] = issue.message;
                // For array-level error like "At least one class must be selected"
                if (issue.path.length === 1 && issue.path[0] === 'classIds') {
                    generalMessage = issue.message;
                }
            });
            return { success: false, message: generalMessage, fieldErrors };
        }

        const { assignmentId, classIds, dueDate, publishDate } = validatedFields.data;
        const assignmentObjectId = new Types.ObjectId(assignmentId);
        const classObjectIds = classIds.map(id => new Types.ObjectId(id));
        const assignedDate = publishDate || new Date(); // If publishDate is not set, assign immediately

        await connectToDB();

        // Verify the teacher owns the original assignment
        const originalAssignment = await Assignment.findOne({ _id: assignmentObjectId, teacher: teacherObjectId });
        if (!originalAssignment) {
            return { success: false, error: "Assignment not found or you are not authorized to assign it." };
        }

        let totalStudentsAssigned = 0;
        const errorsEncountered: string[] = [];

        for (const classObjectId of classObjectIds) {
            // Fetch class and ensure the current teacher manages it
            const targetClass = await Class.findOne({ _id: classObjectId, teacherId: teacherObjectId })
                                      .select('students name') // Assuming 'students' is an array of student ObjectIds
                                      .populate<{ students: { _id: Types.ObjectId }[] }>('students', '_id'); // Populate only _id if that's what you need

            if (!targetClass) {
                errorsEncountered.push(`Class with ID ${classObjectId.toString()} not found or not managed by you.`);
                continue;
            }

            if (!targetClass.students || targetClass.students.length === 0) {
                errorsEncountered.push(`Class "${targetClass.name}" has no students enrolled.`);
                continue;
            }

            const studentObjectIdsInClass = targetClass.students.map(student => student._id); // Now these are ObjectIds

            // Find which students in this class have already been assigned this assignment
            const existingStudentAssignments: Pick<IStudentAssignment, 'studentId'>[] = await StudentAssignment.find({
                assignmentId: assignmentObjectId,
                classId: classObjectId,
                studentId: { $in: studentObjectIdsInClass }
            }).select('studentId').lean(); // Fetch only studentId for efficiency

            const existingStudentIdsSet = new Set(
                existingStudentAssignments.map(sa => sa.studentId.toString())
            );

            const studentAssignmentsToCreate: Partial<IStudentAssignment>[] = [];
            for (const studentObjectId of studentObjectIdsInClass) {
                if (!existingStudentIdsSet.has(studentObjectId.toString())) {
                    studentAssignmentsToCreate.push({
                        assignmentId: assignmentObjectId,
                        studentId: studentObjectId,
                        classId: classObjectId,
                        teacherId: teacherObjectId, // The teacher making this assignment instance
                        assignedDate: assignedDate,
                        dueDate: dueDate,
                        status: 'pending', // Default status from IStudentAssignment
                    });
                }
            }

            if (studentAssignmentsToCreate.length > 0) {
                try {
                    await StudentAssignment.insertMany(studentAssignmentsToCreate);
                    totalStudentsAssigned += studentAssignmentsToCreate.length;
                } catch (insertError: any) {
                    console.error(`Error inserting student assignments for class ${targetClass.name}:`, insertError);
                    errorsEncountered.push(`Failed to assign to some students in class "${targetClass.name}".`);
                }
            }
            
            const skippedCount = studentObjectIdsInClass.length - studentAssignmentsToCreate.length;
            if (skippedCount > 0) {
                errorsEncountered.push(`${skippedCount} student(s) in class "${targetClass.name}" were already assigned this work or an error occurred.`);
            }
        }

        // Revalidation paths
        revalidatePath("/teacher/assignments"); // Teacher's main assignment list
        classObjectIds.forEach(id => revalidatePath(`/teacher/classes/${id.toString()}/manage`)); // Manage page for each class
        // Potentially revalidate student dashboards if you can target them or use a broader revalidation strategy

        if (errorsEncountered.length > 0 && totalStudentsAssigned === 0) {
             return { success: false, message: `Assignment could not be processed. Errors: ${errorsEncountered.join('; ')}`, error: errorsEncountered.join('; ')}
        }
        if (errorsEncountered.length > 0) {
            return { success: true, message: `Assignment partially processed. ${totalStudentsAssigned} student(s) newly assigned. Issues: ${errorsEncountered.join('; ')}`, assignedCount: totalStudentsAssigned };
        }

        return { success: true, message: `Assignment successfully given to ${totalStudentsAssigned} new student(s).`, assignedCount: totalStudentsAssigned };

    } catch (error: any) {
        console.error("Error in assignAssignmentToClassesAction:", error);
        if (error instanceof z.ZodError) { // Should be caught by validatedFields.success, but as a fallback
             return { success: false, error: "Validation error.", fieldErrors: error.flatten().fieldErrors as any };
        }
        return { success: false, error: error.message || "An unexpected server error occurred during assignment." };
    }
}