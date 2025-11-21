import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, Package, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getShopUrl, getCheckoutUrl } from '../../utils/urlUtils';

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

  useEffect(() => {
    const customerData = localStorage.getItem(`customer_${storeSubdomain}`);
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }

    // Atualizar quando o storage mudar
    const handleStorageChange = () => {
      const updated = localStorage.getItem(`customer_${storeSubdomain}`);
      if (updated) {
        setCustomer(JSON.parse(updated));
      } else {
        setCustomer(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storeSubdomain]);

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
    localStorage.removeItem(`customer_token_${storeSubdomain}`);
    localStorage.removeItem(`customer_${storeSubdomain}`);
    setCustomer(null);
    setProfileMenuOpen(false);
    navigate(`/${storeSubdomain}`);
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
            to={getShopUrl(storeSubdomain)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {(theme?.logo_url || storeInfo?.logo_url) && (
              <img
                src={normalizeImageUrl(theme?.logo_url || storeInfo?.logo_url)}
                alt={storeInfo?.name || 'Loja'}
                className="h-10 w-10 rounded-lg object-contain"
              />
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

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 origin-top-right animate-in fade-in slide-in-from-top-2"
                  >
                    {/* Header do Menu */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {customer.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{customer.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Menu */}
                    <div className="py-2">
                      <Link
                        to={`/${storeSubdomain}/my-orders`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <Package className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                        <span className="flex-1">Minhas Compras</span>
                        <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <LogOut className="w-5 h-5 group-hover:text-red-700" />
                        <span>Sair da conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={`/${storeSubdomain}/login`}
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
