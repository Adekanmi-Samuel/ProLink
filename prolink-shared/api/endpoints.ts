import { apiClient, ProLinkApiClient } from './client';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Profile,
  BankAccount,
  PortfolioItem,
  Job,
  Bid,
  ChatThread,
  Message,
  Milestone,
  Dispute,
  DisputeEvidence,
  Review,
  Service,
  ServiceOrder,
  Notification,
  Category,
  Skill,
  SavedJob,
  PaginatedResponse,
  ApiResponse,
  JobFilters,
  SearchFilters,
  UpdateProfileRequest,
  CreateJobRequest,
  UpdateJobRequest,
  SubmitBidRequest,
  CreateMilestoneRequest,
  RequestRevisionRequest,
  CreateDisputeRequest,
  AddEvidenceRequest,
  CreateReviewRequest,
  CreateServiceRequest,
  PurchaseServiceRequest,
  InitiateChatRequest,
  SendMessageRequest,
  InitializePaymentRequest,
  ResolveBankRequest,
  SaveJobRequest,
  CreatePortfolioItemRequest,
  AdminUserFilters,
  AdminJobFilters,
  AdminDisputeFilters,
  ResolveDisputeRequest,
  UpdateUserStatusRequest,
  NotificationFilters,
  Report,
} from '../types';

// ─── Helpers ───────────────────────────────────────────────────────

type Client = ProLinkApiClient;

function getClient(client?: Client): ProLinkApiClient {
  return client || apiClient;
}

// ─── Auth ──────────────────────────────────────────────────────────

export const authEndpoints = {
  login(
    data: LoginRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<AuthResponse>>('/auth/login', data);
  },

  register(
    data: RegisterRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<AuthResponse>>('/auth/register', data);
  },

  logout(client?: Client) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/auth/logout');
  },

  verify(
    token: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<null>>('/auth/verify', { params: { token } });
  },

  verifyOtp(
    data: { email: string; otp_code: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<AuthResponse>>('/auth/verify-otp', data);
  },

  resendVerification(client?: Client) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/auth/resend-verification');
  },

  forgotPassword(
    email: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/auth/forgot-password', { email });
  },

  resetPassword(
    token: string,
    password: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/auth/reset-password', { token, password });
  },
};

// ─── Profiles ──────────────────────────────────────────────────────

export const profilesEndpoints = {
  getMe(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Profile>>('/profiles/me');
  },

  updateMe(
    data: UpdateProfileRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.put<ApiResponse<Profile>>('/profiles/me', data);
  },

  patchMe(
    data: Partial<UpdateProfileRequest>,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Profile>>('/profiles/me', data);
  },

  getProfile(
    userId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Profile>>(`/profiles/${userId}`);
  },

  uploadPicture(
    url: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.put<ApiResponse<Profile>>('/profiles/me/picture', {
      profile_picture_url: url,
    });
  },

  getEarnings(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Record<string, unknown>>>('/profiles/me/earnings');
  },

  getEarningsChart(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Record<string, unknown>>>('/profiles/me/earnings-chart');
  },

  getBank(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<BankAccount>>('/profiles/me/bank');
  },

  updateBank(
    data: {
      bank_name: string;
      bank_code: string;
      account_number: string;
      account_name: string;
    },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<BankAccount>>('/profiles/me/bank', data);
  },

  getReviews(
    userId: number,
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Review>>(`/profiles/${userId}/reviews`, { params });
  },

  upgradeToPremium(client?: Client) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Profile>>('/profiles/upgrade');
  },
};

// ─── Jobs ──────────────────────────────────────────────────────────

export const jobsEndpoints = {
  list(
    params?: JobFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Job>>('/jobs', { params });
  },

  create(
    data: CreateJobRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Job>>('/jobs', data);
  },

  getById(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Job>>(`/jobs/${id}`);
  },

  update(
    id: number,
    data: UpdateJobRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
  },

  delete(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/jobs/${id}`);
  },

  getMyJobs(
    params?: { page?: number; limit?: number; status?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Job>>('/jobs/my-jobs', { params });
  },

  getMyBids(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Bid>>('/jobs/my-bids', { params });
  },

  hireProvider(
    jobId: number,
    data: { provider_id: number; agreed_amount?: number; deadline?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Job>>(`/jobs/${jobId}/hire`, data);
  },

  complete(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Job>>(`/jobs/${jobId}/complete`);
  },

  cancel(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Job>>(`/jobs/${jobId}/cancel`);
  },

  close(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Job>>(`/jobs/${jobId}/close`);
  },
};

// ─── Bids ──────────────────────────────────────────────────────────

export const bidsEndpoints = {
  list(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Bid[]>>(`/jobs/${jobId}/bids`);
  },

  submit(
    jobId: number,
    data: Omit<SubmitBidRequest, 'job_id'>,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Bid>>(`/jobs/${jobId}/bids`, data);
  },

  withdraw(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/jobs/${jobId}/bids`);
  },
};

