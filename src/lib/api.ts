import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Interceptor INICIADO para:', config.url);
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('🔍 Token encontrado:', token ? 'SIM' : 'NÃO');
      console.log('🔍 Token value:', token?.substring(0, 30) + '...');
      
      if (token) {
        // Garantir que headers existe
        if (!config.headers) {
          config.headers = {} as any;
        }
        
        // Adicionar token
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token ADICIONADO ao header Authorization');
        console.log('✅ Headers finais:', JSON.stringify(config.headers, null, 2));
      } else {
        console.warn('⚠️ Token NÃO encontrado no localStorage');
      }
    } else {
      console.warn('⚠️ window não definido (SSR)');
    }
    
    console.log('🏁 Interceptor FINALIZADO, retornando config');
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
