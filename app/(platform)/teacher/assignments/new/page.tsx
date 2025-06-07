// app/(platform)/teacher/assignments/new/page.tsx
import CreateAssignmentForm from "@/components/ui/CreateAssignmentForm"; // Ensure this path is correct
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Create New Assignment | Teacher Dashboard",
};

// This page component for a static route should NOT have a 'params' prop
export default function CreateAssignmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/assignments">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to assignments</span>
          </Button>
        </Link>
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create New Assignment</h1>
            <p className="text-sm text-muted-foreground">
            Fill in the details below to create a new assignment for your students.
            </p>
        </div>
      </div>
      <CreateAssignmentForm />
    </div>
  );
}