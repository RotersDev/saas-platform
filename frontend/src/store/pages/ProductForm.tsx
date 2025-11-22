import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2, Info, Box, FileText, Layers } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useThemeStore } from '../themeStore';

type TabType = 'BASIC_INFO' | 'INVENTORY' | 'ADVANCED';

export default function StoreProductForm() {
  const { theme } = useThemeStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const { confirm, Dialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<TabType>('BASIC_INFO');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    price: '',
    promotional_price: '',
    stock_limit: '',
    min_quantity: '',
    max_quantity: '',
    images: [] as string[],
    is_active: true,
    featured: false,
  });

  const [inventoryType, setInventoryType] = useState<'lines' | 'text' | 'file'>('lines');
  const [inventoryLines, setInventoryLines] = useState<string[]>(['']);
  const [inventoryText, setInventoryText] = useState('');
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar categorias
  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/api/categories');
    return response.data;
  });

  // Buscar produto se estiver editando
  const { data: product, isLoading: productLoading } = useQuery(
    ['product', id],
    async () => {
      const response = await api.get(`/api/products/${id}`);
      return response.data;
    },
    {
      enabled: isEditing,
    }
  );

  // Buscar chaves do produto se estiver editando
  const { data: productKeys } = useQuery(
    ['productKeys', id],
    async () => {
      try {
        const response = await api.get(`/api/products/${id}/keys`);
        return response.data || [];
      } catch (error: any) {
        // Se não encontrar chaves ou produto não existir, retornar array vazio
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    {
      enabled: isEditing && !!id,
      retry: false,
    }
  );

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category_id: product.category_id || '',
        price: product.price || '',
        promotional_price: product.promotional_price || '',
        stock_limit: product.stock_limit || '',
        min_quantity: product.min_quantity || '',
        max_quantity: product.max_quantity || '',
        images: product.images || [],
        is_active: product.is_active !== undefined ? product.is_active : true,
        featured: product.featured || false,
      });

      // Carregar tipo de estoque
      if (product.inventory_type) {
        setInventoryType(product.inventory_type);
      }

      if (product.inventory_type === 'text' && product.inventory_text) {
        setInventoryText(product.inventory_text);
      }

      if (product.inventory_type === 'file' && product.inventory_file_url) {
        setInventoryFile(null); // Arquivo precisa ser reenviado
        // TODO: Mostrar URL do arquivo existente
      }

      if (product.inventory_type === 'lines') {
        // Linhas serão carregadas via productKeys
      }
    }
  }, [product]);

  useEffect(() => {
    if (isEditing && inventoryType === 'lines') {
      if (productKeys && productKeys.length > 0) {
        // Quando está editando e tipo é linhas, carregar chaves do banco
        setInventoryLines(productKeys.map((pk: any) => pk.key));
      } else {
        setInventoryLines(['']);
      }
    }
  }, [productKeys, isEditing, inventoryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.category_id) {
      toast.error('Selecione uma categoria ou crie uma categoria primeiro');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();

    // Sempre enviar imagens (mesmo que vazio) para permitir remoção
    // Se há arquivos novos, enviar os arquivos
    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
    }

    // Sempre enviar as imagens existentes (pode estar vazio para remover todas)
    // Se há arquivos novos, combinar com as existentes
    // Se não há arquivos novos, apenas enviar as existentes (ou vazio se removidas)
    formDataToSend.append('images', JSON.stringify(formData.images));

    formDataToSend.append('name', formData.name);
    formDataToSend.append('slug', formData.slug);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category_id', formData.category_id);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('promotional_price', formData.promotional_price || '');
    formDataToSend.append('stock_limit', formData.stock_limit || '');
    formDataToSend.append('min_quantity', formData.min_quantity || '');
    formDataToSend.append('max_quantity', formData.max_quantity || '');
    formDataToSend.append('is_active', formData.is_active.toString());
    formDataToSend.append('featured', formData.featured.toString());

    try {
      let productId = id;

      if (isEditing) {
        await api.put(`/api/products/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        productId = id;
      } else {
        const response = await api.post('/api/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        productId = response.data.id;
      }

      // Salvar tipo de estoque no produto
      formDataToSend.append('inventory_type', inventoryType);

      if (inventoryType === 'text') {
        formDataToSend.append('inventory_text', inventoryText);
        formDataToSend.append('inventory_file_url', '');
        // Limpar todas as chaves quando muda para texto
        if (isEditing && productKeys && productKeys.length > 0) {
          await api.delete(`/api/products/${productId}/keys`);
        }
      } else if (inventoryType === 'file' && inventoryFile) {
        formDataToSend.append('inventory_file', inventoryFile);
        formDataToSend.append('inventory_text', '');
        // Limpar todas as chaves quando muda para arquivo
        if (isEditing && productKeys && productKeys.length > 0) {
          await api.delete(`/api/products/${productId}/keys`);
        }
      } else {
        formDataToSend.append('inventory_text', '');
        formDataToSend.append('inventory_file_url', '');
      }

      // Salvar estoque baseado no tipo
      if (!isEditing) {
        if (inventoryType === 'lines' && inventoryLines.length > 0 && inventoryLines.some(line => line.trim())) {
          const keysToSave = inventoryLines.filter(line => line.trim());
          if (keysToSave.length > 0) {
            await api.post(`/api/products/${productId}/keys`, {
              keys: keysToSave
            });
          }
        }
      } else {
        // Ao editar, se mudou de tipo, já limpamos acima
        // Se continua sendo linhas, as linhas são gerenciadas via textarea onBlur
      }

      // Invalidar queries para atualizar a lista de produtos
      queryClient.invalidateQueries('products');
      queryClient.invalidateQueries(['productKeys', productId]);
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      navigate('/store/products');
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
      };
    });
  };



  const clearAllInventory = async () => {
    if (!isEditing || !id) {
      setInventoryLines([]);
      return;
    }

    const confirmed = await confirm({
      title: 'Remover todo o estoque',
      message: 'Tem certeza que deseja remover todo o estoque disponível? Esta ação não pode ser desfeita.',
      type: 'warning',
      confirmText: 'Remover tudo',
    });

    if (confirmed) {
      try {
        await api.delete(`/api/products/${id}/keys`);
        queryClient.invalidateQueries(['productKeys', id]);
        queryClient.invalidateQueries('products'); // Atualizar lista de produtos
        setInventoryLines(['']);
        toast.success('Estoque removido com sucesso!');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Erro ao remover estoque');
      }
    }
  };


  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg p-8 text-center ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Crie uma categoria primeiro
        </h2>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Você precisa criar pelo menos uma categoria antes de criar um produto.
        </p>
        <button
          onClick={() => navigate('/store/categories')}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir para Categorias
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'BASIC_INFO' as TabType, label: 'Informações Básicas', icon: Info },
    { id: 'INVENTORY' as TabType, label: 'Estoque', icon: Box },
    { id: 'ADVANCED' as TabType, label: 'Avançado', icon: Layers },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/store/products')}
          className={`inline-flex items-center mb-4 transition-colors ${
            theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Produtos
        </button>
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Tabs e Conteúdo Principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tabs */}
            <div className={`rounded-xl border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab.id
                            ? theme === 'dark'
                              ? 'border-blue-500 text-blue-400 bg-blue-900/30'
                              : 'border-blue-600 text-blue-600 bg-blue-50'
                            : theme === 'dark'
                              ? 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Informações Básicas */}
                {activeTab === 'BASIC_INFO' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (!isEditing) {
                              const slug = e.target.value
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                              setFormData((prev) => ({ ...prev, slug }));
                            }
                          }}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="Ex: Curso Completo de Marketing"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                            })
                          }
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="curso-completo-marketing"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Categoria *
                        </label>
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Descrição Completa *
                        </label>
                        <textarea
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={6}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="Descrição detalhada do produto"
                        />
                      </div>
                    </div>

                    {/* Preços */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Preço Normal (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="99.90"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Preço Comparativo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.promotional_price}
                          onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="79.90"
                        />
                        <p className={`mt-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Preço usado para comparação e cálculo de desconto. Deve ser maior que o preço normal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estoque */}
                {activeTab === 'INVENTORY' && (
                  <div className="space-y-6">
                    {/* Tipo de estoque */}
                    <div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Tipo de estoque</h3>
                      <p className={`text-sm mb-4 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Defina como o estoque será gerenciado.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            if (inventoryType !== 'lines' && isEditing && id && productKeys && productKeys.length > 0) {
                              const confirmed = await confirm({
                                title: 'Mudar tipo de estoque',
                                message: 'Ao mudar para linhas, todas as chaves do tipo anterior serão removidas. Deseja continuar?',
                                type: 'warning',
                                confirmText: 'Continuar',
                              });
                              if (!confirmed) return;
                              await api.delete(`/api/products/${id}/keys`);
                              queryClient.invalidateQueries(['productKeys', id]);
                            }
                            setInventoryType('lines');
                            setInventoryText('');
                            setInventoryFile(null);
                          }}
                          className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'lines'
                              ? theme === 'dark'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-blue-600 bg-blue-50'
                              : theme === 'dark'
                                ? 'border-gray-600 hover:bg-gray-700'
                                : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Layers className={`w-6 h-6 mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`} />
                          <span className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>Linhas</span>
                          <span className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>Cada linha = 1 estoque</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (inventoryType !== 'text' && isEditing && id && productKeys && productKeys.length > 0) {
                              const confirmed = await confirm({
                                title: 'Mudar tipo de estoque',
                                message: 'Ao mudar para texto/serviço, todas as chaves serão removidas. Deseja continuar?',
                                type: 'warning',
                                confirmText: 'Continuar',
                              });
                              if (!confirmed) return;
                              await api.delete(`/api/products/${id}/keys`);
                              queryClient.invalidateQueries(['productKeys', id]);
                            }
                            setInventoryType('text');
                            setInventoryLines(['']);
                            setInventoryFile(null);
                          }}
                          className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'text'
                              ? theme === 'dark'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-blue-600 bg-blue-50'
                              : theme === 'dark'
                                ? 'border-gray-600 hover:bg-gray-700'
                                : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <FileText className={`w-6 h-6 mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`} />
                          <span className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>Texto/Serviço</span>
                          <span className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>Mesmo texto para todos</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (inventoryType !== 'file' && isEditing && id && productKeys && productKeys.length > 0) {
                              const confirmed = await confirm({
                                title: 'Mudar tipo de estoque',
                                message: 'Ao mudar para arquivo, todas as chaves serão removidas. Deseja continuar?',
                                type: 'warning',
                                confirmText: 'Continuar',
                              });
                              if (!confirmed) return;
                              await api.delete(`/api/products/${id}/keys`);
                              queryClient.invalidateQueries(['productKeys', id]);
                            }
                            setInventoryType('file');
                            setInventoryLines(['']);
                            setInventoryText('');
                          }}
                          className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'file'
                              ? theme === 'dark'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-blue-600 bg-blue-50'
                              : theme === 'dark'
                                ? 'border-gray-600 hover:bg-gray-700'
                                : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <FileText className={`w-6 h-6 mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`} />
                          <span className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>Arquivo</span>
                          <span className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>RAR, TXT, etc</span>
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo baseado no tipo */}
                    {inventoryType === 'lines' && (
                      <div className={`border rounded-md shadow-sm ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
                      }`}>
                        <div className="flex flex-col space-y-1.5 p-6">
                          <div className="relative flex justify-between items-center">
                            <div className={`font-semibold leading-none tracking-tight ${
                              theme === 'dark' ? 'text-white' : ''
                            }`}>
                              Estoque ({isEditing && id && productKeys ? productKeys.length : inventoryLines.filter(l => l.trim()).length})
                            </div>
                            {((isEditing && id && productKeys && productKeys.length > 0) || (!isEditing && inventoryLines.filter(l => l.trim()).length > 0)) && (
                              <button
                                type="button"
                                onClick={clearAllInventory}
                                className="text-sm text-red-600 hover:text-red-700 hover:underline"
                              >
                                Remover tudo
                              </button>
                            )}
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Cole múltiplas linhas de uma vez. Cada linha representa um estoque diferente. Se tiver 300 linhas, será 300 em estoque.
                          </div>
                        </div>
                        <div className="p-6 pt-0">
                          {isEditing && id && productKeys ? (
                            // Quando está editando, mostrar textarea com chaves do banco
                            <>
                              <textarea
                                value={inventoryLines.join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split('\n');
                                  setInventoryLines(lines);
                                }}
                                onBlur={async () => {
                                  // Ao sair do campo, sincronizar com banco
                                  const lines = inventoryLines.filter(l => l.trim());
                                  const currentKeys = productKeys ? productKeys.map((pk: any) => pk.key) : [];

                                  // Se mudou, atualizar
                                  if (JSON.stringify(lines.sort()) !== JSON.stringify(currentKeys.sort())) {
                                    // Deletar todas e recriar
                                    try {
                                      await api.delete(`/api/products/${id}/keys`);
                                      if (lines.length > 0) {
                                        await api.post(`/api/products/${id}/keys`, {
                                          keys: lines
                                        });
                                      }
                                      queryClient.invalidateQueries(['productKeys', id]);
                                      queryClient.invalidateQueries('products'); // Atualizar lista de produtos
                                      toast.success('Estoque atualizado!');
                                    } catch (error: any) {
                                      toast.error(error.response?.data?.error || 'Erro ao atualizar estoque');
                                    }
                                  }
                                }}
                                rows={12}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono ${
                                  theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300'
                                }`}
                                placeholder="Cole aqui as chaves/licenças, uma por linha..."
                              />
                              <p className={`text-xs mt-2 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {productKeys.length} {productKeys.length === 1 ? 'chave' : 'chaves'} configurada{productKeys.length === 1 ? '' : 's'}
                              </p>
                            </>
                          ) : (
                            // Quando não está editando, mostrar textarea para colar linhas
                            <>
                              <textarea
                                value={inventoryLines.join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split('\n');
                                  setInventoryLines(lines);
                                }}
                                rows={12}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono ${
                                  theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300'
                                }`}
                                placeholder="Cole aqui as chaves/licenças, uma por linha..."
                              />
                              <p className={`text-xs mt-2 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {inventoryLines.filter(l => l.trim()).length} {inventoryLines.filter(l => l.trim()).length === 1 ? 'chave' : 'chaves'} configurada{inventoryLines.filter(l => l.trim()).length === 1 ? '' : 's'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {inventoryType === 'text' && (
                      <div className={`border rounded-md shadow-sm ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
                      }`}>
                        <div className="flex flex-col space-y-1.5 p-6">
                          <div className={`font-semibold leading-none tracking-tight ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>
                            Texto/Serviço
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            O mesmo texto será enviado para todos os compradores.
                          </div>
                        </div>
                        <div className="p-6 pt-0">
                          <textarea
                            value={inventoryText}
                            onChange={(e) => setInventoryText(e.target.value)}
                            rows={6}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                              theme === 'dark'
                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                : 'border-gray-300'
                            }`}
                            placeholder="Digite o texto/serviço que será enviado para todos os compradores..."
                          />
                        </div>
                      </div>
                    )}

                    {inventoryType === 'file' && (
                      <div className={`border rounded-md shadow-sm ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
                      }`}>
                        <div className="flex flex-col space-y-1.5 p-6">
                          <div className={`font-semibold leading-none tracking-tight ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>
                            Arquivo
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Faça upload de um arquivo (RAR, ZIP, TXT, etc) que será enviado aos compradores.
                          </div>
                        </div>
                        <div className="p-6 pt-0">
                          <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                          }`}>
                            <input
                              type="file"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setInventoryFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                              id="inventory-file-upload"
                              accept=".rar,.zip,.txt,.pdf"
                            />
                            <label htmlFor="inventory-file-upload" className="cursor-pointer">
                              {inventoryFile ? (
                                <div className="space-y-2">
                                  <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                                  <p className={`font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>{inventoryFile.name}</p>
                                  <p className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {(inventoryFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setInventoryFile(null);
                                    }}
                                    className="text-sm text-red-600 hover:text-red-700"
                                  >
                                    Remover arquivo
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <FileText className={`w-8 h-8 mx-auto ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                  }`} />
                                  <p className={`font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>Clique para fazer upload</p>
                                  <p className="text-sm text-gray-500">ou arraste e solte o arquivo aqui</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Avançado */}
                {activeTab === 'ADVANCED' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Limite de Estoque
                        </label>
                        <input
                          type="number"
                          value={formData.stock_limit}
                          onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Quantidade Mínima de Compra
                        </label>
                        <input
                          type="number"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Quantidade Máxima de Compra
                        </label>
                        <input
                          type="number"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300'
                          }`}
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className={`pt-6 border-t space-y-4 ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Ocultar produto</div>
                          <p className={`text-sm mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Ao ocultar o produto ele não será mais visto, apenas para quem tem o link.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: !e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Ocultar vendas</div>
                          <p className={`text-sm mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Habilite esta função caso você queira ocultar as vendas deste produto em sua loja.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Oculto em mobile */}
          <div className="hidden lg:block space-y-6">
            {/* Imagem Principal */}
            <div className={`rounded-xl border shadow-sm ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`p-6 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Imagem principal</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-6 h-6 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className={`font-semibold mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Escolha sua imagem</h3>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Clique aqui ou arraste e solte um arquivo aqui.</p>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-3">
                    {imageFiles.map((file, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>{file.name}</div>
                          <span className={`text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {(file.size / 1024 / 1024).toFixed(2)}mb
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeImageFile(index);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.images.length > 0 && (
                  <div className="space-y-3">
                    {formData.images.map((image, index) => (
                      <div key={`${image}-${index}`} className={`flex items-center gap-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <img src={image} alt={`Imagem ${index + 1}`} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate ${
                            theme === 'dark' ? 'text-white' : ''
                          }`}>Imagem {index + 1}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className={`text-xs mt-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Resolução recomendada: 1280x720. Também recomendamos que mantenha a proporção 16:9, pois caso contrário, sua imagem pode ficar achatada em seu site.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex justify-end gap-4 pt-6 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={() => navigate('/store/products')}
            className={`px-6 py-3 border rounded-lg transition-colors font-medium ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
          </button>
        </div>
      </form>
      {Dialog}
    </div>
  );
}
