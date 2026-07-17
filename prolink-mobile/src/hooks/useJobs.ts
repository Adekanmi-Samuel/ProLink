import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface JobFilters {
  search?: string;
  category_id?: number;
  min_budget?: number;
  max_budget?: number;
  job_type?: 'digital' | 'in_person';
  payment_type?: 'fixed' | 'milestone';
  status?: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  budget: number;
  category_id?: number;
  job_type: 'digital' | 'in_person';
  payment_type: 'fixed' | 'milestone';
  skills?: number[];
}

// Infinite jobs list
export function useJobsList(filters?: JobFilters) {
  return useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { ...filters, page: pageParam, limit: 10 };
      const res = await api.get('/jobs', { params });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

// Single job detail
export function useJobDetail(jobId: number | string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data;
    },
    enabled: Boolean(jobId),
  });
}

// Create job mutation
export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const res = await api.post('/jobs', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Submit bid mutation
export function useSubmitBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      data,
    }: {
      jobId: number;
      data: { amount: number; duration_days?: number; proposal: string };
    }) => {
      const res = await api.post(`/jobs/${jobId}/bids`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['job', variables.jobId] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// My jobs
export function useMyJobs(params?: { status?: string }) {
  return useQuery({
    queryKey: ['my-jobs', params],
    queryFn: async () => {
      const res = await api.get('/jobs/my-jobs', { params });
      return res.data;
    },
  });
}

// My bids
export function useMyBids() {
  return useQuery({
    queryKey: ['my-bids'],
    queryFn: async () => {
      const res = await api.get('/jobs/my-bids');
      return res.data;
    },
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/taxonomy/categories');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Skills
export function useSkills(categoryId?: number) {
  return useQuery({
    queryKey: ['skills', categoryId],
    queryFn: async () => {
      const params = categoryId ? { category_id: categoryId } : {};
      const res = await api.get('/taxonomy/skills', { params });
      return res.data;
    },
  });
}
