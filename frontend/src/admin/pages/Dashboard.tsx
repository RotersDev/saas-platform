import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Store, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery('adminStats', async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Mostrar dados em cache enquanto carrega
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total de Lojas',
      value: stats?.totalStores || 0,
      icon: Store,
      color: 'bg-blue-500',
    },
    {
      name: 'Lojas Ativas',
      value: stats?.activeStores || 0,
      icon: Store,
      color: 'bg-green-500',
    },
    {
      name: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      name: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'Lojas Expirando',
      value: stats?.storesExpiring || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


