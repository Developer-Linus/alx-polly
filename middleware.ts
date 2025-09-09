import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js middleware entry point for authentication and security.
 * 
 * This middleware runs on every request matching the configured patterns
 * and provides the first line of defense for authentication, authorization,
 * and security in the application.
 * 
 * @param request - NextRequest object containing request details
 * @returns NextResponse with appropriate handling (redirect, continue, etc.)
 * 
 * **Purpose:**
 * - Intercepts requests before they reach page components
 * - Validates user authentication status
 * - Enforces route-based access control
 * - Applies security headers and rate limiting
 * - Manages Supabase session cookies
 * 
 * **Flow:**
 * 1. Request comes in from client
 * 2. Middleware checks if route matches config patterns
 * 3. Delegates to updateSession for comprehensive handling
 * 4. Returns response with proper auth state and security headers
 * 
 * **Security Benefits:**
 * - Server-side authentication validation
 * - Protection against unauthorized access
 * - Session management and refresh
 * - Rate limiting and abuse prevention
 * - Security headers for all responses
 * 
 * **Integration with App:**
 * - Works with AuthContext for client-side state sync
 * - Coordinates with auth actions and components
 * - Ensures consistent auth state across the application
 * - Provides seamless user experience with automatic redirects
 * 
 * **Performance Considerations:**
 * - Runs on every matching request (keep logic efficient)
 * - Uses Supabase's optimized session validation
 * - Minimal database queries (only for admin checks)
 * - Proper cookie handling prevents unnecessary auth calls
 */
export async function middleware(request: NextRequest) {
  // Delegate all middleware logic to the updateSession function
  // This separation allows for better testing and organization
  return await updateSession(request)
}

/**
 * Middleware configuration that defines which routes to intercept.
 * 
 * **Matcher Pattern Explanation:**
 * - Matches all routes EXCEPT:
 *   - `_next/static` - Next.js static assets
 *   - `_next/image` - Next.js optimized images
 *   - `favicon.ico` - Browser favicon requests
 *   - `login` - Login page (public access)
 *   - `register` - Registration page (public access)
 *   - Static files (svg, png, jpg, etc.) - Asset files
 * 
 * **Why These Exclusions:**
 * - Static assets don't need authentication
 * - Login/register pages must be accessible to unauthenticated users
 * - Image files and favicons are public resources
 * - Next.js internal routes should not be intercepted
 * 
 * **Security Implications:**
 * - All application routes are protected by default
 * - Public routes must be explicitly excluded
 * - Asset requests bypass auth for performance
 * - API routes are included and protected
 * 
 * **Performance Impact:**
 * - Excluding static assets reduces middleware overhead
 * - Focused matching improves request processing speed
 * - Prevents unnecessary auth checks on public resources
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}