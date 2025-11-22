import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Package, Filter } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useDebounce } from '../../hooks/useDebounce';
import { useThemeStore } from '../themeStore';

export default function StoreOrders() {
  const { theme } = useThemeStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { confirm, Dialog } = useConfirm();

  const { data, isLoading } = useQuery(
    ['orders', statusFilter, debouncedSearchQuery],
    async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      keepPreviousData: true, // Manter dados anteriores enquanto carrega
    }
  );

  const deliverMutation = useMutation(
    async (orderNumber: string) => {
      await api.post(`/api/orders/${encodeURIComponent(orderNumber)}/deliver`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Pedido entregue com sucesso!');
      },
    }
  );

  const cancelMutation = useMutation(
    async (orderNumber: string) => {
      await api.post(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Pedido cancelado!');
      },
    }
  );


  // Status badges com cores melhoradas
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: 'Pendente',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        dot: 'bg-yellow-500',
      },
      paid: {
        label: 'Pago',
        className: 'bg-green-50 text-green-700 border-green-200',
        dot: 'bg-green-500',
      },
      delivered: {
        label: 'Entregue',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      },
      cancelled: {
        label: 'Cancelado',
        className: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      },
      refunded: {
        label: 'Reembolsado',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        dot: 'bg-gray-500',
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border ${badge.className}`}>
        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
        {badge.label}
      </span>
    );
  };

  // Mostrar dados em cache enquanto carrega
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-blue-600' : 'border-indigo-600'
        }`}></div>
      </div>
    );
  }

  const statusOptions = [
    { value: '', label: 'Todos', count: data?.count || 0 },
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Pago' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Pedidos</h1>

        {/* Barra de pesquisa e filtros */}
        <div className={`rounded-xl shadow-sm border p-4 mb-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ID, email, nome do cliente ou produto..."
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                    : 'border-gray-300 bg-white'
                }`}
              />
            </div>

            {/* Filtros de status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`shadow-sm rounded-xl border overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {data?.rows && data.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    ID do Pedido
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Cliente
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Produtos
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Valor
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Data
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
              }`}>
                {data.rows.map((order: any) => (
                  <tr
                    key={order.id}
                    className={`transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => navigate(`/store/orders/${order.order_number || order.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        #{order.order_number || order.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{order.customer_name}</div>
                        <div className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                {item.product_name} x{item.quantity}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                +{order.items.length - 2} mais
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(order.total))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {order.status === 'paid' && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Entregar pedido',
                                message: 'Tem certeza que deseja marcar este pedido como entregue?',
                                type: 'success',
                                confirmText: 'Entregar',
                              });
                              if (confirmed) {
                                deliverMutation.mutate(order.order_number || order.id);
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'text-green-400 hover:bg-gray-700'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Entregar pedido"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Cancelar pedido',
                                message: 'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.',
                                type: 'danger',
                                confirmText: 'Cancelar',
                              });
                              if (confirmed) {
                                cancelMutation.mutate(order.order_number || order.id);
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'text-red-400 hover:bg-gray-700'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title="Cancelar pedido"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className={`mx-auto h-12 w-12 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`mt-2 text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Nenhum pedido encontrado</h3>
            <p className={`mt-1 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {searchQuery || statusFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Quando houver pedidos, eles aparecerão aqui'}
            </p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
