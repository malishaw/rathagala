import { NextResponse, type NextRequest } from "next/server";

const authRoutes = [
  "/signin",
  "/signup",
  "/reset-password",
  "/forgot-password",
  "/email-verified",
];

// Add profile and dashboard to protected routes
const protectedRoutes = ["/dashboard", "/profile"];

export default function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route needs auth handling
  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    authRoutes.includes(pathname)
  ) {
    // Detect better-auth session cookie in request
    const hasSessionToken =
      request.cookies.has("better-auth.session_token") ||
      request.cookies.has("__Secure-better-auth.session_token") ||
      request.cookies.has("__Host-better-auth.session_token") ||
      request.cookies.getAll().some((c) => c.name.includes("session_token"));

    // If Auth route and Already authenticated,
    // Redirect back to homepage
    if (authRoutes.includes(pathname) && hasSessionToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If Protected route and Not authenticated,
    // Redirect to signin with callback URL
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) &&
      !hasSessionToken
    ) {
      return NextResponse.redirect(
        new URL(
          `/signin?callbackUrl=${encodeURIComponent(pathname)}`,
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
