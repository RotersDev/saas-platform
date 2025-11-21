import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

export default function StoreProducts() {
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();

  // Carregar categorias expandidas do sessionStorage
  const loadExpandedCategories = (): Set<number> => {
    try {
      const saved = sessionStorage.getItem('expandedCategories');
      if (saved) {
        const ids = JSON.parse(saved);
        return new Set(ids);
      }
    } catch (error) {
      // Ignorar erro
    }
    return new Set();
  };

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(loadExpandedCategories);
  const [productStockCounts, setProductStockCounts] = useState<Record<number, number>>({});

  const { data: productsData, isLoading: productsLoading } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data;
  }, {
    staleTime: 0, // Sempre considerar dados como "stale"
    refetchOnMount: true, // Sempre buscar quando montar
    refetchOnWindowFocus: false, // Não buscar ao focar na janela
  });

  // Buscar contagem de estoque para cada produto
  useEffect(() => {
    if (productsData?.rows) {
      const fetchStockCounts = async () => {
        const counts: Record<number, number> = {};
        await Promise.all(
          productsData.rows.map(async (product: any) => {
            try {
              const response = await api.get(`/api/products/${product.id}/keys`);
              const keys = response.data || [];
              counts[product.id] = keys.length;
            } catch (error) {
              counts[product.id] = 0;
            }
          })
        );
        setProductStockCounts(counts);
      };
      fetchStockCounts();
    }
  }, [productsData]);

  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/api/categories?include_inactive=true');
    return response.data || [];
  }, {
    staleTime: 0, // Sempre considerar dados como "stale"
    refetchOnMount: true, // Sempre buscar quando montar
  });

  const deleteMutation = useMutation(
    async (id: number) => {
      await api.delete(`/api/products/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Produto excluído com sucesso!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir produto');
      },
    }
  );

  // Agrupar produtos por categoria
  const productsByCategory: Record<number, any[]> = {};
  const categoryMap: Record<number, any> = {};

  // Inicializar todas as categorias, mesmo sem produtos
  if (categories) {
    categories.forEach((cat: any) => {
      categoryMap[cat.id] = cat;
      productsByCategory[cat.id] = [];
    });
  }

  // Adicionar produtos às suas categorias
  if (productsData?.rows) {
    productsData.rows.forEach((product: any) => {
      if (product.category_id && productsByCategory[product.category_id]) {
        productsByCategory[product.category_id].push(product);
      } else {
        // Produtos sem categoria
        if (!productsByCategory[0]) {
          productsByCategory[0] = [];
          categoryMap[0] = { id: 0, name: 'Sem Categoria' };
        }
        productsByCategory[0].push(product);
      }
    });
  }

  // Mostrar TODAS as categorias, mesmo sem produtos
  // Ordenar por display_order ou created_at para manter ordem fixa
  const sortedCategories = categories
    ? [...categories].sort((a: any, b: any) => {
        // Primeiro por display_order, depois por created_at
        if (a.display_order !== undefined && b.display_order !== undefined) {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
        }
        // Se display_order não existe ou é igual, ordenar por created_at
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      })
    : [];

  const categoriesWithProducts = sortedCategories.map((cat: any) => cat.id);

  // Adicionar "Sem Categoria" apenas se houver produtos sem categoria
  if (productsByCategory[0] && productsByCategory[0].length > 0 && !categoriesWithProducts.includes(0)) {
    categoriesWithProducts.push(0);
  }

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      // Salvar no sessionStorage
      try {
        sessionStorage.setItem('expandedCategories', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        // Ignorar erro
      }
      return newSet;
    });
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
        <button
          onClick={() => {
            window.location.href = '/store/products/new';
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {categoriesWithProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando seu primeiro produto.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoriesWithProducts.map((categoryId: number) => {
            const category = categoryMap[categoryId];
            const categoryProducts = productsByCategory[categoryId] || [];

            const isExpanded = expandedCategories.has(categoryId);

            return (
              <div key={categoryId} className="bg-white shadow rounded-lg overflow-hidden">
                <div
                  className="px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => toggleCategory(categoryId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {category?.name || 'Categoria'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {categoryProducts.length} produto{categoryProducts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <ul className="divide-y divide-gray-200">
                    {categoryProducts.length === 0 ? (
                      <li>
                        <div className="px-6 py-8 text-center text-gray-500">
                          <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm">Nenhum produto nesta categoria</p>
                        </div>
                      </li>
                    ) : (
                      categoryProducts.map((product: any) => (
                    <li key={product.id} onClick={(e) => e.stopPropagation()}>
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <Package className="flex-shrink-0 h-10 w-10 text-gray-400" />
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/store/products/edit/${product.id}`;
                                  }}
                                  className="text-sm font-medium text-blue-600 truncate hover:text-blue-800 hover:underline cursor-pointer text-left"
                                >
                                  {product.name}
                                </button>
                                {!product.is_active && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Inativo
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between items-center">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(Number(product.price))}
                                  </p>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                  {(() => {
                                    const stockCount = productStockCounts[product.id] ?? product.stock_limit ?? 0;
                                    if (stockCount === 0) {
                                      return (
                                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md">
                                          Estoque esgotado
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">
                                        {stockCount} em estoque
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/store/products/edit/${product.id}`;
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const confirmed = await confirm({
                                  title: 'Excluir produto',
                                  message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
                                  type: 'danger',
                                  confirmText: 'Excluir',
                                });
                                if (confirmed) {
                                  deleteMutation.mutate(product.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {Dialog}
    </div>
  );
}
