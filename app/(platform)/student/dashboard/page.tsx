// app/(platform)/student/dashboard/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookMarked,
  MessageSquare, // Icon for AI Tutor
  CheckSquare,
  Clock,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Bot // Another good icon for AI Tutor
} from "lucide-react";

// Define interfaces for your mock data (keep these as they were)
interface UpcomingAssignment {
  id: string;
  title: string;
  dueDate: string;
  subject: string;
  status: "Pending" | "Started";
  progress?: number;
  timeEst: string;
}

interface RecentGrade {
  id: string;
  assignmentTitle: string;
  grade: string;
  score: number;
  feedback?: string;
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();

  const upcomingAssignments: UpcomingAssignment[] = [
    { id: "as1", title: "Algebra Chapter 3 Homework", dueDate: "2024-08-12", subject: "Math", status: "Pending", timeEst: "2 hours" },
    { id: "as2", title: "Poetry Analysis Essay", dueDate: "2024-08-14", subject: "English", status: "Started", progress: 30, timeEst: "4 hours" },
    { id: "as3", title: "Lab Report: Cell Division", dueDate: "2024-08-16", subject: "Science", status: "Pending", timeEst: "3 hours" },
  ];

  const recentGrades: RecentGrade[] = [
    { id: "gr1", assignmentTitle: "History Quiz 2", grade: "A-", score: 92, feedback: "Great work!" },
    { id: "gr2", assignmentTitle: "Math Problem Set 5", grade: "B+", score: 88, feedback: "Good understanding." },
  ];

  const overallProgress = 75;
  const assignmentsDueSoonCount = upcomingAssignments.filter(a => a.status === "Pending" || a.status === "Started").length;

  const studentName = session?.user?.name?.split(' ')[0] || "Student";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">Hello, {studentName}! Ready to learn?</p>
        </div>
        {/* Main Call to Action in the header can also be the AI Tutor */}
        <Link href="/student/ai-tutor">
            <Button size="lg" variant="default"> {/* Make it prominent */}
                <Bot className="mr-2 h-5 w-5" /> Ask EduBot (AI Tutor)
            </Button>
        </Link>
      </div>

      {/* Quick Stats & AI Tutor Card */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due Soon</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentsDueSoonCount}</div>
            <p className="text-xs text-muted-foreground">Don't miss your deadlines!</p>
          </CardContent>
          <CardFooter>
            <Link href="/student/assignments?filter=due_soon" className="text-sm text-primary hover:underline">
              View Assignments
            </Link>
          </CardFooter>
        </Card>

        {/* MODIFIED CARD TO BE AI TUTOR CALL TO ACTION */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/80 to-primary dark:from-primary/70 dark:to-primary/90 text-primary-foreground hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
                <Bot className="h-8 w-8" /> {/* Using Bot icon */}
                <CardTitle className="text-xl font-semibold">AI Tutor - EduBot</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/80">
              Need help understanding a topic or preparing for an assignment?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              EduBot is here to answer your questions, explain concepts simply, and guide you through your studies.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/student/ai-tutor" className="w-full">
                <Button variant="secondary" size="lg" className="w-full text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30 dark:bg-white/20 dark:hover:bg-white/30">
                    Chat with EduBot Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card> {/* This was the "Overall Progress" card, keeping it */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">Across all completed work</p>
          </CardContent>
        </Card>

        {/* Optional: "Quick Tip" card can be removed or kept if space allows */}
        {/* <Card className="bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40"> ... </Card> */}
      </div>

      {/* Upcoming Assignments (remains the same) */}
      <Card>
        {/* ... (content of Upcoming Assignments card) ... */}
        <CardHeader>
          <CardTitle>Upcoming Assignments</CardTitle>
          <CardDescription>Stay on top of your coursework and deadlines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAssignments.length > 0 ? upcomingAssignments.map((assignment: UpcomingAssignment) => (
            <Link href={`/student/assignments/${assignment.id}`} key={assignment.id} className="block group">
              <Card className="group-hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-muted/50 dark:hover:bg-muted/80">
                <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                        <BookMarked className="h-4 w-4 text-primary" />
                        <h3 className="text-md font-semibold leading-tight group-hover:text-primary transition-colors">{assignment.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {assignment.subject} • Due: {assignment.dueDate} • Est. {assignment.timeEst}
                    </p>
                    {assignment.status === "Started" && typeof assignment.progress === 'number' && (
                        <div className="mt-1.5">
                            <Progress value={assignment.progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-0.5">{assignment.progress}% complete</p>
                        </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0">
                    <Badge
                        variant={assignment.status === "Pending" ? "outline" : "default"}
                        className={
                            assignment.status === "Started" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600" :
                            ""
                        }
                    >
                        {assignment.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="mx-auto h-12 w-12 text-green-500 mb-2"/>
                <p>No upcoming assignments right now. Great job staying ahead!</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Link href="/student/assignments" className="w-full">
                <Button variant="outline" className="w-full">View All My Assignments</Button>
            </Link>
        </CardFooter>
      </Card>

      {/* Recent Grades Section (remains the same) */}
      {/* ... (content of Recent Grades card) ... */}
      {recentGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Check out your latest scores and feedback.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {recentGrades.map((grade: RecentGrade) => (
              <div key={grade.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <Link href={`/student/assignments/some-assignment-id/results`} className="text-sm font-medium hover:underline hover:text-primary">
                    {grade.assignmentTitle}
                  </Link>
                  <Badge
                    variant={grade.score >= 90 ? "default" : grade.score >= 80 ? "secondary" : grade.score >= 70 ? "outline" : "destructive"}
                    className={
                        grade.score >= 90 ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600" :
                        grade.score >= 80 ? "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600" :
                        grade.score >= 70 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600" :
                        "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600"
                    }
                    >
                    {grade.grade} ({grade.score}%)
                  </Badge>
                </div>
                {grade.feedback && <p className="text-xs text-muted-foreground italic">Teacher feedback: "{grade.feedback}"</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}