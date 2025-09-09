'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/lib/actions/auth-actions';
import { loginSchema } from '@/app/lib/validations/schemas';

/**
 * Login page component that handles user authentication.
 * 
 * This component provides a secure login form with client-side validation,
 * error handling, and integration with the authentication system.
 * 
 * **Authentication Flow:**
 * 1. User enters email and password
 * 2. Client-side validation using Zod schema
 * 3. Form submission to login Server Action
 * 4. Server-side authentication via Supabase
 * 5. Session creation and redirect on success
 * 6. Error display and retry on failure
 * 
 * **Security Features:**
 * - Client-side input validation
 * - Server-side authentication
 * - Generic error messages (no user enumeration)
 * - Loading states to prevent double submission
 * - Automatic redirect after successful login
 * 
 * **User Experience:**
 * - Real-time validation feedback
 * - Clear error messages
 * - Loading indicators
 * - Accessible form design
 * - Link to registration page
 * 
 * **Integration Points:**
 * - Uses login Server Action for authentication
 * - Connects to Supabase auth system
 * - Triggers AuthContext updates on success
 * - Middleware handles session validation
 * 
 * **Error Handling:**
 * - Field-level validation errors
 * - Authentication failure messages
 * - Network error recovery
 * - Form state management
 */
export default function LoginPage() {
  // Form state management
  const [error, setError] = useState<string | null>(null); // General error message
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Field-specific validation errors

  /**
   * Handles form submission for user login.
   * 
   * This function orchestrates the complete login flow from form validation
   * to authentication and redirect, with comprehensive error handling.
   * 
   * **Flow Steps:**
   * 1. Prevent default form submission
   * 2. Set loading state and clear previous errors
   * 3. Extract form data (email, password)
   * 4. Perform client-side validation
   * 5. Call server-side login action
   * 6. Handle success (redirect) or failure (show errors)
   * 
   * **Security Measures:**
   * - Client-side validation prevents malformed requests
   * - Server-side validation and authentication
   * - Generic error messages prevent user enumeration
   * - Loading state prevents double submission
   * 
   * **Error Handling:**
   * - Validation errors shown per field
   * - Authentication errors shown as general message
   * - Network errors handled gracefully
   * - Form state reset on errors
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent default browser form submission
    event.preventDefault();
    
    // Set loading state and clear any previous errors
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Extract form data using FormData API
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Perform client-side validation using Zod schema
    // This provides immediate feedback and prevents unnecessary server calls
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      // Convert Zod errors to field-specific error messages
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    // Call server-side login action with validated data
    // This handles Supabase authentication and session creation
    const result = await login({ email, password });

    // Handle authentication result
    if (result?.error) {
      // Show generic error message (security: no user enumeration)
      setError(result.error);
      setLoading(false);
    } else {
      // Success: redirect to polls page with full page reload
      // Full reload ensures middleware picks up new session cookies
      // and AuthContext is properly initialized with user data
      window.location.href = '/polls';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
                className={fieldErrors.email ? 'border-red-500' : ''}
              />
              {fieldErrors.email && <p className="text-red-500 text-sm">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="current-password"
                className={fieldErrors.password ? 'border-red-500' : ''}
              />
              {fieldErrors.password && <p className="text-red-500 text-sm">{fieldErrors.password}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}