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
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('subdomain', formData.subdomain.trim());
      formDataToSend.append('description', formData.description.trim());

      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      await api.post('/api/stores/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Aguardar um pouco para garantir que o backend atualizou o user
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar dados atualizados do usuário
      const meResponse = await api.get('/api/auth/me');
      const updatedUser = meResponse.data;

      // Atualizar token com store_id atualizado
      const refreshResponse = await api.post('/api/auth/refresh-token');
      const { token, user } = refreshResponse.data;

      // Usar os dados mais atualizados
      const finalUser = {
        ...user,
        store_id: updatedUser.store_id || user.store_id,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(finalUser));
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(finalUser);

      toast.success('Loja criada com sucesso!');

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        setTimeout(() => {
          window.location.href = `https://${saasDomain}/store`;
        }, 300);
        return;
      }

      // Aguardar um pouco antes de navegar para garantir que tudo foi salvo
      setTimeout(() => {
        navigate('/store');
      }, 300);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-8 px-4">
      {/* Background com degradê sutil e bolinhas azuis */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 75%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
          backgroundPosition: '0 0, 0 0',
        }}
      />
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Coluna Esquerda - Informações */}
          <div className="flex flex-col justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 md:p-8">
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Criar sua Loja
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Configure sua loja virtual em poucos minutos
                </p>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Escolha um nome único</p>
                    <p className="text-xs">Seu nome será usado em toda a plataforma</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Configure seu subdomínio</p>
                    <p className="text-xs">Seus clientes acessarão por este endereço</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Personalize sua loja</p>
                    <p className="text-xs">Adicione logo e descrição para destacar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 md:p-8">
            <form onSubmit={handleCreateStore} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Loja *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
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
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-sm"
              placeholder="Descreva sua loja, produtos que vende, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo da Loja (opcional)
            </label>
            <div className="mt-1 flex justify-center px-4 pt-4 pb-5 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition">
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
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center text-sm"
                >
                  {loading ? (
                    'Criando...'
                  ) : (
                    <>
                      Criar Loja
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

