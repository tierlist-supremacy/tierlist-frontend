import { TierList, User } from '../types';

const STORAGE_KEY_TIERLISTS = 'tierlist:lists';
const STORAGE_KEY_USER = 'tierlist:user';

export const storage = {
  // User management
  getUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEY_USER);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  },

  // Tier list management
  getAllTierLists: (): TierList[] => {
    const lists = localStorage.getItem(STORAGE_KEY_TIERLISTS);
    return lists ? JSON.parse(lists) : [];
  },

  getTierList: (id: string): TierList | null => {
    const lists = storage.getAllTierLists();
    return lists.find(list => list.id === id) || null;
  },

  saveTierList: (tierList: TierList): void => {
    const lists = storage.getAllTierLists();
    const index = lists.findIndex(list => list.id === tierList.id);

    if (index >= 0) {
      lists[index] = tierList;
    } else {
      lists.push(tierList);
    }

    localStorage.setItem(STORAGE_KEY_TIERLISTS, JSON.stringify(lists));
  },

  deleteTierList: (id: string): void => {
    const lists = storage.getAllTierLists();
    const filtered = lists.filter(list => list.id !== id);
    localStorage.setItem(STORAGE_KEY_TIERLISTS, JSON.stringify(filtered));
  },
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR');
};
