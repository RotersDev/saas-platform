import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Palette, Save, Upload, X, Image as ImageIcon } from 'lucide-react';

export default function StoreTheme() {
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
      const config: any = {};

      if (!isFormData) {
        config.headers = {
          'Content-Type': 'application/json',
        };
      }
      // Se for FormData, deixar o navegador definir o Content-Type com boundary

      const response = await api.put('/api/themes', data, config);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('theme');
        queryClient.invalidateQueries('shopTheme');
        toast.success('Tema atualizado com sucesso!');
        setLogoFile(null);
        setFaviconFile(null);
      },
    }
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logo_url: '' });
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    setFormData({ ...formData, favicon_url: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Se há arquivos, usar FormData
    if (logoFile || faviconFile) {
      const formDataToSend = new FormData();

      // Adicionar arquivos se houver
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      if (faviconFile) {
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
      if (!logoFile && formData.logo_url) {
        formDataToSend.append('logo_url', formData.logo_url);
      }
      if (!faviconFile && formData.favicon_url) {
        formDataToSend.append('favicon_url', formData.favicon_url);
      }

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

      // Manter URLs se existirem
      if (formData.logo_url) {
        dataToSend.logo_url = formData.logo_url;
      }
      if (formData.favicon_url) {
        dataToSend.favicon_url = formData.favicon_url;
      }

      updateMutation.mutate(dataToSend as any);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Personalizar Tema</h1>
        <p className="text-gray-600 mt-2">Customize as cores e imagens da sua loja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cores */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Palette className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cores do Tema</h2>
                <p className="text-sm text-gray-600">Defina as cores principais da sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      className="h-12 w-20 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, primary_color: e.target.value })
                      }
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                  <div
                    className="h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      className="h-12 w-20 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData({ ...formData, secondary_color: e.target.value })
                      }
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                  <div
                    className="h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      className="h-12 w-20 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="#007bff"
                    />
                  </div>
                  <div
                    className="h-12 rounded-lg border border-gray-200"
                    style={{ backgroundColor: formData.accent_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Imagens da Loja</h2>
                <p className="text-sm text-gray-600">Logo e favicon da sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-8">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Logo da Loja
              </label>
              <div className="flex flex-col md:flex-row gap-6">
                {logoPreview && (
                  <div className="relative flex-shrink-0">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
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
                    className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors w-full justify-center"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {logoPreview ? 'Trocar Logo' : 'Enviar Logo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Formatos aceitos: PNG, JPG, SVG. Tamanho recomendado: 200x60px
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Favicon (Ícone do Site)
              </label>
              <div className="flex flex-col md:flex-row gap-6">
                {faviconPreview && (
                  <div className="relative flex-shrink-0">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6">
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeFavicon}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
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
                    className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors w-full justify-center"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {faviconPreview ? 'Trocar Favicon' : 'Enviar Favicon'}
                  </label>
                  <p className="text-xs text-gray-500 mt-3 text-center">
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
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {updateMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
