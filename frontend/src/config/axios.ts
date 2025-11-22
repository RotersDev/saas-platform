import axios from 'axios';
import { getSubdomainFromHostname } from '../utils/urlUtils';

// Configurar baseURL do axios
// Em desenvolvimento, usar proxy do Vite (baseURL vazio)
// Em produção, usar variável de ambiente ou URL completa
const baseURL = import.meta.env.VITE_API_URL || '';

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
    // Adicionar subdomain do store se estiver na URL atual
    // 1. Primeiro tentar pegar do hostname (ex: asdad.nerix.online -> asdad)
    const subdomainFromHostname = getSubdomainFromHostname();

    // 2. Tentar pegar do path (formato: /{subdomain}/...) - mas apenas se não for uma rota conhecida
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const firstPathPart = pathParts[0];
    // Rotas conhecidas que NÃO são subdomínios
    const knownShopRoutes = ['admin', 'store', 'login', 'create-store', 'product', 'checkout', 'payment', 'order', 'categories', 'terms', 'my-orders', 'forgot-password', 'reset-password'];
    const subdomainFromPath = firstPathPart && !knownShopRoutes.includes(firstPathPart) ? firstPathPart : null;

    // 3. Tentar query param (fallback para rotas antigas)
    const urlParams = new URLSearchParams(window.location.search);
    let storeParam = subdomainFromHostname || urlParams.get('store') || subdomainFromPath;

    // 4. Se ainda não encontrou, tentar pegar do localStorage (armazenado após login ou primeira requisição)
    if (!storeParam || storeParam === 'admin' || storeParam === 'store' || storeParam === 'login' || storeParam === 'create-store' || knownShopRoutes.includes(storeParam)) {
      const storedSubdomain = localStorage.getItem('store_subdomain');
      if (storedSubdomain) {
        storeParam = storedSubdomain;
      } else {
        // Se não encontrou subdomain e não é uma rota conhecida, pode ser domínio customizado
        // Nesse caso, não enviar header X-Store-Subdomain (o backend resolve pelo hostname)
        storeParam = null;
      }
    }

    // Verificar se é uma rota de cliente (customer) e usar token de cliente se disponível
    const isCustomerRoute = config.url?.includes('/customer/') || config.url?.includes('/customers/');
    let token = null;

    if (isCustomerRoute) {
      // Tentar pegar storeInfo do localStorage como fallback
      let storeInfo = null;
      try {
        const stored = localStorage.getItem('storeInfo');
        if (stored) {
          storeInfo = JSON.parse(stored);
        }
      } catch (e) {
        // Ignorar erro
      }

      // Calcular customerKey (mesmo cálculo usado em outras partes)
      const customerKey = storeParam || (storeInfo ? `store-${storeInfo.id}` : null);

      if (customerKey) {
        // Tentar pegar token de cliente primeiro
        token = localStorage.getItem(`customer_token_${customerKey}`);
      }
    }

    // Se não encontrou token de cliente, tentar token genérico
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Se for FormData, remover Content-Type para deixar o navegador definir com boundary correto
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Lista de rotas conhecidas que não devem ser tratadas como subdomain
    const knownShopRoutesForHeader = ['admin', 'store', 'login', 'create-store', 'product', 'checkout', 'payment', 'order', 'categories', 'terms', 'my-orders', 'forgot-password', 'reset-password'];

    if (storeParam && !knownShopRoutesForHeader.includes(storeParam) && !config.headers['X-Store-Subdomain']) {
      config.headers['X-Store-Subdomain'] = storeParam;
      // Log apenas para rotas públicas de produtos/loja
      if (config.url?.includes('/api/public/')) {
        console.log('[Axios] 📤 Enviando header X-Store-Subdomain:', storeParam, '| URL:', config.url);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e armazenar subdomain quando disponível
api.interceptors.response.use(
  (response) => {
    // Se a resposta contém dados da loja, armazenar o subdomain
    if (response.data?.subdomain) {
      localStorage.setItem('store_subdomain', response.data.subdomain);
    }
    return response;
  },
  async (error) => {
    // Erros de conexão (backend não está rodando) não devem causar redirecionamento
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      return Promise.reject(error);
    }

    // Tratar erro 429 (Too Many Requests)
    if (error.response?.status === 429) {
      // Mostrar mensagem de erro amigável
      // O toast será mostrado pelo componente que capturar o erro
      const errorMessage = error.response?.data?.message || 'Muitas requisições. Aguarde alguns instantes e tente novamente.';
      error.userMessage = errorMessage;
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Não redirecionar se estiver tentando fazer login ou se não houver token
      const isLoginAttempt = error.config?.url?.includes('/auth/login') ||
                            error.config?.url?.includes('/auth/register') ||
                            error.config?.url?.includes('/customers/login') ||
                            error.config?.url?.includes('/customers/register');

      // Verificar se é uma rota de cliente
      const isCustomerRoute = error.config?.url?.includes('/customer/') || error.config?.url?.includes('/customers/');

      // Pegar subdomain para verificar token de cliente
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const subdomainFromPath = pathParts[0];
      const urlParams = new URLSearchParams(window.location.search);
      const storeParam = urlParams.get('store') || subdomainFromPath;

      // Tentar pegar storeInfo do localStorage ou da query para identificar a loja
      let storeInfo = null;
      try {
        const storedStoreInfo = localStorage.getItem('storeInfo');
        if (storedStoreInfo) {
          storeInfo = JSON.parse(storedStoreInfo);
        }
      } catch (e) {
        // Ignorar erro
      }

      // Calcular customerKey (mesmo cálculo usado em outras partes)
      const customerKey = storeParam || (storeInfo ? `store-${storeInfo.id}` : null);
      const hasCustomerToken = customerKey ? localStorage.getItem(`customer_token_${customerKey}`) : null;
      const hasToken = localStorage.getItem('token');

      // Tentar renovar token se for erro 401 e tiver token (pode ser token expirado)
      if (hasToken && !isLoginAttempt && !isCustomerRoute && error.config && !error.config._retry) {
        error.config._retry = true;

        try {
          // Tentar renovar o token
          const refreshResponse = await axios.post(`${baseURL}/api/auth/refresh-token`, {}, {
            headers: {
              Authorization: `Bearer ${hasToken}`,
            },
          });

          if (refreshResponse.data.token) {
            // Atualizar token no localStorage
            localStorage.setItem('token', refreshResponse.data.token);
            if (refreshResponse.data.user) {
              localStorage.setItem('user', JSON.stringify(refreshResponse.data.user));
            }

            // Atualizar header da requisição original e tentar novamente
            error.config.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Se falhar ao renovar, fazer logout apenas se realmente não conseguir autenticar
          console.error('Erro ao renovar token:', refreshError);
        }
      }

      // Para rotas de cliente com erro 401, verificar se o token realmente expirou
      // Se for TOKEN_EXPIRED, não remover o token imediatamente - deixar o componente tratar
      if (isCustomerRoute && hasCustomerToken && error.response?.data?.code === 'TOKEN_EXPIRED') {
        // Token expirado - não fazer nada aqui, deixar o componente tratar
        // O componente pode redirecionar para login ou tentar renovar
        return Promise.reject(error);
      }

      // Só fazer logout e redirecionar se já havia um token (sessão expirada) e não conseguiu renovar
      // Se não há token, é apenas uma tentativa de login que falhou
      // Para rotas de cliente, não fazer logout automático - deixar o componente tratar
      if ((hasToken || hasCustomerToken) && !isLoginAttempt && !isCustomerRoute && error.config?._retry) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('store_subdomain');

        // Verificar se está em uma rota de loja (não redirecionar)
        const currentPath = window.location.pathname;
        const pathParts2 = currentPath.split('/').filter(Boolean);
        const isShopRoute = pathParts2.length > 0 &&
                           pathParts2[0] !== 'admin' &&
                           pathParts2[0] !== 'store' &&
                           pathParts2[0] !== 'login' &&
                           pathParts2[0] !== 'create-store' &&
                           pathParts2[0] !== '';

        // Só redirecionar se não estiver já na página de login, landing ou em rota de loja
        if (currentPath !== '/login' && currentPath !== '/' && !isShopRoute) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

