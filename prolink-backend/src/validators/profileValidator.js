const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  title: z.string().max(100).optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional(),
  availability: z.string().max(50).optional(),
  skillIds: z.array(z.number().int().positive()).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  ratePeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'fixed']).optional(),
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
