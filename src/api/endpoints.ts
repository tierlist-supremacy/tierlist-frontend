import { api } from './client';
import { TierList, Category, TierItem, ActivityLog, User } from '../types';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTierListInput {
  name: string;
  themeImage?: string;
  categories: { name: string; color: string }[];
}

export interface UpdateTierListInput {
  name?: string;
  themeImage?: string | null;
  favorite?: boolean;
  isPublic?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  order?: number;
}

export interface CreateItemInput {
  name: string;
  categoryId: string;
  imageUrl?: string;
}

export interface UpdateItemInput {
  name?: string;
  imageUrl?: string | null;
  categoryId?: string;
}

export interface ReorderCategoriesInput {
  categoryIds: string[];
}

export interface ReorderItemsInput {
  itemId: string;
  sourceCategoryId: string;
  destinationCategoryId: string;
  destinationIndex: number;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  favorite?: boolean;
  author?: 'all' | 'me';
  sortBy?: 'updated' | 'created' | 'alphabetical' | 'items';
}

export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/register', { email, name, password }),

  login: (email: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', { email, password }),

  refresh: () =>
    api.post<{ accessToken: string }>('/auth/refresh', {}, { withCredentials: true }),

  logout: () =>
    api.post('/auth/logout', {}, { withCredentials: true }),

  me: () =>
    api.get<{ user: User }>('/auth/me'),

  updateMe: (data: { name?: string; avatarUrl?: string | null }) =>
    api.patch<{ user: User }>('/auth/me', data),
};

export const tierListApi = {
  list: (params?: ListQueryParams) =>
    api.get<PaginatedResponse<TierList>>('/tier-lists', { params }),

  create: (data: CreateTierListInput) =>
    api.post<TierList>('/tier-lists', data),

  get: (id: string) =>
    api.get<TierList>(`/tier-lists/${id}`),

  update: (id: string, data: UpdateTierListInput) =>
    api.patch<TierList>(`/tier-lists/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tier-lists/${id}`),

  reorderCategories: (id: string, categoryIds: string[]) =>
    api.post<TierList>(`/tier-lists/${id}/categories/reorder`, { categoryIds }),
};

export const categoryApi = {
  create: (tierListId: string, data: CreateCategoryInput) =>
    api.post<TierList>(`/tier-lists/${tierListId}/categories`, data),

  update: (categoryId: string, data: UpdateCategoryInput) =>
    api.patch<TierList>(`/categories/${categoryId}`, data),

  delete: (categoryId: string) =>
    api.delete<TierList>(`/categories/${categoryId}`),
};

export const itemApi = {
  create: (tierListId: string, data: CreateItemInput) =>
    api.post<TierList>(`/tier-lists/${tierListId}/items`, data),

  update: (itemId: string, data: UpdateItemInput) =>
    api.patch<TierList>(`/items/${itemId}`, data),

  delete: (itemId: string) =>
    api.delete<TierList>(`/items/${itemId}`),

  reorder: (tierListId: string, data: ReorderItemsInput) =>
    api.post<TierList>(`/tier-lists/${tierListId}/items/reorder`, data),
};

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; publicId: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  theme: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; publicId: string }>('/upload/theme', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const activityApi = {
  list: (tierListId: string, page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<ActivityLog>>(`/tier-lists/${tierListId}/activities`, {
      params: { page, pageSize },
    }),
};