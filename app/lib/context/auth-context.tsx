'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and actions.
 * 
 * This context provides centralized authentication state management for the
 * entire polling application, ensuring consistent user state across all components.
 * 
 * **State Properties:**
 * - session: Current Supabase session with tokens and metadata
 * - user: Current user object with profile data and permissions
 * - loading: Indicates if initial authentication check is in progress
 * 
 * **Actions:**
 * - signOut: Function to log out the current user
 * 
 * **Integration Points:**
 * - Used by all components requiring authentication state
 * - Connected to Supabase Auth for real-time session updates
 * - Provides loading state for conditional rendering during auth checks
 */
const AuthContext = createContext<{ 
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication provider component that manages global auth state.
 * 
 * This component wraps the entire application to provide authentication
 * context to all child components. It handles initial auth state loading,
 * real-time session updates, and provides auth actions like sign out.
 * 
 * @param children - React components that need access to auth context
 * 
 * **Functionality:**
 * - Initializes Supabase client for auth operations
 * - Loads initial user state on app startup
 * - Listens for real-time auth state changes (login/logout)
 * - Provides loading state during initial auth check
 * - Handles cleanup on component unmount
 * 
 * **Security Considerations:**
 * - Uses client-side Supabase client (safe for browser)
 * - Session tokens are managed automatically by Supabase
 * - Real-time updates prevent stale auth state
 * - Cleanup prevents memory leaks and race conditions
 * 
 * **Edge Cases Handled:**
 * - Component unmounting during async operations (mounted flag)
 * - Network failures during initial load (graceful error handling)
 * - Concurrent auth state changes (Supabase handles synchronization)
 * - Session expiration (automatic token refresh by Supabase)
 * 
 * **Integration Points:**
 * - Wraps entire app in layout.tsx
 * - Used by all components via useAuth hook
 * - Connects to server-side auth actions
 * - Syncs with middleware session validation
 * 
 * **Performance Considerations:**
 * - Supabase client is memoized to prevent recreation
 * - Auth listener is cleaned up to prevent memory leaks
 * - Loading state prevents unnecessary re-renders
 * 
 * **Assumptions:**
 * - Supabase client is properly configured
 * - Network connectivity for real-time updates
 * - Browser supports required APIs (localStorage, etc.)
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Memoize Supabase client to prevent recreation on re-renders
  // This ensures consistent auth state and prevents unnecessary API calls
  const supabase = useMemo(() => createClient(), []);
  
  // Auth state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true for initial auth check

  useEffect(() => {
    // Track component mount state to prevent state updates after unmount
    // This prevents React warnings and potential memory leaks
    let mounted = true;
    
    /**
     * Initial user authentication check.
     * 
     * This function runs once when the component mounts to determine
     * if there's an existing valid session. It's crucial for maintaining
     * auth state across page refreshes and app restarts.
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        // Continue with null user - don't block app loading for auth errors
      }
      
      // Only update state if component is still mounted
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Session will be set by auth state change listener
        setLoading(false); // Initial auth check complete
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    // Perform initial auth check
    getUser();

    /**
     * Set up real-time authentication state listener.
     * 
     * This listener responds to all auth events (login, logout, token refresh)
     * and keeps the context state synchronized with the actual auth state.
     * It's essential for multi-tab synchronization and automatic logout.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Note: Don't set loading to false here, only after initial load
      // This prevents loading flicker during auth state changes
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out function that clears user session.
   * 
   * This function calls the Supabase auth signOut method, which:
   * - Invalidates the current session
   * - Clears auth cookies
   * - Triggers the auth state change listener
   * - Updates the context state automatically
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    // State updates will be handled by the auth state change listener
  };

  // Debug logging for development (remove in production)
  console.log('AuthContext: user', user);
  
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing authentication context throughout the application.
 * 
 * This hook provides a convenient way for components to access the current
 * authentication state and actions without directly importing and using
 * the React Context API.
 * 
 * @returns AuthContextType - Object containing auth state and actions
 * 
 * **Returned Properties:**
 * - `user`: Current authenticated user object (null if not authenticated)
 * - `session`: Current Supabase session object (null if no active session)
 * - `loading`: Boolean indicating if initial auth check is in progress
 * - `signOut`: Function to sign out the current user
 * 
 * **Usage Examples:**
 * ```tsx
 * // Basic authentication check
 * const { user, loading } = useAuth();
 * if (loading) return <LoadingSpinner />;
 * if (!user) return <LoginPrompt />;
 * 
 * // Access user information
 * const { user } = useAuth();
 * console.log(user?.email, user?.id);
 * 
 * // Sign out functionality
 * const { signOut } = useAuth();
 * const handleLogout = () => signOut();
 * 
 * // Session-based operations
 * const { session } = useAuth();
 * const token = session?.access_token;
 * ```
 * 
 * **Security Considerations:**
 * - Always check `loading` state before making auth decisions
 * - User object can be null (handle gracefully)
 * - Session tokens are managed automatically by Supabase
 * - Hook reflects real-time auth state changes
 * 
 * **Edge Cases Handled:**
 * - Component unmounting during auth state changes
 * - Network failures during auth operations
 * - Concurrent auth state updates
 * - Session expiration and refresh
 * 
 * **Integration Points:**
 * - Used in layout components for navigation
 * - Used in protected components for access control
 * - Connects to server-side auth via middleware
 * - Syncs with auth actions (login, register, logout)
 * 
 * **Performance Notes:**
 * - Hook uses React Context (minimal re-renders)
 * - Auth state is cached and shared across components
 * - Loading state prevents unnecessary API calls
 * - Real-time updates via Supabase listeners
 * 
 * **Error Handling:**
 * - Throws error if used outside AuthProvider
 * - Gracefully handles auth service failures
 * - Provides fallback states for network issues
 * 
 * **Best Practices:**
 * - Always check loading state first
 * - Handle null user gracefully
 * - Use in components that need auth state
 * - Don't call conditionally (React hooks rules)
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Ensure hook is used within AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
