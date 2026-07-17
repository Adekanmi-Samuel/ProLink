// ─── API Route Prefixes ────────────────────────────────────────────
// These match the backend route mounting in server.js

export const API_PREFIX = '/api';

export const API_PATHS = {
  AUTH: `${API_PREFIX}/auth`,
  PROFILES: `${API_PREFIX}/profiles`,
  JOBS: `${API_PREFIX}/jobs`,
  CHATS: `${API_PREFIX}/chats`,
  MODERATION: `${API_PREFIX}/moderation`,
  REVIEWS: `${API_PREFIX}/reviews`,
  ADMIN: `${API_PREFIX}/admin`,
  MILESTONES: `${API_PREFIX}/milestones`,
  PAYMENTS: `${API_PREFIX}/payments`,
  DISPUTES: `${API_PREFIX}/disputes`,
  TAXONOMY: `${API_PREFIX}/taxonomy`,
  SEARCH: `${API_PREFIX}/search`,
  RECOMMENDATIONS: `${API_PREFIX}/recommendations`,
  SAVED_SEARCHES: `${API_PREFIX}/saved_searches`,
  SAVED_JOBS: `${API_PREFIX}/saved_jobs`,
  PORTFOLIO: `${API_PREFIX}/portfolio`,
  VERIFICATION: `${API_PREFIX}/verification`,
  UPLOAD: `${API_PREFIX}/upload`,
  NOTIFICATIONS: `${API_PREFIX}/notifications`,
  STATS: `${API_PREFIX}/stats`,
  ANALYTICS: `${API_PREFIX}/analytics`,
  SERVICES: `${API_PREFIX}/services`,
  AI: `${API_PREFIX}/ai`,
} as const;

// ─── User Roles ────────────────────────────────────────────────────

export const USER_ROLES = {
  CLIENT: 'client',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ─── Job Statuses ──────────────────────────────────────────────────

export const JOB_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
  EXPIRED: 'expired',
} as const;

export type JobStatus = typeof JOB_STATUSES[keyof typeof JOB_STATUSES];

// ─── Job Types ─────────────────────────────────────────────────────

export const JOB_TYPES = {
  DIGITAL: 'digital',
  PHYSICAL: 'physical',
  ONSITE: 'onsite',
} as const;

export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES];

// ─── Milestone Statuses ────────────────────────────────────────────

export const MILESTONE_STATUSES = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REVISION_REQUESTED: 'revision_requested',
  PAID: 'paid',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const;

export type MilestoneStatus = typeof MILESTONE_STATUSES[keyof typeof MILESTONE_STATUSES];

// ─── Dispute Statuses ──────────────────────────────────────────────

export const DISPUTE_STATUSES = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type DisputeStatus = typeof DISPUTE_STATUSES[keyof typeof DISPUTE_STATUSES];

// ─── Service Statuses ──────────────────────────────────────────────

export const SERVICE_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const;

export type ServiceStatus = typeof SERVICE_STATUSES[keyof typeof SERVICE_STATUSES];

// ─── Service Order Statuses ────────────────────────────────────────

export const SERVICE_ORDER_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type ServiceOrderStatus = typeof SERVICE_ORDER_STATUSES[keyof typeof SERVICE_ORDER_STATUSES];

// ─── User Statuses ─────────────────────────────────────────────────

export const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];

// ─── Report Statuses ───────────────────────────────────────────────

export const REPORT_STATUSES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type ReportStatus = typeof REPORT_STATUSES[keyof typeof REPORT_STATUSES];

// ─── Verification Statuses ─────────────────────────────────────────

export const VERIFICATION_STATUSES = {
  NONE: 'none',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUSES[keyof typeof VERIFICATION_STATUSES];

// ─── Message Types ─────────────────────────────────────────────────

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// ─── Rate Periods ──────────────────────────────────────────────────

export const RATE_PERIODS = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type RatePeriod = typeof RATE_PERIODS[keyof typeof RATE_PERIODS];

// ─── Platform Configuration ────────────────────────────────────────

export const PLATFORM_CONFIG = {
  FEE_PERCENTAGE: 10,
  MIN_BID_AMOUNT: 1000,
  MAX_BID_AMOUNT: 50_000_000,
  DISPUTE_RESPONSE_DEADLINE_DAYS: 3,
  MILESTONE_AUTO_RELEASE_DAYS: 14,
  MAX_PORTFOLIO_ITEMS: 20,
  MAX_PROFILE_PICTURE_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// ─── Pagination Defaults ───────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─── Sort Options ──────────────────────────────────────────────────

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  BUDGET_HIGH: 'budget_high',
  BUDGET_LOW: 'budget_low',
  RATING_HIGH: 'rating_high',
  RATE_LOW: 'rate_low',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];
