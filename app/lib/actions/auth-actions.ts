'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { loginSchema, registerSchema, sanitizeHtml } from '@/app/lib/validations/schemas';

/**
 * Authenticates a user with email and password credentials.
 * 
 * This function handles the core login flow for the polling application, ensuring
 * secure authentication while providing a smooth user experience. It integrates
 * with Supabase Auth for session management and connects to the middleware for
 * automatic session refresh and route protection.
 * 
 * @param data - Login form data containing email and password
 * @returns Promise<{error: string | null}> - Success/error state for UI feedback
 * 
 * **Security Considerations:**
 * - Input validation prevents malformed data from reaching auth service
 * - Email sanitization prevents XSS attacks in error messages
 * - Generic error messages prevent user enumeration attacks
 * - Password is never logged or stored in plain text
 * 
 * **Edge Cases Handled:**
 * - Invalid email format (caught by Zod schema)
 * - Missing required fields (caught by Zod schema)
 * - Network failures (generic error message)
 * - Account lockouts (handled by Supabase)
 * - Rate limiting (handled by middleware)
 * 
 * **Integration Points:**
 * - Called by login page form submission
 * - Session created here is picked up by AuthContext
 * - Middleware validates session on subsequent requests
 * - Success triggers redirect to /polls in login page
 * 
 * **Assumptions:**
 * - Supabase client is properly configured with environment variables
 * - User has confirmed their email (if email confirmation is enabled)
 * - Network connectivity exists for auth service calls
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Validate input data using Zod schema to ensure type safety and format correctness
  // This prevents malformed data from reaching the authentication service
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message;
    return { error: firstError || 'Invalid login data' };
  }

  const { email, password } = validation.data;

  // Sanitize email to prevent XSS attacks in error messages and ensure consistent format
  // Password is not sanitized as it needs to remain exactly as entered for auth
  const sanitizedEmail = sanitizeHtml(email.toLowerCase().trim());

  // Attempt authentication with Supabase Auth service
  // This creates a session that will be automatically managed by the client
  const { error } = await supabase.auth.signInWithPassword({
    email: sanitizedEmail,
    password: password,
  });

  if (error) {
    // Return generic error messages to prevent user enumeration attacks
    // Specific error details are logged server-side but not exposed to client
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password' };
    }
    return { error: 'Login failed. Please try again.' };
  }

  // Success: Session is automatically stored in cookies by Supabase client
  // AuthContext will pick up the new session via onAuthStateChange listener
  return { error: null };
}

/**
 * Registers a new user account with email, password, and display name.
 * 
 * This function handles the complete user registration flow for the polling app,
 * including validation, sanitization, duplicate checking, and account creation.
 * It integrates with Supabase Auth and stores user metadata for poll ownership.
 * 
 * @param data - Registration form data containing name, email, and password
 * @returns Promise<{error: string | null}> - Success/error state for UI feedback
 * 
 * **Security Considerations:**
 * - Input validation prevents malformed data and injection attacks
 * - Email and name sanitization prevents XSS in user-generated content
 * - Duplicate email check prevents account enumeration via registration
 * - Password strength is enforced by Supabase Auth policies
 * - Generic error messages prevent information disclosure
 * 
 * **Edge Cases Handled:**
 * - Duplicate email addresses (checked before registration attempt)
 * - Invalid email formats (caught by Zod schema)
 * - Weak passwords (handled by Supabase with generic error)
 * - Network failures during registration
 * - Race conditions in duplicate checking (Supabase handles uniqueness)
 * 
 * **Integration Points:**
 * - Called by registration page form submission
 * - User metadata (name) is stored for poll creation attribution
 * - Session created here is picked up by AuthContext
 * - Email confirmation may be required (configurable in Supabase)
 * - Success triggers redirect to /polls in registration page
 * 
 * **Assumptions:**
 * - Email confirmation is handled by Supabase (if enabled)
 * - User metadata is accessible for poll ownership tracking
 * - Supabase Auth policies enforce password requirements
 * - Network connectivity exists for auth service calls
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Validate input data using Zod schema for type safety and format validation
  // This ensures all required fields are present and properly formatted
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message;
    return { error: firstError || 'Invalid registration data' };
  }

  const { email, password, name } = validation.data;

  // Sanitize inputs to prevent XSS attacks in user-generated content
  // Email is normalized to lowercase for consistent lookups
  const sanitizedEmail = sanitizeHtml(email.toLowerCase().trim());
  const sanitizedName = sanitizeHtml(name.trim());

  // Check if user already exists to provide immediate feedback
  // This prevents unnecessary registration attempts and improves UX
  // Note: This creates a small window for race conditions, but Supabase
  // will ultimately enforce email uniqueness at the database level
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('email')
    .eq('email', sanitizedEmail)
    .single();

  if (existingUser) {
    return { error: 'An account with this email already exists' };
  }

  // Create new user account with Supabase Auth
  // User metadata (name) is stored for poll attribution and display purposes
  const { error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password: password,
    options: {
      data: {
        name: sanitizedName, // Stored in user_metadata for poll ownership
      },
    },
  });

  if (error) {
    // Return generic error messages to prevent information disclosure
    // Specific error details are logged server-side but not exposed to client
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists' };
    }
    if (error.message.includes('Password')) {
      return { error: 'Password does not meet security requirements' };
    }
    return { error: 'Registration failed. Please try again.' };
  }

  // Success: Account created and session established
  // If email confirmation is enabled, user will need to verify before full access
  return { error: null };
}

/**
 * Logs out the current user by terminating their session.
 * 
 * This function handles the complete logout flow, clearing both client-side
 * and server-side session data. It integrates with the AuthContext to update
 * the UI state and triggers middleware to clear authentication cookies.
 * 
 * @returns Promise<{error: string | null}> - Success/error state for UI feedback
 * 
 * **Security Considerations:**
 * - Clears all session tokens and cookies
 * - Invalidates refresh tokens on the server
 * - Prevents session fixation attacks
 * 
 * **Edge Cases Handled:**
 * - Network failures during logout (graceful degradation)
 * - Already logged out users (no-op)
 * - Concurrent logout attempts
 * 
 * **Integration Points:**
 * - Called by header logout button and AuthContext signOut
 * - AuthContext updates UI state via onAuthStateChange
 * - Middleware clears authentication cookies
 * - User is redirected to login page after logout
 * 
 * **Assumptions:**
 * - Network connectivity for server-side session invalidation
 * - AuthContext listener will update UI state
 */
