import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FC } from 'react';
import type { AdminMaterial, AdminMaterialInput } from '@/schemas/materials';
import type { TranslationKey } from '@/hooks/use-translation';
import { adminMaterialInputSchema } from '@/schemas/materials';
import { createAdminMaterial, updateAdminMaterial } from '@/api/materials-api';
import { MATERIAL_KEY } from '@/query-options/material-options';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM: AdminMaterialInput = {
  name: '',
  discontinued: false,
};

/**
 * Create/edit for one material, modelled on `YarnFormDialog`. Renaming here is deliberately unguarded, same
 * reasoning: propagating a rename to every product at once is the reason the material is an entity at all.
 */
export const MaterialFormDialog: FC<{
  readonly material: AdminMaterial | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}> = ({ material, open, onOpenChange }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminMaterialInput>(
    material
      ? { name: material.name, discontinued: material.discontinued }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const { mutate: save, isPending } = useMutation<unknown, Error, AdminMaterialInput>({
    mutationFn: (value) =>
      material ? updateAdminMaterial(material.id, value) : createAdminMaterial(value),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({ queryKey: [MATERIAL_KEY] });
      // A rename changes what the product form's picker shows and what the storefront filters render, so both
      // product caches go stale with it.
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const parsed = adminMaterialInputSchema.safeParse(form);
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
          <DialogTitle>
            {material ? t('adminMaterialEdit') : t('adminMaterialNew')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="material-name">{t('name')}</Label>
            <Input
              id="material-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3">
            <span className="pr-3">
              <span className="text-sm font-medium">{t('adminMaterialDiscontinued')}</span>
              <span className="block text-sm text-muted-foreground">
                {t('adminMaterialDiscontinuedHint')}
              </span>
            </span>
            <Switch
              checked={form.discontinued}
              onCheckedChange={(checked) => setForm({ ...form, discontinued: checked })}
            />
          </label>

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
