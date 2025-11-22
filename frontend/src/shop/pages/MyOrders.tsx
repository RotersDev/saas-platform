import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { useState, useEffect } from 'react';
import {
  Package, ArrowLeft, CheckCircle2, Clock, XCircle,
  ShoppingBag, DollarSign, Calendar, ChevronRight, User, Mail
} from 'lucide-react';
import { getShopUrl, getLoginUrl } from '../../utils/urlUtils';
import Footer from '../components/Footer';

export default function MyOrders() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);

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

  useEffect(() => {
    const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCustomerKey) {
      // Aguardar storeInfo carregar
      return;
    }

    const customerData = localStorage.getItem(`customer_${currentCustomerKey}`);
    const token = localStorage.getItem(`customer_token_${currentCustomerKey}`);

    if (!customerData || !token) {
      navigate(getLoginUrl(storeSubdomain));
      return;
    }

    try {
      setCustomer(JSON.parse(customerData));
    } catch (error) {
      console.error('[MyOrders] Erro ao parsear customer:', error);
      navigate(getLoginUrl(storeSubdomain));
    }
  }, [storeSubdomain, storeInfo, navigate]);

  const { data: ordersData, isLoading } = useQuery(
    ['myOrders', storeSubdomain, storeInfo?.id],
    async () => {
      const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
      if (!currentCustomerKey) return [];

      const token = localStorage.getItem(`customer_token_${currentCustomerKey}`);
      if (!token) return [];

      const response = await api.get('/api/public/customer/my-orders', {
        headers: {
          'X-Store-Subdomain': storeSubdomain || undefined,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      enabled: !!customer && (!!storeSubdomain || !!storeInfo),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Filtrar apenas pedidos aprovados (paid ou delivered)
  const orders = ordersData ? ordersData.filter((order: any) =>
    order.status === 'paid' || order.status === 'delivered'
  ) : [];

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
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${badge.className}`}>
        <Icon className="w-3 h-3" />
        <span>{badge.label}</span>
      </span>
    );
  };

  // Calcular estatísticas - apenas pedidos pagos/entregues contam para total gasto
  const stats = orders ? {
    total: orders.length,
    totalSpent: orders
      .filter((o: any) => o.status === 'paid' || o.status === 'delivered')
      .reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
    paid: orders.filter((o: any) => o.status === 'paid' || o.status === 'delivered').length,
  } : { total: 0, totalSpent: 0, paid: 0 };

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header com informações do cliente */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-xl">
                    {customer.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Minhas Compras</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>{customer.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                to={getShopUrl(storeSubdomain, '', true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para a loja
              </Link>
            </div>
          </div>

          {/* Estatísticas com design moderno */}
          {orders && orders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total de Pedidos</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Total Gasto</p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(stats.totalSpent)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Pedidos Aprovados</p>
                    <p className="text-3xl font-bold">{stats.paid}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-blue-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">
              Você ainda não realizou nenhuma compra.
            </p>
            <Link
              to={getShopUrl(storeSubdomain, '', true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
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
                to={getShopUrl(storeSubdomain, `my-orders/${order.order_number || order.id}`)}
                className="block bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all transform hover:-translate-y-1"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-lg font-bold text-blue-600">
                          Pedido {order.order_number || `#${order.id}`}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Nomes dos produtos */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-3">
                          {order.items.length === 1 ? (
                            <p className="text-base text-gray-800 font-semibold">
                              {order.items[0].product_name}
                            </p>
                          ) : (
                            <div>
                              <p className="text-base text-gray-800 font-semibold mb-1">
                                {order.items[0].product_name}
                                {order.items.length > 1 && (
                                  <span className="text-gray-500 font-normal"> +{order.items.length - 1} {order.items.length === 2 ? 'outro' : 'outros'}</span>
                                )}
                              </p>
                              {order.items.length > 1 && order.items.length <= 3 && (
                                <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                                  {order.items.slice(1).map((item: any, idx: number) => (
                                    <p key={idx}>• {item.product_name}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>
                            {new Date(order.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })} às {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(order.total))}
                      </p>
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
