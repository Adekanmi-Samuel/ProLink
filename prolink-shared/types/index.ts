// ─── Prisma Model Types ────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  previous_passwords?: unknown;
  user_type: 'client' | 'provider' | 'admin';
  created_at: string;
  status: 'active' | 'suspended' | 'deleted';
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires?: string | null;
  stripe_account_id?: string | null;
  stripe_customer_id?: string | null;
  email_verified: boolean;
  otp_code?: string | null;
  otp_expires_at?: string | null;
  phone_number?: string | null;
  phone_verified: boolean;
  member_id?: string | null;
  failed_login_attempts: number;
  locked_until?: string | null;
  token_version: number;
  is_premium: boolean;
  // Relations (optional, populated by API when needed)
  profile?: Profile;
  bids?: Bid[];
  jobs?: Job[];
  job_assignments?: JobAssignment[];
  sent_messages?: Message[];
  client_threads?: ChatThread[];
  provider_threads?: ChatThread[];
  disputes?: Dispute[];
  dispute_evidence?: DisputeEvidence[];
  reports_received?: Report[];
  reports_made?: Report[];
  reviews_received?: Review[];
  reviews_given?: Review[];
  saved_searches?: SavedSearch[];
  saved_jobs?: SavedJob[];
  notifications?: Notification[];
  services?: Service[];
  service_orders?: ServiceOrder[];
}

export interface Profile {
  id: number;
  user_id: number;
  full_name?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
  rating_avg: number;
  review_count: number;
  title?: string | null;
  hourly_rate?: number | null;
  availability?: string | null;
  is_featured: boolean;
  badges: string[];
  job_success_score?: number | null;
  response_time_hours?: number | null;
  bvn_verified: boolean;
  cac_number?: string | null;
  cac_status: 'none' | 'pending' | 'verified' | 'rejected';
  nin_number?: string | null;
  nin_status: 'none' | 'pending' | 'verified' | 'rejected';
  city?: string | null;
  state: string;
  gender?: string | null;
  rate_period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  // Relations
  user?: User;
  bank_account?: BankAccount;
  portfolio_items?: PortfolioItem[];
  skills?: ProfileSkill[];
}

export interface BankAccount {
  id: number;
  profile_id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  paystack_recipient_code?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
}

export interface PortfolioItem {
  id: number;
  profile_id: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  created_at: string;
  project_url?: string | null;
  // Relations
  profile?: Profile;
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  category_id?: number | null;
  created_at: string;
  // Relations
  category?: Category;
  jobs?: JobSkill[];
  profiles?: ProfileSkill[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  created_at: string;
  // Relations
  jobs?: Job[];
  skills?: Skill[];
  services?: Service[];
}

export interface Job {
  id: number;
  client_id: number;
  title: string;
  description: string;
  budget?: number | null;
  job_type: 'digital' | 'physical' | 'onsite';
  payment_type?: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed' | 'expired';
  posted_at: string;
  category_id?: number | null;
  city?: string | null;
  state?: string | null;
  // Relations
  client?: User;
  category?: Category;
  bids?: Bid[];
  threads?: ChatThread[];
  assignment?: JobAssignment;
  skills?: JobSkill[];
  milestones?: Milestone[];
  reviews?: Review[];
  savedBy?: SavedJob[];
}

export interface Bid {
  id: number;
  job_id: number;
  provider_id: number;
  amount: number;
  duration_days?: number | null;
  proposal: string;
  submitted_at: string;
  // Relations
  job?: Job;
  provider?: User;
}

export interface JobAssignment {
  id: number;
  job_id: number;
  provider_id: number;
  agreed_amount?: number | null;
  deadline?: string | null;
  reminder_sent: boolean;
  assigned_at: string;
  // Relations
  job?: Job;
  provider?: User;
}

export interface Milestone {
  id: number;
  job_id: number;
  title: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'revision_requested' | 'paid' | 'disputed' | 'cancelled';
  stripe_pi_id?: string | null;
  created_at: string;
  updated_at: string;
  payment_reference?: string | null;
  submitted_at?: string | null;
  revision_notes?: string | null;
  // Relations
  job?: Job;
  disputes?: Dispute[];
  platform_revenue?: PlatformRevenue;
}

export interface PlatformRevenue {
  id: number;
  milestone_id: number;
  gross_amount: number;
  fee_percent: number;
  fee_amount: number;
  collected_at: string;
  // Relations
  milestone?: Milestone;
}

export interface Dispute {
  id: number;
  milestone_id: number;
  initiator_id: number;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  response_deadline?: string | null;
  split_percentage?: number | null;
  // Relations
  initiator?: User;
  milestone?: Milestone;
  evidence?: DisputeEvidence[];
}

export interface DisputeEvidence {
  id: number;
  dispute_id: number;
  submitted_by: number;
  note?: string | null;
  file_url?: string | null;
  created_at: string;
  // Relations
  dispute?: Dispute;
  submitter?: User;
}

export interface ChatThread {
  id: number;
  job_id: number;
  client_id: number;
  provider_id: number;
  created_at: string;
  // Relations
  client?: User;
  provider?: User;
  job?: Job;
  messages?: Message[];
}

export interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  sent_at: string;
  read_at?: string | null;
  // Relations
  sender?: User;
  thread?: ChatThread;
}

