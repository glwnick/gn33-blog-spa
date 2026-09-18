import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { AdminCategory, AdminCategoryForm } from '@/schemas/admin-categories';
import type { TranslationKey } from '@/hooks/use-translation';
import { adminCategoryFormSchema } from '@/schemas/admin-categories';
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
  updateAdminCategoryMakingLeadTime,
} from '@/api/admin-categories-api';
import {
  ADMIN_CATEGORY_KEY,
  adminCategoriesOptions,
} from '@/query-options/admin-category-options';
import { CATEGORY_KEY } from '@/query-options/category-options';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';

const EMPTY_FORM: AdminCategoryForm = { name: '', slug: '' };

const CategoryFormDialog: FC<{
  readonly category: AdminCategory | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}> = ({ category, open, onOpenChange }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminCategoryForm>(
    category ? { name: category.name, slug: category.slug } : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_CATEGORY_KEY] });
    queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY] });
  };

  const { mutate: save, isPending } = useMutation<unknown, Error, AdminCategoryForm>({
    mutationFn: (value) =>
      category ? updateAdminCategory(category.id, value) : createAdminCategory(value),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const parsed = adminCategoryFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message as TranslationKey));
      return;
    }
    setError(null);
    save(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t('editCategory') : t('newCategory')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="category-name">{t('name')}</Label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="category-slug">{t('slug')}</Label>
            <Input
              id="category-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {t('categorySlugHint')}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CategoryLeadTimeRow: FC<{ readonly category: AdminCategory }> = ({ category }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(
    category.makingLeadTimeDays === null ? '' : String(category.makingLeadTimeDays),
  );

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      updateAdminCategoryMakingLeadTime(category.id, value === '' ? null : Number(value)),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({ queryKey: [ADMIN_CATEGORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY] });
    },
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('makingLeadTime')}</span>
      <Input
        type="number"
        min={0}
        className="w-20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <span className="text-sm text-muted-foreground">{t('days')}</span>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => save()}>
        {t('save')}
      </Button>
    </div>
  );
};

/**
 * The `/admin/library`'s admin-only fourth section, alongside `YarnListPage`, `SizeListPage` and
 * `MaterialListPage`. Unlike those three, `AdminCategoryController` is ADMIN-only, not MANAGER+ADMIN
 * (choosing a category is shop configuration, not making work), so `LibraryPage` only offers this section,
 * and only prefetches it in the route loader, when the signed-in user holds `ROLE_ADMIN`.
 */
export const CategoryCard: FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories, isPending } = useQuery(adminCategoriesOptions());
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const { mutate: remove } = useMutation({
    mutationFn: (categoryId: string) => deleteAdminCategory(categoryId),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [ADMIN_CATEGORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY] });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            <Tags className="mr-2 inline" size="20" />
            {t('categories')}
          </CardTitle>
          <CardDescription>{t('categoriesHint')}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus /> {t('newCategory')}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!isPending && categories?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
        )}
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{category.name}</p>
                <Badge variant="outline">
                  {t('shopResultCount', { count: category.productCount })}
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">/{category.slug}</p>
              <div className="mt-2">
                <CategoryLeadTimeRow category={category} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(category)}>
                <Pencil />
              </Button>
              <AlertDialogDestructive
                buttonContent={<Trash2 />}
                title={t('deleteVar', {
                  var1: t('category').toLowerCase(),
                  var2: category.name,
                })}
                description={t('deleteVarDescription', { var: t('category') })}
                action={() => remove(category.id)}
              />
            </div>
          </div>
        ))}
      </CardContent>

      {creating && (
        <CategoryFormDialog category={null} open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <CategoryFormDialog
          category={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </Card>
  );
};
