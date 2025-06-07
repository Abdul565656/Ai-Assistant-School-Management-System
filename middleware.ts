// middleware.ts
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/lib/db/models/user.model"; // Import UserRole type

const ROLES = {
  STUDENT: "student" as UserRole,
  TEACHER: "teacher" as UserRole,
} as const;

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const userRole = token?.role as UserRole | undefined;

    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (token && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect from /dashboard to role-specific dashboard
    if (pathname === "/dashboard") {
      if (!token) return NextResponse.redirect(new URL("/sign-in", req.url));

      if (userRole === ROLES.TEACHER) {
        return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
      } else if (userRole === ROLES.STUDENT) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      } else {
        console.warn(`User ${token.email} at /dashboard has invalid/missing role: ${userRole}. Redirecting to sign-in.`);
        const signOutUrl = new URL("/api/auth/signout", req.url);
        signOutUrl.searchParams.set("callbackUrl", "/sign-in?error=InvalidRole");
        return NextResponse.redirect(signOutUrl); // Attempt to sign out and redirect
      }
    }

    // Protect teacher routes
    if (pathname.startsWith("/teacher") && userRole !== ROLES.TEACHER) {
      return NextResponse.redirect(new URL("/unauthorized?from=" + pathname, req.url));
    }

    // Protect student routes
    if (pathname.startsWith("/student") && userRole !== ROLES.STUDENT) {
      return NextResponse.redirect(new URL("/unauthorized?from=" + pathname, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const publicPaths = ["/", "/sign-in", "/sign-up", "/unauthorized"];
        const isApiAuthRoute = pathname.startsWith("/api/auth");
        const isPublicAsset = /\.(.*)$/.test(pathname) || pathname.startsWith("/_next"); // Basic check for assets

        if (publicPaths.some(path => pathname.startsWith(path)) || isApiAuthRoute || isPublicAsset) {
          return true;
        }
        return !!token; // Must have a token for any other route
      },
    },
    pages: {
      signIn: "/sign-in",
      error: "/sign-in", // Redirect to sign-in on NextAuth errors (e.g. invalid token)
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (if any, e.g. /images/logo.png)
     * Match root `/` and all paths under `/student`, `/teacher`, `/dashboard`, `/sign-in`, `/sign-up`, `/api/auth`
     */
    // This matcher tries to exclude static files and image optimization, but `authorized` callback gives finer control.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};