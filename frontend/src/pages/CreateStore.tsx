import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { Store, Upload, ArrowRight, CheckCircle2, Sparkles, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CreateStore() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    logo: null as File | null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast.error('Por favor, informe o nome da loja');
      return;
    }

    if (!formData.subdomain.trim()) {
      toast.error('Por favor, informe o subdomínio');
      return;
    }

    // Validar formato do subdomínio
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast.error('O subdomínio deve conter apenas letras minúsculas, números e hífens');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('subdomain', formData.subdomain.trim().toLowerCase());
      formDataToSend.append('description', formData.description.trim());

      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      // Criar loja
      const createResponse = await api.post('/api/stores/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!createResponse.data) {
        throw new Error('Erro ao criar loja');
      }

      // Aguardar um pouco para garantir que o backend atualizou o user
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar dados atualizados do usuário
      let updatedUser;
      try {
        const meResponse = await api.get('/api/auth/me');
        updatedUser = meResponse.data;
      } catch (meError) {
        console.error('Erro ao buscar dados do usuário:', meError);
        // Continuar mesmo se falhar
      }

      // Atualizar token com store_id atualizado
      let token, user;
      try {
        const refreshResponse = await api.post('/api/auth/refresh-token');
        token = refreshResponse.data.token;
        user = refreshResponse.data.user;
      } catch (refreshError) {
        console.error('Erro ao atualizar token:', refreshError);
        // Tentar pegar token atual do localStorage
        token = localStorage.getItem('token');
        user = updatedUser || useAuthStore.getState().user;
      }

      // Usar os dados mais atualizados
      const finalUser = {
        ...user,
        store_id: updatedUser?.store_id || user?.store_id || createResponse.data.id,
      };

      // Atualizar localStorage e store
      if (token) {
        localStorage.setItem('token', token);
        useAuthStore.getState().setToken(token);
      }
      localStorage.setItem('user', JSON.stringify(finalUser));
      useAuthStore.getState().setUser(finalUser);

      toast.success('Loja criada com sucesso! 🎉');

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        setTimeout(() => {
          window.location.href = `https://${saasDomain}/store`;
        }, 500);
        return;
      }

      // Aguardar um pouco antes de navegar para garantir que tudo foi salvo
      setTimeout(() => {
        navigate('/store');
      }, 500);
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar loja. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

  return (
    <div className="min-h-screen relative py-8 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decorativo */}
      <div
        className="fixed inset-0 -z-10 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Crie sua Loja Virtual
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure sua loja em poucos minutos e comece a vender online hoje mesmo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Benefícios */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Por que escolher?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Setup Rápido</p>
                    <p className="text-sm text-gray-600">Configure em minutos e comece a vender</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Seguro e Confiável</p>
                    <p className="text-sm text-gray-600">Plataforma segura para seus clientes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fácil de Usar</p>
                    <p className="text-sm text-gray-600">Interface intuitiva e moderna</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-3">Passo a Passo</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Escolha um nome único</p>
                    <p className="text-sm text-blue-100">Seu nome será usado em toda a plataforma</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Configure seu subdomínio</p>
                    <p className="text-sm text-blue-100">Seus clientes acessarão por este endereço</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Personalize sua loja</p>
                    <p className="text-sm text-blue-100">Adicione logo e descrição</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <form onSubmit={handleCreateStore} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome da Loja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base"
                    placeholder="Ex: Minha Loja Digital"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subdomínio <span className="text-red-500">*</span>
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
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base"
                      placeholder="minha-loja"
                      disabled={loading}
                    />
                    <span className="text-gray-600 font-medium text-base">.{baseDomain}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Apenas letras minúsculas, números e hífens. Ex: minha-loja
                  </p>
                  {formData.subdomain && (
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                      Sua loja estará em: <span className="font-bold">{formData.subdomain}.{baseDomain}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição da Loja
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-base"
                    placeholder="Descreva sua loja, produtos que vende, missão, etc..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logo da Loja <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <div className="mt-1">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                          <img
                            src={logoPreview}
                            alt="Preview"
                            className="mx-auto h-32 w-32 object-contain rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, logo: null });
                            setLogoPreview(null);
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                          disabled={loading}
                        >
                          Remover logo
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold text-blue-600">Clique para enviar</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={loading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition text-base"
                    disabled={loading}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center text-base shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Criando loja...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Criar Loja
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
