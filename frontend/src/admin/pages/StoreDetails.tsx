import { useQuery } from 'react-query';
import api from '../../config/axios';
import { X, Store, Globe, Mail, Phone, Calendar, DollarSign, Package, ShoppingCart, CreditCard, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import toast from 'react-hot-toast';

interface StoreDetailsProps {
  storeId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function StoreDetails({ storeId, onClose, onUpdate }: StoreDetailsProps) {
  const { data: store, isLoading, refetch } = useQuery(
    ['storeDetails', storeId],
    async () => {
      const response = await api.get(`/api/admin/stores/${storeId}`);
      return response.data;
    }
  );

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'blocked') => {
    try {
      if (newStatus === 'blocked') {
        if (!confirm('Tem certeza que deseja BLOQUEAR esta loja? Esta ação pode ser revertida.')) {
          return;
        }
        await api.post(`/api/admin/stores/${storeId}/block`);
        toast.success('Loja bloqueada com sucesso!');
      } else if (newStatus === 'suspended') {
        if (!confirm('Tem certeza que deseja SUSPENDER esta loja?')) {
          return;
        }
        await api.post(`/api/admin/stores/${storeId}/suspend`);
        toast.success('Loja suspensa com sucesso!');
      } else {
        await api.post(`/api/admin/stores/${storeId}/activate`);
        toast.success('Loja ativada com sucesso!');
      }
      onUpdate();
      refetch();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.error || 'Erro ao alterar status da loja');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const stats = store.stats || {};
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    trial: 'bg-blue-100 text-blue-800',
  };

  const statusLabels = {
    active: 'Ativa',
    suspended: 'Suspensa',
    blocked: 'Bloqueada',
    trial: 'Trial',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[store.status as keyof typeof statusColors] || statusColors.trial}`}>
              {statusLabels[store.status as keyof typeof statusLabels] || 'Trial'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Subdomínio:</span>
                  <span className="text-sm font-medium text-gray-900">{store.subdomain}</span>
                </div>
                {store.domain && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Domínio:</span>
                    <span className="text-sm font-medium text-gray-900">{store.domain}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{store.email}</span>
                </div>
                {store.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm font-medium text-gray-900">{store.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(store.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>

            {/* Plano e Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Plano e Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Plano:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {store.plan?.name || 'N/A'}
                  </span>
                </div>
                {store.trial_ends_at && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Trial até:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(store.trial_ends_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">White Label:</span>
                  <span className={`text-sm font-medium ${store.is_white_label ? 'text-green-600' : 'text-gray-600'}`}>
                    {store.is_white_label ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Faturamento Total</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                R$ {Number(stats.totalRevenue || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Pedidos Pagos</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.paidOrders || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Pedidos</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.totalOrders || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Produtos</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.totalProducts || 0}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Ações</h3>
            <div className="flex flex-wrap gap-2">
              {store.status !== 'active' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ativar
                </button>
              )}
              {store.status !== 'suspended' && (
                <button
                  onClick={() => handleStatusChange('suspended')}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Suspender
                </button>
              )}
              {store.status !== 'blocked' && (
                <button
                  onClick={() => handleStatusChange('blocked')}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear
                </button>
              )}
            </div>
          </div>

          {/* Faturas Recentes */}
          {stats.recentInvoices && stats.recentInvoices.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Faturas Recentes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {stats.recentInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(invoice.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.status}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        R$ {Number(invoice.amount || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

