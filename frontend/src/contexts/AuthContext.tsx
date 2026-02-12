'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  subscription?: {
    planId?: any;
    status: 'trial' | 'active' | 'inactive' | 'cancelled';
    startDate?: string;
    endDate?: string;
    serversCount?: number;
    trialServersUsed?: number;
    assasCustomerId?: string;
    assasSubscriptionId?: string;
    isTrialActive?: boolean;
    isSubscriptionActive?: boolean;
    daysRemaining?: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

let authCheckInProgress = false;
let cachedUser: User | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const checkAuthRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || checkAuthRef.current) return;
    checkAuthRef.current = true;

    checkAuth();
  }, [mounted]);

  const checkAuth = async () => {
    try {
      // Garantir que estamos no cliente
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }

      // Usar cache se disponível e ainda válido
      const now = Date.now();
      if (cachedUser && now - cacheTimestamp < CACHE_DURATION) {
        setUser(cachedUser);
        setLoading(false);
        return;
      }

      // Se já está verificando, não fazer outra requisição
      if (authCheckInProgress) {
        setLoading(false);
        return;
      }

      authCheckInProgress = true;

      try {
        // Verificar se o token ainda é válido
        const response = await api.get('/auth/me');
        const userData = response.data.data;

        cachedUser = userData;
        cacheTimestamp = Date.now();

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } finally {
        authCheckInProgress = false;
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      authCheckInProgress = false;
      setLoading(false);
      logout();
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    setUser(null);
    cachedUser = null;
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    cachedUser = updatedUser;
    cacheTimestamp = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
