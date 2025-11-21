import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import { User, Trash2, Search, AlertTriangle, Mail, Calendar, Store as StoreIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../hooks/useConfirm';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();

  const { data, isLoading, refetch } = useQuery(
    ['adminAccounts', debouncedSearchQuery],
    async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }
      const response = await api.get(`/api/admin/accounts?${params.toString()}`);
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  const deleteAccountMutation = useMutation(
    async (userId: number) => {
      const response = await api.delete(`/api/admin/accounts/${userId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminAccounts');
        toast.success('Conta deletada com sucesso');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao deletar conta');
      },
    }
  );

  const handleDeleteAccount = async (account: any) => {
    // Primeira confirmação
    const firstConfirm = await confirm({
      title: '⚠️ ATENÇÃO: Deletar Conta',
      message: `Você está prestes a deletar permanentemente a conta de ${account.email}. Esta ação é IRREVERSÍVEL e deletará TODOS os dados associados.`,
      type: 'danger',
      confirmText: 'Sim, quero deletar',
    });

    if (!firstConfirm) return;

    // Segunda confirmação com mais detalhes
    const secondConfirm = await confirm({
      title: '⚠️ CONFIRMAÇÃO FINAL',
      message: `Tem CERTEZA ABSOLUTA que deseja deletar a conta de ${account.email}?\n\nIsso irá deletar:\n- Conta do usuário\n- Loja associada\n- Todos os produtos\n- Todo o estoque\n- Todas as categorias\n- Todos os pedidos\n- Todas as transações\n- TUDO relacionado a esta conta\n\nEsta ação NÃO PODE ser revertida!`,
      type: 'danger',
      confirmText: 'SIM, DELETAR TUDO',
    });

    if (!secondConfirm) return;

    // Terceira confirmação - pedir para digitar o email
    const emailConfirm = await confirm({
      title: '🔴 ÚLTIMA CONFIRMAÇÃO',
      message: `Para confirmar, digite o email da conta que deseja deletar:\n\n${account.email}`,
      type: 'danger',
      confirmText: 'Confirmar',
      requireInput: true,
      inputPlaceholder: 'Digite o email',
      inputMatch: account.email,
    });

    if (!emailConfirm) {
      toast.error('Email não confere. Operação cancelada.');
      return;
    }

    // Executar deleção
    try {
      await deleteAccountMutation.mutateAsync(account.id);
    } catch (error) {
      // Erro já tratado no mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const accounts = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por email, nome ou username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Contas */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta encontrada</h3>
          <p className="text-gray-500">
            {debouncedSearchQuery ? 'Tente ajustar sua busca' : 'Não há contas cadastradas'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account: any) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {account.name ? account.name.charAt(0).toUpperCase() : account.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {account.name || 'Sem nome'}
                          </div>
                          {account.username && (
                            <div className="text-xs text-gray-500">@{account.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {account.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.store ? (
                        <div className="flex items-center text-sm">
                          <StoreIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{account.store.name || account.store.subdomain}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sem loja</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {new Date(account.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        disabled={deleteAccountMutation.isLoading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {Dialog}
    </div>
  );
}

