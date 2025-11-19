import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { Store, Upload, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CreateStore() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    logo: null as File | null,
  });
  const navigate = useNavigate();

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('subdomain', formData.subdomain);
      formDataToSend.append('description', formData.description);

      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      await api.post('/api/stores/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualizar token com store_id atualizado
      const refreshResponse = await api.post('/api/auth/refresh-token');
      const { token, user } = refreshResponse.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);

      toast.success('Loja criada com sucesso!');
      navigate('/store');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Store className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Criar sua Loja
          </h1>
          <p className="text-gray-600">
            Configure sua loja virtual em poucos minutos
          </p>
        </div>

        <form onSubmit={handleCreateStore} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Loja *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Ex: Minha Loja Digital"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subdomínio *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="minha-loja"
              />
              <span className="text-gray-500 font-medium">.localhost</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apenas letras, números e hífens. Ex: minha-loja
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Loja
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              placeholder="Descreva sua loja, produtos que vende, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo da Loja (opcional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition">
              <div className="space-y-1 text-center">
                {formData.logo ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(formData.logo)}
                      alt="Preview"
                      className="mx-auto h-32 w-32 object-contain rounded-lg"
                    />
                    <p className="text-sm text-gray-600">{formData.logo.name}</p>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: null })}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="logo-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Enviar arquivo</span>
                        <input
                          id="logo-upload"
                          name="logo-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              logo: e.target.files?.[0] || null,
                            })
                          }
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center"
            >
              {loading ? (
                'Criando...'
              ) : (
                <>
                  Criar Loja
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

