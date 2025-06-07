// app/(auth)/sign-up/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signUpUser, SignUpFormState } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const initialState: SignUpFormState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating Account..." : "Create Account"}
    </Button>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [state, formAction] = useFormState(signUpUser, initialState);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard"); // Redirect if already logged in
    }
  }, [status, router]);

  useEffect(() => {
    if (state.success) {
      toast.success("Account Created!", {
        description: state.message + " Redirecting to sign in...",
        duration: 3000,
        onAutoClose: () => router.push("/sign-in"),
      });
    } else if (state.message && (state.errors || state.message !== "")) {
      const description = state.errors?._form?.join(", ") || state.message || "Please check the form for errors.";
      toast.error("Sign Up Failed", { description });
    }
  }, [state, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (status === "authenticated") {
    return null; // Or a loading spinner while redirecting
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Enter your details to join the platform.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.errors?._form && (
              <p className="text-sm text-destructive bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-center">
                {state.errors._form.join(", ")}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
              {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name.join(", ")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              {state.errors?.email && <p className="text-xs text-destructive mt-1">{state.errors.email.join(", ")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              {state.errors?.password && <p className="text-xs text-destructive mt-1">{state.errors.password.join(", ")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">I am a...</Label>
              <Select name="role" defaultValue="student" required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.role && <p className="text-xs text-destructive mt-1">{state.errors.role.join(", ")}</p>}
            </div>
            <SubmitButton />
          </CardContent>
        </form>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}