// ─── Chats ─────────────────────────────────────────────────────────

export const chatsEndpoints = {
  initiate(
    data: InitiateChatRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<ChatThread>>('/chats/initiate', data);
  },

  getMessages(
    threadId: number,
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Message>>(`/chats/${threadId}/messages`, { params });
  },

  sendMessage(
    threadId: number,
    data: SendMessageRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Message>>(`/chats/${threadId}/messages`, data);
  },

  getDetails(
    threadId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<ChatThread>>(`/chats/${threadId}/details`);
  },

  getThreads(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<ChatThread[]>>('/chats');
  },
};

// ─── Payments ──────────────────────────────────────────────────────

export const paymentsEndpoints = {
  initialize(
    data: InitializePaymentRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<{ authorization_url: string; reference: string }>>(
      '/payments/initialize',
      data,
    );
  },

  verify(
    reference: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<{ status: string; reference: string }>>(
      '/payments/verify',
      { params: { reference } },
    );
  },

  resolveBank(
    params: ResolveBankRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<{ account_name: string; account_number: string }>>(
      '/payments/resolve-bank',
      { params },
    );
  },
};

// ─── Milestones ────────────────────────────────────────────────────

export const milestonesEndpoints = {
  create(
    data: CreateMilestoneRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Milestone>>('/milestones', data);
  },

  listByJob(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Milestone[]>>(`/milestones/job/${jobId}`);
  },

  submit(
    milestoneId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Milestone>>(`/milestones/${milestoneId}/submit`);
  },

  approve(
    milestoneId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Milestone>>(`/milestones/${milestoneId}/approve`);
  },

  requestRevision(
    milestoneId: number,
    data: RequestRevisionRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Milestone>>(
      `/milestones/${milestoneId}/request-revision`,
      data,
    );
  },

  delete(
    milestoneId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/milestones/${milestoneId}`);
  },
};

// ─── Disputes ──────────────────────────────────────────────────────

export const disputesEndpoints = {
  create(
    data: CreateDisputeRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Dispute>>('/disputes', data);
  },

  list(
    params?: AdminDisputeFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Dispute>>('/disputes/my-disputes', { params });
  },

  getById(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Dispute>>(`/disputes/${id}`);
  },

  submitEvidence(
    id: number,
    data: AddEvidenceRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<DisputeEvidence>>(`/disputes/${id}/evidence`, data);
  },
};

// ─── Reviews ───────────────────────────────────────────────────────

export const reviewsEndpoints = {
  create(
    data: CreateReviewRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Review>>('/reviews', data);
  },

  listByUser(
    userId: number,
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Review>>(`/reviews/user/${userId}`, { params });
  },
};

// ─── Services ──────────────────────────────────────────────────────

export const servicesEndpoints = {
  list(
    params?: { page?: number; limit?: number; category_id?: number; search?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Service>>('/services', { params });
  },

  getById(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Service>>(`/services/${id}`);
  },

  create(
    data: CreateServiceRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Service>>('/services', data);
  },

  purchase(
    data: PurchaseServiceRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<ServiceOrder>>('/services/purchase', data);
  },

  getMy(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Service>>('/services/my', { params });
  },
};

// ─── Search ────────────────────────────────────────────────────────

export const searchEndpoints = {
  jobs(
    params?: SearchFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Job>>('/search/jobs', { params });
  },

  providers(
    params?: SearchFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Profile>>('/search/providers', { params });
  },
};

// ─── Notifications ─────────────────────────────────────────────────

export const notificationsEndpoints = {
  list(
    params?: NotificationFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Notification>>('/notifications', { params });
  },

  unreadCount(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  },

  markRead(
    id: string,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
  },

  markAllRead(client?: Client) {
    const { instance } = getClient(client);
    return instance.put<ApiResponse<null>>('/notifications/read-all');
  },
};

// ─── Admin ─────────────────────────────────────────────────────────

export const adminEndpoints = {
  stats(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Record<string, unknown>>>('/admin/stats');
  },

  getUsers(
    params?: AdminUserFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<User>>('/admin/users', { params });
  },

  updateUserStatus(
    id: number,
    data: UpdateUserStatusRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<User>>(`/admin/users/${id}/status`, data);
  },

  getJobs(
    params?: AdminJobFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Job>>('/admin/jobs', { params });
  },

  deleteJob(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/admin/jobs/${id}`);
  },

  getDisputes(
    params?: AdminDisputeFilters,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Dispute>>('/admin/disputes', { params });
  },

  resolveDispute(
    id: number,
    data: ResolveDisputeRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.patch<ApiResponse<Dispute>>(`/admin/disputes/${id}/resolve`, data);
  },

  getVerifications(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<Profile>>('/admin/verifications', { params });
  },

  reviewVerification(
    data: { user_id: number; status: 'verified' | 'rejected'; notes?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Profile>>('/admin/verifications/review', data);
  },

  getRevenue(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Record<string, unknown>>>('/admin/revenue', { params });
  },
};

