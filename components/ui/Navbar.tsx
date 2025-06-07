// components/landing/Navbar.tsx
"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogIn, LogOut, UserPlus, BookOpenText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";

const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || 'U';
  }
  return email?.[0]?.toUpperCase() || 'U';
};


export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" }, // Example, implement if needed
    { label: "Contact", href: "#contact" }, // Example
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpenText className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">School AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled size="sm">Loading...</Button>
            </div>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                    <AvatarFallback>{getInitials(session.user.name, session.user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs capitalize pt-1 text-primary">{session.user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 pt-6">
                   <Link href="/" className="flex items-center space-x-2 mb-4 border-b pb-4">
                      <BookOpenText className="h-6 w-6 text-primary" />
                      <span className="font-bold">School AI</span>
                    </Link>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-2 py-1 text-lg font-medium text-muted-foreground hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="pt-4 border-t">
                  {!isLoading && !session?.user && (
                    <>
                      <Link href="/sign-in" className={buttonVariants({ variant: "outline", className:"w-full mb-2" })}>
                        <LogIn className="mr-2 h-4 w-4" /> Sign In
                      </Link>
                      <Link href="/sign-up" className={buttonVariants({ className: "w-full" })}>
                        <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                      </Link>
                    </>
                  )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}