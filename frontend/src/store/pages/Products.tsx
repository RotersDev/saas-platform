import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

export default function StoreProducts() {
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: productsLoading } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data;
  }, {
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/api/categories?include_inactive=true');
    return response.data || [];
  }, {
    staleTime: 5 * 60 * 1000,
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

  if (categories) {
    categories.forEach((cat: any) => {
      categoryMap[cat.id] = cat;
      productsByCategory[cat.id] = [];
    });
  }

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

  // Filtrar categorias que têm produtos
  const categoriesWithProducts = Object.keys(productsByCategory)
    .map(Number)
    .filter((catId) => productsByCategory[catId].length > 0);

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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
          {categoriesWithProducts.map((categoryId) => {
            const category = categoryMap[categoryId];
            const categoryProducts = productsByCategory[categoryId];

            return (
              <div key={categoryId} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {categoryProducts.length} produto{categoryProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {categoryProducts.map((product: any) => (
                    <li key={product.id}>
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <Package className="flex-shrink-0 h-10 w-10 text-gray-400" />
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  {product.name}
                                </p>
                                {!product.is_active && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Inativo
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(Number(product.promotional_price || product.price))}
                                  </p>
                                  {product.promotional_price && (
                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                      <span className="line-through text-gray-400 mr-2">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(Number(product.price))}
                                      </span>
                                    </p>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>Vendas: {product.sales_count}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => {
                                window.location.href = `/store/products/edit/${product.id}`;
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este produto?')) {
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
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