// ─── Taxonomy ──────────────────────────────────────────────────────

export const taxonomyEndpoints = {
  categories(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Category[]>>('/taxonomy/categories');
  },

  skills(
    params?: { category_id?: number; search?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Skill[]>>('/taxonomy/skills', { params });
  },

  createSkill(
    data: { name: string; category_id?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Skill>>('/taxonomy/skills', data);
  },
};

// ─── Portfolio ─────────────────────────────────────────────────────

export const portfolioEndpoints = {
  list(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<PortfolioItem[]>>('/portfolio/me');
  },

  create(
    data: CreatePortfolioItemRequest,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<PortfolioItem>>('/portfolio', data);
  },

  delete(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/portfolio/${id}`);
  },
};

// ─── Saved Jobs ────────────────────────────────────────────────────

export const savedJobsEndpoints = {
  list(
    params?: { page?: number; limit?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<PaginatedResponse<SavedJob>>('/saved_jobs', { params });
  },

  save(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<SavedJob>>('/saved_jobs', { jobId });
  },

  check(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<{ saved: boolean }>>(`/saved_jobs/${jobId}/status`);
  },

  remove(
    jobId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/saved_jobs/${jobId}`);
  },
};

// ─── Saved Searches ────────────────────────────────────────────────

export const savedSearchesEndpoints = {
  list(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Array<{ id: number; title: string; query?: string; filters?: unknown }>>>(
      '/saved_searches',
    );
  },

  create(
    data: { title: string; query?: string; filters?: Record<string, unknown> },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<{ id: number }>>('/saved_searches', data);
  },

  remove(
    id: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/saved_searches/${id}`);
  },
};

// ─── Recommendations ───────────────────────────────────────────────

export const recommendationsEndpoints = {
  jobs(client?: Client) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Job[]>>('/recommendations/jobs');
  },

  providers(
    jobId?: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    const url = jobId
      ? `/recommendations/providers/${jobId}`
      : '/recommendations/providers';
    return instance.get<ApiResponse<Profile[]>>(url);
  },
};

// ─── Upload ────────────────────────────────────────────────────────

export const uploadEndpoints = {
  single(
    file: File | FormData,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    const formData = file instanceof FormData ? file : (() => {
      const fd = new FormData();
      fd.append('file', file);
      return fd;
    })();
    return instance.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  multiple(
    files: File[],
    client?: Client,
  ) {
    const { instance } = getClient(client);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return instance.post<ApiResponse<{ urls: string[] }>>('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Verification ──────────────────────────────────────────────────

export const verificationEndpoints = {
  verifyOtp(
    data: { email: string; otp_code: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/verification/verify-otp', data);
  },

  verifyNin(
    data: { nin_number: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Profile>>('/verification/verify-nin', data);
  },

  verifyCac(
    data: { cac_number: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Profile>>('/verification/verify-cac', data);
  },
};

// ─── AI ────────────────────────────────────────────────────────────

export const aiEndpoints = {
  generateProposal(
    data: { job_id: number; provider_id: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<{ proposal: string }>>('/ai/proposals/generate', data);
  },

  optimizeProfile(
    data: { profile_id: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<{ suggestions: string[] }>>('/ai/profile/optimize', data);
  },

  matchJobs(
    params?: { provider_id?: number },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.get<ApiResponse<Job[]>>('/ai/jobs/match', { params });
  },

  suggestPricing(
    data: { title: string; description: string; category?: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<{ suggested_price: number }>>('/ai/services/pricing', data);
  },
};

// ─── Moderation ────────────────────────────────────────────────────

export const moderationEndpoints = {
  blockUser(
    blockedId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<null>>('/moderation/blocks', { blocked_id: blockedId });
  },

  unblockUser(
    blockedId: number,
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.delete<ApiResponse<null>>(`/moderation/blocks/${blockedId}`);
  },

  reportUser(
    data: { reported_user_id?: number; job_id?: number; message_id?: number; reason: string },
    client?: Client,
  ) {
    const { instance } = getClient(client);
    return instance.post<ApiResponse<Report>>('/moderation/reports', data);
  },
};
