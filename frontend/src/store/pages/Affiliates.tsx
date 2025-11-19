import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, DollarSign, UserCheck } from 'lucide-react';

export default function StoreAffiliates() {
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    commission_rate: '',
  });
  const [payAmount, setPayAmount] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('affiliates', async () => {
    const response = await api.get('/api/affiliates');
    return response.data;
  }, {
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/api/affiliates', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('affiliates');
        toast.success('Afiliado criado com sucesso!');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const payMutation = useMutation(
    async ({ id, amount }: { id: number; amount: number }) => {
      await api.post(`/api/affiliates/${id}/pay`, { amount });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('affiliates');
        toast.success('Comissão paga com sucesso!');
        setShowPayModal(false);
        setPayAmount('');
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: '', email: '', commission_rate: '' });
    setSelectedAffiliate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      commission_rate: parseFloat(formData.commission_rate),
    });
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAffiliate) {
      const pendingCommission =
        Number(selectedAffiliate.total_commission) -
        Number(selectedAffiliate.paid_commission);
      if (parseFloat(payAmount) > pendingCommission) {
        toast.error('Valor excede a comissão pendente');
        return;
      }
      payMutation.mutate({
        id: selectedAffiliate.id,
        amount: parseFloat(payAmount),
      });
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Afiliados</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Afiliado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data && data.length > 0 ? (
          data.map((affiliate: any) => {
            const pendingCommission =
              Number(affiliate.total_commission) - Number(affiliate.paid_commission);
            return (
              <div key={affiliate.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{affiliate.name}</h3>
                    <p className="text-sm text-gray-500">{affiliate.email}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-indigo-600" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Código:</span>
                    <span className="font-medium">{affiliate.code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxa:</span>
                    <span className="font-medium">{affiliate.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vendas:</span>
                    <span className="font-medium">{affiliate.sales}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Comissão Total:</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(affiliate.total_commission))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pendente:</span>
                    <span className="font-medium text-orange-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pendingCommission)}
                    </span>
                  </div>
                </div>

                {pendingCommission > 0 && (
                  <button
                    onClick={() => {
                      setSelectedAffiliate(affiliate);
                      setPayAmount(pendingCommission.toString());
                      setShowPayModal(true);
                    }}
                    className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pagar Comissão
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum afiliado</h3>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Novo Afiliado</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa de Comissão (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.commission_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, commission_rate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagar */}
      {showPayModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Pagar Comissão</h2>
              <p className="text-sm text-gray-600 mb-4">
                Afiliado: {selectedAffiliate.name}
              </p>
              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPayModal(false);
                      setPayAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Pagar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
