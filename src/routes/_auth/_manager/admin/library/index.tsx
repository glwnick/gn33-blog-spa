import { createFileRoute } from '@tanstack/react-router';
import { LibraryPage } from '@/pages/admin/library-page';
import { adminYarnsOptions } from '@/query-options/yarn-options';
import { adminSizesOptions } from '@/query-options/size-options';
import { adminMaterialsOptions } from '@/query-options/material-options';
import { adminCategoriesOptions } from '@/query-options/admin-category-options';

export const Route = createFileRoute('/_auth/_manager/admin/library/')({
  // The yarn/size/material sections read with `useSuspenseQuery`, so the loader is what keeps the page in the
  // SSR-dehydration convention slice 6b-1 established rather than refetching on hydration. All three are
  // prefetched up front, not just the initially active section, since the switcher itself is client-only local
  // state the loader cannot see. The categories section only prefetches for ROLE_ADMIN: this route is
  // MANAGER+ADMIN, but `AdminCategoryController` is ADMIN-only, so a MANAGER's `ensureQueryData` call would
  // 403 the whole loader if it ran unconditionally.
  loader: ({ context }) => {
    const isAdmin = context.auth.user?.roles.includes('ROLE_ADMIN') ?? false;
    return Promise.all([
      context.queryClient.ensureQueryData(adminYarnsOptions()),
      context.queryClient.ensureQueryData(adminSizesOptions()),
      context.queryClient.ensureQueryData(adminMaterialsOptions()),
      ...(isAdmin ? [context.queryClient.ensureQueryData(adminCategoriesOptions())] : []),
    ]);
  },
  component: LibraryPage,
});
