import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security headers
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  return response
}

// Simple rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100 // Max requests per window

  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export async function updateSession(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Apply rate limiting
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Enhanced session validation
    const { data: { user, session }, error } = await supabase.auth.getUser()
    
    // Check for authentication errors
    if (error) {
      console.error('Auth error in middleware:', error)
      // Clear potentially corrupted session
      const response = NextResponse.redirect(new URL('/login?error=session_invalid', request.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return addSecurityHeaders(response)
    }

    // Validate session integrity
    if (user && session) {
      const sessionAge = Date.now() - new Date(session.created_at).getTime()
      const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (sessionAge > maxSessionAge) {
        // Session too old, force re-authentication
        const response = NextResponse.redirect(new URL('/login?error=session_expired', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return addSecurityHeaders(response)
      }
    }

    // Check if user is required for protected routes
    const isProtectedRoute = !request.nextUrl.pathname.startsWith('/login') && 
                           !request.nextUrl.pathname.startsWith('/register') &&
                           !request.nextUrl.pathname.startsWith('/auth') &&
                           !request.nextUrl.pathname.startsWith('/_next') &&
                           !request.nextUrl.pathname.startsWith('/api/auth')

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return addSecurityHeaders(NextResponse.redirect(url))
    }

    // Add security headers to response
    return addSecurityHeaders(supabaseResponse)
    
  } catch (error) {
    console.error('Middleware error:', error)
    // On any error, redirect to login
    const response = NextResponse.redirect(new URL('/login?error=auth_error', request.url))
    return addSecurityHeaders(response)
  }
}