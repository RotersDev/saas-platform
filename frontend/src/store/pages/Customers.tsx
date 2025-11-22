import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Users, Ban, CheckCircle, Search, Shield, ShieldOff, UserCheck, UserX, Mail, Phone, Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useDebounce } from '../../hooks/useDebounce';
import { useThemeStore } from '../themeStore';

export default function StoreCustomers() {
  const { theme } = useThemeStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();

  const { data, isLoading } = useQuery(
    ['customers', debouncedSearch, showBlockedOnly],
    async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (showBlockedOnly) params.append('blocked_only', 'true');
      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },
    {
      staleTime: 2 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  const blockMutation = useMutation(
    async (id: number) => {
      await api.put(`/api/customers/${id}/block`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Cliente bloqueado com sucesso!');
      },
      onError: () => {
        toast.error('Erro ao bloquear cliente');
      },
    }
  );

  const unblockMutation = useMutation(
    async (id: number) => {
      await api.put(`/api/customers/${id}/unblock`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Cliente desbloqueado com sucesso!');
      },
      onError: () => {
        toast.error('Erro ao desbloquear cliente');
      },
    }
  );

  const customers = data?.rows || [];
  const totalCustomers = data?.count || 0;
  const blockedCount = customers.filter((c: any) => c.is_blocked).length;
  const activeCount = customers.filter((c: any) => !c.is_blocked).length;

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-blue-600' : 'border-indigo-600'
        }`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Clientes</h1>
          <p className={`mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Gerencie seus clientes e bloqueios</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total de Clientes</p>
              <p className={`text-2xl font-bold mt-1 ${
                theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
              }`}>{totalCustomers}</p>
            </div>
            <div className={`rounded-full p-3 ${
              theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
            }`}>
              <Users className={`w-6 h-6 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Clientes Ativos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Clientes Bloqueados</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{blockedCount}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className={`rounded-xl shadow-sm p-6 border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white'
              }`}
            />
          </div>
          <button
            onClick={() => setShowBlockedOnly(!showBlockedOnly)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showBlockedOnly
                ? 'bg-red-600 text-white hover:bg-red-700'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBlockedOnly ? (
              <>
                <ShieldOff className="w-5 h-5" />
                Mostrar Bloqueados
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Ver Todos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Cliente
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Contato
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Estatísticas
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
              }`}>
                {customers.map((customer: any) => (
                  <tr key={customer.id} className={theme === 'dark' ? 'hover:bg-gray-700 transition-colors' : 'hover:bg-gray-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}>
                          <span className={`font-semibold text-sm ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{customer.name}</div>
                          <div className={`text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            ID: {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className={`flex items-center text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Mail className={`w-4 h-4 mr-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className={`flex items-center text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Phone className={`w-4 h-4 mr-2 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <ShoppingBag className={`w-4 h-4 mr-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{customer.total_orders}</span>
                          <span className={`ml-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>pedido{customer.total_orders !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <DollarSign className={`w-4 h-4 mr-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className={`font-semibold ${
                            theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                          }`}>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number(customer.total_spent))}
                          </span>
                        </div>
                        {customer.created_at && (
                          <div className={`flex items-center text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.is_blocked ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <Ban className="w-3 h-3 mr-1" />
                          Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {customer.is_blocked ? (
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: 'Desbloquear cliente',
                              message: `Deseja desbloquear ${customer.name}?`,
                              type: 'success',
                              confirmText: 'Desbloquear',
                            });
                            if (confirmed) {
                              unblockMutation.mutate(customer.id);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          title="Desbloquear cliente"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: 'Bloquear cliente',
                              message: `Deseja bloquear ${customer.name}? Este cliente não poderá mais fazer compras.`,
                              type: 'warning',
                              confirmText: 'Bloquear',
                            });
                            if (confirmed) {
                              blockMutation.mutate(customer.id);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          title="Bloquear cliente"
                        >
                          <Ban className="w-4 h-4 mr-1.5" />
                          Bloquear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {showBlockedOnly ? (
                <UserX className={`w-8 h-8 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
              ) : (
                <Users className={`w-8 h-8 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {showBlockedOnly ? 'Nenhum cliente bloqueado' : 'Nenhum cliente encontrado'}
            </h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {showBlockedOnly
                ? 'Não há clientes bloqueados no momento.'
                : search
                  ? 'Tente ajustar sua busca.'
                  : 'Ainda não há clientes cadastrados.'}
            </p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
