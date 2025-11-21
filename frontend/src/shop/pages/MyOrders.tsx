import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { useState, useEffect } from 'react';
import {
  Package, ArrowLeft, CheckCircle2, Clock, XCircle,
  ShoppingBag, DollarSign, Calendar, ChevronRight
} from 'lucide-react';
import { getShopUrl, getLoginUrl } from '../../utils/urlUtils';
import Footer from '../components/Footer';

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
      navigate(getLoginUrl(storeSubdomain));
      return;
    }

    setCustomer(JSON.parse(customerData));
  }, [storeSubdomain, navigate]);

  const { data: ordersData, isLoading } = useQuery(
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
    <div className="min-h-screen flex flex-col">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-1">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Minhas Compras</h1>
              <p className="text-sm text-gray-600">Acompanhe todos os seus pedidos</p>
            </div>
            <Link
              to={getShopUrl(storeSubdomain)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a loja
            </Link>
          </div>

          {/* Estatísticas */}
          {orders && orders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Total de Pedidos</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Gasto</p>
                    <p className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(stats.totalSpent)}
                    </p>
                  </div>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Pedidos Aprovados</p>
                    <p className="text-xl font-bold text-gray-900">{stats.paid}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-sm text-gray-600 mb-6">
              Você ainda não realizou nenhuma compra.
            </p>
            <Link
              to={getShopUrl(storeSubdomain)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                to={`/${storeSubdomain}/my-orders/${order.order_number || order.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">
                          {order.order_number || `#${order.id}`}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Nomes dos produtos */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-2">
                          {order.items.length === 1 ? (
                            <p className="text-sm text-gray-700 font-medium">
                              {order.items[0].product_name}
                            </p>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                {order.items[0].product_name}
                                {order.items.length > 1 && (
                                  <span className="text-gray-500"> +{order.items.length - 1} {order.items.length === 2 ? 'outro' : 'outros'}</span>
                                )}
                              </p>
                              {order.items.length > 1 && order.items.length <= 3 && (
                                <div className="text-xs text-gray-600 space-y-0.5">
                                  {order.items.slice(1).map((item: any, idx: number) => (
                                    <p key={idx}>• {item.product_name}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
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
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(order.total))}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-1 ml-auto" />
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
