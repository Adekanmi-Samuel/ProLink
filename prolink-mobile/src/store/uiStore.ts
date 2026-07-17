import { create } from 'zustand';

interface UIState {
  unreadMessageCount: number;
  searchQuery: string;
  selectedCategory: string | null;
  setUnreadMessageCount: (count: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  unreadMessageCount: 0,
  searchQuery: '',
  selectedCategory: null,
  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
