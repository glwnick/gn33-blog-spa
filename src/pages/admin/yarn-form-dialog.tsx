import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FC } from 'react';
import type { AdminYarn, AdminYarnInput } from '@/schemas/yarns';
import type { TranslationKey } from '@/hooks/use-translation';
import { adminYarnInputSchema } from '@/schemas/yarns';
import { createAdminYarn, updateAdminYarn } from '@/api/yarns-api';
import { YARN_KEY } from '@/query-options/yarn-options';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM: AdminYarnInput = {
  name: '',
  hex: '',
  fibreComposition: '',
  supplier: '',
  notes: '',
  discontinued: false,
};

/**
 * Create/edit for one yarn. Renaming here is deliberately unguarded: propagating a rename to every product at
 * once is the reason the yarn is an entity at all, so the dialog does not warn about it the way a slug change
 * would - nothing breaks, and the storefront's swatches and fibre-composition lines follow immediately.
 */
export const YarnFormDialog: FC<{
  readonly yarn: AdminYarn | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}> = ({ yarn, open, onOpenChange }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminYarnInput>(
    yarn
      ? {
          name: yarn.name,
          hex: yarn.hex ?? '',
          fibreComposition: yarn.fibreComposition ?? '',
          supplier: yarn.supplier ?? '',
          notes: yarn.notes ?? '',
          discontinued: yarn.discontinued,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const { mutate: save, isPending } = useMutation<unknown, Error, AdminYarnInput>({
    mutationFn: (value) =>
      yarn ? updateAdminYarn(yarn.id, value) : createAdminYarn(value),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({ queryKey: [YARN_KEY] });
      // A rename changes what the product form's picker shows and what the storefront filters and product pages
      // render, so both product caches go stale with it.
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const parsed = adminYarnInputSchema.safeParse(form);
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
          <DialogTitle>{yarn ? t('adminYarnEdit') : t('adminYarnNew')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="yarn-name">{t('name')}</Label>
            <Input
              id="yarn-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="yarn-hex">{t('adminYarnSwatch')}</Label>
            <div className="flex items-center gap-2">
              {/* A native colour input alongside the text field: the text field is what makes an exact brand hex
                  paste-able, the picker is what makes choosing one bearable. They edit the same value. */}
              <Input
                type="color"
                aria-label={t('adminYarnSwatch')}
                className="h-9 w-12 shrink-0 p-1"
                value={/^#[0-9a-fA-F]{6}$/.test(form.hex ?? '') ? form.hex! : '#cccccc'}
                onChange={(e) => setForm({ ...form, hex: e.target.value })}
              />
              <Input
                id="yarn-hex"
                placeholder="#RRGGBB"
                value={form.hex ?? ''}
                onChange={(e) => setForm({ ...form, hex: e.target.value })}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('adminYarnSwatchHint')}</p>
          </div>

          <div>
            <Label htmlFor="yarn-fibre">{t('fibreCompositionYarn')}</Label>
            <Input
              id="yarn-fibre"
              placeholder={t('adminYarnFibrePlaceholder')}
              value={form.fibreComposition ?? ''}
              onChange={(e) => setForm({ ...form, fibreComposition: e.target.value })}
            />
            <p className="mt-1 text-sm text-muted-foreground">{t('adminYarnFibreHint')}</p>
          </div>

          <div>
            <Label htmlFor="yarn-supplier">{t('adminYarnSupplier')}</Label>
            <Input
              id="yarn-supplier"
              value={form.supplier ?? ''}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="yarn-notes">{t('adminYarnNotes')}</Label>
            <Textarea
              id="yarn-notes"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3">
            <span className="pr-3">
              <span className="text-sm font-medium">{t('adminYarnDiscontinued')}</span>
              <span className="block text-sm text-muted-foreground">
                {t('adminYarnDiscontinuedHint')}
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
