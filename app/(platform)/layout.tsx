// app/(platform)/layout.tsx (Simplified)
"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
// ... other imports ...

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  // ... (loading states, auth checks) ...

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-8">
        {children} {/* <--- THIS IS WHERE YOUR page.tsx CONTENT GOES */}
      </main>
      <footer>{/* Common Footer */}</footer>
    </div>
  );
}