import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthRoute,
  isPublicRoute,
  REDIRECT_PATHS,
} from "@/lib/middleware/routes";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  try {
    const pathname = request.nextUrl.pathname;
    
    // Check for Better Auth session cookies
    const cookies = request.cookies.getAll();
    const sessionCookie = cookies.find(cookie => 
      cookie.name === 'better-auth.session_token' ||
      cookie.name.startsWith('better-auth.')
    );

    
    // If user has session and is on auth page, redirect to app
    if (sessionCookie && isAuthRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = REDIRECT_PATHS.DEFAULT_AFTER_LOGIN;
      return NextResponse.redirect(url);
    }
    
    // Skip API routes completely
    if (pathname.startsWith("/api/")) {
      return response;
    }
    
    // Allow auth routes when no session (login, signup, etc.)
    if (isAuthRoute(pathname)) {
      return response;
    }
    
    // Allow public routes regardless of session
    if (isPublicRoute(pathname)) {
      return response;
    }
    
    // If no session and trying to access protected route, redirect to login
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    console.error("Better Auth middleware error:", error);
    return response;
  }
}