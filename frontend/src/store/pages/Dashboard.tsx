import { useQuery, useQueryClient } from 'react-query';
import api from '../../config/axios';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type CustomDateRange = { start: string; end: string };

export default function StoreDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries('storeStats');
      queryClient.invalidateQueries('recentOrders');
      queryClient.invalidateQueries('visitStats');
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: store } = useQuery('store', async () => {
    const response = await api.get('/api/stores');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  const getDateRangeDates = (): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    if (selectedPeriod === 'custom' && customRange.start && customRange.end) {
      start = new Date(customRange.start);
      const endDate = new Date(customRange.end);
      end.setTime(endDate.getTime());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (selectedPeriod) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
      }
    }

    return { start, end };
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Semana';
      case 'month':
        return 'Mês';
      case 'year':
        return 'Ano';
      case 'custom':
        if (customRange.start && customRange.end) {
          const startDate = new Date(customRange.start);
          const endDate = new Date(customRange.end);
          return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
        }
        return 'Personalizado';
      default:
        return 'Mês';
    }
  };

  const handlePeriodSelect = (period: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setShowPeriodDropdown(false);
    }
  };

  const { data: stats, isLoading: statsLoading } = useQuery(
    ['storeStats', selectedPeriod, customRange],
    async () => {
      const response = await api.get('/api/orders?limit=1000');
      const orders = response.data.rows || [];

      // VERIFICAÇÃO CRÍTICA: Garantir que todos os pedidos pertencem à loja atual
      const storeId = store?.id;
      let validOrders = orders;

      if (storeId) {
        validOrders = orders.filter((o: any) => {
          // Verificar se o pedido tem store_id e corresponde à loja atual
          return o.store_id === storeId || o.store?.id === storeId;
        });

        // Se houver pedidos filtrados, usar apenas eles
        if (validOrders.length !== orders.length) {
          console.warn(`[Dashboard] Filtrados ${orders.length - validOrders.length} pedidos que não pertencem à loja ${storeId}`);
        }
      }

      const { start, end } = getDateRangeDates();

      const isValidSale = (order: any) => {
        return order.payment_status === 'paid' || order.status === 'paid' || order.status === 'delivered';
      };

      // Filtrar pedidos do período selecionado (usar validOrders que já foi filtrado por store_id)
      const filteredOrders = validOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return isValidSale(o) && orderDate >= start && orderDate <= end;
      });

      const allTimeOrders = validOrders.filter((o: any) => isValidSale(o));

      // Período anterior para comparação (mesmo período anterior)
      const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - periodDays);
      const previousEnd = new Date(start);

      const previousPeriodOrders = validOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return isValidSale(o) && orderDate >= previousStart && orderDate < previousEnd;
      });

      const totalSales = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const previousTotalSales = previousPeriodOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const salesChange = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;

      const totalOrders = filteredOrders.length;
      const previousTotalOrders = previousPeriodOrders.length;
      const ordersChange = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0;

      // Calcular vendas por dia para o gráfico
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const chartData = Array.from({ length: Math.min(daysDiff, 30) }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const daySales = filteredOrders
          .filter((o: any) => {
            const orderDate = new Date(o.created_at);
            return orderDate >= date && orderDate < nextDate;
          })
          .reduce((sum: number, o: any) => sum + Number(o.total), 0);

        const dayOrders = filteredOrders.filter((o: any) => {
          const orderDate = new Date(o.created_at);
          return orderDate >= date && orderDate < nextDate;
        }).length;

        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          vendas: daySales,
          pedidos: dayOrders,
        };
      });

      // Status dos pedidos: apenas Pendentes e Aprovados (entregues/aprovados)
      const approvedOrders = filteredOrders.filter((o: any) =>
        o.status === 'delivered' || o.status === 'paid' || o.payment_status === 'paid'
      ).length;
      const pendingOrders = validOrders.filter((o: any) =>
        o.status === 'pending' && o.payment_status !== 'paid'
      ).length;

      const statusData = [
        { name: 'Aprovados', value: approvedOrders, color: '#10b981' },
        { name: 'Pendentes', value: pendingOrders, color: '#f59e0b' },
      ];

      // Top produtos
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      filteredOrders.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            if (!productSales[item.product_name]) {
              productSales[item.product_name] = {
                name: item.product_name,
                sales: 0,
                revenue: 0,
              };
            }
            productSales[item.product_name].sales += item.quantity || 1;
            productSales[item.product_name].revenue += Number(item.total || item.price || 0);
          });
        }
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalSales,
        previousTotalSales,
        salesChange,
        totalOrders,
        previousTotalOrders,
        ordersChange,
        chartData,
        statusData,
        topProducts,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        allTimeRevenue: allTimeOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0),
      };
    },
    {
      staleTime: 0,
      refetchOnMount: true,
      refetchInterval: 30000,
    }
  );

  const { data: visitStats } = useQuery(
    ['visitStats', selectedPeriod, customRange],
    async () => {
      const { start, end } = getDateRangeDates();
      const response = await api.get(`/api/visits/stats?start=${start.toISOString()}&end=${end.toISOString()}`);
      return response.data;
    },
    {
      staleTime: 0,
      refetchOnMount: true,
      refetchInterval: 30000,
    }
  );

  const { data: recentOrders } = useQuery('recentOrders', async () => {
    const response = await api.get('/api/orders?limit=5');
    return response.data.rows || [];
  }, {
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
  });

  const getStoreUrl = () => {
    if (!store) return '';
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = window.location.port || '5173';
    if (isDevelopment) {
      return `http://localhost:${port}/${store.subdomain}`;
    }
    const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';
    if (store.primary_domain) {
      return `https://${store.primary_domain}`;
    }
    return `https://${store.subdomain}.${baseDomain}`;
  };



  if (statsLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Botão único para ir ao site - bem posicionado */}
          {store && (
            <a
              href={getStoreUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all text-sm font-semibold whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Visitar Loja</span>
              <span className="sm:hidden">Loja</span>
            </a>
          )}
        </div>

        {/* Filtro de Período - Profissional com Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Botão de Período com Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="w-full sm:w-auto flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 bg-white shadow-sm hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors justify-between sm:min-w-[200px]"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-gray-500" />
                <span>Período</span>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {getPeriodLabel()}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown - melhorado para mobile */}
            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="p-3">
                    {(['today', 'week', 'month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => handlePeriodSelect(period)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                          selectedPeriod === period
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {period === 'today' ? 'Hoje' :
                         period === 'week' ? 'Semana' :
                         period === 'month' ? 'Mês' : 'Ano'}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Personalizado</div>
                    <div className="px-3 py-2 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">De</label>
                        <input
                          type="date"
                          value={customRange.start || ''}
                          onChange={(e) => {
                            setCustomRange({ ...customRange, start: e.target.value });
                            setSelectedPeriod('custom');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Até</label>
                        <input
                          type="date"
                          value={customRange.end || ''}
                          onChange={(e) => {
                            setCustomRange({ ...customRange, end: e.target.value });
                            setSelectedPeriod('custom');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            {stats?.salesChange !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.salesChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {formatPercent(stats.salesChange)}
              </div>
            )}
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">Receita Total</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalSales || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
            </div>
            {stats?.ordersChange !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ordersChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {formatPercent(stats.ordersChange)}
              </div>
            )}
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">Total de Pedidos</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Vendas realizadas</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">Ticket Médio</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.averageOrderValue || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Por pedido</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Eye className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">Visitas</h3>
          <p className="text-2xl font-bold text-gray-900">{visitStats?.totalVisits || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{visitStats?.uniqueVisits || 0} únicas</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Evolução de Vendas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#4f46e5"
                strokeWidth={2}
                name="Vendas (R$)"
                dot={{ fill: '#4f46e5', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Status - melhorado para mobile */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Status dos Pedidos</h2>
          <div className="flex flex-col sm:block">
            {/* Lista de status para mobile */}
            <div className="sm:hidden space-y-3 mb-4">
              {(stats?.statusData || []).map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({((entry.value / (stats?.statusData?.reduce((sum: number, e: any) => sum + e.value, 0) || 1)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Gráfico para desktop */}
            <div className="hidden sm:block">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.statusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(stats?.statusData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Pedidos e Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pedidos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pedidos por Dia</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="pedidos" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Produtos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Produtos Mais Vendidos</h2>
          <div className="space-y-4">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">Receita</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum produto vendido no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'paid' || order.payment_status === 'paid' || order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'paid' || order.payment_status === 'paid' || order.status === 'delivered'
                          ? 'Aprovado'
                          : order.status === 'pending'
                          ? 'Pendente'
                          : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
