import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from './StoreBlocked';
import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, CreditCard, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import { getShopUrl } from '../../utils/urlUtils';

export default function ShopCheckout() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: storeInfo } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
    }
  );

  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const customerData = localStorage.getItem(`customer_${storeSubdomain}`);
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }
  }, [storeSubdomain]);

  const { data: theme } = useQuery(
    ['shopTheme', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/theme');
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  useEffect(() => {
    const saved = localStorage.getItem(`cart_${storeSubdomain}`);
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, [storeSubdomain]);

  // Verificar se a loja está bloqueada ou suspensa
  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  const removeFromCart = (productId: number) => {
    const newCart = cart.filter((item: any) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem(`cart_${storeSubdomain}`, JSON.stringify(newCart));
    toast.success('Produto removido do carrinho');
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map((item: any) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem(`cart_${storeSubdomain}`, JSON.stringify(newCart));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.promotional_price || item.price) * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se login é obrigatório
    if (storeInfo?.require_login_to_purchase && !customer) {
      toast.error('Login obrigatório para finalizar a compra');
      navigate(`/${storeSubdomain}/login`);
      return;
    }

    setLoading(true);

    try {
      // Se cliente está logado, usar dados do cliente
      const finalCustomerData = customer ? {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
      } : customerData;
      // Criar pedido
      const orderData = {
        items: cart.map((item: any) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.promotional_price || item.price,
        })),
        customer: finalCustomerData,
        customer_id: customer?.id || null, // Incluir ID do cliente se estiver logado
        total: subtotal,
      };

      const response = await api.post('/api/public/orders', orderData, {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
        },
      });

      // Limpar carrinho
      localStorage.removeItem(`cart_${storeSubdomain}`);
      setCart([]);

      // Redirecionar para página de pagamento com QR Code usando order_number
      if (response.data?.order?.order_number) {
        navigate(`/${storeSubdomain}/payment/${encodeURIComponent(response.data.order.order_number)}`);
      } else if (response.data?.order?.id) {
        // Fallback para ID se order_number não existir
        navigate(`/${storeSubdomain}/payment/${response.data.order.id}`);
      } else {
        toast.error('Erro ao obter informações do pedido');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <Link
            to={getShopUrl(storeSubdomain)}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carrinho */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Carrinho de Compras</h2>

              <div className="space-y-4">
                {cart.map((item: any) => {
                  const price = Number(item.promotional_price || item.price);
                  const total = price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      {item.images && item.images.length > 0 && (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(price)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(total)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm mt-1"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resumo e Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumo do Pedido</h2>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Frete</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verificar se login é obrigatório */}
              {storeInfo?.require_login_to_purchase && !customer ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Login obrigatório:</strong> Você precisa fazer login para finalizar a compra.
                    </p>
                  </div>
                  <Link
                    to={`/${storeSubdomain}/login`}
                    className="w-full px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-md hover:bg-indigo-700 transition-colors inline-flex items-center justify-center"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Fazer Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4">
                  {customer ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Logado como:</strong> {customer.name} ({customer.email})
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerData.name}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={customerData.email}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {loading ? 'Processando...' : 'Finalizar Compra (PIX)'}
                  </button>
                </form>
              )}

              <p className="text-xs text-gray-500 mt-4 text-center">
                Pagamento via PIX - Aprovação instantânea
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
