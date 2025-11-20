import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Palette,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X,
  Folder,
  Settings,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';

export default function StoreLayout() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Buscar informações da loja
  const { data: store } = useQuery('store', async () => {
    const response = await api.get('/api/stores');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  // Gerar URL da loja
  const getStoreUrl = () => {
    if (!store) return '';

    // Se estiver em desenvolvimento local, usar localhost
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = window.location.port || '5173';

    if (isDevelopment) {
      return `http://localhost:${port}/${store.subdomain}`;
    }

    const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.site';

    // Se tiver domínio primário verificado, usar ele
    if (store.primary_domain) {
      return `https://${store.primary_domain}`;
    }

    // Sempre usar o formato subdomain.nerix.site
    return `https://${store.subdomain}.${baseDomain}`;
  };

  const copyStoreUrl = () => {
    const url = getStoreUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigation = [
    { name: 'Dashboard', href: '/store', icon: LayoutDashboard },
    { name: 'Produtos', href: '/store/products', icon: Package },
    { name: 'Categorias', href: '/store/categories', icon: Folder },
    { name: 'Pedidos', href: '/store/orders', icon: ShoppingCart },
    { name: 'Clientes', href: '/store/customers', icon: Users },
    { name: 'Cupons', href: '/store/coupons', icon: Ticket },
    { name: 'Tema', href: '/store/theme', icon: Palette },
    { name: 'Pagamentos', href: '/store/payment-methods', icon: CreditCard },
    { name: 'Configurações', href: '/store/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transition-none`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-900">Painel</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Store URL Section */}
          {store && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-900">Link da Loja</span>
                </div>
                <p className="text-xs text-indigo-700 truncate mb-2" title={getStoreUrl()}>
                  {getStoreUrl()}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={copyStoreUrl}
                    className="flex-1 px-2 py-1.5 bg-white text-indigo-600 text-xs rounded hover:bg-indigo-100 transition-colors flex items-center justify-center"
                    title="Copiar link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </button>
                  <a
                    href={getStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-2 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors text-center"
                  >
                    Abrir
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Painel do Lojista</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


