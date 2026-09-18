import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { AdminSize } from '@/schemas/sizes';
import { deleteAdminSize } from '@/api/sizes-api';
import { SIZE_KEY, adminSizesOptions } from '@/query-options/size-options';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { SizeFormDialog } from '@/pages/admin/size-form-dialog';
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
 * One row of the list, modelled on `YarnRow`. A size in use cannot be deleted - the backend refuses and the row
 * says so up front rather than letting the maker click into a rejection.
 */
const SizeRow: FC<{
  readonly size: AdminSize;
  readonly onEdit: (size: AdminSize) => void;
}> = ({ size, onEdit }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inUse = size.productCount > 0;

  const { mutate: remove } = useMutation({
    mutationFn: () => deleteAdminSize(size.id),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [SIZE_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate font-medium">{size.name}</p>
        <Badge variant={inUse ? 'outline' : 'secondary'}>
          {t('adminSizeUsedBy', { count: size.productCount })}
        </Badge>
        {size.discontinued && (
          <Badge variant="secondary">{t('adminSizeDiscontinued')}</Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          aria-label={t('adminSizeEdit')}
          onClick={() => onEdit(size)}
        >
          <Pencil />
        </Button>
        {inUse ? (
          <Button
            size="sm"
            variant="secondary"
            disabled
            aria-label={t('delete')}
            title={t('adminSizeDeleteBlocked', { count: size.productCount })}
          >
            <Trash2 />
          </Button>
        ) : (
          <AlertDialogDestructive
            buttonContent={<Trash2 />}
            buttonAriaLabel={t('delete')}
            title={t('deleteVar', {
              var1: t('adminSize').toLowerCase(),
              var2: size.name,
            })}
            description={t('adminSizeDeleteDescription')}
            action={() => remove()}
          />
        )}
      </div>
    </div>
  );
};

/** One section of `/admin/library`, alongside `YarnListPage` and `MaterialListPage`. */
export const SizeListPage: FC = () => {
  const { t } = useTranslation();
  const { data: sizes } = useSuspenseQuery(adminSizesOptions());
  const [editing, setEditing] = useState<AdminSize | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('adminSizesHint')}</p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> {t('adminSizeNew')}
        </Button>
      </div>

      {sizes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('adminSizesEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('adminSizesEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            {sizes.map((size) => (
              <SizeRow key={size.id} size={size} onEdit={setEditing} />
            ))}
          </CardContent>
        </Card>
      )}

      {creating && (
        <SizeFormDialog size={null} open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <SizeFormDialog
          size={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
};
