import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from './StoreBlocked';
import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Trash2,
  User,
  Lock,
  CheckCircle2,
  Mail,
  FileText,
  ChevronRight,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import { getShopUrl, getLoginUrl } from '../../utils/urlUtils';

export default function ShopCheckout() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState({
    email: '',
    confirmEmail: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

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
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) return;

    const customerData = localStorage.getItem(`customer_${currentCartKey}`);
    const token = localStorage.getItem(`customer_token_${currentCartKey}`);
    if (customerData && token) {
      setCustomer(JSON.parse(customerData));
    }
  }, [storeSubdomain, storeInfo]);

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
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) {
      setCart([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`cart_${currentCartKey}`);
      if (saved) {
        const cart = JSON.parse(saved);
        setCart(Array.isArray(cart) ? cart : []);
        console.log('[Checkout] Carrinho carregado:', { cartKey: currentCartKey, items: cart.length });
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('[Checkout] Erro ao carregar carrinho:', error);
      setCart([]);
    }
  }, [storeSubdomain, storeInfo]);

  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  const removeFromCart = (productId: number) => {
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) {
      toast.error('Loja não identificada');
      return;
    }
    const newCart = cart.filter((item: any) => item.id !== productId);
    setCart(newCart);
    localStorage.setItem(`cart_${currentCartKey}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Produto removido do carrinho');
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) {
      toast.error('Loja não identificada');
      return;
    }
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map((item: any) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem(`cart_${currentCartKey}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const discount = appliedCoupon
    ? Math.min(
        appliedCoupon.discount_type === 'percentage'
          ? (subtotal * appliedCoupon.discount_value) / 100
          : appliedCoupon.discount_value,
        appliedCoupon.max_discount || Infinity
      )
    : 0;

  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um cupom');
      return;
    }

    setCouponLoading(true);
    try {
      const response = await api.post(
        '/api/public/coupons/validate',
        {
          code: couponCode.trim().toUpperCase(),
          amount: subtotal,
        },
        {
          headers: {
            'X-Store-Subdomain': storeSubdomain,
          },
        }
      );

      if (response.data.valid) {
        // Converter estrutura do cupom para o formato esperado pelo frontend
        setAppliedCoupon({
          code: response.data.coupon.code,
          discount_type: response.data.coupon.type,
          discount_value: response.data.coupon.value,
          max_discount: response.data.coupon.max_discount || null,
        });
        toast.success('Cupom aplicado com sucesso!');
      } else {
        toast.error(response.data.error || 'Cupom inválido');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (storeInfo?.require_login_to_purchase && !customer) {
      toast.error('Login obrigatório para finalizar a compra');
      navigate(getLoginUrl(storeSubdomain));
      return;
    }

    // Validar email apenas
    const emailToUse = customer ? customer.email : customerData.email;
    if (!emailToUse || !emailToUse.trim()) {
      toast.error('Por favor, informe seu e-mail');
      return;
    }

    if (!customer && customerData.email !== customerData.confirmEmail) {
      toast.error('Os e-mails não coincidem');
      return;
    }

    setLoading(true);

    try {
      const finalCustomerData = customer
        ? {
            name: customer.name || '',
            email: customer.email,
            phone: customer.phone || '',
          }
        : {
            name: '',
            email: customerData.email.trim(),
            phone: '',
          };

      const orderData = {
        items: cart.map((item: any) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        customer: finalCustomerData,
        customer_id: customer?.id || null,
        coupon_code: appliedCoupon?.code || null,
        total: total,
      };

      const response = await api.post('/api/public/orders', orderData, {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
        },
      });

      const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
      if (currentCartKey) {
        localStorage.removeItem(`cart_${currentCartKey}`);
      }
      setCart([]);
      window.dispatchEvent(new Event('cartUpdated'));

      if (response.data?.order?.order_number) {
        navigate(getShopUrl(storeSubdomain, `payment/${encodeURIComponent(response.data.order.order_number)}`));
      } else if (response.data?.order?.id) {
        navigate(getShopUrl(storeSubdomain, `payment/${response.data.order.id}`));
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
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
            <Link
              to={getShopUrl(storeSubdomain)}
              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
            >
              Continuar comprando
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        <Footer storeInfo={storeInfo} theme={theme} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
        {/* Header e breadcrumb */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Finalize sua Compra</h1>
          <p className="text-gray-600 text-sm md:text-base">Confira seus itens e complete seu pedido com segurança</p>
          <nav aria-label="breadcrumb" className="flex justify-center md:justify-start mt-2">
            <ol className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
              <li className="flex items-center">
                <Link to={getShopUrl(storeSubdomain)} className="hover:text-indigo-600 transition-colors">
                  Início
                </Link>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mx-1" />
              </li>
              <li className="text-indigo-600 font-medium">Carrinho</li>
            </ol>
          </nav>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Coluna esquerda - Produtos */}
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            {/* Bloco de produtos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="p-4 md:p-5 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2 text-indigo-600" />
                  Seus Produtos
                </h3>
              </div>
              <div className="p-4 md:p-5 space-y-4">
                {cart.map((item: any) => {
                  // Preço normal (o que realmente cobra) = price
                  const price = Number(item.price);
                  const total = price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      {item.images && item.images.length > 0 && (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-600">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(price)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 p-1 transition-colors flex-shrink-0"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Coluna direita - Resumo e informações */}
          <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
            {/* Resumo do pedido */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Resumo */}
              <div className="p-4 md:p-5 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2 text-indigo-600" />
                  Resumo do Pedido
                </h3>
              </div>
              <div className="p-4 md:p-5 space-y-4">
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(subtotal)}
                    </span>
                  </li>
                  {discount > 0 && (
                    <li className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Desconto</span>
                      <span className="font-medium text-indigo-600">
                        -{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(discount)}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between text-base md:text-lg font-semibold pt-2 mt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-indigo-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(total)}
                    </span>
                  </li>
                </ul>

                {/* Cupom de desconto */}
                <div className="space-y-2">
                  <label htmlFor="coupon-code" className="block text-xs md:text-sm font-medium text-gray-700">
                    Cupom de desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon-code"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs md:text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Digite seu cupom"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs md:text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      <Tag className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {couponLoading ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-600">
                      Cupom {appliedCoupon.code} aplicado com sucesso!
                    </p>
                  )}
                </div>
              </div>

              {/* Informações pessoais */}
              <div className="p-4 md:p-5 border-t border-gray-200 space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-4 h-4 md:w-5 md:h-5 mr-2 text-indigo-600" />
                  Informações Pessoais
                </h3>

                {customer ? (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-xs md:text-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      </div>
                      <div className="ml-2">
                        <p className="text-green-700">
                          <strong className="font-medium">Cliente logado:</strong> {customer.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">E-mail *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          required
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-300 bg-white text-xs md:text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Confirmar E-mail *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          required
                          value={customerData.confirmEmail}
                          onChange={(e) => setCustomerData({ ...customerData, confirmEmail: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-300 bg-white text-xs md:text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="confirme@email.com"
                        />
                      </div>
                      {customerData.email &&
                        customerData.confirmEmail &&
                        customerData.email !== customerData.confirmEmail && (
                          <p className="text-xs text-red-600">Os e-mails não coincidem</p>
                        )}
                    </div>
                  </form>
                )}
              </div>

              {/* Botão de pagamento e garantias */}
              <div className="p-4 md:p-5 bg-gray-50 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-700 font-medium">Pagamento 100% seguro e criptografado</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={
                    loading ||
                    (!customer && (!customerData.email?.trim() || customerData.email !== customerData.confirmEmail))
                  }
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap">
                    {loading ? (
                      'Processando...'
                    ) : (
                      'Finalizar Compra'
                    )}
                  </span>
                </button>

                <p className="text-xs text-center text-gray-500 mt-2 px-2">
                  Ao finalizar, você concorda com nossos{' '}
                  <Link
                    to={getShopUrl(storeSubdomain, 'terms')}
                    className="text-indigo-600 hover:underline"
                  >
                    Termos
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
