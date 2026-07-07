const { z } = require('zod');

// Job creation/update validation schema
const jobSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budget: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    if (typeof val === 'number') return val;
    return undefined;
  }, z.number().min(5000, 'Budget must be at least ₦5,000')),
  job_type: z.enum(['digital', 'in-person']).default('digital'),
  payment_type: z.enum(['fixed', 'milestone']).optional(),
  category_id: z.number().int().positive().optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  skillIds: z.array(z.number().int().positive()).optional(),
});

// Bid validation schema
// job_id comes from URL params, provider_id comes from auth middleware
const bidSchema = z.object({
  amount: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val);
    if (typeof val === 'number') return val;
    return undefined;
  }, z.number().min(5000, 'Bid amount must be at least ₦5,000')).transform(val => String(val)),
  proposal: z.string().min(20, 'Proposal must be at least 20 characters').max(5000),
});

// Job assignment validation schema
const jobAssignmentSchema = z.object({
  job_id: z.number().int().positive(),
  provider_id: z.number().int().positive(),
  agreed_amount: z.string().or(z.number()).optional(),
});

module.exports = {
  jobSchema,
  bidSchema,
  jobAssignmentSchema,
};
