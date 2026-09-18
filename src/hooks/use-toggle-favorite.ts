import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '@/api/favorites-api';
import { FAVORITE_KEY } from '@/query-options/favorites-options';
import { PRODUCT_KEY } from '@/query-options/product-options';

/**
 * Optimistic favorite toggle, shared by the catalogue card and the product detail page's two heart buttons.
 * Same local-state-with-revert shape as `StockAdjustControl` rather than React Query cache patching: the
 * favorited flag lives inside `ProductSummary`/`ProductDetail` query results scattered across several cache
 * entries (the catalogue list, the detail page, the favorites list), and there is no existing precedent in this
 * codebase for patching all of them - a brief staleness between components is a smaller cost than that.
 */
export function useToggleFavorite(productId: string, favorited: boolean) {
  const queryClient = useQueryClient();
  const [optimistic, setOptimistic] = useState(favorited);

  // The server value can change under us (another tab, or this product being reloaded) - stay in sync
  // whenever the caller's own `favorited` prop moves, not just on first mount.
  useEffect(() => setOptimistic(favorited), [favorited]);

  const { mutate, isPending } = useMutation({
    mutationFn: (next: boolean) => (next ? addFavorite(productId) : removeFavorite(productId)),
    onError: () => setOptimistic(favorited),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [FAVORITE_KEY] });
    },
  });

  const toggle = () => {
    const next = !optimistic;
    setOptimistic(next);
    mutate(next);
  };

  return { favorited: optimistic, toggle, isPending };
}
