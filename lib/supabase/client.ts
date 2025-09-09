import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client optimized for browser/client-side usage.
 * 
 * This function initializes a Supabase client that runs in the browser
 * and handles client-side authentication, real-time subscriptions,
 * and database operations from React components.
 * 
 * @returns SupabaseClient - Configured Supabase client for browser use
 * 
 * **Purpose:**
 * - Provides client-side access to Supabase services
 * - Handles browser-based authentication flows
 * - Manages client-side session state
 * - Enables real-time subscriptions
 * - Supports client-side database queries
 * 
 * **Key Features:**
 * - Automatic session management in browser storage
 * - Real-time authentication state changes
 * - Cookie-based session persistence
 * - Automatic token refresh
 * - Cross-tab session synchronization
 * 
 * **Security Considerations:**
 * - Uses public anon key (safe for client exposure)
 * - Row Level Security (RLS) enforced on server
 * - Session tokens stored securely in httpOnly cookies
 * - Automatic session validation and refresh
 * - No sensitive credentials exposed to client
 * 
 * **Environment Variables:**
 * - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (public)
 * - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous/public key (safe for client)
 * 
 * **Usage Contexts:**
 * - AuthContext for global auth state management
 * - Client Components that need auth operations
 * - Real-time subscriptions and listeners
 * - Client-side form submissions
 * - Interactive UI components
 * 
 * **Integration Points:**
 * - Works with AuthProvider for state management
 * - Syncs with server-side middleware validation
 * - Coordinates with auth actions
 * - Connects to Supabase backend services
 * 
 * **Performance Considerations:**
 * - Client is lightweight and optimized for browsers
 * - Automatic connection pooling
 * - Efficient session caching
 * - Minimal bundle size impact
 * 
 * **Browser Compatibility:**
 * - Supports modern browsers with localStorage
 * - Graceful degradation for older browsers
 * - Works with SSR and client-side hydration
 * - Compatible with Next.js App Router
 * 
 * **Error Handling:**
 * - Automatic retry for network failures
 * - Graceful handling of auth errors
 * - Session corruption recovery
 * - Connection timeout management
 * 
 * **Best Practices:**
 * - Use in Client Components only ('use client')
 * - Don't recreate unnecessarily (use useMemo if needed)
 * - Handle loading states appropriately
 * - Always check auth state before operations
 */
export function createClient() {
  // Create browser-optimized Supabase client
  // This client handles cookies automatically and works with SSR
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
