import axios from 'axios';

// Configurar baseURL do axios
// Em desenvolvimento, usar proxy do Vite (baseURL vazio)
// Em produção, usar variável de ambiente ou URL completa
const baseURL = (import.meta as any).env?.VITE_API_URL || '';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para adicionar token e subdomain em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adicionar subdomain do store se estiver na URL atual
    // Primeiro tentar pegar do path (formato: /{subdomain}/...)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const subdomainFromPath = pathParts[0];

    // Se não encontrar no path, tentar query param (fallback para rotas antigas)
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store') || subdomainFromPath;

    if (storeParam && storeParam !== 'admin' && storeParam !== 'store' && storeParam !== 'login' && storeParam !== 'create-store' && !config.headers['X-Store-Subdomain']) {
      config.headers['X-Store-Subdomain'] = storeParam;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

