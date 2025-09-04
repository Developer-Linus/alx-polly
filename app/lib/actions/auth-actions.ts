'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { loginSchema, registerSchema, sanitizeHtml } from '@/app/lib/validations/schemas';

export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Validate input data
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message;
    return { error: firstError || 'Invalid login data' };
  }

  const { email, password } = validation.data;

  // Sanitize email (password doesn't need sanitization for auth)
  const sanitizedEmail = sanitizeHtml(email.toLowerCase().trim());

  const { error } = await supabase.auth.signInWithPassword({
    email: sanitizedEmail,
    password: password,
  });

  if (error) {
    // Don't expose detailed auth errors for security
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password' };
    }
    return { error: 'Login failed. Please try again.' };
  }

  // Success: no error
  return { error: null };
}

export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Validate input data
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message;
    return { error: firstError || 'Invalid registration data' };
  }

  const { email, password, name } = validation.data;

  // Sanitize inputs
  const sanitizedEmail = sanitizeHtml(email.toLowerCase().trim());
  const sanitizedName = sanitizeHtml(name.trim());

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('email')
    .eq('email', sanitizedEmail)
    .single();

  if (existingUser) {
    return { error: 'An account with this email already exists' };
  }

  const { error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password: password,
    options: {
      data: {
        name: sanitizedName,
      },
    },
  });

  if (error) {
    // Don't expose detailed auth errors for security
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists' };
    }
    if (error.message.includes('Password')) {
      return { error: 'Password does not meet security requirements' };
    }
    return { error: 'Registration failed. Please try again.' };
  }

  // Success: no error
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Admin role management
export async function isUserAdmin(userId?: string) {
  const supabase = await createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  // Check if user has admin role in user_metadata or a separate admins table
  const { data: user } = await supabase.auth.getUser();
  
  // For now, we'll use user metadata to store admin status
  // In production, you might want a separate admins table
  return user.user?.user_metadata?.is_admin === true;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  return user;
}