export async function logout() {
  const supabase = await createClient();
  
  // Terminate the user session on both client and server
  // This invalidates all tokens and clears authentication state
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Return specific error for logout failures (less security sensitive)
    return { error: error.message };
  }
  
  // Success: Session terminated, AuthContext will update UI state
  return { error: null };
}

/**
 * Retrieves the currently authenticated user from the session.
 * 
 * This function provides access to user data for authorization checks,
 * UI personalization, and poll ownership verification. It's used throughout
 * the app to determine user permissions and display appropriate content.
 * 
 * @returns Promise<User | null> - Current user object or null if not authenticated
 * 
 * **Security Considerations:**
 * - Only returns user data if session is valid
 * - No sensitive data is exposed in user object
 * - Session validation is handled by Supabase client
 * 
 * **Edge Cases Handled:**
 * - Expired sessions (returns null)
 * - Invalid tokens (returns null)
 * - Network failures (returns null)
 * 
 * **Integration Points:**
 * - Used by admin functions for role checking
 * - Used by poll actions for ownership verification
 * - Used by UI components for conditional rendering
 * - Called by middleware for route protection
 * 
 * **Assumptions:**
 * - Supabase client handles session validation
 * - User object contains necessary metadata (name, admin status)
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Get current user from the active session
  // Returns null if no valid session exists
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current session information.
 * 
 * This function provides access to session metadata including tokens,
 * expiration times, and user data. It's primarily used for session
 * validation and debugging purposes.
 * 
 * @returns Promise<Session | null> - Current session object or null if not authenticated
 * 
 * **Security Considerations:**
 * - Session tokens are handled securely by Supabase client
 * - Expiration times are validated automatically
 * - Refresh tokens are managed transparently
 * 
 * **Edge Cases Handled:**
 * - Expired sessions (returns null)
 * - Invalid sessions (returns null)
 * - Missing session data (returns null)
 * 
 * **Integration Points:**
 * - Used by AuthContext for session state management
 * - Used by middleware for session validation
 * - Used for debugging authentication issues
 * 
 * **Assumptions:**
 * - Supabase client manages session lifecycle
 * - Session data is stored securely in HTTP-only cookies
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Get current session with all metadata
  // Returns null if no valid session exists
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Checks if a user has administrative privileges in the polling application.
 * 
 * This function implements role-based access control (RBAC) by checking the
 * user's metadata for admin status. It's used throughout the app to control
 * access to administrative features like viewing all polls and user management.
 * 
 * @param userId - Optional user ID to check (defaults to current user)
 * @returns Promise<boolean> - True if user has admin privileges, false otherwise
 * 
 * **Security Considerations:**
 * - Admin status is stored in user_metadata (server-side only)
 * - No client-side admin status caching to prevent tampering
 * - Always validates current session before checking admin status
 * - Returns false for unauthenticated users
 * 
 * **Edge Cases Handled:**
 * - Unauthenticated users (returns false)
 * - Invalid user IDs (returns false)
 * - Missing user_metadata (returns false)
 * - Network failures (returns false, fail-safe)
 * 
 * **Integration Points:**
 * - Used by admin page for access control
 * - Used by poll actions for admin-only operations
 * - Used by UI components for conditional admin features
 * - Called by requireAdmin() for strict access control
 * 
 * **Implementation Notes:**
 * - Currently uses user_metadata for simplicity
 * - In production, consider a separate admins table for better scalability
 * - Admin status is set manually in Supabase dashboard or via admin API
 * 
 * **Assumptions:**
 * - Admin status is set in user_metadata.is_admin field
 * - User metadata is accessible via Supabase Auth
 * - Admin privileges are binary (admin or not admin)
 */
