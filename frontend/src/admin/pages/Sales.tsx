import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { ShoppingCart, Store as StoreIcon, Calendar, DollarSign, ExternalLink, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Sale {
  id: number;
  order_number: string;
  total: number;
  created_at: string;
  store: {
    id: number;
    name: string;
    subdomain: string;
    email: string;
  };
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  payment?: {
    pushin_pay_id?: string;
    mercado_pago_id?: string;
  };
}

export default function AdminSales() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const { data, isLoading, refetch } = useQuery<{ sales: Sale[]; count: number }>(
    ['adminSales', searchQuery, dateFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (dateFilter !== 'all') params.append('date', dateFilter);

      const response = await api.get(`/api/admin/sales?${params.toString()}`);
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStoreUrl = (subdomain: string) => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = window.location.port || '5173';
    const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

    if (isDevelopment) {
      return `http://localhost:${port}/${subdomain}`;
    }

    return `https://${subdomain}.${baseDomain}`;
  };

  const exportToCSV = () => {
    if (!data?.sales || data.sales.length === 0) {
      toast.error('Nenhuma venda para exportar');
      return;
    }

    const headers = ['ID', 'Order Number', 'Loja', 'Subdomain', 'Item', 'Quantidade', 'Preço Unitário', 'Total', 'Data/Hora', 'Pushin Pay ID', 'Mercado Pago ID'];
    const rows = data.sales.flatMap((sale) =>
      sale.items.map((item) => [
        sale.id,
        sale.order_number,
        sale.store.name,
        sale.store.subdomain,
        item.product_name,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(sale.total),
        formatDate(sale.created_at),
        sale.payment?.pushin_pay_id || '-',
        sale.payment?.mercado_pago_id || '-',
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Vendas exportadas com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600 mt-1">Todas as vendas realizadas na plataforma</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por loja, pedido, item..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas as vendas</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{data.count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.sales.reduce((sum, s) => sum + Number(s.total), 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <StoreIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lojas Únicas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(data.sales.map((s) => s.store.id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de vendas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Link da Loja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Pushin Pay ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mercado Pago ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.sales && data.sales.length > 0 ? (
                data.sales.flatMap((sale) =>
                  sale.items.map((item) => (
                    <tr key={`${sale.id}-${item.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{sale.id}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{sale.order_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StoreIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{sale.store.name}</div>
                            <div className="text-xs text-gray-500">{sale.store.subdomain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.product_name}</div>
                        <div className="text-xs text-gray-500">Qtd: {item.quantity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(Number(item.price))}</div>
                        <div className="text-xs text-gray-500">Total: {formatCurrency(Number(sale.total))}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(sale.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getStoreUrl(sale.store.subdomain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Abrir
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-700">
                          {sale.payment?.pushin_pay_id || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-700">
                          {sale.payment?.mercado_pago_id || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhuma venda encontrada</h3>
                    <p className="text-sm text-gray-500">As vendas aparecerão aqui quando forem realizadas</p>
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

