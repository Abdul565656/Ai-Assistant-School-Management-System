// app/(platform)/unauthorized/page.tsx
"use client"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6"> {/* Adjust min-h if header/footer sizes change */}
      <ShieldAlert className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-4xl font-bold mb-4 text-foreground">Access Denied</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        You do not have the necessary permissions to view this page
        {from && <span className="font-mono bg-muted p-1 rounded text-sm"> ({from})</span>}.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        <Link href="/dashboard">
          <Button>Go to Your Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}