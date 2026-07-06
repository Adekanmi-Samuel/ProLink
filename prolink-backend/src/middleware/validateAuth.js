const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  user_type: z.enum(['client', 'provider']),
  full_name: z.string().min(2).max(100),
  phone_number: z.string().min(10).max(20).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100)
});

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid input', details: err.errors });
  }
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema)
};
