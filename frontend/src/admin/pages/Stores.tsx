import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Plus, Edit, Trash2, Ban, CheckCircle, Eye, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import StoreDetails from './StoreDetails';

export default function AdminStores() {
  const [page, setPage] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const { data, isLoading, refetch, error } = useQuery(
    ['adminStores', page],
    async () => {
      const response = await api.get(`/api/admin/stores?page=${page}&limit=20`);
      console.log('Stores response:', response.data);
      return response.data;
    },
    {
      staleTime: 30 * 1000, // 30 segundos
      refetchInterval: 30000, // Atualizar a cada 30 segundos (menos agressivo)
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
    if (!confirm('Tem certeza que deseja BLOQUEAR esta loja? Esta ação pode ser revertida.')) {
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

  // Mostrar dados em cache enquanto carrega
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Verificar se há erro
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
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

      {stores.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">Nenhuma loja cadastrada ainda.</p>
          <p className="text-gray-400 text-sm mt-2">
            As lojas criadas aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {stores.map((store: any) => (
              <li key={store.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {store.name}
                      </p>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {store.subdomain}
                        </p>
                        {store.email && (
                          <p className="flex items-center text-sm text-gray-500 mt-1">
                            {store.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
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
                    ) : store.status === 'suspended' ? (
                      <button
                        onClick={() => handleActivate(store.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Ativar"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
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
                </div>
              </li>
            ))}
          </ul>
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
    </div>
  );
}


