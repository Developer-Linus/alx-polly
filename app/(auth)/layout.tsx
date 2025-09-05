'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/context/auth-context';

/**
 * Authentication layout component that wraps login and register pages.
 * 
 * This layout provides a consistent UI structure for authentication pages
 * and implements automatic redirection logic for authenticated users.
 * 
 * **Key Responsibilities:**
 * - Provides consistent header, main content area, and footer for auth pages
 * - Automatically redirects authenticated users to the main application
 * - Shows loading state during authentication checks
 * - Prevents authenticated users from accessing auth pages
 * 
 * **Authentication Flow Integration:**
 * - Uses AuthContext to monitor authentication state
 * - Redirects to /polls when user is authenticated
 * - Allows access to auth pages only for unauthenticated users
 * - Handles loading states during initial authentication checks
 * 
 * **Security Considerations:**
 * - Prevents authenticated users from accessing login/register pages
 * - Uses client-side routing for immediate feedback
 * - Integrates with server-side middleware for complete protection
 * 
 * **User Experience:**
 * - Consistent branding across authentication pages
 * - Loading indicators during authentication state checks
 * - Clean, centered layout for auth forms
 * - Responsive design for various screen sizes
 * 
 * **Integration Points:**
 * - Wraps /login and /register pages
 * - Uses AuthContext for authentication state
 * - Coordinates with Next.js router for navigation
 * - Works with middleware for server-side protection
 * 
 * **Layout Structure:**
 * - Header: Application branding
 * - Main: Centered content area for auth forms
 * - Footer: Copyright information
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  // Get authentication state from AuthContext
  const { user, loading } = useAuth();
  const router = useRouter();

  /**
   * Redirect authenticated users away from auth pages.
   * 
   * This effect monitors authentication state and automatically redirects
   * authenticated users to the main application, preventing them from
   * accessing login/register pages when already logged in.
   * 
   * **Security Benefits:**
   * - Prevents authenticated users from accessing auth pages
   * - Provides immediate client-side feedback
   * - Works in conjunction with server-side middleware protection
   * 
   * **Dependencies:**
   * - user: Current authenticated user object
   * - loading: Authentication state loading indicator
   * - router: Next.js router for navigation
   */
  useEffect(() => {
    // Only redirect when authentication check is complete and user is authenticated
    if (!loading && user) {
      // Redirect to main application (polls page)
      router.push('/polls');
    }
  }, [user, loading, router]);

  // Show loading state while authentication status is being determined
  // This prevents flash of auth forms before redirect
  if (loading) {
    return <div>Loading...</div>; // Loading indicator during auth state check
  }

  // Fallback: if user is authenticated but useEffect hasn't triggered redirect yet
  // This should be rare due to useEffect, but provides additional safety
  if (user) {
    return null; // Authenticated user should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="py-4 px-6 border-b bg-white">
        <div className="container mx-auto flex justify-center">
          <h1 className="text-2xl font-bold text-slate-800">ALX Polly</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-4 px-6 border-t bg-white">
        <div className="container mx-auto text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ALX Polly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}