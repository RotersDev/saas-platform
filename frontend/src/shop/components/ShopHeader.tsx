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

                {/* Dropdown Menu - Design Moderno */}
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2"
                    style={{
                      animation: 'slideDown 0.2s ease-out',
                    }}
                  >
                    {/* Header com Gradiente Azul */}
                    <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-6 py-5">
                      <div className="absolute inset-0 bg-black/5"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/30">
                          <span className="text-white font-bold text-lg">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-white">
                          <div className="text-base font-bold truncate mb-0.5">
                            {customer.name}
                          </div>
                          <div className="text-xs text-blue-100 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Menu - Cards Estilizados */}
                    <div className="p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
                      <Link
                        to={getShopUrl(storeSubdomain, 'my-orders')}
                        onClick={() => setProfileMenuOpen(false)}
                        className="group relative flex items-center gap-4 px-4 py-4 bg-white rounded-xl border-2 border-transparent hover:border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            Minhas Compras
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Ver seus pedidos
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <ChevronDown className="w-4 h-4 text-blue-600 rotate-[-90deg]" />
                          </div>
                        </div>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="group relative w-full flex items-center gap-4 px-4 py-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                          <LogOut className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-bold text-red-700 group-hover:text-red-800 transition-colors">
                            Sair da conta
                          </div>
                          <div className="text-xs text-red-600 mt-0.5">
                            Encerrar sessão
                          </div>
                        </div>
                      </button>
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
