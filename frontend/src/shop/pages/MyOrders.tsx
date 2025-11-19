import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { useState, useEffect } from 'react';
import {
  Package, ArrowLeft, LogOut, CheckCircle2, Clock, XCircle,
  ShoppingBag, DollarSign, Calendar, FileText, CreditCard, Truck,
  TrendingUp, Eye, ChevronRight
} from 'lucide-react';
import Footer from '../components/Footer';
import { getShopUrl } from '../../utils/urlUtils';

export default function MyOrders() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const customerData = localStorage.getItem(`customer_${storeSubdomain}`);
    const token = localStorage.getItem(`customer_token_${storeSubdomain}`);

    if (!customerData || !token) {
      navigate(`/${storeSubdomain}/login`);
      return;
    }

    setCustomer(JSON.parse(customerData));
  }, [storeSubdomain, navigate]);

  const { data: orders, isLoading } = useQuery(
    ['myOrders', storeSubdomain],
    async () => {
      const token = localStorage.getItem(`customer_token_${storeSubdomain}`);
      if (!token) return [];

      const response = await api.get('/api/public/customer/my-orders', {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      enabled: !!customer && !!storeSubdomain,
      staleTime: 1 * 60 * 1000,
    }
  );

  const handleLogout = () => {
    localStorage.removeItem(`customer_token_${storeSubdomain}`);
    localStorage.removeItem(`customer_${storeSubdomain}`);
    navigate(`/${storeSubdomain}/login`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: Clock,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        label: 'Pendente',
        description: 'Aguardando pagamento'
      },
      paid: {
        icon: CheckCircle2,
        className: 'bg-green-50 text-green-700 border-green-200',
        label: 'Pago',
        description: 'Pagamento confirmado'
      },
      delivered: {
        icon: Package,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Entregue',
        description: 'Produto entregue'
      },
      cancelled: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
        label: 'Cancelado',
        description: 'Pedido cancelado'
      },
      refunded: {
        icon: XCircle,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        label: 'Reembolsado',
        description: 'Valor reembolsado'
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{badge.label}</span>
          <span className="text-xs opacity-75">{badge.description}</span>
        </div>
      </div>
    );
  };

  // Calcular estatísticas
  const stats = orders ? {
    total: orders.length,
    totalSpent: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
    paid: orders.filter((o: any) => o.status === 'paid' || o.status === 'delivered').length,
  } : { total: 0, totalSpent: 0, paid: 0 };

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Minhas Compras</h1>
              <p className="text-gray-600">Acompanhe todos os seus pedidos e histórico de compras</p>
            </div>
            <Link
              to={getShopUrl(storeSubdomain)}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a loja
            </Link>
          </div>

          {/* Estatísticas */}
          {orders && orders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total de Pedidos</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Gasto</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(stats.totalSpent)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pedidos Pagos</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.paid}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Você ainda não realizou nenhuma compra. Explore nossos produtos e encontre o que você precisa!
            </p>
            <Link
              to={getShopUrl(storeSubdomain)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                to={`/${storeSubdomain}/my-orders/${order.order_number || order.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all group"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Informações do Pedido */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              Pedido {order.order_number || `#${order.id}`}
                            </h3>
                            {getStatusBadge(order.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Package className="w-4 h-4" />
                                <span>
                                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                </span>
                              </div>
                            )}
                            {order.payment && (
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4" />
                                <span className="capitalize">
                                  {order.payment.payment_method || 'PIX'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Valor e Ação */}
                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(order.total))}
                        </p>
                      </div>
                      <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer storeInfo={null} theme={null} />
    </div>
  );
}
