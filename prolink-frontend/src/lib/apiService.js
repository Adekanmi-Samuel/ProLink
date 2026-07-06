import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from './backendConfig';

// Create axios instance
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
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);

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

// API service object
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    signup: (data) => axiosInstance.post('/auth/register', data),
    logout: () => axiosInstance.post('/auth/logout'),
  },

  // Profile endpoints
  profiles: {
    get: (userId) => axiosInstance.get(`/profiles/${userId}`),
    update: (userId, data) => axiosInstance.patch(`/profiles/${userId}`, data),
    getOwnProfile: () => axiosInstance.get('/profiles/me'),
  },

  // Jobs endpoints
  jobs: {
    list: (params) => axiosInstance.get('/jobs', { params }),
    get: (jobId) => axiosInstance.get(`/jobs/${jobId}`),
    create: (data) => axiosInstance.post('/jobs', data),
    update: (jobId, data) => axiosInstance.patch(`/jobs/${jobId}`, data),
    delete: (jobId) => axiosInstance.delete(`/jobs/${jobId}`),
    getMyJobs: (params) => axiosInstance.get('/jobs/my-jobs', { params }),
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
};

export default axiosInstance;
