import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Plus, Ban, CheckCircle, Eye, AlertCircle, Search, ExternalLink, DollarSign, TrendingUp } from 'lucide-react';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import StoreDetails from './StoreDetails';
import { useConfirm } from '../../hooks/useConfirm';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminStores() {
  const [page] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { confirm, Dialog } = useConfirm();

  const { data, isLoading, refetch, error } = useQuery(
    ['adminStores', page, debouncedSearchQuery],
    async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }
      const response = await api.get(`/api/admin/stores?${params.toString()}`);
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos - não recarregar automaticamente
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      onError: (err: any) => {
        console.error('Error fetching stores:', err);
        toast.error(err.response?.data?.error || 'Erro ao carregar lojas');
      },
    }
  );

  const handleSuspend = async (id: number) => {
    try {
      await api.post(`/api/admin/stores/${id}/suspend`);
      toast.success('Loja suspensa com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao suspender loja');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/api/admin/stores/${id}/activate`);
      toast.success('Loja ativada com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao ativar loja');
    }
  };

  const handleBlock = async (id: number) => {
    const confirmed = await confirm({
      title: 'Bloquear loja',
      message: 'Tem certeza que deseja BLOQUEAR esta loja? Esta ação pode ser revertida.',
      type: 'danger',
      confirmText: 'Bloquear',
    });
    if (!confirmed) {
      return;
    }
    try {
      await api.post(`/api/admin/stores/${id}/block`);
      toast.success('Loja bloqueada com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao bloquear loja');
    }
  };

  const getStoreUrl = (store: any) => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = window.location.port || '5173';
    const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

    if (isDevelopment) {
      return `http://localhost:${port}/${store.subdomain}`;
    }

    if (store.primary_domain) {
      return `https://${store.primary_domain}`;
    }

    return `https://${store.subdomain}.${baseDomain}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar lojas. Verifique o console.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const stores = data?.rows || data || [];
  const totalCount = data?.count || stores.length;

  // Calcular totais
  const totalRevenue = stores.reduce((sum: number, store: any) => sum + (store.stats?.totalRevenue || 0), 0);
  const totalAdminProfit = stores.reduce((sum: number, store: any) => sum + (store.stats?.adminProfit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lojas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {totalCount} loja{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Loja
        </button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Faturamento Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Lucro Total (Admin)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAdminProfit)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total de Lojas</p>
              <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, subdomínio, link ou e-mail..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Lista de Lojas */}
      {stores.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">Nenhuma loja encontrada.</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery ? 'Tente uma busca diferente.' : 'As lojas criadas aparecerão aqui automaticamente.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link do Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faturamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lucro Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.map((store: any) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.subdomain}</div>
                        <div className="text-xs text-gray-400">{store.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={getStoreUrl(store)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir loja
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          store.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : store.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : store.status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {store.status === 'active' ? 'Ativa' :
                         store.status === 'suspended' ? 'Suspensa' :
                         store.status === 'blocked' ? 'Bloqueada' :
                         'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(store.stats?.totalRevenue || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {store.stats?.totalOrders || 0} pedidos
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(store.stats?.adminProfit || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedStoreId(store.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {store.status === 'active' ? (
                          <>
                            <button
                              onClick={() => handleSuspend(store.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Suspender"
                            >
                              <AlertCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleBlock(store.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Bloquear"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivate(store.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Ativar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedStoreId && (
        <StoreDetails
          storeId={selectedStoreId}
          onClose={() => setSelectedStoreId(null)}
          onUpdate={() => {
            refetch();
            setSelectedStoreId(null);
          }}
        />
      )}
      {Dialog}
    </div>
  );
}