export interface Review {
  id: number;
  job_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  // Relations
  job?: Job;
  reviewer?: User;
  reviewee?: User;
}

export interface Report {
  id: number;
  reporter_id: number;
  reported_user_id?: number | null;
  job_id?: number | null;
  message_id?: number | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  // Relations
  reporter?: User;
  reported_user?: User;
}

export interface Block {
  id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: string;
  // Relations
  blocker?: User;
  blocked?: User;
}

export interface SavedJob {
  id: number;
  user_id: number;
  job_id: number;
  created_at: string;
  // Relations
  user?: User;
  job?: Job;
}

export interface SavedSearch {
  id: number;
  user_id: number;
  title: string;
  query?: string | null;
  filters?: Record<string, unknown> | null;
  created_at: string;
  // Relations
  user?: User;
}

export interface ProfileSkill {
  profile_id: number;
  skill_id: number;
  // Relations
  profile?: Profile;
  skill?: Skill;
}

export interface JobSkill {
  job_id: number;
  skill_id: number;
  // Relations
  job?: Job;
  skill?: Skill;
}

export interface Notification {
  id: string;
  user_id: number;
  type: string;
  content: string;
  is_read: boolean;
  link_url?: string | null;
  created_at: string;
  // Relations
  user?: User;
}

export interface Service {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  category_id?: number | null;
  images?: unknown;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
  // Relations
  provider?: User;
  category?: Category;
  orders?: ServiceOrder[];
}

export interface ServiceOrder {
  id: number;
  service_id: number;
  client_id: number;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  stripe_pi_id?: string | null;
  payment_reference?: string | null;
  requirements?: string | null;
  delivery_date?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  service?: Service;
  client?: User;
}

// ─── API Response Types ────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message?: string;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
  error?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// ─── Auth Types ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  user_type: 'client' | 'provider';
  full_name?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

// ─── Query / Filter Types ──────────────────────────────────────────

export interface JobFilters {
  page?: number;
  limit?: number;
  status?: string;
  job_type?: string;
  category_id?: number;
  state?: string;
  city?: string;
  min_budget?: number;
  max_budget?: number;
  search?: string;
  sort?: string;
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  state?: string;
  min_rate?: number;
  max_rate?: number;
  skills?: string[];
  sort?: string;
}

// ─── Profile Update Types ──────────────────────────────────────────

export interface UpdateProfileRequest {
  full_name?: string;
  bio?: string;
  title?: string;
  hourly_rate?: number;
  availability?: string;
  city?: string;
  state?: string;
  gender?: string;
  rate_period?: string;
  skills?: number[];
}

// ─── Job Create/Update Types ───────────────────────────────────────

export interface CreateJobRequest {
  title: string;
  description: string;
  budget?: number;
  job_type?: string;
  payment_type?: string;
  category_id?: number;
  city?: string;
  state?: string;
  skill_ids?: number[];
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  budget?: number;
  job_type?: string;
  category_id?: number;
  city?: string;
  state?: string;
}

// ─── Bid Types ─────────────────────────────────────────────────────

export interface SubmitBidRequest {
  job_id: number;
  amount: number;
  duration_days?: number;
  proposal: string;
}

// ─── Milestone Types ───────────────────────────────────────────────

export interface CreateMilestoneRequest {
  job_id: number;
  title: string;
  amount: number;
}

export interface RequestRevisionRequest {
  revision_notes: string;
}

// ─── Dispute Types ─────────────────────────────────────────────────

export interface CreateDisputeRequest {
  milestone_id: number;
  reason: string;
}

export interface AddEvidenceRequest {
  note?: string;
  file_url?: string;
}

// ─── Review Types ──────────────────────────────────────────────────

export interface CreateReviewRequest {
  job_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string;
}

// ─── Service Types ─────────────────────────────────────────────────

export interface CreateServiceRequest {
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  category_id?: number;
  images?: unknown;
}

export interface PurchaseServiceRequest {
  service_id: number;
  requirements?: string;
}

// ─── Chat Types ────────────────────────────────────────────────────

export interface InitiateChatRequest {
  job_id: number;
  provider_id: number;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

// ─── Payment Types ─────────────────────────────────────────────────

export interface InitializePaymentRequest {
  milestone_id?: number;
  service_order_id?: number;
  amount: number;
  email: string;
  callback_url?: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface ResolveBankRequest {
  account_number: string;
  bank_code: string;
}

// ─── Saved Job Types ──────────────────────────────────────────────

export interface SaveJobRequest {
  jobId: number;
}

// ─── Portfolio Types ───────────────────────────────────────────────

export interface CreatePortfolioItemRequest {
  title: string;
  description?: string;
  image_url?: string;
  project_url?: string;
}

// ─── Admin Types ───────────────────────────────────────────────────

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  user_type?: string;
  status?: string;
  search?: string;
}

export interface AdminJobFilters {
  page?: number;
  limit?: number;
  status?: string;
  job_type?: string;
  search?: string;
}

export interface AdminDisputeFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ResolveDisputeRequest {
  resolution: string;
  split_percentage?: number;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'suspended' | 'deleted';
}

// ─── Notification Types ────────────────────────────────────────────

export interface NotificationFilters {
  page?: number;
  limit?: number;
  is_read?: boolean;
}
