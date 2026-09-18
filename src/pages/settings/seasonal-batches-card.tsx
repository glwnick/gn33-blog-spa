import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { SeasonalBatch, SeasonalBatchForm } from '@/schemas/settings';
import type { TranslationKey } from '@/hooks/use-translation';
import { seasonalBatchFormSchema } from '@/schemas/settings';
import {
  createSeasonalBatch,
  deleteSeasonalBatch,
  updateSeasonalBatch,
} from '@/api/seasonal-batches-api';
import {
  SEASONAL_BATCH_KEY,
  seasonalBatchesOptions,
} from '@/query-options/seasonal-batch-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const STATUS_VARIANT = {
  PLANNED: 'outline',
  OPEN: 'accent',
  CLOSED: 'secondary',
} as const;

const EMPTY_FORM: SeasonalBatchForm = {
  name: '',
  startsOn: '',
  endsOn: '',
  capacity: 0,
  status: 'PLANNED',
};

const BatchFormDialog: FC<{
  readonly batch: SeasonalBatch | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}> = ({ batch, open, onOpenChange }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SeasonalBatchForm>(
    batch
      ? {
          name: batch.name,
          startsOn: batch.startsOn,
          endsOn: batch.endsOn,
          capacity: batch.capacity,
          status: batch.status,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [SEASONAL_BATCH_KEY] });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (value: SeasonalBatchForm) =>
      batch ? updateSeasonalBatch(batch.id, value) : createSeasonalBatch(value),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const parsed = seasonalBatchFormSchema.safeParse(form);
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
            {batch ? t('editSeasonalBatch') : t('newSeasonalBatch')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="batch-name">{t('seasonalBatchName')}</Label>
            <Input
              id="batch-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="batch-starts">{t('seasonalBatchStartsOn')}</Label>
              <Input
                id="batch-starts"
                type="date"
                value={form.startsOn}
                onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="batch-ends">{t('seasonalBatchEndsOn')}</Label>
              <Input
                id="batch-ends"
                type="date"
                value={form.endsOn}
                onChange={(e) => setForm({ ...form, endsOn: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="batch-capacity">{t('seasonalBatchCapacity')}</Label>
              <Input
                id="batch-capacity"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex-1">
              <Label>{t('status')}</Label>
              <Select
                items={[
                  { label: t('seasonalBatchPlanned'), value: 'PLANNED' },
                  { label: t('seasonalBatchOpen'), value: 'OPEN' },
                  { label: t('seasonalBatchClosed'), value: 'CLOSED' },
                ]}
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as SeasonalBatchForm['status'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="PLANNED">{t('seasonalBatchPlanned')}</SelectItem>
                    <SelectItem value="OPEN">{t('seasonalBatchOpen')}</SelectItem>
                    <SelectItem value="CLOSED">{t('seasonalBatchClosed')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
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

export const SeasonalBatchesCard: FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: batches, isPending } = useQuery(seasonalBatchesOptions());
  const [editing, setEditing] = useState<SeasonalBatch | null>(null);
  const [creating, setCreating] = useState(false);

  const { mutate: remove } = useMutation({
    mutationFn: (batchId: string) => deleteSeasonalBatch(batchId),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [SEASONAL_BATCH_KEY] });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            <CalendarRange className="mr-2 inline" size="20" />
            {t('seasonalBatches')}
          </CardTitle>
          <CardDescription>{t('seasonalBatchesHint')}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus /> {t('newSeasonalBatch')}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!isPending && batches?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
        )}
        {batches?.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <CalendarRange className="shrink-0 text-muted-foreground" size={18} />
              <div className="min-w-0">
                <p className="truncate font-medium">{batch.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {t('seasonalBatchPreorderRange', {
                    from: formatDate(batch.startsOn),
                    to: formatDate(batch.endsOn),
                    capacity: batch.capacity,
                  })}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={STATUS_VARIANT[batch.status]}>
                {t(
                  batch.status === 'PLANNED'
                    ? 'seasonalBatchPlanned'
                    : batch.status === 'OPEN'
                      ? 'seasonalBatchOpen'
                      : 'seasonalBatchClosed',
                )}
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => setEditing(batch)}>
                <Pencil />
              </Button>
              <AlertDialogDestructive
                buttonContent={<Trash2 />}
                title={t('deleteVar', {
                  var1: t('seasonalBatch').toLowerCase(),
                  var2: batch.name,
                })}
                description={t('deleteVarDescription', {
                  var: t('seasonalBatch'),
                })}
                action={() => remove(batch.id)}
              />
            </div>
          </div>
        ))}
      </CardContent>

      {creating && (
        <BatchFormDialog batch={null} open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <BatchFormDialog
          batch={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </Card>
  );
};
