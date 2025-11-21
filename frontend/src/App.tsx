import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { getSubdomainFromHostname } from './utils/urlUtils';
import api from './config/axios';

// Admin Master
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/Dashboard';
import AdminStores from './admin/pages/Stores';
import AdminPlans from './admin/pages/Plans';
import AdminSales from './admin/pages/Sales';
import AdminWithdrawals from './admin/pages/Withdrawals';
import AdminAccounts from './admin/pages/Accounts';

// Store Owner
import StoreLayout from './store/layouts/StoreLayout';
import StoreDashboard from './store/pages/Dashboard';
import StoreProducts from './store/pages/Products';
import StoreOrders from './store/pages/Orders';
import StoreOrderDetails from './store/pages/OrderDetails';
import StoreCustomers from './store/pages/Customers';
import StoreCoupons from './store/pages/Coupons';
import StoreTheme from './store/pages/Theme';
import StoreCategories from './store/pages/Categories';
import StoreProductForm from './store/pages/ProductForm';
import StoreSettings from './store/pages/Settings';
import StoreDomains from './store/pages/Domains';
import StoreWallet from './store/pages/Wallet';
import StoreAccount from './store/pages/Account';

// Shop (Public)
import ShopLayout from './shop/layouts/ShopLayout';
import ShopHome from './shop/pages/Home';
import ShopProduct from './shop/pages/Product';
import ShopCheckout from './shop/pages/Checkout';
import ShopPayment from './shop/pages/Payment';
import ShopOrderStatus from './shop/pages/OrderStatus';
import ShopCategories from './shop/pages/Categories';
import CustomerLogin from './shop/pages/CustomerLogin';
import MyOrders from './shop/pages/MyOrders';
import MyOrderDetails from './shop/pages/MyOrderDetails';
import ShopTerms from './shop/pages/Terms';
import PageNotFound from './shop/pages/PageNotFound';

// Landing
import Landing from './pages/Landing';
import CreateStore from './pages/CreateStore';

