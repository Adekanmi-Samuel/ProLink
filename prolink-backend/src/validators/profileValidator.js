const { z } = require('zod');

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  phone_number: z.string().min(10).max(20).optional(),
  profile_picture_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  title: z.string().max(100).optional(),
  hourlyRate: z.union([z.string(), z.number()]).nullable().optional(),
  ratePeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'fixed']).nullable().optional(),
  availability: z.string().max(50).nullable().optional(),
  skills: z.array(z.number().int().positive()).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional().or(z.literal('')),
  rate_period: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'fixed']).nullable().optional(),
});

const updatePictureSchema = z.object({
  profile_picture_url: z.string().url('Must be a valid URL'),
});

const saveBankAccountSchema = z.object({
  bank_name: z.string().min(2),
  bank_code: z.string().min(2),
  account_number: z.string().min(9).max(20),
  account_name: z.string().min(2),
});

module.exports = {
  updateProfileSchema,
  updatePictureSchema,
  saveBankAccountSchema,
};
