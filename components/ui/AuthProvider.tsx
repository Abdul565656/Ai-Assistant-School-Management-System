// components/providers/AuthProvider.tsx
"use client";

import { SessionProvider, SessionProviderProps } from "next-auth/react";
import React from "react";

// No need to pass session explicitly here if SessionProvider handles fetching it
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}