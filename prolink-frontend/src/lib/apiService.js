import axios from 'axios';
import { API_BASE_URL } from './backendConfig';
import { toast } from 'sonner';

// Use the same axios instance pattern as api.ts (cookie-based auth)
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Token is sent automatically via httpOnly cookie (withCredentials)
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
axiosInstance.interceptors.response.use(
  (response) => response.data, // Return only the data
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Clear cookie and redirect to login
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; Max-Age=0; path=/';
        window.location.href = '/login';
      }
      toast.error('Session expired. Please log in again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status >= 400) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API service object with all endpoints
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    signup: (data) => axiosInstance.post('/auth/register', data),
    logout: () => axiosInstance.post('/auth/logout'),
    verify: (token) => axiosInstance.get('/auth/verify', { params: { token } }),
    resendVerification: () => axiosInstance.post('/auth/resend-verification'),
    forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => axiosInstance.post('/auth/reset-password', { token, password }),
  },

  // Profile endpoints
  profiles: {
    get: (userId) => axiosInstance.get(`/profiles/${userId}`),
    update: (userId, data) => axiosInstance.patch(`/profiles/${userId}`, data),
    getOwnProfile: () => axiosInstance.get('/profiles/me'),
    updatePicture: (url) => axiosInstance.put('/profiles/me/picture', { profile_picture_url: url }),
    getBankAccount: () => axiosInstance.get('/profiles/me/bank'),
    saveBankAccount: (data) => axiosInstance.post('/profiles/me/bank', data),
    getEarnings: () => axiosInstance.get('/profiles/me/earnings'),
    getEarningsChart: () => axiosInstance.get('/profiles/me/earnings-chart'),
    getReviews: (userId, params) => axiosInstance.get(`/profiles/${userId}/reviews`, { params }),
  },

  // Jobs endpoints
  jobs: {
    list: (params) => axiosInstance.get('/jobs', { params }),
    get: (jobId) => axiosInstance.get(`/jobs/${jobId}`),
    create: (data) => axiosInstance.post('/jobs', data),
    update: (jobId, data) => axiosInstance.patch(`/jobs/${jobId}`, data),
    delete: (jobId) => axiosInstance.delete(`/jobs/${jobId}`),
    getMyJobs: (params) => axiosInstance.get('/jobs/my-jobs', { params }),
    submitBid: (jobId, data) => axiosInstance.post(`/jobs/${jobId}/bids`, data),
    withdrawBid: (jobId) => axiosInstance.delete(`/jobs/${jobId}/bids`),
    hireProvider: (jobId, data) => axiosInstance.post(`/jobs/${jobId}/hire`, data),
    completeJob: (jobId) => axiosInstance.patch(`/jobs/${jobId}/complete`),
    cancelJob: (jobId) => axiosInstance.patch(`/jobs/${jobId}/cancel`),
    closeJob: (jobId) => axiosInstance.patch(`/jobs/${jobId}/close`),
  },

  // Chats endpoints
  chats: {
    initiateChat: (data) => axiosInstance.post('/chats/initiate', data),
    getThreadMessages: (threadId, params) =>
      axiosInstance.get(`/chats/${threadId}/messages`, { params }),
    sendMessage: (threadId, data) =>
      axiosInstance.post(`/chats/${threadId}/messages`, data),
    getThreadDetails: (threadId) => axiosInstance.get(`/chats/${threadId}/details`),
    getUserThreads: () => axiosInstance.get('/chats'),
  },

  // Bids endpoints
  bids: {
    list: (jobId) => axiosInstance.get(`/jobs/${jobId}/bids`),
    submit: (data) => axiosInstance.post('/bids', data),
  },

  // Milestones endpoints
  milestones: {
    create: (data) => axiosInstance.post('/milestones', data),
    getByJob: (jobId) => axiosInstance.get(`/milestones/job/${jobId}`),
    submit: (milestoneId) => axiosInstance.patch(`/milestones/${milestoneId}/submit`),
    approve: (milestoneId) => axiosInstance.patch(`/milestones/${milestoneId}/approve`),
    requestRevision: (milestoneId, data) => axiosInstance.patch(`/milestones/${milestoneId}/request-revision`, data),
    delete: (milestoneId) => axiosInstance.delete(`/milestones/${milestoneId}`),
  },

  // Notifications endpoints
  notifications: {
    list: (params) => axiosInstance.get('/notifications', { params }),
    markRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
    markAllRead: () => axiosInstance.patch('/notifications/read-all'),
  },

  // Saved jobs endpoints
  savedJobs: {
    list: (params) => axiosInstance.get('/saved_jobs', { params }),
    add: (jobId) => axiosInstance.post('/saved_jobs', { jobId }),
    remove: (jobId) => axiosInstance.delete(`/saved_jobs/${jobId}`),
  },

  // Portfolio endpoints
  portfolio: {
    list: (params) => axiosInstance.get('/portfolio', { params }),
    get: (id) => axiosInstance.get(`/portfolio/${id}`),
    create: (data) => axiosInstance.post('/portfolio', data),
    update: (id, data) => axiosInstance.patch(`/portfolio/${id}`, data),
    delete: (id) => axiosInstance.delete(`/portfolio/${id}`),
  },

  // Disputes endpoints
  disputes: {
    list: (params) => axiosInstance.get('/disputes', { params }),
    get: (id) => axiosInstance.get(`/disputes/${id}`),
    create: (data) => axiosInstance.post('/disputes', data),
    addEvidence: (id, data) => axiosInstance.post(`/disputes/${id}/evidence`, data),
  },

  // Search endpoints
  search: {
    jobs: (params) => axiosInstance.get('/search/jobs', { params }),
    profiles: (params) => axiosInstance.get('/search/profiles', { params }),
  },

  // Taxonomy endpoints
  taxonomy: {
    categories: () => axiosInstance.get('/taxonomy/categories'),
    skills: (params) => axiosInstance.get('/taxonomy/skills', { params }),
  },

  // Recommendations endpoints
  recommendations: {
    jobs: () => axiosInstance.get('/recommendations/jobs'),
    profiles: () => axiosInstance.get('/recommendations/profiles'),
  },

  // Upload endpoints
  upload: {
    single: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    multiple: (files) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return axiosInstance.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Verification endpoints
  verification: {
    submit: (data) => axiosInstance.post('/verification', data),
    getStatus: () => axiosInstance.get('/verification/status'),
  },

  // Payments endpoints
  payments: {
    initializeCheckout: (data) => axiosInstance.post('/payments/initialize-checkout', data),
    getPaymentStatus: (reference) => axiosInstance.get(`/payments/status/${reference}`),
    getTransactionHistory: (params) => axiosInstance.get('/payments/history', { params }),
  },

  // Admin endpoints
  admin: {
    getUsers: (params) => axiosInstance.get('/admin/users', { params }),
    getJobs: (params) => axiosInstance.get('/admin/jobs', { params }),
    getDisputes: (params) => axiosInstance.get('/admin/disputes', { params }),
    getVerifications: (params) => axiosInstance.get('/admin/verifications', { params }),
    updateUser: (id, data) => axiosInstance.patch(`/admin/users/${id}`, data),
    updateJob: (id, data) => axiosInstance.patch(`/admin/jobs/${id}`, data),
    resolveDispute: (id, data) => axiosInstance.patch(`/admin/disputes/${id}/resolve`, data),
    verifyUser: (id, data) => axiosInstance.patch(`/admin/verifications/${id}`, data),
  },
};

export default axiosInstance;