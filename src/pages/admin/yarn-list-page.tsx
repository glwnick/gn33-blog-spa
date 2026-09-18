import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { AdminYarn } from '@/schemas/yarns';
import { deleteAdminYarn } from '@/api/yarns-api';
import { YARN_KEY, adminYarnsOptions } from '@/query-options/yarn-options';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { YarnFormDialog } from '@/pages/admin/yarn-form-dialog';
import { YarnSwatch } from '@/pages/admin/yarn-swatch';
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
 * One row of the palette. A yarn in use cannot be deleted - the backend refuses and the row says so up front
 * rather than letting the maker click into a rejection, because "used by 3 products" is also the answer to the
 * question they were actually asking.
 */
const YarnRow: FC<{
  readonly yarn: AdminYarn;
  readonly onEdit: (yarn: AdminYarn) => void;
}> = ({ yarn, onEdit }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inUse = yarn.productCount > 0;

  const { mutate: remove } = useMutation({
    mutationFn: () => deleteAdminYarn(yarn.id),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [YARN_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <YarnSwatch hex={yarn.hex} className="mt-0.5 size-8" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{yarn.name}</p>
            <Badge variant={inUse ? 'outline' : 'secondary'}>
              {t('adminYarnUsedBy', { count: yarn.productCount })}
            </Badge>
            {yarn.discontinued && (
              <Badge variant="secondary">{t('adminYarnDiscontinued')}</Badge>
            )}
          </div>
          {yarn.fibreComposition && (
            <p className="truncate text-sm text-muted-foreground">
              {yarn.fibreComposition}
            </p>
          )}
          {yarn.supplier && (
            <p className="truncate text-sm text-muted-foreground">{yarn.supplier}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          aria-label={t('adminYarnEdit')}
          onClick={() => onEdit(yarn)}
        >
          <Pencil />
        </Button>
        {inUse ? (
          // Disabled rather than absent, with the reason in its tooltip: a control that vanishes reads as a bug,
          // and the maker needs to know discontinuing is the way to retire a yarn that products still declare.
          <Button
            size="sm"
            variant="secondary"
            disabled
            aria-label={t('delete')}
            title={t('adminYarnDeleteBlocked', { count: yarn.productCount })}
          >
            <Trash2 />
          </Button>
        ) : (
          <AlertDialogDestructive
            buttonContent={<Trash2 />}
            buttonAriaLabel={t('delete')}
            title={t('deleteVar', {
              var1: t('adminYarn').toLowerCase(),
              var2: yarn.name,
            })}
            description={t('adminYarnDeleteDescription')}
            action={() => remove()}
          />
        )}
      </div>
    </div>
  );
};

/** One section of `/admin/library`, alongside {@link SizeListPage} and {@link MaterialListPage}. */
export const YarnListPage: FC = () => {
  const { t } = useTranslation();
  const { data: yarns } = useSuspenseQuery(adminYarnsOptions());
  const [editing, setEditing] = useState<AdminYarn | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('adminYarnsHint')}</p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> {t('adminYarnNew')}
        </Button>
      </div>

      {yarns.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('adminYarnsEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('adminYarnsEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            {yarns.map((yarn) => (
              <YarnRow key={yarn.id} yarn={yarn} onEdit={setEditing} />
            ))}
          </CardContent>
        </Card>
      )}

      {creating && (
        <YarnFormDialog yarn={null} open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <YarnFormDialog
          yarn={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
};