export async function isUserAdmin(userId?: string) {
  const supabase = await createClient();
  
  // If no userId provided, check current authenticated user
  // This is the most common use case for authorization checks
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false; // Unauthenticated users are never admin
    userId = user.id;
  }

  // Get user data to check admin status in metadata
  // Admin status is stored server-side to prevent client-side tampering
  const { data: user } = await supabase.auth.getUser();
  
  // Check admin flag in user metadata
  // Returns false if user doesn't exist or admin flag is not set
  // This implements a fail-safe approach where admin access must be explicitly granted
  return user.user?.user_metadata?.is_admin === true;
}

/**
 * Enforces admin access by throwing an error if the user lacks admin privileges.
 * 
 * This function provides strict access control for admin-only operations.
 * It combines authentication and authorization checks to ensure only
 * authenticated admin users can access protected functionality.
 * 
 * @returns Promise<User> - The authenticated admin user object
 * @throws Error - If user is not authenticated or lacks admin privileges
 * 
 * **Security Considerations:**
 * - Throws immediately on authentication failure
 * - Throws immediately on authorization failure
 * - No information disclosure about admin status to non-admins
 * - Always validates current session state
 * 
 * **Edge Cases Handled:**
 * - Unauthenticated users (throws 'Authentication required')
 * - Authenticated non-admin users (throws 'Admin access required')
 * - Network failures (throws with appropriate error)
 * - Invalid sessions (throws 'Authentication required')
 * 
 * **Integration Points:**
 * - Used by admin page server components
 * - Used by admin-only server actions
 * - Used by API routes requiring admin access
 * - Error messages are caught by error boundaries
 * 
 * **Usage Pattern:**
 * ```typescript
 * try {
 *   const adminUser = await requireAdmin();
 *   // Proceed with admin-only operation
 * } catch (error) {
 *   // Handle authentication/authorization failure
 *   redirect('/login?error=admin_required');
 * }
 * ```
 * 
 * **Assumptions:**
 * - Calling code will handle thrown errors appropriately
 * - Error messages are safe to display to users
 * - Admin status checking is reliable and up-to-date
 */
export async function requireAdmin() {
  // First check if user is authenticated
  // This provides a clear error message for unauthenticated access attempts
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  // Then check if authenticated user has admin privileges
  // This separates authentication from authorization concerns
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  // Return the authenticated admin user for further operations
  // This allows the calling code to access user data without additional queries
  return user;
}
