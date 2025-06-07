// app/(platform)/teacher/dashboard/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  PlusCircle,    // For Create New Assignment
  BookOpen,      // For Assignments
  Users,         // For Students/Classes (general)
  Edit3,         // For Grading/Editing
  Eye,           // For View
  BellRing,      // For Notifications/Alerts
  FileText,      // For Reports/Resources
  LineChart,     // For Stats/Analytics
  CheckCircle2,  // For Completion/Success
  Clock4,        // For Pending/Time Sensitive
  AlertTriangle, // For Attention Needed
  Brain,         // For AI Help
  ClipboardList, // For Submissions
  UserCheck,     // For Graded Submissions
  ArrowRight
} from "lucide-react";

// --- Mock Data & Types (Replace with actual data fetching) ---
interface TeacherAssignmentSummary {
  id: string;
  title: string;
  dueDate: string;
  submissionsReceived: number;
  totalStudents: number; // Or number enrolled in the class this assignment is for
  status: "Ongoing" | "Awaiting Grading" | "Partially Graded" | "Graded" | "Past Due";
  classOrSubject: string;
}

interface SubmissionAwaitingGrading {
  id: string; // Submission ID
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string; // e.g., "2 hours ago", "Yesterday"
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || 'U';
};
// --- End Mock Data & Types ---

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const teacherName = session?.user?.name?.split(' ')[0] || "Teacher";

  // --- Mock Data Instantiation ---
  const assignmentsSummary: TeacherAssignmentSummary[] = [
    { id: "ts1", title: "Physics Midterm Review", classOrSubject: "Physics 101", dueDate: "2024-08-20", submissionsReceived: 15, totalStudents: 28, status: "Ongoing" },
    { id: "ts2", title: "Shakespeare Sonnet Analysis", classOrSubject: "English Lit.", dueDate: "2024-08-15", submissionsReceived: 22, totalStudents: 25, status: "Awaiting Grading" },
    { id: "ts3", title: "Calculus Problem Set 3", classOrSubject: "Calculus I", dueDate: "2024-08-12", submissionsReceived: 30, totalStudents: 30, status: "Partially Graded" },
    { id: "ts4", title: "World War II Essay", classOrSubject: "History 202", dueDate: "2024-08-05", submissionsReceived: 18, totalStudents: 18, status: "Graded" },
  ];

  const submissionsToGrade: SubmissionAwaitingGrading[] = [
    { id: "subT1", assignmentId: "ts2", studentName: "Ethan Miller", assignmentTitle: "Shakespeare Sonnet Analysis", submittedAt: "1 day ago", className: "English Lit." },
    { id: "subT2", assignmentId: "ts3", studentName: "Olivia Davis", assignmentTitle: "Calculus Problem Set 3", submittedAt: "3 hours ago", className: "Calculus I" },
    { id: "subT3", assignmentId: "ts2", studentName: "Sophia Wilson", assignmentTitle: "Shakespeare Sonnet Analysis", submittedAt: "2 days ago", className: "English Lit." },
  ];

  const totalActiveAssignments = assignmentsSummary.filter(a => a.status === "Ongoing" || a.status === "Awaiting Grading" || a.status === "Partially Graded").length;
  const needsGradingCount = submissionsToGrade.length; // Or a more accurate count from DB
  const overallClassPerformance = 78; // Example percentage
  // --- End Mock Data Instantiation ---

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {teacherName}! Manage your classes and assignments.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/teacher/ai-help">
            <Button variant="outline" size="lg">
              <Brain className="mr-2 h-5 w-5" /> AI Teaching Help
            </Button>
          </Link>
          <Link href="/teacher/assignments/new">
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats & Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveAssignments}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing or needing attention.</p>
          </CardContent>
          <CardFooter>
            <Link href="/teacher/assignments" className="text-sm text-primary hover:underline">
              View All Assignments
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-orange-500/50 dark:border-orange-400/40 bg-orange-50/30 dark:bg-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Submissions to Grade</CardTitle>
            <Edit3 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{needsGradingCount}</div>
            <p className="text-xs text-orange-500/90 dark:text-orange-400/80">Items requiring your review.</p>
          </CardContent>
          <CardFooter>
            <Link href="/teacher/assignments?filter=needs_grading" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
              Go to Grading Queue
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Performance</CardTitle>
            <LineChart className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallClassPerformance}%</div>
            <Progress value={overallClassPerformance} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">Average score across recent graded work.</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Assignments Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments Overview</CardTitle>
          <CardDescription>A quick look at your assignments and their progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignmentsSummary.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title & Class</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsSummary.map((assignment: TeacherAssignmentSummary) => (
                  <TableRow key={assignment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-xs text-muted-foreground">{assignment.classOrSubject}</div>
                    </TableCell>
                    <TableCell>{assignment.dueDate}</TableCell>
                    <TableCell className="text-center">
                      {assignment.submissionsReceived}/{assignment.totalStudents}
                      <Progress
                        value={(assignment.submissionsReceived / assignment.totalStudents) * 100}
                        className="mt-1 h-1.5"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          assignment.status === "Graded" ? "default" :
                          assignment.status === "Awaiting Grading" || assignment.status === "Partially Graded" ? "outline" :
                          "secondary" // For Ongoing or Past Due
                        }
                        className={
                          assignment.status === "Graded" ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600" :
                          assignment.status === "Awaiting Grading" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600" :
                          assignment.status === "Partially Graded" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600" :
                          assignment.status === "Ongoing" ? "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border-sky-300 dark:border-sky-600" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400" // Past Due
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/teacher/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </Link>
                      {/* Add Edit link if applicable */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>No assignments found. Time to create some!</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
           <Link href="/teacher/assignments" className="w-full">
                <Button variant="outline" className="w-full">Manage All Assignments</Button>
            </Link>
        </CardFooter>
      </Card>

      {/* Submissions Needing Attention */}
      {needsGradingCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-orange-500"/> Needs Grading</CardTitle>
                    <CardDescription>Quick access to student submissions awaiting your review.</CardDescription>
                </div>
                <Badge variant="destructive" className="text-sm px-3 py-1">{needsGradingCount} PENDING</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto"> {/* Added scroll for long lists */}
            {submissionsToGrade.map((submission: SubmissionAwaitingGrading) => (
              <Link
                href={`/teacher/assignments/${submission.assignmentId}/submissions/${submission.id}`}
                key={submission.id}
                className="block group"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={submission.studentAvatar} alt={submission.studentName} />
                      <AvatarFallback>{getInitials(submission.studentName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary">{submission.studentName}</p>
                      <p className="text-xs text-muted-foreground">{submission.assignmentTitle}</p>
                      {submission.className && <p className="text-xs text-muted-foreground/70">{submission.className}</p>}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{submission.submittedAt}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1"/>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optional: Alerts / Announcements Section */}
      {/* <Card> ... </Card> */}
    </div>
  );
}