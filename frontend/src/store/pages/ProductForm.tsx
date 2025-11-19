import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, X, Plus, Trash2, Info, Box, FileText, Cloud, Layers, Edit2 } from 'lucide-react';

type TabType = 'BASIC_INFO' | 'INVENTORY' | 'ADVANCED';

export default function StoreProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
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
    benefits: [] as string[],
    tags: [] as string[],
    is_active: true,
    featured: false,
  });

  const [inventoryType, setInventoryType] = useState<'lines' | 'text' | 'file'>('lines');
  const [inventoryLines, setInventoryLines] = useState<string[]>(['']);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);

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
        benefits: product.benefits || [],
        tags: product.tags || [],
        is_active: product.is_active !== undefined ? product.is_active : true,
        featured: product.featured || false,
      });
    }
  }, [product]);

  useEffect(() => {
    if (productKeys && productKeys.length > 0) {
      setInventoryLines(productKeys.map((pk: any) => pk.key));
    }
  }, [productKeys]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.category_id) {
      toast.error('Selecione uma categoria ou crie uma categoria primeiro');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
    }

    if (formData.images.length > 0) {
      if (imageFiles.length === 0) {
        formDataToSend.append('images', JSON.stringify(formData.images));
      } else {
        formDataToSend.append('images', JSON.stringify(formData.images));
      }
    }

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
    formDataToSend.append('benefits', JSON.stringify(formData.benefits));
    formDataToSend.append('tags', JSON.stringify(formData.tags));

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

      // Salvar estoque se houver linhas
      if (inventoryLines.length > 0 && inventoryLines.some(line => line.trim())) {
        const keysToSave = inventoryLines.filter(line => line.trim());
        if (keysToSave.length > 0) {
          await api.post(`/api/products/${productId}/keys`, {
            keys: keysToSave
          });
        }
      }

      queryClient.invalidateQueries('products');
      queryClient.invalidateQueries(['product', productId]);
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
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData({ ...formData, images: [...formData.images, newImageUrl] });
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData({ ...formData, benefits: [...formData.benefits, newBenefit.trim()] });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const addInventoryLine = () => {
    setInventoryLines([...inventoryLines, '']);
  };

  const removeInventoryLine = (index: number) => {
    setInventoryLines(inventoryLines.filter((_, i) => i !== index));
  };

  const updateInventoryLine = (index: number, value: string) => {
    const newLines = [...inventoryLines];
    newLines[index] = value;
    setInventoryLines(newLines);
  };

  const clearAllInventory = () => {
    if (confirm('Tem certeza que deseja remover todo o estoque?')) {
      setInventoryLines(['']);
    }
  };

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Crie uma categoria primeiro
        </h2>
        <p className="text-gray-600 mb-6">
          Você precisa criar pelo menos uma categoria antes de criar um produto.
        </p>
        <button
          onClick={() => navigate('/store/categories')}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Produtos
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Tabs e Conteúdo Principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200">
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
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="Ex: Curso Completo de Marketing"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="curso-completo-marketing"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria *
                        </label>
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição Completa *
                        </label>
                        <textarea
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                          placeholder="Descrição detalhada do produto"
                        />
                      </div>
                    </div>

                    {/* Preços */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço Normal (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="99.90"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço Promocional (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.promotional_price}
                          onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="79.90"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Estoque */}
                {activeTab === 'INVENTORY' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tipo de estoque</h3>
                      <p className="text-sm text-gray-600 mb-4">Defina quais itens devem ser entregues ao seu cliente.</p>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setInventoryType('lines')}
                          className={`p-5 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'lines'
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Layers className="w-6 h-6 mb-2 text-gray-700" />
                          <span className="text-sm font-medium">Linhas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInventoryType('text')}
                          className={`p-5 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'text'
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <FileText className="w-6 h-6 mb-2 text-gray-700" />
                          <span className="text-sm font-medium">Texto/Serviço</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInventoryType('file')}
                          className={`p-5 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            inventoryType === 'file'
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Cloud className="w-6 h-6 mb-2 text-gray-700" />
                          <span className="text-sm font-medium">Arquivo</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Estoque
                        </label>
                        {inventoryLines.length > 0 && inventoryLines.some(l => l.trim()) && (
                          <button
                            type="button"
                            onClick={clearAllInventory}
                            className="text-sm text-red-600 hover:text-red-700 hover:underline"
                          >
                            Remover tudo
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {inventoryLines.map((line, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 text-xs text-gray-500 text-right">
                              {index + 1}
                            </div>
                            {editingLineIndex === index ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={line}
                                  onChange={(e) => updateInventoryLine(index, e.target.value)}
                                  onBlur={() => setEditingLineIndex(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setEditingLineIndex(null);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingLineIndex(null)}
                                  className="p-2 text-gray-600 hover:text-gray-900"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center gap-2 group">
                                <div
                                  onClick={() => setEditingLineIndex(index)}
                                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-text hover:border-gray-300 transition-colors text-sm"
                                >
                                  {line || <span className="text-gray-400">Clique para editar</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeInventoryLine(index)}
                                  className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addInventoryLine}
                        className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar linha
                      </button>

                      <p className="mt-4 text-sm text-gray-600">
                        <span className="text-yellow-600 font-medium">(Importante)</span> Cada linha representa um estoque.
                      </p>
                    </div>
                  </div>
                )}

                {/* Avançado */}
                {activeTab === 'ADVANCED' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Limite de Estoque
                        </label>
                        <input
                          type="number"
                          value={formData.stock_limit}
                          onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantidade Mínima de Compra
                        </label>
                        <input
                          type="number"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantidade Máxima de Compra
                        </label>
                        <input
                          type="number"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Ocultar produto</div>
                          <p className="text-sm text-gray-600 mt-1">
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Ocultar vendas</div>
                          <p className="text-sm text-gray-600 mt-1">
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Imagem Principal */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Imagem principal</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Escolha sua imagem</h3>
                    <p className="text-sm text-gray-600">Clique aqui ou arraste e solte um arquivo aqui.</p>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-3">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{file.name}</div>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)}mb
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImageFile(index)}
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
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img src={image} alt={`Imagem ${index + 1}`} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">Imagem {index + 1}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="URL da imagem"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Resolução recomendada: 1280x720. Também recomendamos que mantenha a proporção 16:9, pois caso contrário, sua imagem pode ficar achatada em seu site.
                </p>
              </div>
            </div>

            {/* Benefícios e Tags */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Benefícios</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Acesso vitalício"
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Tags</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: marketing, digital"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/store/products')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