// Auth
import Login from './auth/pages/Login';
import ForgotPassword from './auth/pages/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Sempre buscar dados quando o componente é montado
      refetchOnReconnect: true, // Buscar dados quando reconectar
      staleTime: 30 * 1000, // 30 segundos - dados considerados "stale" após 30s
      cacheTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error: any) => {
        // Não tentar novamente em caso de erro 429 (Too Many Requests)
        if (error?.response?.status === 429) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function ProtectedRoute({ children, requiredRole }: { children: JSX.Element; requiredRole?: string }) {
  const { user, isAuthenticated } = useAuthStore();

  // Debug: verificar estado de autenticação
  console.log('ProtectedRoute check:', {
    isAuthenticated,
    userRole: user?.role,
    requiredRole,
    userEmail: user?.email
  });

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Se requer role específica
  if (requiredRole) {
    // Para admin, verificar email específico
    if (requiredRole === 'master_admin') {
      // Lista de emails permitidos para admin master
      // Pode ser configurado via variável de ambiente VITE_ADMIN_EMAILS (separados por vírgula)
      const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS || '';
      const ADMIN_EMAILS = ADMIN_EMAILS_ENV
        ? ADMIN_EMAILS_ENV.split(',').map((e: string) => e.trim().toLowerCase())
        : ['jprotersiza@gmail.com', 'admin@platform.com']; // Emails padrão permitidos

      const userEmailLower = user.email?.toLowerCase();

      // Se o email está na lista de admin emails, permitir acesso mesmo que a role não seja exatamente master_admin
      // (útil para casos onde o usuário ainda não foi atualizado no banco)
      if (ADMIN_EMAILS.includes(userEmailLower)) {
        // Se tem role master_admin, permitir diretamente
        if (user.role === requiredRole) {
          console.log('Access granted - admin email and role match:', userEmailLower);
          return children;
        }
        // Se o email está na lista mas a role não é master_admin, ainda permitir acesso
        // (assumindo que é um admin que precisa ter a role atualizada)
        console.log('Access granted - admin email in list (role may need update):', userEmailLower, 'Current role:', user.role);
        return children;
      }
      // Se não é o email correto, redirecionar
      console.log('Access denied - not admin email. User email:', userEmailLower, 'Allowed emails:', ADMIN_EMAILS);
      if (user.store_id) {
        return <Navigate to="/store" replace />;
      }
      return <Navigate to="/create-store" replace />;
    }

    // Se o usuário tem a role necessária, permitir acesso
    if (user.role === requiredRole) {
      console.log('Access granted - role matches');
      return children;
    }

    // Se não tem a role necessária, redirecionar baseado na role dele
    console.log('Role mismatch:', { userRole: user.role, requiredRole });
    // NÃO redirecionar master_admin para /admin automaticamente
    // Redirecionar para /store se tiver loja, senão para /create-store
    if (user.store_id) {
      console.log('Redirecting to /store');
      return <Navigate to="/store" replace />;
    }
    console.log('Redirecting to /create-store');
    return <Navigate to="/create-store" replace />;
  }

  // Se não requer role específica, permitir acesso
  console.log('Access granted - no role required');
  return children;
}

// Componente que tenta carregar loja e redireciona para Landing se não encontrar
function ShopLayoutWithLandingFallback() {
  const { data: storeInfo, isLoading } = useQuery(
    ['shopStoreCheck', typeof window !== 'undefined' ? window.location.hostname : ''],
    async () => {
      try {
        const response = await api.get('/api/public/store');
        return response.data;
      } catch (error: any) {
        return null;
      }
    },
    {
      staleTime: Infinity,
      enabled: true,
      retry: false,
    }
  );

  // Se não está carregando e não encontrou loja, redirecionar para Landing
  if (!isLoading && !storeInfo) {
    // Redirecionar para o domínio principal do SaaS
    const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
    if (typeof window !== 'undefined' && window.location.hostname !== saasDomain) {
      window.location.href = `https://${saasDomain}/`;
      return null;
    }
    return <Landing />;
  }

  // Se encontrou loja ou ainda está carregando, renderizar ShopLayout com rotas
  if (storeInfo || isLoading) {
    return (
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<ShopHome />} />
          <Route path="product/:slug" element={<ShopProduct />} />
          <Route path="checkout" element={<ShopCheckout />} />
          <Route path="payment/:orderId" element={<ShopPayment />} />
          <Route path="order/:orderId" element={<ShopOrderStatus />} />
          <Route path="categories" element={<ShopCategories />} />
          <Route path="terms" element={<ShopTerms />} />
          <Route path="login" element={<CustomerLogin />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-orders/:orderId" element={<MyOrderDetails />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    );
  }

  // Fallback: renderizar ShopLayout vazio (será tratado pelo ShopLayout)
  return <ShopLayout />;
}

// Componente que detecta subdomínio no hostname e renderiza ShopLayout ou Landing
function SubdomainShopWrapper() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const subdomain = getSubdomainFromHostname();
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';
  const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  const isBaseDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
  const isSaasDomain = hostname === saasDomain || hostname === `www.${saasDomain}`;

  // Se há subdomínio conhecido do domínio base (ex: marcos.nerix.online), renderizar ShopLayout com rotas
  // IMPORTANTE: Para subdomínios, as rotas são diretas (sem subdomain no path)
  // O backend resolve a loja baseado no header Host
  if (subdomain) {
    return (
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<ShopHome />} />
          <Route path="product/:slug" element={<ShopProduct />} />
          <Route path="checkout" element={<ShopCheckout />} />
          <Route path="payment/:orderId" element={<ShopPayment />} />
          <Route path="order/:orderId" element={<ShopOrderStatus />} />
          <Route path="categories" element={<ShopCategories />} />
          <Route path="terms" element={<ShopTerms />} />
          <Route path="login" element={<CustomerLogin />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-orders/:orderId" element={<MyOrderDetails />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    );
  }

  // Se é localhost ou domínio base (nerix.online), renderizar Landing
  if (isLocalhost || isBaseDomain) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/create-store"
          element={
            <ProtectedRoute>
              <CreateStore />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // Se é o domínio SaaS, renderizar Landing com rotas do SaaS
  if (isSaasDomain) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/create-store"
          element={
            <ProtectedRoute>
              <CreateStore />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // Se não é subdomínio do BASE_DOMAIN, não é SAAS_DOMAIN, não é localhost, pode ser domínio customizado
  // Tentar carregar loja e renderizar ShopLayout se encontrar, senão redirecionar para Landing
  const isSubdomainOfBase = hostname.endsWith(`.${baseDomain}`) && !isBaseDomain;
  if (!isSubdomainOfBase && !isBaseDomain && !isSaasDomain && !isLocalhost) {
    return <ShopLayoutWithLandingFallback />;
  }

  // Fallback: renderizar Landing
  return <Landing />;
}

// Componente que decide qual rota renderizar baseado no hostname
function RouteSelector() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';
  const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  const isBaseDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
  const isSaasDomain = hostname === saasDomain || hostname === `www.${saasDomain}`;
  const subdomain = getSubdomainFromHostname();
  const isSubdomainOfBase = hostname.endsWith(`.${baseDomain}`) && !isBaseDomain;

  // Se é domínio SaaS ou base, renderizar Landing (que tem suas próprias rotas internas)
  if (isSaasDomain || (isBaseDomain && !subdomain) || (isLocalhost && !subdomain)) {
    return <SubdomainShopWrapper />;
  }

  // Se é subdomínio do BASE_DOMAIN (ex: marcos.nerix.online), usar rotas com subdomain no path
  if (subdomain && isSubdomainOfBase) {
    return <SubdomainShopWrapper />;
  }

  // Se não é subdomínio conhecido, pode ser domínio customizado
  // Usar ShopLayoutWithLandingFallback que renderiza rotas sem subdomain no path
  if (!isSubdomainOfBase && !isBaseDomain && !isSaasDomain && !isLocalhost) {
    return <ShopLayoutWithLandingFallback />;
  }

  // Fallback: usar SubdomainShopWrapper
  return <SubdomainShopWrapper />;
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Admin Master - sempre disponível */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="master_admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="stores" element={<AdminStores />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="accounts" element={<AdminAccounts />} />
            </Route>

            {/* Store Owner - sempre disponível */}
            <Route
              path="/store/*"
              element={
                <ProtectedRoute>
                  <StoreLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StoreDashboard />} />
              <Route path="products" element={<StoreProducts />} />
              <Route path="products/new" element={<StoreProductForm />} />
              <Route path="products/edit/:id" element={<StoreProductForm />} />
              <Route path="categories" element={<StoreCategories />} />
              <Route path="orders" element={<StoreOrders />} />
              <Route path="orders/:id" element={<StoreOrderDetails />} />
              <Route path="customers" element={<StoreCustomers />} />
              <Route path="coupons" element={<StoreCoupons />} />
              <Route path="theme" element={<StoreTheme />} />
              <Route path="settings" element={<StoreSettings />} />
              <Route path="settings/domains" element={<StoreDomains />} />
              <Route path="wallet" element={<StoreWallet />} />
              <Route path="account" element={<StoreAccount />} />
            </Route>

            {/* Fallback para rotas antigas com /shop */}
            <Route path="/shop/*" element={<ShopLayout />}>
              <Route index element={<ShopHome />} />
              <Route path="product/:slug" element={<ShopProduct />} />
              <Route path="checkout" element={<ShopCheckout />} />
              <Route path="categories" element={<ShopCategories />} />
            </Route>

            {/* Landing Page ou Shop baseado no hostname - deve vir antes das rotas genéricas */}
            <Route path="*" element={<RouteSelector />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;


