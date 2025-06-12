"use client";

import React, { useEffect, useState, useTransition, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getClassDetailsForTeacherAction,
    addStudentToClassAction,
    ClassDetailsResponse,
    ClassServerActionResponse,
    PopulatedClassForManagePage
} from '@/lib/actions/class.actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from 'next/link';
import { ArrowLeft, Loader2, UserPlus, Users, Trash2, AlertTriangle } from 'lucide-react';

interface DisplayStudent {
    _id: string;
    name?: string;
    email?: string;
}

export default function ManageClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = typeof params.classId === 'string' ? params.classId : '';

  const [classDetails, setClassDetails] = useState<PopulatedClassForManagePage | null>(null);
  const [isLoadingClass, setIsLoadingClass] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddStudentPending, startAddStudentTransition] = useTransition();
  const [addStudentFieldErrors, setAddStudentFieldErrors] = useState<{[key: string]: string} | undefined>(undefined);
  const [addStudentFormError, setAddStudentFormError] = useState<string | undefined>(undefined);

  const fetchClassDetails = async () => {
    if (!classId) {
        setLoadError("Class ID is missing from URL.");
        setIsLoadingClass(false);
        return;
    }
    setIsLoadingClass(true);
    setLoadError(null);
    try {
      const result: ClassDetailsResponse = await getClassDetailsForTeacherAction(classId);
      if (result.success && result.class) {
        setClassDetails(result.class);
      } else {
        setLoadError(result.error || "Failed to load class details.");
      }
    } catch (e: any) {
      setLoadError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingClass(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const handleAddStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddStudentFieldErrors(undefined);
    setAddStudentFormError(undefined);
    const formData = new FormData(event.currentTarget);

    startAddStudentTransition(async () => {
      const result: ClassServerActionResponse = await addStudentToClassAction(classId, undefined, formData);
      if (result.success) {
        toast.success("Student Added", { description: result.message });
        (event.target as HTMLFormElement).reset();
        fetchClassDetails();
      } else {
        toast.error("Failed to Add Student", { description: result.error || result.message });
        if(result.fieldErrors) setAddStudentFieldErrors(result.fieldErrors);
        if(result.error && (!result.fieldErrors || !result.fieldErrors.studentEmail)) {
            setAddStudentFormError(result.error);
        }
      }
    });
  };

  if (isLoadingClass) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /> <p className="ml-4 text-lg text-muted-foreground">Loading class details...</p></div>;
  }

  if (loadError || !classDetails) {
    return (
      <div className="max-w-2xl mx-auto text-center p-6 space-y-6">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-semibold text-destructive">Error Loading Class</h2>
        <p className="text-muted-foreground">{loadError || "The class could not be found or you don't have permission."}</p>
        <Link href="/teacher/classes" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Classes</Button>
        </Link>
      </div>
    );
  }

  const students: DisplayStudent[] = classDetails.students;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/teacher/classes" passHref>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Classes</span>
          </Button>
        </Link>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{classDetails.name}</h1>
            <p className="text-sm text-muted-foreground">
                Subject: {classDetails.subjectId.name} {classDetails.year && `(${classDetails.year})`}
            </p>
            <p className="text-xs text-muted-foreground">Taught by: {classDetails.teacherId.name || classDetails.teacherId.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus /> Add Student</CardTitle>
            <CardDescription>Enter a student&apos;s email address to enroll them in this class.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <Label htmlFor="studentEmail">Student Email <span className="text-destructive">*</span></Label>
                <Input id="studentEmail" name="studentEmail" type="email" placeholder="student@example.com" required />
                {addStudentFieldErrors?.studentEmail && <p className="text-sm text-destructive mt-1">{addStudentFieldErrors.studentEmail}</p>}
              </div>
              {addStudentFormError && <p className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">{addStudentFormError}</p>}
              <Button type="submit" disabled={isAddStudentPending} className="w-full">
                {isAddStudentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Class
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users/> Enrolled Students ({students.length})</CardTitle>
            <CardDescription>List of students currently in this class.</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No students have been added to this class yet.</p>
            ) : (
              <div className="border rounded-md">
                <ul className="divide-y divide-border">
                  {students.map((student) => (
                    <li key={student._id} className="flex justify-between items-center p-3 hover:bg-muted/50">
                      <div>
                          <p className="font-medium text-sm">{student.name || "Unnamed Student"}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {toast.info("Remove student: Not yet implemented.")}} >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove Student</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}