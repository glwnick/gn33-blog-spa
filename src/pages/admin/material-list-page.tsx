import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { AdminMaterial } from '@/schemas/materials';
import { deleteAdminMaterial } from '@/api/materials-api';
import { MATERIAL_KEY, adminMaterialsOptions } from '@/query-options/material-options';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { MaterialFormDialog } from '@/pages/admin/material-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import { useTranslation } from '@/hooks/use-translation';

/**
 * One row of the list, modelled on `YarnRow`. A material in use cannot be deleted - the backend refuses and the
 * row says so up front rather than letting the maker click into a rejection.
 */
const MaterialRow: FC<{
  readonly material: AdminMaterial;
  readonly onEdit: (material: AdminMaterial) => void;
}> = ({ material, onEdit }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inUse = material.productCount > 0;

  const { mutate: remove } = useMutation({
    mutationFn: () => deleteAdminMaterial(material.id),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [MATERIAL_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate font-medium">{material.name}</p>
        <Badge variant={inUse ? 'outline' : 'secondary'}>
          {t('adminMaterialUsedBy', { count: material.productCount })}
        </Badge>
        {material.discontinued && (
          <Badge variant="secondary">{t('adminMaterialDiscontinued')}</Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          aria-label={t('adminMaterialEdit')}
          onClick={() => onEdit(material)}
        >
          <Pencil />
        </Button>
        {inUse ? (
          <Button
            size="sm"
            variant="secondary"
            disabled
            aria-label={t('delete')}
            title={t('adminMaterialDeleteBlocked', { count: material.productCount })}
          >
            <Trash2 />
          </Button>
        ) : (
          <AlertDialogDestructive
            buttonContent={<Trash2 />}
            buttonAriaLabel={t('delete')}
            title={t('deleteVar', {
              var1: t('adminMaterial').toLowerCase(),
              var2: material.name,
            })}
            description={t('adminMaterialDeleteDescription')}
            action={() => remove()}
          />
        )}
      </div>
    </div>
  );
};

/** One section of `/admin/library`, alongside `YarnListPage` and `SizeListPage`. */
export const MaterialListPage: FC = () => {
  const { t } = useTranslation();
  const { data: materials } = useSuspenseQuery(adminMaterialsOptions());
  const [editing, setEditing] = useState<AdminMaterial | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('adminMaterialsHint')}</p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> {t('adminMaterialNew')}
        </Button>
      </div>

      {materials.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('adminMaterialsEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('adminMaterialsEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            {materials.map((material) => (
              <MaterialRow key={material.id} material={material} onEdit={setEditing} />
            ))}
          </CardContent>
        </Card>
      )}

      {creating && (
        <MaterialFormDialog
          material={null}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
      {editing && (
        <MaterialFormDialog
          material={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
};
