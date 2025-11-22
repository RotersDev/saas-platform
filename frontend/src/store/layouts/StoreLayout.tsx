import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../themeStore';
import { useQuery, useMutation } from 'react-query';
import api from '../../config/axios';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Palette,
  Menu,
  X,
  Folder,
  Settings,
  Wallet,
  Save,
  ChevronDown,
  ChevronRight,
  Store,
  Moon,
  Sun,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function StoreLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Expandir automaticamente o menu Inventário se estiver em produtos ou categorias
  useEffect(() => {
    if (location.pathname.startsWith('/store/products') || location.pathname.startsWith('/store/categories')) {
      setExpandedMenus(prev => new Set(prev).add('Inventário'));
    }
  }, [location.pathname]);

  // Verificar se precisa pedir username ao fazer login
  useEffect(() => {
    if (user && !user.username && !showUsernameModal) {
      // Aguardar um pouco antes de mostrar o modal
      const timer = setTimeout(() => {
        setShowUsernameModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, showUsernameModal]);

  // Buscar dados atualizados do usuário
  const { data: userData } = useQuery(
    'userProfile',
    async () => {
      const response = await api.get('/api/auth/me');
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        if (data) {
          setUser(data);
        }
      },
    }
  );

  const updateProfileMutation = useMutation(
    async (data: { username?: string; profile_picture_url?: string }) => {
      const response = await api.put('/api/auth/profile', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setUser({
          ...data,
          username: data.username || undefined,
        } as any);
        setShowUsernameModal(false);
        toast.success('Perfil atualizado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
      },
    }
  );

  const handleSaveUsername = () => {
    const username = profileUsername.trim().toLowerCase();
    if (!username) {
      toast.error('Username é obrigatório');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      toast.error('Username deve ter entre 3 e 20 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username deve conter apenas letras, números e underscore');
      return;
    }
    updateProfileMutation.mutate({ username });
  };


  const getInitials = (username: string | null | undefined) => {
    if (!username) return 'U';
    return username[0].toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  const currentUser = userData || user;



  const navigation = [
    { name: 'Dashboard', href: '/store', icon: LayoutDashboard },
    {
      name: 'Inventário',
      icon: Store,
      children: [
        { name: 'Produtos', href: '/store/products', icon: Package },
        { name: 'Categorias', href: '/store/categories', icon: Folder },
      ],
    },
    { name: 'Pedidos', href: '/store/orders', icon: ShoppingCart },
    { name: 'Clientes', href: '/store/customers', icon: Users },
    { name: 'Cupons', href: '/store/coupons', icon: Ticket },
    { name: 'Tema', href: '/store/theme', icon: Palette },
    { name: 'Carteira', href: '/store/wallet', icon: Wallet },
    { name: 'Configurações', href: '/store/settings', icon: Settings },
  ];

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuName: string) => expandedMenus.has(menuName);

  const isChildActive = (children: any[]) => {
    return children.some(child => {
      if (child.href === '/store/products' && location.pathname.startsWith('/store/products')) {
        return true;
      }
      if (child.href === '/store/categories' && location.pathname.startsWith('/store/categories')) {
        return true;
      }
      return location.pathname === child.href;
    });
  };

  // Aplicar tema no elemento raiz
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen relative flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background com degradê sutil e bolinhas azuis */}
      <div
        className={`fixed inset-0 -z-10 ${
          theme === 'dark'
            ? 'bg-gray-900'
            : ''
        }`}
        style={
          theme === 'dark'
            ? {}
            : {
                background: `
                  radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
                  linear-gradient(to top, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 75%, #ffffff 100%)
                `,
                backgroundSize: '30px 30px, 100% 100%',
                backgroundPosition: '0 0, 0 0',
              }
        }
      />
      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 h-screen lg:h-screen ${
        theme === 'dark'
          ? 'bg-gray-800/95 backdrop-blur-sm border-r border-gray-700'
          : 'bg-white/80 backdrop-blur-sm'
      } shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transition-none flex flex-col`}>
        {/* Logo/Header */}
        <div className={`flex items-center justify-between h-16 px-6 border-b flex-shrink-0 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h1 className={`text-lg font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {getGreeting()}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : currentUser?.username ? `, ${currentUser.username}` : ''}
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={`lg:hidden ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation - com scroll limitado */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const Icon = item.icon;

              // Se tem filhos (subitens)
              if (item.children) {
                const isExpanded = isMenuExpanded(item.name);
                const hasActiveChild = isChildActive(item.children);

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        hasActiveChild
                          ? theme === 'dark'
                            ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-500'
                            : 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isActive = location.pathname === child.href ||
                            (child.href === '/store/products' && location.pathname.startsWith('/store/products')) ||
                            (child.href === '/store/categories' && location.pathname.startsWith('/store/categories'));

                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? theme === 'dark'
                                    ? 'bg-blue-900/50 text-blue-300 font-medium'
                                    : 'bg-blue-50 text-blue-700 font-medium'
                                  : theme === 'dark'
                                    ? 'text-gray-400 hover:bg-gray-700/50'
                                    : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 mr-3" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Item sem filhos (normal)
              const isActive = location.pathname === item.href ||
                (item.href === '/store/settings' && location.pathname.startsWith('/store/settings'));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-500'
                        : 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700/50'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

        {/* Botão de Tema - fixo na parte inferior */}
        <div className={`px-4 py-4 border-t flex-shrink-0 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:bg-gray-700/50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            <div className="flex items-center">
              {theme === 'light' ? (
                <Moon className="w-5 h-5 mr-3" />
              ) : (
                <Sun className="w-5 h-5 mr-3" />
              )}
              <span>{theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}</span>
            </div>
          </button>
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
        {/* Header Profissional */}
        <header className={`shadow-sm border-b ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between h-20 px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden ${
                theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Title - Removido para evitar duplicação */}

            {/* User Profile */}
            {currentUser && (
              <div className="flex items-center gap-3 ml-auto">
                <Link
                  to="/store/account"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {currentUser.profile_picture_url ? (
                      <img
                        src={currentUser.profile_picture_url}
                        alt={currentUser.username || 'Usuário'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-blue-500">
                        {getInitials(currentUser.username)}
                      </div>
                    )}
                    {/* User Info */}
                    <div className="hidden md:block text-left">
                      <p className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        @{currentUser.username || 'usuário'}
                      </p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>{currentUser.email}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 ${
          theme === 'dark' ? 'bg-gray-900' : ''
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Modal: Pedir Username */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {}}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">Atualização do Sistema</h2>
                <p className="text-blue-100 text-sm mt-1">Configure seu username</p>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Olá! Implementamos uma atualização e precisamos que você configure seu username (nickname) para continuar.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-gray-500">(3-20 caracteres)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">@</span>
                      <input
                        type="text"
                        value={profileUsername}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setProfileUsername(value);
                        }}
                        placeholder="jproters"
                        maxLength={20}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Apenas letras, números e underscore (_)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveUsername}
                    disabled={!profileUsername.trim() || profileUsername.length < 3 || updateProfileMutation.isLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-semibold"
                  >
                    {updateProfileMutation.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


