// app/(platform)/teacher/dashboard/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  PlusCircle,
  BookOpen,
  Users,
  Edit,
  Eye,
  Bell,
  FileText,
  LineChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Brain
} from "lucide-react";

// Define interfaces for your mock data
interface RecentAssignment {
  id: string;
  title: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: "Ongoing" | "Grading" | "Graded"; // Use a union type for status
}

interface RecentSubmissionToGrade {
  id: string;
  studentName: string;
  assignmentTitle: string;
  submittedAt: string;
  studentAvatar?: string; // Optional avatar
}

const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || 'U';
};


export default function TeacherDashboardPage() {
  // Mock Data defined INSIDE the component function or passed as props
  const recentAssignments: RecentAssignment[] = [ // Add type here
    { id: "as1", title: "Algebra Basics Quiz", dueDate: "2024-08-15", submissions: 18, totalStudents: 25, status: "Ongoing" },
    { id: "as2", title: "History of Ancient Rome Essay", dueDate: "2024-08-10", submissions: 22, totalStudents: 22, status: "Grading" },
    { id: "as3", title: "Science Project: Volcano Model", dueDate: "2024-07-30", submissions: 20, totalStudents: 20, status: "Graded" },
  ];

  const recentSubmissionsToGrade: RecentSubmissionToGrade[] = [ // Add type here
      { id: "sub1", studentName: "Alice Smith", assignmentTitle: "History of Ancient Rome Essay", submittedAt: "2 days ago", studentAvatar: "/avatars/alice.png" },
      { id: "sub2", studentName: "Bob Johnson", assignmentTitle: "History of Ancient Rome Essay", submittedAt: "1 day ago", studentAvatar: "/avatars/bob.png" },
      { id: "sub3", studentName: "Carol Williams", assignmentTitle: "Algebra Basics Quiz", submittedAt: "5 hours ago", studentAvatar: "/avatars/carol.png" },
  ];

  const totalAssignments = 35;
  const pendingGrading = 12;
  const averageScore = 82;

  return (
    <div className="space-y-8">
      {/* ... (rest of the component header: h1, buttons) ... */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, [Teacher Name]!</p> {/* Personalize this */}
        </div>
        <div className="flex gap-3">
            <Link href="/teacher/ai-help">
                <Button variant="outline">
                    <Brain className="mr-2 h-4 w-4" /> AI Teaching Help
                </Button>
            </Link>
            <Link href="/teacher/assignments/new">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Assignment
            </Button>
            </Link>
        </div>
      </div>


      {/* Stats Overview */}
      {/* ... (Stats cards remain the same) ... */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Managed across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <Edit className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGrading}</div>
            <p className="text-xs text-muted-foreground">Submissions awaiting review</p>
          </CardContent>
          <CardFooter>
            <Link href="/teacher/assignments?filter=pending_grading" className="text-sm text-primary hover:underline">
              View Submissions
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Class Score</CardTitle>
            <LineChart className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <Progress value={averageScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Assignments */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Overview of your latest assignments and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* The error was likely here. Ensure recentAssignments is in scope */}
                {recentAssignments.map((assignment: RecentAssignment) => ( // Explicitly type 'assignment'
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.dueDate}</TableCell>
                    <TableCell className="text-center">
                        {assignment.submissions}/{assignment.totalStudents}
                        <Progress value={(assignment.submissions / assignment.totalStudents) * 100} className="mt-1 h-1.5" />
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge
                            variant={
                                assignment.status === "Graded" ? "default" :
                                assignment.status === "Grading" ? "outline" :
                                "default"
                            }
                            className={
                                assignment.status === "Graded" ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600" :
                                assignment.status === "Grading" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600" :
                                assignment.status === "Ongoing" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600" :
                                ""
                            }
                        >
                            {assignment.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/teacher/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Link href="/teacher/assignments" className="w-full">
                <Button variant="outline" className="w-full">View All Assignments</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Submissions Awaiting Grading */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Awaiting Grading</CardTitle>
            <CardDescription>Quick access to submissions that need your attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSubmissionsToGrade.length > 0 ? recentSubmissionsToGrade.map((submission: RecentSubmissionToGrade) => ( // Explicitly type 'submission'
              <div key={submission.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={submission.studentAvatar} alt={submission.studentName} />
                    <AvatarFallback>{getInitials(submission.studentName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{submission.studentName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{submission.assignmentTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">{submission.submittedAt}</p>
                    {/* Replace assignmentX with actual assignment ID placeholder or logic */}
                    <Link href={`/teacher/assignments/some-assignment-id/submissions/${submission.id}`}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">Grade Now</Button>
                    </Link>
                </div>
              </div>
            )) : (
                <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2"/>
                    <p>All caught up! No submissions currently awaiting grading.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}