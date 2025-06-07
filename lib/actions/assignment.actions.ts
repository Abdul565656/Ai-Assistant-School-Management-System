// lib/actions/assignment.actions.ts (or a new studentAssignment.actions.ts)
"use server";

import connectToDB from "@/lib/db/connectDB";
import Assignment, { IAssignment } from "@/lib/db/models/assignment.model";
import Class, { IClass } from "@/lib/db/models/class.model";
import StudentAssignment from "@/lib/db/models/assignment.model"; // Your new model
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose, { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Interface for the response of this action
export interface AssignActionResponse {
    success: boolean;
    message?: string;
    error?: string;
    fieldErrors?: { [key: string]: string }; // For specific field errors like classIds or dueDate
    assignedCount?: number; // Number of students successfully assigned
}

// Zod schema for validating the "assign assignment" form data from the client
const AssignAssignmentFormSchema = z.object({
    assignmentId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid assignment ID." }),
    classIds: z.array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid class ID in selection." })).min(1, "At least one class must be selected."),
    dueDate: z.coerce.date({ errorMap: () => ({ message: "Due date is required and must be a valid date."}) }), // coerce to convert string from form to Date
    publishDate: z.coerce.date().optional(), // Optional
});


export async function assignAssignmentToClassesAction(
    prevState: AssignActionResponse | undefined,
    formData: FormData
): Promise<AssignActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        const userFromSession = session?.user as { id?: string; role?: string };

        if (!userFromSession?.id || userFromSession.role !== 'teacher') {
            return { success: false, error: "Unauthorized: Only teachers can assign work." };
        }
        if (!mongoose.Types.ObjectId.isValid(userFromSession.id)) {
             return { success: false, error: "Invalid teacher ID in session." };
        }
        const teacherId = new Types.ObjectId(userFromSession.id);

        // Extract classIds - FormData.getAll returns string[]
        const classIdStrings = formData.getAll('classIds') as string[];

        const validatedFields = AssignAssignmentFormSchema.safeParse({
            assignmentId: formData.get('assignmentId'),
            classIds: classIdStrings,
            dueDate: formData.get('dueDate'), // Zod will coerce this
            publishDate: formData.get('publishDate'), // Zod will coerce this
        });

        if (!validatedFields.success) {
            const fieldErrors: { [key: string]: string } = {};
            let generalMessage = "Validation failed. Please check the form.";
            validatedFields.error.issues.forEach(issue => {
                const path = issue.path.join('.');
                fieldErrors[path] = issue.message;
                if (issue.path[0] === 'classIds' && issue.path.length === 1) generalMessage = issue.message; // For array level error
            });
            return { success: false, message: generalMessage, fieldErrors };
        }

        const { assignmentId, classIds, dueDate, publishDate } = validatedFields.data;
        const assignmentObjectId = new Types.ObjectId(assignmentId);
        const classObjectIds = classIds.map(id => new Types.ObjectId(id));
        const assignedDate = publishDate || new Date(); // Default to now if publishDate is not set

        await connectToDB();

        // 1. Verify assignment exists and belongs to the teacher
        const assignmentToAssign = await Assignment.findOne({ _id: assignmentObjectId, teacher: teacherId });
        if (!assignmentToAssign) {
            return { success: false, error: "Assignment not found or you are not authorized to assign it." };
        }

        let totalStudentsAssigned = 0;
        const errorsEncountered: string[] = [];

        // 2. For each class, get students and create StudentAssignment records
        for (const classObjectId of classObjectIds) {
            const targetClass = await Class.findOne({ _id: classObjectId, teacherId: teacherId }).select('students name'); // Ensure teacher owns the class
            if (!targetClass) {
                errorsEncountered.push(`Class with ID ${classObjectId.toString()} not found or not managed by you.`);
                continue; // Skip to next class
            }

            if (!targetClass.students || targetClass.students.length === 0) {
                errorsEncountered.push(`Class "${targetClass.name}" has no students enrolled.`);
                continue;
            }

            const studentAssignmentDocs = targetClass.students.map(studentId => ({
                assignmentId: assignmentObjectId,
                studentId: studentId, // studentId is already ObjectId from Class.students
                classId: classObjectId,
                teacherId: teacherId, // The teacher making the assignment
                assignedDate: assignedDate,
                dueDate: dueDate,
                status: 'pending' as const, // Explicitly type status
            }));

            // Use insertMany for efficiency, but be mindful of error handling for partial success
            // To prevent duplicates for a student+assignment+class combo, you'd query first or rely on unique index
            try {
                // Example: Check for existing assignments for these students to avoid duplicates
                const existingAssignments = await StudentAssignment.find({
                    assignmentId: assignmentObjectId,
                    classId: classObjectId,
                    studentId: { $in: targetClass.students }
                }).select('studentId');
                
                const existingStudentIds = existingAssignments.map(sa => sa.studentId.toString());
                
                const newStudentAssignments = studentAssignmentDocs.filter(
                    doc => !existingStudentIds.includes(doc.studentId.toString())
                );

                if (newStudentAssignments.length > 0) {
                    await StudentAssignment.insertMany(newStudentAssignments);
                    totalStudentsAssigned += newStudentAssignments.length;
                }
                const skippedCount = studentAssignmentDocs.length - newStudentAssignments.length;
                if (skippedCount > 0) {
                    errorsEncountered.push(`${skippedCount} student(s) in class "${targetClass.name}" were already assigned this work.`);
                }

            } catch (insertError: any) {
                console.error(`Error inserting student assignments for class ${targetClass.name}:`, insertError);
                errorsEncountered.push(`Failed to assign to some students in class "${targetClass.name}".`);
            }
        }

        // Revalidate student dashboards (hard to target specifically without knowing student IDs here)
        // A general revalidation or a more complex system might be needed.
        // For now, let's assume students' dashboards will refetch.
        revalidatePath("/teacher/assignments"); // Refresh teacher's view
        classObjectIds.forEach(id => revalidatePath(`/teacher/classes/${id.toString()}/manage`));


        if (errorsEncountered.length > 0 && totalStudentsAssigned === 0) {
             return { success: false, message: `Assignment could not be fully processed. Errors: ${errorsEncountered.join('; ')}`, error: errorsEncountered.join('; ')}
        }
        if (errorsEncountered.length > 0) {
            return { success: true, message: `Assignment partially processed. ${totalStudentsAssigned} student(s) assigned. Issues: ${errorsEncountered.join('; ')}`, assignedCount: totalStudentsAssigned };
        }

        return { success: true, message: `Assignment successfully given to ${totalStudentsAssigned} student(s).`, assignedCount: totalStudentsAssigned };

    } catch (error: any) {
        console.error("Error in assignAssignmentToClassesAction:", error);
        return { success: false, error: error.message || "An unexpected server error occurred." };
    }
}