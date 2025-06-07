// components/landing/CallToActionSection.tsx
"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, PartyPopper } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CallToActionSection() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <section id="cta" className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <PartyPopper className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Ready to Revolutionize Learning?
        </h2>
        <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
          Join the School AI Assistant platform today and experience the future of education.
          It's free to get started!
        </p>
        <div className="mt-10">
          {isAuthenticated ? (
             <Link href="/dashboard" className={buttonVariants({ variant: "secondary", size: "lg", className: "px-10 py-6 text-lg" })}>
                Go to Your Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
          ) : (
            <Link href="/sign-up" className={buttonVariants({ variant: "secondary", size: "lg", className: "px-10 py-6 text-lg" })}>
              Sign Up For Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}