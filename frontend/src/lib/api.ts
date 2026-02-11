import axios from 'axios';

// Detectar URL da API automaticamente baseado no ambiente
const getApiUrl = () => {
  // Se estiver no servidor (SSR), usar variável de ambiente
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
  }
  
  // Se estiver no cliente, detectar baseado na URL atual
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Se for localhost, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001/api';
  }
  
  // Se for IP direto (ex: 38.242.213.195)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `${protocol}//${hostname}:8001/api`;
  }
  
  // Se for domínio sslip.io (ex: painel.38.242.213.195.sslip.io)
  if (hostname.includes('sslip.io')) {
    // Extrair IP do domínio
    const ipMatch = hostname.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      return `${protocol}//api.${ipMatch[1]}.sslip.io/api`;
    }
  }
  
  // Fallback para variável de ambiente
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
};

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

console.log('🌐 API URL configurada:', getApiUrl());

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
