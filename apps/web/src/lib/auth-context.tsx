'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from './api';

// DEV MODE: Skip authentication during development
const DEV_MODE = true;
const DEV_USER: User = {
  id: 1,
  email: 'dev@test.com',
  is_admin: true,
  created_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? DEV_USER : null);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  const refreshUser = useCallback(async () => {
    if (DEV_MODE) {
      setUser(DEV_USER);
      return;
    }
    try {
      const user = await api.getCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (DEV_MODE) {
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
  };

  const signup = async (email: string, password: string) => {
    const response = await api.signup(email, password);
    setUser(response.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
