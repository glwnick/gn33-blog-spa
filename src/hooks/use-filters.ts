import { getRouteApi, useNavigate } from '@tanstack/react-router';
import type { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { cleanEmptyParams } from '@/lib/clean-empty-params';

export function useFilters<T extends RouteIds<RegisteredRouter['routeTree']>>(
  routeId: T,
) {
  const routeApi = getRouteApi<T>(routeId);
  const navigate = useNavigate();
  const filters = routeApi.useSearch();

  const setFilters = (partialFilters: Partial<typeof filters>) =>
    navigate({
      to: '.',
      search: (prev) => cleanEmptyParams({ ...prev, ...partialFilters }),
    });
  const resetFilters = () => navigate({ to: '.', search: {} });

  return { filters, setFilters, resetFilters };
}
