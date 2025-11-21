import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, XCircle, Clock, User, Store as StoreIcon, Mail, CreditCard, AlertCircle } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

interface WithdrawalData {
  id: string;
  amount: number;
  pix_key: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  created_at: string;
  store?: {
    id: number;
    name: string;
    subdomain: string;
    email: string;
  };
  wallet?: {
    full_name: string;
    cpf: string;
    email: string;
  };
}

interface PersonalDataRegistration {
  id: number;
  store?: {
    id: number;
    name: string;
    subdomain: string;
    email: string;
  };
  full_name: string;
  cpf: string;
  email: string;
  birth_date: string;
  created_at: string;
}

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'registrations'>('withdrawals');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<WithdrawalData | null>(null);

  const { data, isLoading, refetch } = useQuery<{
    withdrawals: WithdrawalData[];
    count: number;
    personalDataRegistrations: PersonalDataRegistration[];
  }>('adminWithdrawals', async () => {
    const response = await api.get('/api/admin/withdrawals');
    return response.data;
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const approveMutation = useMutation(
    async (id: string) => {
      const response = await api.post(`/api/admin/withdrawals/${id}/approve`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminWithdrawals');
        toast.success('Saque aprovado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao aprovar saque');
      },
    }
  );

  const rejectMutation = useMutation(
    async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/api/admin/withdrawals/${id}/reject`, { reason });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminWithdrawals');
        toast.success('Saque cancelado com sucesso!');
        setShowRejectModal(null);
        setRejectReason('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao cancelar saque');
      },
    }
  );

  const handleApprove = async (withdrawal: WithdrawalData) => {
    const confirmed = await confirm({
      title: 'Aprovar saque',
      message: `Deseja aprovar o saque de R$ ${withdrawal.amount.toFixed(2).replace('.', ',')}? Um email será enviado ao usuário.`,
      type: 'success',
      confirmText: 'Aprovar',
    });

    if (confirmed) {
      approveMutation.mutate(withdrawal.id);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;

    if (!rejectReason.trim()) {
      toast.error('Informe o motivo do cancelamento');
      return;
    }

    const confirmed = await confirm({
      title: 'Cancelar saque',
      message: `Deseja cancelar este saque? O valor será devolvido para a carteira e um email será enviado ao usuário.`,
      type: 'danger',
      confirmText: 'Cancelar',
    });

    if (confirmed) {
      rejectMutation.mutate({ id: showRejectModal.id, reason: rejectReason.trim() });
    }
  };

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

  const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return cpf;
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      processing: { label: 'Processando', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pendingWithdrawals = data?.withdrawals.filter((w) => w.status === 'pending') || [];
  const allWithdrawals = data?.withdrawals || [];
  const registrations = data?.personalDataRegistrations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saques</h1>
          <p className="text-gray-600 mt-1">Gerencie saques e cadastros de dados pessoais</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === 'withdrawals'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Saques
            {pendingWithdrawals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === 'registrations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Novos Cadastros
            {registrations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {registrations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo: Saques */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {pendingWithdrawals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  {pendingWithdrawals.length} saque{pendingWithdrawals.length !== 1 ? 's' : ''} pendente{pendingWithdrawals.length !== 1 ? 's' : ''} aguardando aprovação
                </p>
              </div>
            </div>
          )}

          {allWithdrawals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum saque encontrado</h3>
              <p className="text-sm text-gray-500">Os saques aparecerão aqui quando forem solicitados</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Loja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Chave PIX</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono">{withdrawal.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StoreIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{withdrawal.store?.name || '-'}</div>
                              <div className="text-xs text-gray-500">{withdrawal.store?.subdomain || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{withdrawal.wallet?.full_name || '-'}</div>
                              <div className="text-xs text-gray-500">{withdrawal.wallet?.email || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(withdrawal.amount)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-700">{withdrawal.pix_key}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(withdrawal.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(withdrawal.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          {withdrawal.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(withdrawal)}
                                disabled={approveMutation.isLoading}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => setShowRejectModal(withdrawal)}
                                disabled={rejectMutation.isLoading}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Novos Cadastros */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {registrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum cadastro recente</h3>
              <p className="text-sm text-gray-500">Novos cadastros de dados pessoais aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <StoreIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{registration.store?.name || 'Loja'}</h3>
                          <p className="text-sm text-gray-500">{registration.store?.subdomain || '-'}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Nome Completo</p>
                            <p className="text-sm font-medium text-gray-900">{registration.full_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">CPF</p>
                            <p className="text-sm font-medium text-gray-900">{formatCPF(registration.cpf)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">E-mail</p>
                            <p className="text-sm font-medium text-gray-900">{registration.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Data de Nascimento</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(registration.birth_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Cadastrado em: {formatDate(registration.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Cancelar Saque */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cancelar Saque</h2>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>ID:</strong> {showRejectModal.id}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Valor:</strong> {formatCurrency(showRejectModal.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Loja:</strong> {showRejectModal.store?.name || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo do cancelamento *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Informe o motivo do cancelamento..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este motivo será enviado por email ao usuário
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isLoading || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectMutation.isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {Dialog}
    </div>
  );
}

