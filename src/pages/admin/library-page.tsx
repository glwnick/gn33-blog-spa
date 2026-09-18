import { useState } from 'react';
import type { TranslationKey } from '@/hooks/use-translation';
import { AppContent } from '@/components/layout/app-content';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/context/auth-provider';
import { YarnListPage } from '@/pages/admin/yarn-list-page';
import { SizeListPage } from '@/pages/admin/size-list-page';
import { MaterialListPage } from '@/pages/admin/material-list-page';
import { CategoryCard } from '@/pages/admin/category-card';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

/**
 * The small, slow-changing lookups a variant is made from - modelled on the section switcher in
 * `pages/settings/settings-page.tsx` rather than a new Tabs primitive, since one already exists in the codebase.
 * `categories` is filtered out below for anyone but ROLE_ADMIN: unlike yarn/size/material, choosing a
 * category is ADMIN-only (`AdminCategoryController`), not MANAGER+ADMIN.
 */
const SECTIONS = [
  { id: 'yarns', titleKey: 'adminYarns' },
  { id: 'sizes', titleKey: 'adminSizes' },
  { id: 'materials', titleKey: 'adminMaterials' },
  { id: 'categories', titleKey: 'categories' },
] as const satisfies ReadonlyArray<{ id: string; titleKey: TranslationKey }>;

type SectionId = (typeof SECTIONS)[number]['id'];

export function LibraryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;
  const [section, setSection] = useState<SectionId>('yarns');
  const sections = isAdmin ? SECTIONS : SECTIONS.filter((item) => item.id !== 'categories');

  return (
    <AppContent title={t('adminLibrary')}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 md:sticky md:top-20 md:h-fit md:flex-col">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                buttonVariants({
                  variant: section === item.id ? 'default' : 'ghost',
                  size: 'sm',
                }),
                'justify-start',
              )}
            >
              {t(item.titleKey)}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-6">
          {section === 'yarns' && <YarnListPage />}
          {section === 'sizes' && <SizeListPage />}
          {section === 'materials' && <MaterialListPage />}
          {section === 'categories' && isAdmin && <CategoryCard />}
        </div>
      </div>
    </AppContent>
  );
}
