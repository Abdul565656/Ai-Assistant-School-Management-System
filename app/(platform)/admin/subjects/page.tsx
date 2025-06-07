// app/(platform)/admin/subjects/page.tsx
"use client";

import React, { useEffect, useState, useTransition, FormEvent } from 'react'; // Added FormEvent
import { createSubjectAction, getAllSubjectsAction, SubjectActionResponse } from '@/lib/actions/subject.actions';
import { ISubject } from '@/lib/db/models/subject.model';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

export default function AdminSubjectsPage() {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string} | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);


  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    setFetchError(null);
    try {
        const response = await getAllSubjectsAction();
        if (response.success && response.subjects) {
          setSubjects(response.subjects);
        } else {
          setFetchError(response.error || "Failed to load subjects.");
          toast.error("Error fetching subjects", { description: response.error });
        }
    } catch (e: any) {
        setFetchError(e.message || "An unexpected error occurred while fetching subjects.");
        toast.error("Client Error", {description: "Could not fetch subjects."})
    } finally {
        setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors(undefined);
    setFormError(undefined);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result: SubjectActionResponse = await createSubjectAction(undefined, formData); // Pass undefined as prevState
      if (result.success && result.subject) {
        toast.success("Subject Created!", { description: `"${result.subject.name}" has been added.` });
        (event.target as HTMLFormElement).reset(); // Reset form fields
        fetchSubjects(); // Refresh the list of subjects
      } else {
        let errorDesc = result.error || result.message || "An unknown error occurred.";
        if (result.fieldErrors?.name) { // Prioritize field error for toast if available
            errorDesc = result.fieldErrors.name;
        }
        toast.error("Creation Failed", { description: errorDesc });
        if(result.fieldErrors) setFieldErrors(result.fieldErrors);
        // Only set general formError if there are no specific field errors for name
        if(result.error && !result.fieldErrors?.name) setFormError(result.error);
      }
    });
  };

  // Placeholder for delete action - to be implemented later
  // const handleDeleteSubject = async (subjectId: string) => {
  //   console.log("Delete subject:", subjectId);
  //   // Call a deleteSubjectAction(subjectId)
  //   // On success, toast and fetchSubjects()
  // };

  return (
    <div className="max-w-xl mx-auto space-y-8 p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center">Manage Subjects</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create New Subject</CardTitle>
          <CardDescription>Add a new subject to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-medium">Subject Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="e.g., Physics, Creative Writing" required className="mt-1"/>
              {fieldErrors?.name && <p className="text-sm text-destructive mt-1">{fieldErrors.name}</p>}
            </div>
            {formError && <p className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">{formError}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Subject
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Subjects</CardTitle>
          <CardDescription>List of all subjects currently in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSubjects ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading subjects...</span>
            </div>
          ) : fetchError ? (
             <div className="flex flex-col items-center justify-center py-6 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Could not load subjects</p>
                <p className="text-sm">{fetchError}</p>
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No subjects have been created yet.</p>
          ) : (
            <div className="border rounded-md">
              <ul className="divide-y divide-border">
                {subjects.map(subject => (
                  <li key={subject._id.toString()} className="flex justify-between items-center p-3 hover:bg-muted/50">
                    <span className="font-medium">{subject.name}</span>
                    {/* Future: Add Edit/Delete buttons here */}
                    {/* <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject._id.toString())} disabled>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button> */}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}