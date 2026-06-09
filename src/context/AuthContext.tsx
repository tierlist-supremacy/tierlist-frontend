import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { authApi, tierListApi } from '../api/endpoints';
import { setAccessToken, clearAuth, getAccessToken } from '../api/client';
import { generateId } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string | null) => Promise<void>;
  migrateLocalData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      setUser(response.data.user);
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id !== response.data.user.id) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } else {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: userData, accessToken } = response.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (email: string, name: string, password: string) => {
    const response = await authApi.register(email, name, password);
    const { user: userData, accessToken } = response.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      setUser(null);
      localStorage.setItem('user', JSON.stringify({ id: generateId(), name: 'Visitante' }));
    }
  };

  const updateProfile = async (name: string, avatarUrl?: string | null) => {
    const response = await authApi.updateMe({ name, avatarUrl });
    setUser(response.data.user);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  };

  const migrateLocalData = async () => {
    if (!user) return;
    const localLists = JSON.parse(localStorage.getItem('tierlist:lists') || '[]');
    const userLists = localLists.filter((list: { userId: string; userName: string }) => list.userId === user.id || list.userName === user.name);

    for (const list of userLists) {
      try {
        await tierListApi.create({
          name: list.name,
          themeImage: list.themeImage,
          categories: list.categories.map((c: { name: string; color: string }) => ({ name: c.name, color: c.color })),
        });
      } catch (error) {
        console.error('Failed to migrate list:', list.name, error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, migrateLocalData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};