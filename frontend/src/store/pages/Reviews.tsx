import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

export default function StoreReviews() {
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();

  const { data, isLoading } = useQuery('reviews', async () => {
    const response = await api.get('/api/reviews');
    return response.data;
  }, {
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  const approveMutation = useMutation(
    async (id: number) => {
      await api.post(`/api/reviews/${id}/approve`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Avaliação aprovada!');
      },
    }
  );

  const rejectMutation = useMutation(
    async (id: number) => {
      await api.post(`/api/reviews/${id}/reject`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reviews');
        toast.success('Avaliação rejeitada!');
      },
    }
  );

  // Mostrar dados em cache enquanto carrega
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pendingReviews = data?.filter((r: any) => r.status === 'pending') || [];
  const approvedReviews = data?.filter((r: any) => r.status === 'approved') || [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Avaliações</h1>

      {/* Pendentes */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pendentes ({pendingReviews.length})
          </h2>
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {pendingReviews.map((review: any) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.customer?.name || 'Cliente'}
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {review.title}
                      </h3>
                    )}
                    {review.comment && (
                      <p className="text-gray-600 mb-2">{review.comment}</p>
                    )}
                    {review.images && review.images.length > 0 && (
                      <div className="flex space-x-2 mt-2">
                        {review.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Review ${i + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => approveMutation.mutate(review.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Aprovar"
                    >
                      <CheckCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Rejeitar avaliação',
                          message: 'Tem certeza que deseja rejeitar esta avaliação?',
                          type: 'warning',
                          confirmText: 'Rejeitar',
                        });
                        if (confirmed) {
                          rejectMutation.mutate(review.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Rejeitar"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aprovadas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Aprovadas ({approvedReviews.length})
        </h2>
        {approvedReviews.length > 0 ? (
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {approvedReviews.map((review: any) => (
              <div key={review.id} className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {review.customer?.name || 'Cliente'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {review.title && (
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{review.title}</h3>
                )}
                {review.comment && <p className="text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma avaliação</h3>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
