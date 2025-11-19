import { useQuery } from 'react-query';
import api from '../../config/axios';
import { DollarSign, ShoppingCart, Package, TrendingUp, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function StoreDashboard() {
  const [copied, setCopied] = useState(false);

  // Buscar informações da loja
  const { data: store } = useQuery('store', async () => {
    const response = await api.get('/api/stores');
    return response.data;
  }, {
    staleTime: Infinity, // Nunca ficar stale
  });

  const { data: stats, isLoading: statsLoading } = useQuery('storeStats', async () => {
    const response = await api.get('/api/orders?limit=1000');
    const orders = response.data.rows || [];

    // Calcular estatísticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const dailySales = orders
      .filter((o: any) => o.status === 'paid' && new Date(o.created_at) >= today)
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const weeklySales = orders
      .filter((o: any) => o.status === 'paid' && new Date(o.created_at) >= thisWeek)
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const monthlySales = orders
      .filter((o: any) => o.status === 'paid' && new Date(o.created_at) >= thisMonth)
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: any) => o.status === 'paid').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;

    // Gráfico de vendas dos últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const salesChart = last7Days.map((date) => {
      const daySales = orders
        .filter(
          (o: any) =>
            o.status === 'paid' &&
            new Date(o.created_at).toDateString() === date.toDateString()
        )
        .reduce((sum: number, o: any) => sum + Number(o.total), 0);

      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: daySales,
      };
    });

    return {
      dailySales,
      weeklySales,
      monthlySales,
      totalOrders,
      paidOrders,
      pendingOrders,
      salesChart,
    };
  }, {
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: products } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    // A resposta pode ser { rows: [], count: 0 } ou um array direto
    return Array.isArray(response.data) ? response.data : (response.data?.rows || []);
  }, {
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: recentOrders } = useQuery('recentOrders', async () => {
    const response = await api.get('/api/orders?limit=5');
    return response.data.rows || [];
  }, {
    staleTime: 1 * 60 * 1000, // 1 minuto
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

    const baseDomain = (import.meta as any).env?.VITE_BASE_DOMAIN || 'nerix.site';

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

  // Não mostrar loading se já tiver dados em cache
  if (statsLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Vendas Hoje',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.dailySales || 0),
      icon: DollarSign,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Vendas Semanais',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.weeklySales || 0),
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Vendas Mensais',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.monthlySales || 0),
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive',
    },
    {
      name: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      change: `${stats?.paidOrders || 0} pagos`,
      changeType: 'neutral',
    },
    {
      name: 'Produtos',
      value: Array.isArray(products) ? products.length : 0,
      icon: Package,
      change: `${Array.isArray(products) ? products.filter((p: any) => p.is_active).length : 0} ativos`,
      changeType: 'neutral',
    },
    {
      name: 'Pedidos Pendentes',
      value: stats?.pendingOrders || 0,
      icon: ShoppingCart,
      change: 'Aguardando pagamento',
      changeType: 'negative',
    },
  ];

  const topProducts = Array.isArray(products)
    ? products.sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5)
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {store && (
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-indigo-900 font-medium">
                {getStoreUrl()}
              </span>
              <button
                onClick={copyStoreUrl}
                className="ml-2 p-1 hover:bg-indigo-100 rounded transition-colors"
                title="Copiar link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-indigo-600" />
                )}
              </button>
              <a
                href={getStoreUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
              >
                Abrir Loja
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive'
                              ? 'text-green-600'
                              : stat.changeType === 'negative'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Vendas */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Vendas dos Últimos 7 Dias
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.salesChart || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#4f46e5"
                strokeWidth={2}
                name="Vendas (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Produtos Mais Vendidos
          </h2>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.sales_count} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(product.promotional_price || product.price))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum produto vendido ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(order.total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'paid'
                          ? 'Pago'
                          : order.status === 'pending'
                          ? 'Pendente'
                          : order.status === 'delivered'
                          ? 'Entregue'
                          : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum pedido ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
