// app/(platform)/teacher/classes/new/page.tsx
"use client";

import React, { useState, useEffect, useTransition, FormEvent } from 'react';
import { createClassAction, ClassServerActionResponse } from '@/lib/actions/class.actions'; // Ensure path is correct
import { getAllSubjectsAction, SubjectActionResponse } from '@/lib/actions/subject.actions'; // Ensure path is correct
import { ISubject } from '@/lib/db/models/subject.model'; // Ensure path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // If you plan to redirect
import { cn } from '@/lib/utils';

export default function CreateClassPage() {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string} | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const response: SubjectActionResponse = await getAllSubjectsAction();
        if (response.success && response.subjects) {
          setSubjects(response.subjects);
        } else {
          toast.error("Failed to load subjects", { description: response.error || "Could not retrieve subject list." });
        }
      } catch (e: any) {
        toast.error("Client Error", { description: "An error occurred while fetching subjects." });
        console.error("Fetch subjects client error:", e);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors(undefined);
    setFormError(undefined);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
        // Pass undefined as prevState as we are not using useFormState here for direct call
        const result: ClassServerActionResponse = await createClassAction(undefined, formData);
        if (result.success && result.message) {
            toast.success("Class Created!", { description: result.message });
            (event.target as HTMLFormElement).reset(); // Reset form fields
            // Optionally redirect after a short delay or immediately
            // router.push('/teacher/classes'); 
        } else {
            let errorDesc = result.error || result.message || "An unknown error occurred during class creation.";
            if (result.fieldErrors?.name) errorDesc = result.fieldErrors.name;
            else if (result.fieldErrors?.subjectId) errorDesc = result.fieldErrors.subjectId;

            toast.error("Creation Failed", { description: errorDesc });
            if(result.fieldErrors) setFieldErrors(result.fieldErrors);
            // Set general formError only if no specific field errors caused the main toast message
            if(result.error && !result.fieldErrors) setFormError(result.error);
        }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
         <Link href="/teacher/dashboard" passHref> {/* Or link to /teacher/classes if that page exists */}
             <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                 <ArrowLeft className="h-5 w-5" />
                 <span className="sr-only">Back to Dashboard</span>
             </Button>
         </Link>
         <h1 className="text-2xl font-semibold tracking-tight">Create New Class</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>Enter the information for your new class.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Class Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="e.g., Grade 10 English - Section A" required />
              {fieldErrors?.name && <p className="text-sm text-destructive mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="subjectId">Subject <span className="text-destructive">*</span></Label>
              <Select name="subjectId" required disabled={isLoadingSubjects || subjects.length === 0}>
                <SelectTrigger
                  id="subjectId"
                  className={cn(fieldErrors?.subjectId && "border-destructive")}
                  // Disabled state handled by the Select component itself via its `disabled` prop
                >
                  <SelectValue
                    placeholder={
                      isLoadingSubjects
                        ? "Loading subjects..."
                        : subjects.length === 0
                        ? "No subjects available"
                        : "Select a subject"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {/* Only render SelectItems if there are subjects and not loading */}
                  {!isLoadingSubjects && subjects.length > 0 && (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject._id.toString()}
                        value={subject._id.toString()}
                      >
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                  {/* Informative text if no subjects, shown when dropdown is opened (if not disabled) */}
                  {!isLoadingSubjects && subjects.length === 0 && (
                     <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No subjects found. Please create subjects first.
                    </div>
                  )}
                   {isLoadingSubjects && (
                     <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        Loading...
                    </div>
                  )}
                </SelectContent>
              </Select>
              {fieldErrors?.subjectId && (
                <p className="text-sm text-destructive mt-1">
                  {fieldErrors.subjectId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Academic Year/Term (Optional)</Label>
              <Input id="year" name="year" placeholder="e.g., 2023-2024" />
              {fieldErrors?.year && <p className="text-sm text-destructive mt-1">{fieldErrors.year}</p>}
            </div>
             
             {formError && (
                 <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-md text-center">{formError}</p>
             )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending || isLoadingSubjects} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Class
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}