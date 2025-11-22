import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Palette, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useThemeStore } from '../themeStore';

export default function StoreTheme() {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#007bff',
    font_family: '',
    logo_url: '',
    favicon_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery('theme', async () => {
    const response = await api.get('/api/themes');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        primary_color: data.primary_color || '#000000',
        secondary_color: data.secondary_color || '#ffffff',
        accent_color: data.accent_color || '#007bff',
        font_family: data.font_family || '',
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || '',
      });
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
      if (data.favicon_url) {
        setFaviconPreview(data.favicon_url);
      }
    }
  }, [data]);

  const updateMutation = useMutation(
    async (data: FormData | any) => {
      // Se for FormData, não definir Content-Type (navegador define automaticamente)
      // Se for objeto, enviar como JSON
      const isFormData = data instanceof FormData;
      const config: any = {
        headers: {},
      };

      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }
      // Para FormData, não definir Content-Type - o interceptor do axios já remove

      console.log('[Theme] Enviando requisição:', {
        isFormData,
        hasLogo: isFormData ? data.has('logo') : false,
        hasFavicon: isFormData ? data.has('favicon') : false,
        contentType: config.headers['Content-Type'] || 'multipart/form-data (auto)',
      });

      const response = await api.put('/api/themes', data, config);
      return response.data;
    },
    {
      onSuccess: (data) => {
        console.log('[Theme] Resposta do backend:', data);
        queryClient.invalidateQueries('theme');
        queryClient.invalidateQueries('shopTheme');
        toast.success('Tema atualizado com sucesso!');

        // Atualizar previews com as URLs retornadas do backend
        // IMPORTANTE: Só atualizar se realmente recebeu uma URL do backend
        // Se havia um arquivo sendo enviado, manter o preview até receber a URL
        if (data.logo_url) {
          console.log('[Theme] Atualizando logo preview com URL:', data.logo_url);
          setLogoPreview(data.logo_url);
          setFormData((prev) => ({ ...prev, logo_url: data.logo_url }));
          setLogoFile(null); // Limpar apenas após receber URL
        } else if (data.logo_url === null || data.logo_url === '') {
          // Só limpar se explicitamente removido
          if (!logoFile) {
            setLogoPreview(null);
            setFormData((prev) => ({ ...prev, logo_url: '' }));
          }
        } else if (logoFile) {
          // Se enviou arquivo mas não recebeu URL, manter preview local
          console.log('[Theme] Arquivo enviado mas URL não retornada, mantendo preview local');
        }

        if (data.favicon_url) {
          console.log('[Theme] Atualizando favicon preview com URL:', data.favicon_url);
          setFaviconPreview(data.favicon_url);
          setFormData((prev) => ({ ...prev, favicon_url: data.favicon_url }));
          setFaviconFile(null); // Limpar apenas após receber URL
        } else if (data.favicon_url === null || data.favicon_url === '') {
          // Só limpar se explicitamente removido
          if (!faviconFile) {
            setFaviconPreview(null);
            setFormData((prev) => ({ ...prev, favicon_url: '' }));
          }
        } else if (faviconFile) {
          // Se enviou arquivo mas não recebeu URL, manter preview local
          console.log('[Theme] Arquivo enviado mas URL não retornada, mantendo preview local');
        }
      },
      onError: (error: any) => {
        console.error('[Theme] Erro ao atualizar tema:', error);
        toast.error(error.response?.data?.error || 'Erro ao atualizar tema');
      },
    }
  );

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  const removeLogo = async () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, logo_url: '' }));

    // Salvar remoção imediatamente no backend
    try {
      const dataToSend: any = {
        primary_color: formData.primary_color || '#000000',
        secondary_color: formData.secondary_color || '#ffffff',
        accent_color: formData.accent_color || '#007bff',
        logo_url: '', // String vazia para remover
      };

      if (formData.font_family && formData.font_family.trim()) {
        dataToSend.font_family = formData.font_family;
      }

      if (formData.favicon_url) {
        dataToSend.favicon_url = formData.favicon_url;
      }

      await api.put('/api/themes', dataToSend, {
        headers: { 'Content-Type': 'application/json' },
      });

      queryClient.invalidateQueries('theme');
      queryClient.invalidateQueries('shopTheme');
      toast.success('Logo removida com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao remover logo');
    }
  };

  const removeFavicon = async () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    setFormData((prev) => ({ ...prev, favicon_url: '' }));

    // Salvar remoção imediatamente no backend
    try {
      const dataToSend: any = {
        primary_color: formData.primary_color || '#000000',
        secondary_color: formData.secondary_color || '#ffffff',
        accent_color: formData.accent_color || '#007bff',
        favicon_url: '', // String vazia para remover
      };

      if (formData.font_family && formData.font_family.trim()) {
        dataToSend.font_family = formData.font_family;
      }

      if (formData.logo_url) {
        dataToSend.logo_url = formData.logo_url;
      }

      await api.put('/api/themes', dataToSend, {
        headers: { 'Content-Type': 'application/json' },
      });

      queryClient.invalidateQueries('theme');
      queryClient.invalidateQueries('shopTheme');
      toast.success('Favicon removido com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao remover favicon');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Se há arquivos, usar FormData
    if (logoFile || faviconFile) {
      const formDataToSend = new FormData();

      // Adicionar arquivos se houver
      if (logoFile) {
        console.log('[Theme] Adicionando logo ao FormData:', {
          name: logoFile.name,
          type: logoFile.type,
          size: logoFile.size,
        });
        formDataToSend.append('logo', logoFile);
      }
      if (faviconFile) {
        console.log('[Theme] Adicionando favicon ao FormData:', {
          name: faviconFile.name,
          type: faviconFile.type,
          size: faviconFile.size,
        });
        formDataToSend.append('favicon', faviconFile);
      }

      // Adicionar outros campos
      formDataToSend.append('primary_color', formData.primary_color || '#000000');
      formDataToSend.append('secondary_color', formData.secondary_color || '#ffffff');
      formDataToSend.append('accent_color', formData.accent_color || '#007bff');
      if (formData.font_family && formData.font_family.trim()) {
        formDataToSend.append('font_family', formData.font_family);
      }

      // Se não há arquivo novo mas há URL, manter a URL
      // Se logo_url está vazio, enviar como string vazia para remover
      if (!logoFile) {
        formDataToSend.append('logo_url', formData.logo_url || '');
      }
      if (!faviconFile) {
        formDataToSend.append('favicon_url', formData.favicon_url || '');
      }

      console.log('[Theme] Enviando FormData com arquivos');
      updateMutation.mutate(formDataToSend);
    } else {
      // Se não há arquivos, enviar como JSON
      const dataToSend: any = {
        primary_color: formData.primary_color || '#000000',
        secondary_color: formData.secondary_color || '#ffffff',
        accent_color: formData.accent_color || '#007bff',
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.font_family && formData.font_family.trim()) {
        dataToSend.font_family = formData.font_family;
      }

      // Enviar URLs (vazias se foram removidas, ou manter existentes)
      if (formData.logo_url !== undefined) {
        dataToSend.logo_url = formData.logo_url || '';
      }
      if (formData.favicon_url !== undefined) {
        dataToSend.favicon_url = formData.favicon_url || '';
      }

      updateMutation.mutate(dataToSend as any);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-blue-600' : 'border-indigo-600'
        }`}></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Personalizar Tema</h1>
        <p className={`mt-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Customize as cores e imagens da sua loja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cores */}
        <div className={`rounded-xl border shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Palette className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Cores do Tema</h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Defina as cores principais da sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cor Primária
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, primary_color: e.target.value })
                      }
                      className={`h-12 w-20 border-2 rounded-lg cursor-pointer ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, primary_color: e.target.value })
                      }
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder="#000000"
                    />
                  </div>
                  <div
                    className={`h-12 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cor Secundária
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, secondary_color: e.target.value })
                      }
                      className={`h-12 w-20 border-2 rounded-lg cursor-pointer ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, secondary_color: e.target.value })
                      }
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder="#ffffff"
                    />
                  </div>
                  <div
                    className={`h-12 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cor de Destaque
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      className={`h-12 w-20 border-2 rounded-lg cursor-pointer ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder="#007bff"
                    />
                  </div>
                  <div
                    className={`h-12 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: formData.accent_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className={`rounded-xl border shadow-sm ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <ImageIcon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Imagens da Loja</h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Logo e favicon da sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-8">
            {/* Logo */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Logo da Loja
              </label>
              <div className="flex flex-col md:flex-row gap-6">
                {logoPreview && (
                  <div className="relative flex-shrink-0">
                    <div className={`border-2 border-dashed rounded-xl p-6 ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeLogo();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center px-6 py-3 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition-colors w-full justify-center ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {logoPreview ? 'Trocar Logo' : 'Enviar Logo'}
                  </label>
                  <p className={`text-xs mt-3 text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Formatos aceitos: PNG, JPG, SVG. Tamanho recomendado: 200x60px
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Favicon (Ícone do Site)
              </label>
              <div className="flex flex-col md:flex-row gap-6">
                {faviconPreview && (
                  <div className="relative flex-shrink-0">
                    <div className={`border-2 border-dashed rounded-xl p-6 ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavicon();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconChange}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label
                    htmlFor="favicon-upload"
                    className={`inline-flex items-center px-6 py-3 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition-colors w-full justify-center ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {faviconPreview ? 'Trocar Favicon' : 'Enviar Favicon'}
                  </label>
                  <p className={`text-xs mt-3 text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Formatos aceitos: PNG, ICO. Tamanho recomendado: 32x32 ou 64x64px
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isLoading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {updateMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
