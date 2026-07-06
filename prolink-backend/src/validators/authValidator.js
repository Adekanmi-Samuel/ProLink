const { z } = require('zod');

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Signup validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  user_type: z.enum(['client', 'provider'], { message: 'User type must be "client" or "provider"' }),
});

// Profile update validation schema
const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  bio: z.string().optional(),
  phone_number: z.string().optional(),
  profile_picture_url: z.string().url('Invalid URL').optional().or(z.literal(null)),
});

module.exports = {
  loginSchema,
  signupSchema,
  profileUpdateSchema,
};
