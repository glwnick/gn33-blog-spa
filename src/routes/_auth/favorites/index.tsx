import { createFileRoute } from '@tanstack/react-router';
import { FavoritesPage } from '@/pages/favorites/favorites-page';
import { myFavoritesOptions } from '@/query-options/favorites-options';

export const Route = createFileRoute('/_auth/favorites/')({
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(myFavoritesOptions()),
  component: FavoritesPage,
});
