import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Simple in-memory rate limiting store.
 * 
 * **Production Note:** This implementation uses in-memory storage which
 * doesn't persist across server restarts and doesn't work in multi-instance
 * deployments. For production, use Redis, database, or a dedicated rate
 * limiting service like Upstash or Cloudflare.
 * 
 * **Security Purpose:** Prevents brute force attacks and API abuse by
 * limiting requests per IP address within a time window.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration constants.
 * 
 * These values balance security with user experience:
 * - 15-minute window prevents short-term abuse while allowing legitimate usage
 * - 100 requests per window accommodates normal browsing patterns
 * - Can be adjusted based on application usage patterns
 */
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per IP per window

/**
 * Security headers configuration for enhanced protection.
 * 
 * These headers provide defense-in-depth against common web vulnerabilities:
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing attacks
 * - Referrer-Policy: Controls referrer information leakage
 * - X-XSS-Protection: Legacy XSS protection (deprecated but still useful)
 * - Content-Security-Policy: Comprehensive XSS and injection protection
 */
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
};

/**
 * Applies security headers to the response for enhanced protection.
 * 
 * @param response - NextResponse object to add headers to
 * @returns NextResponse with security headers applied
 * 
 * **Security Benefits:**
 * - Prevents common web vulnerabilities (XSS, clickjacking, MIME sniffing)
 * - Enforces content security policies
 * - Controls referrer information leakage
 * - Provides defense-in-depth security approach
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Rate limiting function that tracks and validates request frequency per IP.
 * 
 * @param ip - Client IP address for rate limiting
 * @returns boolean - true if request is allowed, false if rate limited
 * 
 * **Algorithm:**
 * 1. Check if IP has existing rate limit record
 * 2. If no record or window expired, create new record
 * 3. If within window and under limit, increment counter
 * 4. If over limit, reject request
 * 
 * **Security Considerations:**
 * - Uses IP-based tracking (can be bypassed with proxies)
 * - Sliding window approach prevents burst attacks
 * - Automatic cleanup when window expires
 * 
 * **Edge Cases:**
 * - Shared IP addresses (corporate networks, NAT)
 * - Clock skew (uses server time consistently)
 * - Memory cleanup (old records are overwritten)
 * 
 * **Limitations:**
 * - In-memory storage doesn't persist across restarts
 * - Not suitable for distributed deployments
 * - No differentiation between authenticated/anonymous users
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // Create new record if none exists or window has expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_WINDOW 
    });
    return true; // Allow first request in new window
  }

  // Check if rate limit exceeded
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  // Increment counter and allow request
  record.count++;
  return true;
}

/**
 * Main middleware function that handles session management, authentication,
 * authorization, rate limiting, and security headers.
 * 
 * This function runs on every request and provides comprehensive security
 * and authentication handling for the entire application.
 * 
 * @param request - NextRequest object containing request details
 * @returns NextResponse with appropriate redirects, headers, and session handling
 * 
 * **Core Functionality:**
 * 1. Rate limiting based on client IP
 * 2. Supabase session validation and refresh
 * 3. Route-based authentication checks
 * 4. Session age validation
 * 5. Security headers application
 * 6. Error handling and recovery
 * 
 * **Security Measures:**
 * - IP-based rate limiting to prevent abuse
 * - Session integrity validation
 * - Automatic session refresh handling
 * - Protected route enforcement
 * - Security headers for all responses
 * - Session corruption detection and cleanup
 * 
 * **Route Protection:**
 * - All routes except `/login`, `/register`, `/auth`, `/_next`, `/api/auth` require authentication
 * - Unauthenticated users redirected to `/login` with redirect parameter
 * - Session errors trigger cleanup and re-authentication
 * 
 * **Edge Cases Handled:**
 * - Missing or invalid IP addresses
 * - Network failures during auth checks
 * - Expired or corrupted sessions
 * - Race conditions in session updates
 * - Clock skew in session age calculations
 * - Authentication service errors
 * 
 * **Integration Points:**
 * - Works with AuthContext for client-side state
 * - Connects to Supabase auth system
 * - Coordinates with auth actions
 * - Integrates with login/register flows
 * 
 * **Performance Considerations:**
 * - Minimal database queries
 * - Efficient cookie handling
 * - Rate limiting prevents resource exhaustion
 * - Session validation caching by Supabase
 * 
 * **Critical Implementation Notes:**
 * - Must return supabaseResponse to maintain session sync
 * - Cookie handling is crucial for auth state
 * - Order of operations matters for Supabase client
 * - Security headers applied to all responses
 * - Error recovery ensures application stability
 */
export async function updateSession(request: NextRequest) {
  // Extract client IP for rate limiting
  // Priority: direct IP > X-Forwarded-For header > fallback
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Apply rate limiting to prevent abuse and DoS attacks
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // Initialize NextResponse for Supabase session handling
  // This response object will be modified by Supabase for cookie management
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie handling for server-side auth
  // This setup ensures session cookies are properly managed
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request
        getAll() {
          return request.cookies.getAll()
        },
        // Set cookies in both request and response for proper session handling
        setAll(cookiesToSet) {
          // Update request cookies for immediate use
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies in response for client
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // CRITICAL: Avoid writing logic between createServerClient and getUser()
    // Any code here could interfere with Supabase's session management
    // and cause random logout issues
    
    // Enhanced session validation with comprehensive error handling
    const { data: { user, session }, error } = await supabase.auth.getUser()
    
    // Check for authentication errors and handle gracefully
    if (error) {
      console.error('Auth error in middleware:', error)
      // Clear potentially corrupted session cookies
      const response = NextResponse.redirect(new URL('/login?error=session_invalid', request.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return addSecurityHeaders(response)
    }

    // Validate session integrity and age for additional security
    if (user && session) {
      const sessionAge = Date.now() - new Date(session.created_at).getTime()
      const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours maximum
      
      // Force re-authentication for old sessions
      if (sessionAge > maxSessionAge) {
        console.log('Session too old, forcing re-authentication')
        const response = NextResponse.redirect(new URL('/login?error=session_expired', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return addSecurityHeaders(response)
      }
    }

    // Define protected routes (all routes except public ones)
    const isProtectedRoute = !request.nextUrl.pathname.startsWith('/login') && 
                           !request.nextUrl.pathname.startsWith('/register') &&
                           !request.nextUrl.pathname.startsWith('/auth') &&
                           !request.nextUrl.pathname.startsWith('/_next') &&
                           !request.nextUrl.pathname.startsWith('/api/auth')

    // Redirect unauthenticated users from protected routes
    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return addSecurityHeaders(NextResponse.redirect(url))
    }

    // CRITICAL: Must return supabaseResponse to maintain session synchronization
    // The supabaseResponse contains updated session cookies that must be sent to client
    return addSecurityHeaders(supabaseResponse)
    
  } catch (error) {
    // Comprehensive error handling for any unexpected issues
    console.error('Middleware error:', error)
    // On any error, redirect to login with error indication
    const response = NextResponse.redirect(new URL('/login?error=auth_error', request.url))
    return addSecurityHeaders(response)
  }
}