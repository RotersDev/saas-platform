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
import { useThemeStore } from '../themeStore';
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
  const { theme } = useThemeStore();

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
            <h1 className={`text-2xl sm:text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Dashboard</h1>
            <p className={`mt-1 text-sm sm:text-base ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Visão geral das suas vendas e métricas</p>
          </div>

          {/* Botão único para ir ao site - bem posicionado */}
          {store && (
            <a
              href={getStoreUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all text-sm font-semibold whitespace-nowrap"
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
              className={`w-full sm:w-auto flex items-center gap-1.5 px-3 py-2.5 border shadow-sm rounded-lg text-sm font-medium transition-colors justify-between sm:min-w-[200px] ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-gray-500" />
                <span>Período</span>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}>
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
                <div className={`absolute left-0 sm:right-0 mt-2 w-full sm:w-64 border rounded-lg shadow-xl z-50 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-3">
                    {(['today', 'week', 'month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => handlePeriodSelect(period)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                          selectedPeriod === period
                            ? theme === 'dark'
                              ? 'bg-blue-900/50 text-blue-400 font-medium'
                              : 'bg-blue-50 text-blue-700 font-medium'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {period === 'today' ? 'Hoje' :
                         period === 'week' ? 'Semana' :
                         period === 'month' ? 'Mês' : 'Ano'}
                      </button>
                    ))}
                    <div className={`border-t my-2 ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}></div>
                    <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Personalizado</div>
                    <div className="px-3 py-2 space-y-2">
                      <div>
                        <label className={`block text-xs mb-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>De</label>
                        <input
                          type="date"
                          value={customRange.start || ''}
                          onChange={(e) => {
                            setCustomRange({ ...customRange, start: e.target.value });
                            setSelectedPeriod('custom');
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Até</label>
                        <input
                          type="date"
                          value={customRange.end || ''}
                          onChange={(e) => {
                            setCustomRange({ ...customRange, end: e.target.value });
                            setSelectedPeriod('custom');
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
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
        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            {stats?.salesChange !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.salesChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {formatPercent(stats.salesChange)}
              </div>
            )}
          </div>
          <h3 className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Receita Total</h3>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
          }`}>{formatCurrency(stats?.totalSales || 0)}</p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>Período selecionado</p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <ShoppingCart className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            {stats?.ordersChange !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ordersChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {formatPercent(stats.ordersChange)}
              </div>
            )}
          </div>
          <h3 className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Total de Pedidos</h3>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
          }`}>{stats?.totalOrders || 0}</p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>Vendas realizadas</p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
          </div>
          <h3 className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Ticket Médio</h3>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
          }`}>{formatCurrency(stats?.averageOrderValue || 0)}</p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>Por pedido</p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Eye className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
          </div>
          <h3 className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Visitas</h3>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
          }`}>{visitStats?.totalVisits || 0}</p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>{visitStats?.uniqueVisits || 0} únicas</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas */}
        <div className={`lg:col-span-2 rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Evolução de Vendas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#000',
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: theme === 'dark' ? '#fff' : '#000' }} />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Vendas (R$)"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Status - Design Profissional */}
        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="mb-6">
            <h2 className={`text-lg font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Status dos Pedidos</h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Distribuição por status</p>
          </div>

          {/* Gráfico de Pizza - Melhorado */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats?.statusData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {(stats?.statusData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                    border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: theme === 'dark' ? '#fff' : '#000',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} pedidos`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda - Design Elegante */}
          <div className={`space-y-3 pt-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
          }`}>
            {(stats?.statusData || []).map((entry: any, index: number) => {
              const total = stats?.statusData?.reduce((sum: number, e: any) => sum + e.value, 0) || 1;
              const percentage = ((entry.value / total) * 100).toFixed(1);

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-24 h-2 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: entry.color,
                        }}
                      ></div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                      }`}>{entry.value}</span>
                      <span className={`text-xs ml-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>({percentage}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gráfico de Pedidos e Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pedidos */}
        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Pedidos por Dia</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#000',
                }}
              />
              <Bar dataKey="pedidos" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Produtos */}
        <div className={`rounded-xl border p-6 shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Produtos Mais Vendidos</h2>
          <div className="space-y-4">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((product: any, index: number) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      theme === 'dark' ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{product.name}</p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                    }`}>{formatCurrency(product.revenue)}</p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Receita</p>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Nenhum produto vendido no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>Pedido</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>Cliente</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>Valor</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>Data</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
            }`}>
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{order.order_number}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>{order.customer_name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                    }`}>
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'paid' || order.payment_status === 'paid' || order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'paid' || order.payment_status === 'paid' || order.status === 'delivered'
                          ? 'Aprovado'
                          : order.status === 'pending'
                          ? 'Pendente'
                          : order.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
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
                  <td colSpan={5} className={`px-6 py-8 text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
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
