"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: session, status } = useSession();

   useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl); 
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    if (errorParam) {
      let message = "An unknown error occurred.";
      if (errorParam === "CredentialsSignin") {
        message = "Invalid email or password. Please try again.";
      } else if (errorParam === "InvalidRole") {
        message = "Your session is invalid due to a role issue. Please sign in again.";
      } else if (errorParam === "SessionInvalid") {
         message = "Your session is invalid. Please sign in again.";
      }
      setFormError(message);
      toast.error("Login Failed", { description: message });
      router.replace('/sign-in', undefined);
    }
  }, [errorParam, router]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);

    const result = await signIn("credentials", {
      redirect: false, 
      email: email.toLowerCase(),
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      const errorMessage = result.error === "CredentialsSignin"
        ? "Invalid email or password. Please try again."
        : "Login failed. Please check your credentials or try again later.";
      setFormError(errorMessage);
      toast.error("Login Failed", { description: errorMessage });
    } else if (result?.ok && !result.error) {
      toast.success("Login Successful!", { description: "Redirecting to your dashboard..."});
      router.push(result.url || callbackUrl); 
    } else {
      setFormError("An unexpected error occurred during sign in.");
      toast.error("Login Failed", { description: "An unexpected error occurred." });
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
   if (status === "authenticated") {
    return null; 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
          <CardDescription>Welcome back! Access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p className="text-sm text-destructive bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-center">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}