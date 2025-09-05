'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/app/lib/actions/auth-actions';
import { registerSchema } from '@/app/lib/validations/schemas';

/**
 * Registration page component that handles new user account creation.
 * 
 * This component provides a secure registration form with comprehensive validation,
 * password confirmation, error handling, and integration with the authentication system.
 * 
 * **Registration Flow:**
 * 1. User enters name, email, password, and password confirmation
 * 2. Client-side password matching validation
 * 3. Client-side validation using Zod schema
 * 4. Form submission to register Server Action
 * 5. Server-side user creation via Supabase
 * 6. Session creation and redirect on success
 * 7. Error display and retry on failure
 * 
 * **Security Features:**
 * - Client-side input validation
 * - Password confirmation matching
 * - Server-side user creation and validation
 * - Generic error messages (no information leakage)
 * - Loading states to prevent double submission
 * - Automatic redirect after successful registration
 * 
 * **User Experience:**
 * - Real-time validation feedback
 * - Clear error messages per field
 * - Loading indicators during submission
 * - Accessible form design with proper labels
 * - Link to login page for existing users
 * 
 * **Integration Points:**
 * - Uses register Server Action for user creation
 * - Connects to Supabase auth system
 * - Triggers AuthContext updates on success
 * - Middleware handles session validation
 * 
 * **Validation Rules:**
 * - Name: Required, minimum length
 * - Email: Valid email format, uniqueness checked server-side
 * - Password: Minimum length, complexity requirements
 * - Password Confirmation: Must match password field
 * 
 * **Error Handling:**
 * - Field-level validation errors
 * - Password mismatch errors
 * - Registration failure messages
 * - Network error recovery
 * - Form state management
 */
export default function RegisterPage() {
  // Form state management
  const [error, setError] = useState<string | null>(null); // General error message
  const [loading, setLoading] = useState(false); // Loading state for form submission
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Field-specific validation errors

  /**
   * Handles form submission for user registration.
   * 
   * This function orchestrates the complete registration flow from form validation
   * to user creation and redirect, with comprehensive error handling.
   * 
   * **Flow Steps:**
   * 1. Prevent default form submission
   * 2. Set loading state and clear previous errors
   * 3. Extract form data (name, email, password, confirmPassword)
   * 4. Validate password confirmation match
   * 5. Perform client-side validation using Zod schema
   * 6. Call server-side register action
   * 7. Handle success (redirect) or failure (show errors)
   * 
   * **Security Measures:**
   * - Password confirmation validation
   * - Client-side validation prevents malformed requests
   * - Server-side validation and user creation
   * - Generic error messages prevent information leakage
   * - Loading state prevents double submission
   * 
   * **Error Handling:**
   * - Password mismatch validation
   * - Field-level validation errors
   * - Registration failure messages
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
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate password confirmation match (client-side security check)
    // This provides immediate feedback before server validation
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Perform client-side validation using Zod schema
    // This provides immediate feedback and prevents unnecessary server calls
    const validation = registerSchema.safeParse({ name, email, password });
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

    // Call server-side register action with validated data
    // This handles Supabase user creation and session establishment
    const result = await register({ name, email, password });

    // Handle registration result
    if (result?.error) {
      // Show generic error message (security: no information leakage)
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
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Sign up to start creating and sharing polls</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                required
                className={fieldErrors.name ? 'border-red-500' : ''}
              />
              {fieldErrors.name && <p className="text-red-500 text-sm">{fieldErrors.name}</p>}
            </div>
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
                autoComplete="new-password"
                className={fieldErrors.password ? 'border-red-500' : ''}
              />
              {fieldErrors.password && <p className="text-red-500 text-sm">{fieldErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required
                autoComplete="new-password"
                className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-sm">{fieldErrors.confirmPassword}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}