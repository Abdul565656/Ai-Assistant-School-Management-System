// app/(platform)/teacher/assignments/[assignmentId]/page.tsx
import { getAssignmentById } from "@/lib/actions/assignment.actions";
import {
  PopulatedAssignment, // Now exported from assignment.types.ts (consider moving)
  SerializedQuestion,  // Now exported from assignment.types.ts (consider moving)
  SerializedQuestionOption // Now exported from assignment.types.ts (consider moving)
} from "@/lib/actions/assignment.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, ListChecks, Clock, CheckCircle, AlertOctagon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ModelQuestionType } from "@/lib/actions/assignment.types"; // Use ModelQuestionType from form types if same

const getQuestionTypeLabel = (type: ModelQuestionType): string => {
  switch (type) {
    case "multiple_choice": return "Multiple Choice";
    case "short_answer": return "Short Answer";
    case "essay": return "Essay";
    case "file_upload": return "File Upload";
    default:
        // Optional: handle exhaustive check if ModelQuestionType might change
        // const _exhaustiveCheck: never = type;
        return "Unknown Type";
  }
};

export async function generateMetadata({ params }: { params: { assignmentId: string } }) {
  // Note: Type assertion might be needed if getAssignmentById returns a more generic type initially
  const assignment = await getAssignmentById(params.assignmentId) as PopulatedAssignment | null;
  if (!assignment) {
    return { title: "Assignment Not Found" };
  }
  return {
    title: `${assignment.title} | Assignment Details`,
    description: assignment.description || `Details for assignment: ${assignment.title}`,
  };
}

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  const { assignmentId } = params;
  // Note: Type assertion might be needed
  const assignment = await getAssignmentById(assignmentId) as PopulatedAssignment | null;

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <AlertOctagon className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-semibold mb-2">Assignment Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The assignment you are looking for either does not exist or you do not have permission to view it.
        </p>
        <Link href="/teacher/assignments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/assignments">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{assignment.title}</h1>
            {assignment.teacher && (
                <p className="text-sm text-muted-foreground">
                    Created by: You ({assignment.teacher.name || assignment.teacher.email})
                </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled>
                <Edit className="mr-2 h-4 w-4" /> Edit Assignment
            </Button>
            <Link href={`/teacher/assignments/${assignment._id}/submissions`}>
                 <Button>
                    <ListChecks className="mr-2 h-4 w-4" /> View Submissions (0)
                </Button>
            </Link>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Assignment Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div>
              <h3 className="font-semibold mb-1">Description:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Due Date:</h3>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {assignment.dueDate ? format(parseISO(assignment.dueDate), "PPPp") : "Not set"}
              </p>
            </div>
             <div>
              <h3 className="font-semibold mb-1">Total Points:</h3>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {/* Corrected sum type and ensure q.points is handled if undefined */}
                {assignment.questions.reduce((sum: number, q: SerializedQuestion) => sum + (q.points || 0), 0)} points
              </p>
            </div>
            <div><h3 className="font-semibold mb-1">Created On:</h3><p className="text-muted-foreground">{format(parseISO(assignment.createdAt), "PPP")}</p></div>
            <div><h3 className="font-semibold mb-1">Last Updated:</h3><p className="text-muted-foreground">{format(parseISO(assignment.updatedAt), "PPP")}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({assignment.questions.length})</CardTitle>
          <CardDescription>Below are the questions included in this assignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignment.questions.map((question: SerializedQuestion, index: number) => (
            <div key={question._id || `q-${index}`} className="p-4 border rounded-md bg-muted/30 dark:bg-muted/50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-md">Question {index + 1}</h4>
                <Badge variant="secondary">{getQuestionTypeLabel(question.questionType)}</Badge>
              </div>
              <p className="text-foreground whitespace-pre-wrap mb-2">{question.questionText}</p>
              {question.questionType === "multiple_choice" && question.options && question.options.length > 0 && (
                <div className="mt-2 space-y-1 pl-4">
                  <p className="text-xs text-muted-foreground font-medium">Options:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                    {question.options.map((option: SerializedQuestionOption, optIndex: number) => (
                      <li key={option._id || `q-${index}-opt-${optIndex}`}>
                        {option.text}
                        {option.isCorrect && <span className="ml-2 text-green-500 font-semibold">(Correct)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2 text-right">Points: {question.points || 0}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}