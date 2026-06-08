export interface TierItem {
  id: string;
  name: string;
  image?: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: number;
}

export interface TierList {
  id: string;
  name: string;
  userName: string;
  userId: string;
  themeImage?: string;
  categories: Category[];
  items: TierItem[];
  activities: ActivityLog[];
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
}

export interface User {
  id: string;
  name: string;
}
