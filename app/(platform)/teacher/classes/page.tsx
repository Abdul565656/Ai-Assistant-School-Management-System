// app/(platform)/teacher/classes/page.tsx
import { getTeacherClassesAction, ClassServerActionResponse } from '@/lib/actions/class.actions'; // Ensure path is correct
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle, Users, BookOpen, AlertTriangle, Edit3, ListChecks } from 'lucide-react'; // Added icons
import { IClass } from '@/lib/db/models/class.model'; // Ensure path is correct

// Type for the class object as expected by this page after processing in the action
type DisplayableClass = Omit<IClass, '_id' | 'teacherId' | 'subjectId' | 'students'> & {
    _id: string;
    teacherId: string;
    subjectId: string;
    subjectName?: string;
    studentCount?: number;
    students: string[];
};

export default async function TeacherClassesPage() {
  const result: ClassServerActionResponse = await getTeacherClassesAction();
  // Ensure proper typing for classes or cast if necessary
  const classes: DisplayableClass[] = result.success && result.classes ? result.classes as DisplayableClass[] : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Classes</h1>
        <Link href="/teacher/classes/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Class
          </Button>
        </Link>
      </div>

      {!result.success && result.error && (
         <Card className="border-destructive bg-destructive/10">
             <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                 <AlertTriangle className="h-6 w-6 text-destructive" />
                 <CardTitle className="text-destructive text-lg">Error Loading Classes</CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-destructive/90">{result.error}</p>
                 <Button variant="link" className="p-0 h-auto text-destructive/80" onClick={() => { /*router.refresh() or similar */ }}>Try refreshing</Button>
             </CardContent>
         </Card>
      )}

      {result.success && classes.length === 0 && (
        <Card className="text-center py-10">
          <CardHeader>
            <CardTitle className="text-xl">You haven't created any classes yet.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Classes help you organize your students and assignments. <br/>
              Get started by creating your first one!
            </p>
            <Link href="/teacher/classes/new" passHref>
                <Button variant="default" size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Class
                </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {result.success && classes.length > 0 && (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((cls) => (
            <Card key={cls._id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg leading-tight">{cls.name}</CardTitle>
                {cls.year && <CardDescription className="text-xs">{cls.year}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow space-y-1.5 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Subject: <span className="font-medium text-foreground">{cls.subjectName || 'N/A'}</span></span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Students: {cls.studentCount || 0}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 grid grid-cols-2 gap-2">
                <Link href={`/teacher/classes/${cls._id}/manage`} passHref legacyBehavior>
                  <Button asChild variant="outline" size="sm" className="w-full"><a><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Manage</a></Button>
                </Link>
                <Link href={`/teacher/assignments/assign?classId=${cls._id}`} passHref legacyBehavior>
                    {/* This link will go to a page/modal to assign work to this class */}
                    <Button asChild variant="default" size="sm" className="w-full"><a><ListChecks className="mr-1.5 h-3.5 w-3.5" /> Assign Work</a></Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}