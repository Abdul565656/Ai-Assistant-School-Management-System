// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/ui/AuthProvider";
import { Toaster } from "@/components/ui/sonner"; // For notifications

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); // Add variable for ShadCN

export const metadata: Metadata = {
  title: "School AI Assistant",
  description: "AI-powered assistant for students and teachers",
  icons: { icon: "/favicon.ico" }, // Add a favicon in public folder
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`min-h-screen bg-background font-sans antialiased ${inter.variable}`}>
          {children}
          <Toaster richColors closeButton />
        </body>
      </html>
    </AuthProvider>
  );
}