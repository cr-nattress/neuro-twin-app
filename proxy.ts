import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * @module proxy
 *
 * Route proxy handler for authentication and route protection (Next.js 15+ convention).
 *
 * Previously named `middleware.ts`, renamed to `proxy.ts` to use the modern Next.js approach.
 * Runs on every request to check auth status and redirect as needed.
 *
 * Features:
 * - Refreshes session on each request
 * - Protects /dashboard routes (redirects to /auth/login if not authenticated)
 * - Redirects authenticated users away from /auth/login
 *
 * @sideeffects
 * - Validates Supabase auth tokens on every request
 * - Updates auth cookies automatically
 * - Redirects unauthenticated users to login
 * - Redirects authenticated users away from login page
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for server-side auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  // Refresh session if expired (automatically updates cookies)
  const { data } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname === "/auth/login";
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isCallbackRoute = request.nextUrl.pathname === "/auth/callback";

  // Redirect unauthenticated users trying to access protected routes
  if (!data.user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect authenticated users away from login page
  // (they should use /dashboard or home page instead)
  if (data.user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow callback route and public routes
  return response;
}

/**
 * Route matcher configuration for proxy handler.
 *
 * Applies to all routes except:
 * - Next.js static files (_next/static)
 * - Optimized images (_next/image)
 * - Favicon requests
 *
 * This ensures auth checks run on all user-facing routes and API calls.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
