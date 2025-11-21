import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import api from '../../config/axios';

interface UseLazyCategoryProductsOptions {
  categoryId: number;
  categorySlug?: string;
  enabled?: boolean;
  rootMargin?: string;
}

/**
 * Hook para carregar produtos de uma categoria apenas quando ela fica visível na tela
 * Usa Intersection Observer para detectar quando a categoria está próxima de aparecer
 */
export function useLazyCategoryProducts({
  categoryId,
  categorySlug,
  enabled = true,
  rootMargin = '200px', // Começar a carregar 200px antes da categoria aparecer
}: UseLazyCategoryProductsOptions) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Query para buscar produtos da categoria
  const { data: products, isLoading, error } = useQuery(
    ['categoryProducts', categoryId, categorySlug],
    async () => {
      const url = categorySlug
        ? `/api/public/products?category_slug=${categorySlug}`
        : `/api/public/products?category_id=${categoryId}`;
      const response = await api.get(url);
      return response.data || [];
    },
    {
      enabled: enabled && shouldLoad, // Só buscar quando shouldLoad for true
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
      cacheTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
    }
  );

  // Configurar Intersection Observer
  useEffect(() => {
    if (!enabled || shouldLoad || !elementRef.current) return;

    // Criar observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Quando a categoria fica visível, ativar carregamento
            setShouldLoad(true);
            // Desconectar observer após ativar (não precisa mais observar)
            if (observerRef.current && elementRef.current) {
              observerRef.current.unobserve(elementRef.current);
            }
          }
        });
      },
      {
        rootMargin, // Começar a carregar antes de aparecer na tela
        threshold: 0.1, // Ativar quando 10% da categoria estiver visível
      }
    );

    // Observar o elemento
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
      observerRef.current = null;
    };
  }, [enabled, shouldLoad, rootMargin]);

  return {
    products: products || [],
    isLoading,
    error,
    elementRef, // Ref para anexar ao elemento da categoria
    shouldLoad, // Indica se já deve carregar (útil para mostrar skeleton)
  };
}

