export interface User {
  id: number;
  email: string;
  user_type: string;
  profile?: Profile;
}

export interface Profile {
  id: number;
  user_id: number;
  full_name?: string;
  bio?: string;
  profile_picture_url?: string;
  portfolio?: PortfolioItem[];
}

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  file_url_or_link?: string;
}

export interface Job {
  id: number;
  client_id: number;
  title: string;
  description: string;
  budget?: string;
  job_type: string;
  status: string;
  posted_at: string;
  client_name?: string;
  bids?: Bid[];
}

export interface Bid {
  id: number;
  provider_id: number;
  amount: string;
  proposal: string;
  full_name?: string;
}

export interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  message_type?: string;
  sent_at: string;
}

export interface ChatThread {
  thread_id: number;
  job_title: string;
  other_user_name: string;
}
