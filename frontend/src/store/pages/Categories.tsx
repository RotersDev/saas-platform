import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Image as ImageIcon, X, GripVertical } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useThemeStore } from '../themeStore';

export default function StoreCategories() {
  const { theme } = useThemeStore();
  const { confirm, Dialog } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image_url: '',
    is_active: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [categoriesOrder, setCategoriesOrder] = useState<number[]>([]);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentIndex, setTouchCurrentIndex] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery('categories', async () => {
    const response = await api.get('/api/categories?include_inactive=true');
    return response.data;
  }, {
    staleTime: 2 * 60 * 1000,
    onSuccess: (data) => {
      // Inicializar ordem das categorias baseado em display_order ou created_at
      if (data) {
        const sorted = [...data].sort((a: any, b: any) => {
          if (a.display_order !== undefined && b.display_order !== undefined) {
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order;
            }
          }
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB;
        });
        setCategoriesOrder(sorted.map((cat: any) => Number(cat.id)));
      }
    },
  });

  // Ordenar categorias pela ordem salva
  const sortedCategories = categories && categoriesOrder.length > 0
    ? [...categories].sort((a: any, b: any) => {
        const indexA = categoriesOrder.indexOf(a.id);
        const indexB = categoriesOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
    : categories || [];

  const updateOrderMutation = useMutation(
    async (newOrder: number[]) => {
      // Garantir que todos os IDs sejam números
      const numericOrder = newOrder.map(id => Number(id)).filter(id => !isNaN(id));
      await api.put('/api/categories/order/update', { categoryIds: numericOrder });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Ordem das categorias atualizada!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar ordem');
      },
    }
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...categoriesOrder].map(id => Number(id));
    const draggedId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedId);
    setCategoriesOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && categoriesOrder.length > 0) {
      updateOrderMutation.mutate(categoriesOrder);
    }
    setDraggedIndex(null);
  };

  // Touch events para mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchCurrentIndex(index);
    setDraggedIndex(index);
    // Adicionar classe para feedback visual
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchCurrentIndex === null) return;

    e.preventDefault();
    const touchY = e.touches[0].clientY;

    // Encontrar qual elemento está sendo tocado agora
    const elements = document.querySelectorAll('[data-category-index]');
    let newIndex = touchCurrentIndex;

    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();

      if (touchY >= rect.top && touchY <= rect.bottom) {
        if (idx !== touchCurrentIndex) {
          newIndex = idx;
        }
      }
    });

    // Se mudou de posição, atualizar ordem
    if (newIndex !== touchCurrentIndex && newIndex >= 0 && newIndex < categoriesOrder.length) {
      const newOrder = [...categoriesOrder].map(id => Number(id));
      const draggedId = newOrder[touchCurrentIndex];
      newOrder.splice(touchCurrentIndex, 1);
      newOrder.splice(newIndex, 0, draggedId);
      setCategoriesOrder(newOrder);
      setTouchCurrentIndex(newIndex);
      setDraggedIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    // Restaurar opacidade de todos os elementos
    document.querySelectorAll('[data-category-index]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
    });

    if (touchCurrentIndex !== null && categoriesOrder.length > 0) {
      updateOrderMutation.mutate(categoriesOrder);
    }
    setTouchStartY(null);
    setTouchCurrentIndex(null);
    setDraggedIndex(null);
  };

  const createMutation = useMutation(
    async (data: FormData | any) => {
      const isFormData = data instanceof FormData;
      const config: any = {
        headers: {},
      };

      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await api.post('/api/categories', data, config);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria criada com sucesso!');
        setShowModal(false);
        resetForm();
        // Atualizar preview se recebeu URL do backend
        if (data.image_url) {
          setImagePreview(data.image_url);
          setFormData((prev) => ({ ...prev, image_url: data.image_url }));
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar categoria');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: number; data: FormData | any }) => {
      const isFormData = data instanceof FormData;
      const config: any = {
        headers: {},
      };

      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await api.put(`/api/categories/${id}`, data, config);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria atualizada com sucesso!');
        setShowModal(false);
        resetForm();
        // Atualizar preview se recebeu URL do backend
        if (data.image_url) {
          setImagePreview(data.image_url);
          setFormData((prev) => ({ ...prev, image_url: data.image_url }));
        } else if (data.image_url === null || data.image_url === '') {
          setImagePreview(null);
          setFormData((prev) => ({ ...prev, image_url: '' }));
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar categoria');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: number) => {
      await api.delete(`/api/categories/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria excluída com sucesso!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir categoria');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      image_url: '',
      is_active: true,
    });
    setSelectedCategory(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url || '',
      is_active: category.is_active,
    });
    setImagePreview(category.image_url || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Limpar input para permitir selecionar o mesmo arquivo novamente
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Se há arquivo de imagem, usar FormData
    if (imageFile) {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('is_active', formData.is_active.toString());
      formDataToSend.append('image', imageFile);

      if (selectedCategory) {
        updateMutation.mutate({ id: selectedCategory.id, data: formDataToSend });
      } else {
        createMutation.mutate(formDataToSend);
      }
    } else {
      // Se não há arquivo, enviar como JSON normal
      const dataToSend: any = {
        name: formData.name,
        slug: formData.slug,
        is_active: formData.is_active,
      };

      // Se image_url está vazio, enviar como string vazia para remover
      if (formData.image_url !== undefined) {
        dataToSend.image_url = formData.image_url || '';
      }

      if (selectedCategory) {
        updateMutation.mutate({ id: selectedCategory.id, data: dataToSend });
      } else {
        createMutation.mutate(dataToSend);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir categoria',
      message: 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
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
        }`}>Categorias</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </button>
      </div>

      {!categories || categories.length === 0 ? (
        <div className={`shadow rounded-lg p-12 text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <ImageIcon className={`mx-auto h-12 w-12 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`mt-2 text-sm font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Nenhuma categoria</h3>
          <p className={`mt-1 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Comece criando sua primeira categoria.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {sortedCategories.map((category: any, index: number) => (
            <div
              key={category.id}
              data-category-index={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } ${draggedIndex === index ? 'opacity-50 scale-95 z-50' : ''} ${draggedIndex !== null ? 'cursor-move' : ''}`}
              style={{ touchAction: 'none' }}
            >
              {/* Imagem - oculta no mobile */}
              <div className="relative hidden md:block">
                {/* Handle de arrastar - desktop */}
                <div className={`absolute top-2 left-2 z-10 backdrop-blur-sm rounded p-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none ${
                  theme === 'dark' ? 'bg-gray-700/90' : 'bg-white/90'
                }`}>
                  <GripVertical className="w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                {category.image_url ? (
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    {!category.is_active && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Oculto
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                    {!category.is_active && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Oculto
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conteúdo - simplificado no mobile */}
              <div className="p-3 md:p-4">
                {/* Mobile: Layout horizontal com handle */}
                <div className="flex items-center gap-3 md:hidden">
                  <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-semibold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{category.name}</h3>
                    <p className={`text-xs truncate ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>/{category.slug}</p>
                  </div>
                  {!category.is_active && (
                    <span className="flex-shrink-0 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                      Oculto
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }}
                    className={`flex-shrink-0 p-2 rounded-md ${
                      theme === 'dark' ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category.id);
                    }}
                    className={`flex-shrink-0 p-2 rounded-md ${
                      theme === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Desktop: Layout vertical completo */}
                <div className="hidden md:block">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{category.name}</h3>
                  <p className={`text-sm mb-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>/{category.slug}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                        theme === 'dark'
                          ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/50'
                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        theme === 'dark'
                          ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50'
                          : 'text-red-600 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!selectedCategory) {
                        // Gerar slug automaticamente
                        const slug = e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        setFormData((prev) => ({ ...prev, slug }));
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Ex: Cursos Online"
                  />
                </div>

                {selectedCategory && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder="cursos-online"
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Imagem da Categoria
                  </label>
                  {imagePreview && (
                    <div className="mb-4 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`w-full h-48 object-cover rounded-lg border ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                        }`}
                        onError={() => setImagePreview(null)}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="category-image-upload"
                  />
                  <label
                    htmlFor="category-image-upload"
                    className={`inline-flex items-center px-4 py-2 border-2 border-dashed rounded-md text-sm font-medium cursor-pointer transition-colors w-full justify-center ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    {imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                  </label>
                  <p className={`text-xs mt-2 text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Formatos aceitos: PNG, JPG, WEBP. Tamanho recomendado: 800x600px
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${
                      theme === 'dark' ? 'text-blue-600' : 'text-blue-600'
                    }`}
                  />
                  <label htmlFor="is_active" className={`ml-2 block text-sm ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Categoria ativa (visível no site)
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {selectedCategory ? 'Atualizar' : 'Criar'} Categoria
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

