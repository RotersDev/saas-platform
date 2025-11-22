import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Ticket, Calendar, X } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useThemeStore } from '../themeStore';

export default function StoreCoupons() {
  const { theme } = useThemeStore();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Cupons</h1>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </button>
      </div>

      <div className={`shadow overflow-hidden sm:rounded-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {data && data.length > 0 ? (
          <ul className={`divide-y ${
            theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            {data.map((coupon: any) => (
              <li key={coupon.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {coupon.code}
                          </p>
                        {coupon.is_secret && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Secreto
                          </span>
                        )}
                        {!coupon.is_active && (
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className={`mt-2 text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
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
                        className={theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}
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
                        className={theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
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
            <h3 className={`mt-2 text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            }`}>Nenhum cupom</h3>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-2xl w-full shadow-2xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="EXEMPLO123"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as any })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="percentage">Percentual</option>
                      <option value="fixed">Valor Fixo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Limite de Uso
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="Ilimitado"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Compra Mínima
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Desconto Máximo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Válido De *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.valid_from}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setFormData({ ...formData, valid_from: e.target.value });
                          // Se a data "até" for anterior à nova data "de", ajustar
                          if (formData.valid_until && e.target.value > formData.valid_until) {
                            setFormData({ ...formData, valid_from: e.target.value, valid_until: e.target.value });
                          }
                        }}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Válido Até *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.valid_until}
                        min={formData.valid_from || new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          // Validar que a data "até" não seja anterior à data "de"
                          if (!formData.valid_from || e.target.value >= formData.valid_from) {
                            setFormData({ ...formData, valid_until: e.target.value });
                          } else {
                            toast.error('A data "Válido Até" deve ser posterior ou igual à data "Válido De"');
                          }
                        }}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className={`flex items-center p-4 rounded-lg border-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    id="is_secret"
                    checked={formData.is_secret}
                    onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="is_secret" className={`ml-3 block text-sm font-medium cursor-pointer ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Cupom secreto (não aparece na lista pública)
                  </label>
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className={`flex-1 px-6 py-3 border-2 rounded-lg font-semibold transition-all ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isLoading || updateMutation.isLoading
                      ? 'Salvando...'
                      : selectedCoupon
                      ? 'Atualizar'
                      : 'Criar Cupom'}
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
