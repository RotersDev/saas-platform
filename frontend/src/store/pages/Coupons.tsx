import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

export default function StoreCoupons() {
  const { confirm, Dialog } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    is_secret: false,
    valid_from: '',
    valid_until: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('coupons', async () => {
    const response = await api.get('/api/coupons');
    return response.data;
  }, {
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/api/coupons', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Cupom criado com sucesso!');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/api/coupons/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Cupom atualizado!');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: number) => {
      await api.delete(`/api/coupons/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Cupom excluído!');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      usage_limit: '',
      is_secret: false,
      valid_from: '',
      valid_until: '',
    });
    setSelectedCoupon(null);
  };

  const handleEdit = (coupon: any) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_purchase: coupon.min_purchase || '',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '',
      is_secret: coupon.is_secret,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until.split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      value: parseFloat(formData.value),
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      valid_from: new Date(formData.valid_from),
      valid_until: new Date(formData.valid_until),
    };

    if (selectedCoupon) {
      updateMutation.mutate({ id: selectedCoupon.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
        <h1 className="text-3xl font-bold text-gray-900">Cupons</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((coupon: any) => (
              <li key={coupon.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600">
                          {coupon.code}
                        </p>
                        {coupon.is_secret && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Secreto
                          </span>
                        )}
                        {!coupon.is_active && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {coupon.type === 'percentage'
                          ? `${coupon.value}% de desconto`
                          : `R$ ${coupon.value} de desconto`}
                        {coupon.usage_limit && (
                          <span className="ml-2">
                            • {coupon.usage_count}/{coupon.usage_limit} usos
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: 'Excluir cupom',
                            message: 'Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.',
                            type: 'danger',
                            confirmText: 'Excluir',
                          });
                          if (confirmed) {
                            deleteMutation.mutate(coupon.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Ticket className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cupom</h3>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as any })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="percentage">Percentual</option>
                      <option value="fixed">Valor Fixo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de Uso
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compra Mínima
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto Máximo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Válido De *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Válido Até *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_secret"
                    checked={formData.is_secret}
                    onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_secret" className="ml-2 block text-sm text-gray-900">
                    Cupom secreto (não aparece na lista pública)
                  </label>
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
                    {selectedCoupon ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}
      {Dialog}
    </div>
  );
}
