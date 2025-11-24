import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("auth_session");
  const isLoginPage = request.nextUrl.pathname === "/login";

  // If user is on login page and already has a session, redirect to home
  if (isLoginPage && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not on login page and doesn't have a session, redirect to login
  if (!isLoginPage && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - login (login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};

