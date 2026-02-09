import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        router.push('/login');
        return;
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Verificar se o token ainda é válido
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    user,
    loading,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
}
