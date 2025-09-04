import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

// Poll validation schemas
export const pollOptionSchema = z
  .string()
  .min(1, 'Option cannot be empty')
  .max(200, 'Option must be less than 200 characters')
  .trim()
  .refine(
    (val) => val.length > 0,
    'Option cannot be only whitespace'
  );

export const createPollSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .min(5, 'Question must be at least 5 characters')
    .max(500, 'Question must be less than 500 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      'Question cannot be only whitespace'
    ),
  options: z
    .array(pollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(
      (options) => {
        const uniqueOptions = new Set(options.map(opt => opt.toLowerCase().trim()));
        return uniqueOptions.size === options.length;
      },
      'All options must be unique'
    ),
  allowMultipleVotes: z.boolean().optional().default(false),
  requireAuthentication: z.boolean().optional().default(true),
});

export const updatePollSchema = z.object({
  pollId: z
    .string()
    .uuid('Invalid poll ID format'),
  question: z
    .string()
    .min(1, 'Question is required')
    .min(5, 'Question must be at least 5 characters')
    .max(500, 'Question must be less than 500 characters')
    .trim(),
  options: z
    .array(pollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(
      (options) => {
        const uniqueOptions = new Set(options.map(opt => opt.toLowerCase().trim()));
        return uniqueOptions.size === options.length;
      },
      'All options must be unique'
    ),
});

// Vote validation schema
export const submitVoteSchema = z.object({
  pollId: z
    .string()
    .uuid('Invalid poll ID format'),
  optionIndex: z
    .number()
    .int('Option index must be an integer')
    .min(0, 'Option index must be non-negative')
    .max(9, 'Option index cannot exceed 9'),
});

// ID validation schemas
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

export const pollIdSchema = z.object({
  id: uuidSchema,
});

// Form data validation helpers
export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  try {
    const rawData: Record<string, any> = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('[]')) {
        // Handle array fields
        const arrayKey = key.slice(0, -2);
        if (!rawData[arrayKey]) {
          rawData[arrayKey] = [];
        }
        rawData[arrayKey].push(value);
      } else if (key === 'allowMultipleVotes' || key === 'requireAuthentication') {
        // Handle boolean fields
        rawData[key] = value === 'true' || value === 'on';
      } else {
        rawData[key] = value;
      }
    }

    const result = schema.safeParse(rawData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string[]> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      });
      return { success: false, errors };
    }
  } catch (error) {
    return {
      success: false,
      errors: { general: ['Invalid form data'] }
    };
  }
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[match];
    })
    .trim();
}

export function sanitizeArray(arr: string[]): string[] {
  return arr
    .map(item => sanitizeHtml(item))
    .filter(item => item.length > 0);
}

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreatePollData = z.infer<typeof createPollSchema>;
export type UpdatePollData = z.infer<typeof updatePollSchema>;
export type SubmitVoteData = z.infer<typeof submitVoteSchema>;