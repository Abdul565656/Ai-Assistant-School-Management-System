// lib/actions/subject.actions.ts
"use server";

import connectToDB from "@/lib/db/connectDB";
import Subject, { ISubject } from "@/lib/db/models/subject.model";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface SubjectActionResponse {
    success: boolean;
    message?: string;
    subject?: ISubject | null;
    subjects?: ISubject[] | null;
    error?: string;
    fieldErrors?: { [key: string]: string };
}

const SubjectFormSchema = z.object({
    name: z.string().min(1, "Subject name is required.").trim(),
});

export async function createSubjectAction(
    prevState: SubjectActionResponse | undefined,
    formData: FormData
): Promise<SubjectActionResponse> {
    const validatedFields = SubjectFormSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        const fieldErrors: { [key: string]: string } = {};
        validatedFields.error.issues.forEach(issue => {
            if (issue.path[0]) { // Ensure path exists
                fieldErrors[issue.path[0] as string] = issue.message;
            }
        });
        return {
            success: false,
            message: "Validation failed. Please check the subject name.",
            fieldErrors: fieldErrors,
        };
    }

    // Access .data only after successful validation
    const { name } = validatedFields.data;

    try {
        await connectToDB();

        const existingSubject = await Subject.findOne({ name: name }); // Use the validated 'name'
        if (existingSubject) {
            return { success: false, fieldErrors: { name: "A subject with this name already exists." }, message: "Subject already exists." };
        }

        const newSubject = new Subject({
            name: name,
        });
        const savedSubject = await newSubject.save();

        revalidatePath("/admin/subjects");
        revalidatePath("/teacher/classes/new");
        revalidatePath("/teacher/assignments/new");

        // Return a plain object, ensuring serialization if needed (lean() does this, toObject() also works)
        return { success: true, message: "Subject created successfully.", subject: JSON.parse(JSON.stringify(savedSubject)) };
    } catch (error: any) {
        console.error("Error creating subject:", error);
        return { success: false, error: error.message || "Database error: Failed to create subject." };
    }
}

export async function getAllSubjectsAction(): Promise<SubjectActionResponse> {
    try {
        await connectToDB();
        const subjects = await Subject.find().sort({ name: 1 }).lean<ISubject[]>();
        // lean() returns plain JS objects, so direct return is fine.
        // If not using lean(), you might need JSON.parse(JSON.stringify(subjects))
        return { success: true, subjects: subjects };
    } catch (error: any) {
        console.error("Error fetching subjects:", error);
        return { success: false, error: error.message || "Database error: Failed to fetch subjects.", subjects: [] };
    }
}