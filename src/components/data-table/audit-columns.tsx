import type { AppColumnDef } from '@/components/data-table/table-features';
import { useTranslation } from '@/hooks/use-translation';
import { ColumnHeader } from '@/components/data-table/column-header';
import { formatDateTime } from '@/lib/formatting';
import {
  COLUMN_CREATED_BY,
  COLUMN_CREATED_DATE,
  COLUMN_LAST_MODIFIED_BY,
  COLUMN_LAST_MODIFIED_DATE,
} from '@/components/data-table/constants';

type AuditFields = {
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
};

export const auditColumns = <T extends AuditFields>(): Array<AppColumnDef<T>> => [
  {
    accessorKey: COLUMN_CREATED_BY,
    header: ({ column }) => {
      const { t } = useTranslation();
      return <ColumnHeader column={column} title={t('createdBy')} />;
    },
    enableSorting: false,
    meta: { filterKey: 'createdBy' },
  },
  {
    accessorKey: COLUMN_CREATED_DATE,

    header: ({ column }) => {
      const { t } = useTranslation();
      return <ColumnHeader column={column} title={t('createdDate')} />;
    },
    meta: { filterKey: 'createdDate', filterVariant: 'date' },
    cell: ({ row }) => formatDateTime(row.original.createdDate),
  },
  {
    accessorKey: COLUMN_LAST_MODIFIED_BY,
    header: ({ column }) => {
      const { t } = useTranslation();
      return <ColumnHeader column={column} title={t('lastModifiedBy')} />;
    },
    enableSorting: false,
    meta: { filterKey: 'lastModifiedBy' },
  },
  {
    accessorKey: COLUMN_LAST_MODIFIED_DATE,
    header: ({ column }) => {
      const { t } = useTranslation();
      return <ColumnHeader column={column} title={t('lastModifiedDate')} />;
    },
    meta: { filterKey: 'lastModifiedDate', filterVariant: 'date' },
    cell: ({ row }) => formatDateTime(row.original.lastModifiedDate),
  },
];
