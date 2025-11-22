import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { Upload, ArrowRight } from 'lucide-react';
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

      // Salvar token atual antes de fazer qualquer requisição
      const currentToken = localStorage.getItem('token');
      const currentUser = useAuthStore.getState().user;

      // Aguardar um pouco para garantir que o backend atualizou o user
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Buscar dados atualizados do usuário
      let updatedUser;
      try {
        const meResponse = await api.get('/api/auth/me');
        updatedUser = meResponse.data;
        console.log('[CreateStore] Dados atualizados do usuário:', updatedUser);
      } catch (meError) {
        console.error('[CreateStore] Erro ao buscar dados do usuário:', meError);
        // Continuar mesmo se falhar
      }

      // Tentar atualizar token, mas manter o atual se falhar
      let token = currentToken;
      let user = currentUser;

      try {
        const refreshResponse = await api.post('/api/auth/refresh-token');
        if (refreshResponse.data?.token) {
          token = refreshResponse.data.token;
          user = refreshResponse.data.user;
          console.log('[CreateStore] Token atualizado com sucesso');
        }
      } catch (refreshError: any) {
        console.error('[CreateStore] Erro ao atualizar token:', refreshError);
        // Manter token atual se refresh falhar
        if (!token) {
          token = localStorage.getItem('token');
        }
        if (!user) {
          user = updatedUser || useAuthStore.getState().user;
        }
      }

      // Usar os dados mais atualizados, garantindo store_id
      const finalUser = {
        ...(updatedUser || user || {}),
        store_id: updatedUser?.store_id || user?.store_id || createResponse.data.id,
      };

      // Garantir que temos um token antes de atualizar
      if (!token) {
        console.error('[CreateStore] Nenhum token disponível após criar loja');
        toast.error('Erro ao manter sessão. Por favor, faça login novamente.');
        // Não redirecionar, deixar o usuário tentar novamente
        return;
      }

      // Atualizar localStorage e store
      localStorage.setItem('token', token);
      useAuthStore.getState().setToken(token);
      localStorage.setItem('user', JSON.stringify(finalUser));
      useAuthStore.getState().setUser(finalUser);

      console.log('[CreateStore] Sessão atualizada:', { hasToken: !!token, store_id: finalUser.store_id });

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
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas - igual ao resto do site */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
            Criar nova loja
          </h1>
          <p className="text-lg text-gray-600">
            Configure sua loja em poucos minutos e comece a vender produtos digitais
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Header do Card */}
              <div className="flex items-center p-6 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none tracking-tight text-gray-900">
                    Informações da Loja
                  </h3>
                  <p className="text-sm text-gray-500">
                    Preencha os dados básicos para criar sua loja
                  </p>
                </div>
              </div>

              {/* Body do Card */}
              <div className="p-6 pt-6">
                <form onSubmit={handleCreateStore} className="space-y-5">
                  {/* Nome e Subdomínio lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 inline-flex items-center gap-1">
                        Nome da Loja <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Digite o nome da sua loja"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 inline-flex items-center gap-1">
                        Subdomínio <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                            <path d="M2 12h20"></path>
                          </svg>
                        </div>
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
                          className="flex h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 pl-10 pr-20 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Digite seu subdomínio"
                          disabled={loading}
                        />
                        <span className="absolute right-3 text-sm text-gray-500">.{baseDomain}</span>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Descrição da Loja
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="flex w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Descreva sua loja, produtos que vende, missão, etc..."
                      disabled={loading}
                    />
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 inline-flex items-center gap-1">
                      Logo <span className="text-gray-500 font-normal">(opcional)</span>
                    </label>
                    {logoPreview ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                              <img
                                src={logoPreview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm text-gray-900">Imagem selecionada</h3>
                              <p className="text-sm text-gray-500">Logo da sua loja</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, logo: null });
                                setLogoPreview(null);
                              }}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                              disabled={loading}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer block">
                        <div className="flex space-y-1.5 p-6 flex-row gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold leading-none tracking-tight text-gray-900 text-sm">
                              Escolha sua imagem
                            </h3>
                            <p className="text-sm text-gray-500">
                              Faça o upload de sua imagem por aqui
                            </p>
                          </div>
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

                  {/* Botão Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 justify-center px-4 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 rounded-lg w-full h-12 shadow-sm"
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
                      <>
                        Criar loja
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Informações Adicionais */}
          <div className="space-y-6">
            {/* Card de Preview do Subdomínio */}
            {formData.subdomain && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">URL da sua loja</h3>
                <p className="text-sm text-gray-600 break-all">
                  <span className="font-mono text-blue-600">{formData.subdomain}.{baseDomain}</span>
                </p>
              </div>
            )}

            {/* Card de Ajuda */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center p-6 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none tracking-tight text-gray-900 text-sm">
                    Dicas
                  </h3>
                  <p className="text-sm text-gray-500">
                    Algumas recomendações
                  </p>
                </div>
              </div>
              <div className="p-6 pt-6">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Escolha um nome que represente sua marca</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>O subdomínio deve ser único e fácil de lembrar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Você pode alterar essas informações depois</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
