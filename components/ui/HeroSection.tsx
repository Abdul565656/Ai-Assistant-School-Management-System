// components/landing/HeroSection.tsx
"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";

export default function HeroSection() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <section id="hero" className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground mb-4">
            <Sparkles className="inline-block h-4 w-4 mr-1" />
            AI-Powered Learning Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The Future of School Assistance is Here
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Our AI-driven platform helps teachers create and grade assignments effortlessly,
            while students get personalized tutoring and support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {isLoading ? (
                <Button size="lg" disabled>Loading...</Button>
            ) : isAuthenticated ? (
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Go to Your Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Sign In
                </Link>
              </>
            )}
          </div>
           <p className="text-xs text-muted-foreground pt-2">
            Join thousands of educators and students revolutionizing learning.
          </p>
        </div>
      </div>
    </section>
  );
}