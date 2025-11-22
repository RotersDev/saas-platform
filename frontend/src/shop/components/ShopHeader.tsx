import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, Package, LogOut, Mail } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getShopUrl, getCheckoutUrl, getLoginUrl } from '../../utils/urlUtils';

interface ShopHeaderProps {
  storeInfo?: any;
  theme?: any;
  cartCount?: number;
}

export default function ShopHeader({ storeInfo, theme, cartCount = 0 }: ShopHeaderProps) {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Calcular cartKey (mesmo cálculo usado nas outras páginas)
  const customerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);

  useEffect(() => {
    if (!customerKey) {
      setCustomer(null);
      return;
    }

    const customerData = localStorage.getItem(`customer_${customerKey}`);
    const token = localStorage.getItem(`customer_token_${customerKey}`);

    if (customerData && token) {
      try {
        setCustomer(JSON.parse(customerData));
      } catch (error) {
        console.error('[ShopHeader] Erro ao parsear customer:', error);
        setCustomer(null);
      }
    } else {
      setCustomer(null);
    }

    // Atualizar quando o storage mudar
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `customer_${customerKey}` || e.key === `customer_token_${customerKey}`) {
        const updated = localStorage.getItem(`customer_${customerKey}`);
        const updatedToken = localStorage.getItem(`customer_token_${customerKey}`);
        if (updated && updatedToken) {
          try {
            setCustomer(JSON.parse(updated));
          } catch (error) {
            console.error('[ShopHeader] Erro ao parsear customer no storage change:', error);
            setCustomer(null);
          }
        } else {
          setCustomer(null);
        }
      }
    };

    // Listener para evento customizado (mesma aba)
    const handleCustomerUpdated = () => {
      const updated = localStorage.getItem(`customer_${customerKey}`);
      const updatedToken = localStorage.getItem(`customer_token_${customerKey}`);
      if (updated && updatedToken) {
        try {
          setCustomer(JSON.parse(updated));
        } catch (error) {
          console.error('[ShopHeader] Erro ao parsear customer no evento:', error);
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customerUpdated', handleCustomerUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customerUpdated', handleCustomerUpdated);
    };
  }, [customerKey]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);

  const handleLogout = () => {
    const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (currentCustomerKey) {
      localStorage.removeItem(`customer_token_${currentCustomerKey}`);
      localStorage.removeItem(`customer_${currentCustomerKey}`);
    }
    setCustomer(null);
    setProfileMenuOpen(false);
    window.dispatchEvent(new Event('customerUpdated'));
    navigate(getShopUrl(storeSubdomain, ''));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEmailDomain = (email: string) => {
    return email.split('@')[1] || '';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <Link
            to={getShopUrl(storeSubdomain, '', true)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {(theme?.logo_url || storeInfo?.logo_url) ? (
              <img
                src={normalizeImageUrl(theme?.logo_url || storeInfo?.logo_url)}
                alt={storeInfo?.name || 'Loja'}
                className="h-10 w-10 rounded-lg object-contain"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  // Se a imagem falhar ao carregar, mostrar apenas o texto
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {(storeInfo?.name || 'L')[0].toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              {storeInfo?.name || 'Loja'}
            </h1>
          </Link>

          {/* Ações Direitas */}
          <div className="flex items-center gap-3">
            {/* Carrinho */}
            <Link
              to={getCheckoutUrl(storeSubdomain)}
              className="relative inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Menu de Perfil */}
            {customer ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {getInitials(customer.name)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500">
                      ******@{getEmailDomain(customer.email)}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      profileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu - Layout Reformulado */}
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden origin-top-right"
                  >
                    {/* Header do Menu - Layout Horizontal */}
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {customer.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Menu - Layout em Grid */}
                    <div className="p-3">
                      <div className="space-y-1.5">
                        <Link
                          to={getShopUrl(storeSubdomain, 'my-orders')}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                              <Package className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 group-hover:text-gray-950">
                                Minhas Compras
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Ver pedidos
                              </div>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] flex-shrink-0" />
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors group border border-transparent hover:border-red-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                              <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-sm font-medium text-red-600 group-hover:text-red-700">
                                Sair da conta
                              </div>
                              <div className="text-xs text-red-500 mt-0.5">
                                Encerrar sessão
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={getLoginUrl(storeSubdomain)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
