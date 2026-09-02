import { NextRequest, NextResponse } from "next/server";

const publicPaths = new Set(["/", "/login", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next();
  }
  const session = request.cookies.get("better-auth.session_token");
  const isPublic = publicPaths.has(pathname) || pathname.startsWith("/invite/");
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Do not bounce /login or /signup based on cookie presence. A stale
  // session cookie would otherwise loop: signup → dashboard → login → dashboard.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
