import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client optimized for server-side usage in Next.js.
 * 
 * This function initializes a Supabase client that runs on the server
 * and handles server-side authentication, database operations, and
 * session management using Next.js cookies.
 * 
 * @returns Promise<SupabaseClient> - Configured Supabase client for server use
 * 
 * **Purpose:**
 * - Provides server-side access to Supabase services
 * - Handles server-side authentication validation
 * - Manages session cookies in Server Components and Actions
 * - Enables secure database operations with user context
 * - Supports server-side rendering with auth state
 * 
 * **Key Features:**
 * - Cookie-based session management
 * - Server-side session validation
 * - Automatic session refresh handling
 * - Integration with Next.js Server Components
 * - Support for Server Actions
 * 
 * **Security Considerations:**
 * - Runs on server (secure environment)
 * - Uses httpOnly cookies for session storage
 * - Validates sessions server-side for security
 * - Prevents client-side token exposure
 * - Enforces Row Level Security (RLS) policies
 * 
 * **Cookie Management:**
 * - Reads session cookies from incoming requests
 * - Updates cookies when sessions change
 * - Handles cookie options (httpOnly, secure, sameSite)
 * - Graceful error handling for read-only contexts
 * 
 * **Usage Contexts:**
 * - Server Components for data fetching
 * - Server Actions for mutations
 * - API Route Handlers
 * - Middleware for auth validation
 * - Page-level authentication checks
 * 
 * **Integration Points:**
 * - Works with middleware for session validation
 * - Coordinates with client-side auth context
 * - Connects to auth actions and components
 * - Syncs with browser-based Supabase client
 * 
 * **Performance Considerations:**
 * - Optimized for server-side execution
 * - Efficient cookie handling
 * - Minimal overhead for session validation
 * - Connection pooling for database operations
 * 
 * **Error Handling:**
 * - Graceful handling of cookie setting errors
 * - Automatic session refresh on expiration
 * - Network failure recovery
 * - Invalid session cleanup
 * 
 * **Server Component Compatibility:**
 * - Works with Next.js App Router
 * - Compatible with async Server Components
 * - Handles streaming and suspense
 * - Supports concurrent rendering
 * 
 * **Best Practices:**
 * - Use in Server Components and Actions only
 * - Always await the function call
 * - Handle authentication errors gracefully
 * - Don't expose sensitive data to client
 */
export async function createClient() {
  // Get Next.js cookie store for session management
  const cookieStore = await cookies()
  
  // Create server-optimized Supabase client with cookie handling
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request
        getAll() {
          return cookieStore.getAll()
        },
        // Set cookies in the response (with error handling)
        setAll(cookiesToSet) {
          try {
            // Attempt to set each cookie with its options
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component context
            // where cookies cannot be set (read-only). This is expected behavior
            // when the middleware is handling session refresh, so we can safely
            // ignore this error. The middleware will handle cookie updates.
          }
        },
      },
    }
  )
}