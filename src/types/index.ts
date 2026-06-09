// API Response Types (matching backend)
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface TierItem {
  id: string;
  name: string;
  imageUrl: string | null;
  image?: string; // legacy support for local state
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string; // ISO string from API
}

// Alias for backward compatibility
export type ActivityLog = Activity;

export interface TierList {
  id: string;
  name: string;
  userId: string;
  userName: string;
  themeImage: string | null;
  isPublic: boolean;
  favorite: boolean;
  createdAt: string; // ISO string from API
  updatedAt: string; // ISO string from API
  categories: Category[];
  items: TierItem[];
  activities: Activity[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTierListData {
  name: string;
  themeImage?: string | null;
  categories: { name: string; color: string }[];
}

export interface UpdateTierListData {
  name?: string;
  themeImage?: string | null;
  favorite?: boolean;
  isPublic?: boolean;
}

// For Vite env
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}