import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  Info,
  AlertCircle,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  CreditCard,
  User,
  Sparkles,
} from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useThemeStore } from '../themeStore';

interface PersonalData {
  full_name: string;
  cpf: string;
  birth_date: string;
  email: string;
}

interface WalletData {
  available_balance: number;
  retained_balance: number;
  has_personal_data: boolean;
  personal_data?: PersonalData;
  pix_key?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  created_at: string;
  rejection_reason?: string | null;
  processed_at?: string | null;
}

const MIN_WITHDRAWAL = 5.00;
const MAX_WITHDRAWAL = 50000.00;
const MAX_WITHDRAWALS_PER_DAY = 10;
const WITHDRAWAL_DAYS = '1 a 3 dias úteis';

export default function Wallet() {
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'withdraws' | 'transactions'>('withdraws');
  const [showPersonalDataForm, setShowPersonalDataForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});

  const [personalData, setPersonalData] = useState<PersonalData>({
    full_name: '',
    cpf: '',
    birth_date: '',
    email: '',
  });

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);

  // Buscar dados da carteira
  const { data: walletData, isLoading } = useQuery<WalletData>(
    'wallet',
    async () => {
      const response = await api.get('/api/wallet');
      return response.data;
    },
    {
      refetchOnMount: true,
    }
  );

  // Buscar saques
  const { data: withdrawals } = useQuery<Withdrawal[]>(
    'withdrawals',
    async () => {
      const response = await api.get('/api/wallet/withdrawals');
      return response.data || [];
    },
    {
      enabled: !!walletData?.has_personal_data,
    }
  );

  // Buscar transações
  const { data: transactions } = useQuery(
    'walletTransactions',
    async () => {
      const response = await api.get('/api/wallet/transactions');
      return response.data || [];
    },
    {
      enabled: !!walletData?.has_personal_data,
    }
  );

  // Salvar dados pessoais
  const savePersonalDataMutation = useMutation(
    async (data: PersonalData) => {
      const response = await api.post('/api/wallet/personal-data', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('wallet');
        toast.success('Dados pessoais cadastrados com sucesso!');
        setShowPersonalDataForm(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao salvar dados pessoais');
      },
    }
  );

  // Criar saque
  const createWithdrawalMutation = useMutation(
    async (data: { amount: number; pix_key: string }) => {
      const response = await api.post('/api/wallet/withdrawals', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('wallet');
        queryClient.invalidateQueries('withdrawals');
        toast.success('Saque solicitado com sucesso!');
        setShowWithdrawalForm(false);
        setWithdrawalAmount('');
        setPixKey('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao solicitar saque');
      },
    }
  );

  useEffect(() => {
    if (walletData?.personal_data) {
      setPersonalData(walletData.personal_data);
    }
    if (walletData?.pix_key) {
      setPixKey(walletData.pix_key);
    }
  }, [walletData]);

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    savePersonalDataMutation.mutate(personalData);
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount.replace(',', '.'));

    if (amount < MIN_WITHDRAWAL) {
      toast.error(`O valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }

    if (amount > MAX_WITHDRAWAL) {
      toast.error(`O valor máximo para saque é R$ ${MAX_WITHDRAWAL.toFixed(2)}`);
      return;
    }

    if (amount > (walletData?.available_balance || 0)) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!pixKey.trim()) {
      toast.error('Informe a chave PIX');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar saque',
      message: `Você está solicitando um saque de R$ ${amount.toFixed(2).replace('.', ',')}. Deseja continuar?`,
      type: 'info',
      confirmText: 'Confirmar',
    });

    if (confirmed) {
      createWithdrawalMutation.mutate({ amount, pix_key: pixKey.trim() });
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20' },
      approved: { label: 'Aprovado', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
      rejected: { label: 'Rejeitado', className: 'bg-red-500/15 text-red-600 border-red-500/20' },
      processing: { label: 'Processando', className: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não tem dados pessoais, mostrar layout profissional com botão
  if (!walletData?.has_personal_data) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Carteira</h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Gerencie seus saques e transações</p>
        </div>

        {/* Card Principal */}
        <div className={`rounded-2xl border shadow-lg overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-8 sm:p-12">
            <div className="text-center max-w-2xl mx-auto space-y-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${
                theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <WalletIcon className={`w-7 h-7 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>

              <div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Cadastre seus dados pessoais</h2>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Para realizar saques, precisamos verificar sua identidade.
                  Seus dados são protegidos e usados apenas para processar transações.
                </p>
              </div>

              <button
                onClick={() => setShowPersonalDataForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <User className="w-5 h-5" />
                Se registrar
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Cadastro */}
        {showPersonalDataForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPersonalDataForm(false)}
            ></div>
            <div className="flex min-h-full items-center justify-center p-4">
              <div className={`relative rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                {/* Header do Modal */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-xl font-bold text-white">Cadastro de Dados Pessoais</h2>
                    <p className="text-blue-100 text-sm mt-1">Preencha seus dados para começar</p>
                  </div>
                  <button
                    onClick={() => setShowPersonalDataForm(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="p-6 sm:p-8">
                  <div className={`border rounded-xl p-4 mb-6 ${
                    theme === 'dark'
                      ? 'bg-blue-900/20 border-blue-800'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                        }`}>Por que precisamos desses dados?</p>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                        }`}>
                          Para garantir a segurança e conformidade, precisamos verificar sua identidade antes de permitir saques.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSavePersonalData} className="space-y-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={personalData.full_name}
                        onChange={(e) => setPersonalData({ ...personalData, full_name: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                            : 'border-gray-200 bg-white'
                        }`}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          CPF *
                        </label>
                        <input
                          type="text"
                          required
                          value={personalData.cpf}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                            setPersonalData({ ...personalData, cpf: formatted });
                          }}
                          maxLength={14}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-200 bg-white'
                          }`}
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Data de Nascimento *
                        </label>
                        <input
                          type="date"
                          required
                          value={personalData.birth_date}
                          onChange={(e) => setPersonalData({ ...personalData, birth_date: e.target.value })}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-200 bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={personalData.email}
                        onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                            : 'border-gray-200 bg-white'
                        }`}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowPersonalDataForm(false)}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savePersonalDataMutation.isLoading}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {savePersonalDataMutation.isLoading ? 'Salvando...' : 'Salvar Dados'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {Dialog}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Moderno */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="space-y-2">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Carteira</h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Gerencie seus saques e transações</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowHowItWorks(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl hover:border-blue-300 transition-all text-sm font-medium ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                : 'bg-white border-gray-200 hover:bg-blue-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Como funciona?
          </button>
          <button
            onClick={() => setShowPersonalDataForm(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl hover:border-blue-300 transition-all text-sm font-medium ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                : 'bg-white border-gray-200 hover:bg-blue-50'
            }`}
          >
            <User className="w-4 h-4" />
            Dados Pessoais
          </button>
          <button
            onClick={() => setShowWithdrawalForm(true)}
            disabled={(walletData?.available_balance || 0) < MIN_WITHDRAWAL}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <ArrowDownCircle className="w-5 h-5" />
            Realizar saque
          </button>
        </div>
      </div>

      {/* Aviso sobre taxas - Design Moderno */}
      <div className={`border-2 rounded-2xl p-6 shadow-sm ${
        theme === 'dark'
          ? 'bg-blue-900/20 border-blue-800'
          : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Informações sobre taxas</h3>
            <div className={`space-y-1 text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <p>
                <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Taxa da Gateway:</strong> R$ 0,70 + 3% sobre o valor da venda
              </p>
              <p>
                <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Taxa da Plataforma:</strong> 3% sobre o valor da venda
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Saldo - Design Profissional */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`rounded-lg border shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="mb-2">
              <h3 className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Saldo disponível</h3>
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
            }`}>
              {formatCurrency(walletData?.available_balance || 0)}
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Valor disponível para saque</p>
          </div>
        </div>

        <div className={`rounded-lg border shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="mb-2">
              <h3 className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Saldo retido</h3>
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
            }`}>
              {formatCurrency(walletData?.retained_balance || 0)}
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Aguardando processamento</p>
          </div>
        </div>
      </div>

      {/* Tabs Modernas */}
      <div className={`rounded-2xl border-2 shadow-lg overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`border-b px-6 ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('withdraws')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'withdraws'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400 bg-gray-800'
                    : 'border-blue-600 text-blue-600 bg-white'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Saques
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'transactions'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400 bg-gray-800'
                    : 'border-blue-600 text-blue-600 bg-white'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Transações
            </button>
          </div>
        </div>

        {/* Conteúdo das tabs */}
        <div className="p-6">
          {activeTab === 'withdraws' && (
            <div>
              {withdrawals && withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className={`border-2 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                          }`}>
                            <CreditCard className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-sm font-mono font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>#{withdrawal.id}</span>
                              {getStatusBadge(withdrawal.status)}
                            </div>
                            <div className={`flex items-center gap-4 text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <span className={`font-semibold ${
                                theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                              }`}>{formatCurrency(withdrawal.amount)}</span>
                              <span>•</span>
                              <span>{formatDate(withdrawal.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowWithdrawalDetails(true);
                          }}
                          className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <WalletIcon className={`w-8 h-8 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Nenhum saque realizado</h3>
                  <p className={`mb-6 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Seus saques aparecerão aqui</p>
                  <button
                    onClick={() => setShowWithdrawalForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <ArrowDownCircle className="w-5 h-5" />
                    Realizar primeiro saque
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className={`rounded-lg border p-4 hover:shadow-md transition-shadow ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className={`font-semibold text-sm ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{transaction.description || 'Crédito na carteira'}</h4>
                              <p className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {new Date(transaction.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="ml-12 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Valor creditado:</span>
                              <span className="font-semibold text-green-600">
                                + {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(transaction.amount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Saldo anterior:</span>
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(transaction.previous_balance)}
                              </span>
                            </div>
                            <div className={`flex items-center justify-between text-xs pt-1 border-t ${
                              theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                            }`}>
                              <span className={`font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>Saldo atual:</span>
                              <span className={`font-bold ${
                                theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
                              }`}>
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(transaction.new_balance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <TrendingUp className={`w-8 h-8 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Nenhuma transação encontrada</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Suas transações aparecerão aqui quando houver vendas aprovadas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Como funciona - Design Moderno */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Como funciona a carteira?</h2>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              </div>

              <div className="p-8 space-y-6">
              <p className={`leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Utilizando esta ferramenta de Carteira, quando você realizar uma venda, o dinheiro será enviado diretamente para sua carteira. Em seguida, você poderá resgatar este dinheiro facilmente através de uma transferência Pix.
              </p>

              <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl divide-y divide-gray-200">
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm font-medium text-gray-700">Saque mínimo</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(MIN_WITHDRAWAL)}</span>
                </div>
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm font-medium text-gray-700">Limite máximo de saque (por dia)</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(MAX_WITHDRAWAL)}</span>
                </div>
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm font-medium text-gray-700">Limite de saques (por dia)</span>
                  <span className="text-sm font-bold text-gray-900">{MAX_WITHDRAWALS_PER_DAY}</span>
                </div>
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm font-medium text-gray-700">Prazo de saque</span>
                  <span className="text-sm font-bold text-gray-900">{WITHDRAWAL_DAYS}</span>
                </div>
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm font-medium text-gray-700">Métodos de transferência</span>
                  <span className="text-sm font-bold text-gray-900">Chave Pix</span>
                </div>
                <div className="p-4 bg-red-50 border-t-2 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-red-900">Importante</span>
                      <p className="text-sm text-red-800 mt-1">
                        Leia os{' '}
                        <a href="/legal/terms" className="text-red-600 hover:underline font-medium">
                          termos de uso
                        </a>{' '}
                        antes do uso!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-blue-900 flex-1 leading-relaxed">
                    Esta ferramenta é extremamente útil pois oferece um gateway próprio de pagamento. Assim que o usuário pagar, você terá o dinheiro direto na sua conta, e então poderá resgatar através de uma transferência no pix.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Perguntas frequentes</h3>
                <div className="space-y-3">
                    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
                      <button
                        onClick={() => setFaqOpen({ ...faqOpen, pix: !faqOpen.pix })}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-3 font-medium text-gray-900">
                          <HelpCircle className="w-5 h-5 text-blue-600" />
                          Onde eu configuro a chave pix?
                        </span>
                      {faqOpen.pix ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {faqOpen.pix && (
                      <div className="px-5 pb-5 pt-0 border-t border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed pt-4">
                          A chave pix você configura durante o saque, ao clicar em{' '}
                          <button
                            onClick={() => {
                              setShowHowItWorks(false);
                              setShowWithdrawalForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-semibold underline"
                          >
                            realizar saque
                          </button>{' '}
                          você irá preencher as informações como a chave do pix.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
                    <button
                      onClick={() => setFaqOpen({ ...faqOpen, time: !faqOpen.time })}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-3 font-medium text-gray-900">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        Quanto tempo leva o saque?
                      </span>
                      {faqOpen.time ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {faqOpen.time && (
                      <div className="px-5 pb-5 pt-0 border-t border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed pt-4">
                          Geralmente o saque é feito em menos de 1 hora, porém o nosso tempo de garantia de entrega é de 1 a 3 dias úteis, isto é levado em consideração pois pode haver muitos saques durante o tempo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ok, entendi!
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dados Pessoais - Design Moderno */}
      {showPersonalDataForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPersonalDataForm(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Dados Pessoais</h2>
              </div>
              <button
                onClick={() => setShowPersonalDataForm(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              </div>

              <form onSubmit={handleSavePersonalData} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={personalData.full_name}
                  onChange={(e) => setPersonalData({ ...personalData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={personalData.cpf}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                      setPersonalData({ ...personalData, cpf: formatted });
                    }}
                    maxLength={14}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={personalData.birth_date}
                    onChange={(e) => setPersonalData({ ...personalData, birth_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={personalData.email}
                  onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPersonalDataForm(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savePersonalDataMutation.isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {savePersonalDataMutation.isLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Realizar Saque - Design Moderno */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdrawalForm(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Realizar Saque</h2>
                </div>
                <button
                onClick={() => setShowWithdrawalForm(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateWithdrawal} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  required
                  value={withdrawalAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                    setWithdrawalAmount(value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold"
                  placeholder="0,00"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Mínimo: {formatCurrency(MIN_WITHDRAWAL)} | Máximo: {formatCurrency(MAX_WITHDRAWAL)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chave PIX *
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                />
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Prazo de entrega</p>
                    <p className="text-xs text-blue-800">{WITHDRAWAL_DAYS}</p>
                  </div>
                </div>
              </div>

              {walletData?.personal_data?.full_name && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900 mb-1">Atenção</h4>
                      <p className="text-sm text-amber-800">
                        O saque será realizado para o nome cadastrado: <strong>{walletData.personal_data.full_name}</strong>
                      </p>
                      <p className="text-xs text-amber-700 mt-2">
                        Certifique-se de que a chave PIX informada pertence a esta pessoa.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalForm(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createWithdrawalMutation.isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {createWithdrawalMutation.isLoading ? 'Processando...' : 'Confirmar Saque'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Saque */}
      {showWithdrawalDetails && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdrawalDetails(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WalletIcon className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Detalhes do Saque</h2>
                </div>
                <button
                  onClick={() => setShowWithdrawalDetails(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ID do Saque</p>
                    <p className="font-mono font-semibold text-gray-900">#{selectedWithdrawal.id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedWithdrawal.created_at)}</p>
                  </div>

                  {selectedWithdrawal.status === 'rejected' && selectedWithdrawal.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-900 mb-1">Motivo da Rejeição</h4>
                          <p className="text-sm text-red-800">{selectedWithdrawal.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowWithdrawalDetails(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Dialog}
    </div>
  );
}
