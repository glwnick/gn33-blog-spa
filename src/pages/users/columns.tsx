import { UserMinus, UserPen } from 'lucide-react';

import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserAvatarColumn } from './user-avatar-column';
import { UserStatusBadge } from './user-status-badge';
import { UserRoleBadge } from './user-role-badge';
import type { AppColumnDef } from '@/components/data-table/table-features';
import type { UserResponse } from '@/schemas/users';
import type { useTranslation } from '@/hooks/use-translation';
import type { SelectOptionContentItem } from '@/query-options/collection-options';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { deleteUser } from '@/api/user-api';
import { SignInTypeBadge } from '@/components/sign-in-type/sing-in-type';
import { ColumnHeader } from '@/components/data-table/column-header';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import { formatDateTime, formatPrice } from '@/lib/formatting';

import {
  COLUMN_ACTIONS,
  COLUMN_CREATED_DATE,
  COLUMN_SELECT_CHECKBOX,
} from '@/components/data-table/constants';
import { auditColumns } from '@/components/data-table/audit-columns';
import { RowButtons } from '@/components/data-table/row-buttons';

type ColumnsOptions = {
  t: ReturnType<typeof useTranslation>['t'];
};

const roleFilterOptions = (
  t: ReturnType<typeof useTranslation>['t'],
): Array<SelectOptionContentItem> => [
  { label: t('userRoleAdmin'), value: 'ADMIN' },
  { label: t('userRoleManager'), value: 'MANAGER' },
  { label: t('userRoleUser'), value: 'USER' },
];

const statusFilterOptions = (
  t: ReturnType<typeof useTranslation>['t'],
): Array<SelectOptionContentItem> => [
  { label: t('userStatusActive'), value: 'true' },
  { label: t('userStatusBlocked'), value: 'false' },
];

export const columns = ({ t }: ColumnsOptions): Array<AppColumnDef<UserResponse>> => [
  {
    id: COLUMN_SELECT_CHECKBOX,
    enableHiding: false,
    enableSorting: false,
    enablePinning: false,

    header: ({ table }) => {
      // v9 changed `getIsSomePageRowsSelected()` from "some but not all" to "at least one, including all" -
      // recompute the v8 "some but not all" meaning explicitly, or this checkbox stays indeterminate (a
      // dash) instead of showing a checkmark once every row on the page is selected.
      const somePageRowsSelected =
        table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
      return (
        <Checkbox
          className="font-bold"
          checked={table.getIsAllRowsSelected() || somePageRowsSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          indeterminate={somePageRowsSelected}
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        // Route through the library's own generated handler rather than calling `row.toggleSelected()`
        // directly, so its side effect of recording `table._lastSelectedRowId` as the range-selection anchor
        // still happens - even though `enableRowRangeSelection` is off today, flipping just that one flag
        // back on later should be enough, not a rewrite of this handler too. The handler expects a real DOM
        // event (`event.target.checked`, no optional chaining in v9 unlike v8, plus `event.shiftKey` for
        // range selection), but base-ui's `Checkbox.onCheckedChange` calls back with a plain boolean and its
        // own event-details wrapper - build the minimal shape the handler actually reads from those.
        onCheckedChange={(checked, eventDetails) =>
          row.getToggleSelectedHandler()({
            target: { checked },
            shiftKey: 'shiftKey' in eventDetails.event ? eventDetails.event.shiftKey : false,
          })
        }
        aria-label="Select row"
      />
    ),
  },
  {
    // The design handoff's single "Customer" column: avatar plus name/email stacked, replacing three
    // separate columns. Filtering moved to the toolbar's single "Name, email or phone" search box (the
    // route's `AllFeatureTable` call) - a per-column text filter here would only ever match one of the
    // three anyway.
    accessorKey: 'firstName',
    header: ({ column }) => <ColumnHeader column={column} title={t('customer')} />,
    enablePinning: true,
    meta: { label: t('customer') },
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <UserAvatarColumn
          userId={row.original.userId}
          picture={row.original.profilePictureUrl}
          firstName={row.original.firstName}
          lastName={row.original.lastName}
        />
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground lowercase">
            {row.original.email}
          </span>
        </div>
      </div>
    ),
  },
  {
    // Batched server-side (`UserServiceImpl.mergeRoles`). The column filter writes straight to
    // `userRoleType` - no parse/format needed, `RoleFilter`'s values are already the strings a select emits.
    accessorKey: 'userRoleType',
    header: ({ column }) => <ColumnHeader column={column} title={t('userRole')} />,
    enableSorting: false,
    meta: {
      label: t('userRole'),
      filterKey: 'userRoleType',
      filterVariant: 'select',
      filterOptions: roleFilterOptions(t),
    },
    cell: ({ row }) => <UserRoleBadge role={row.original.userRoleType} />,
  },
  {
    // Display-only, like every other column here: the design handoff has no Sign in type filter, so this
    // stays out of the toolbar and out of the per-column mechanism rather than being the one exception.
    accessorKey: 'signInType',
    header: ({ column }) => <ColumnHeader column={column} title={t('signInType')} />,
    enableSorting: false,
    meta: { label: t('signInType') },
    cell: ({ row }) => <SignInTypeBadge type={row.original.signInType} />,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => <ColumnHeader column={column} title={t('phoneNumber')} />,
    enableSorting: false,
    meta: { label: t('phoneNumber') },
  },
  {
    // A select filter's own values are always strings, but `enabled` is boolean - filterParse/filterFormat
    // convert both ways so a raw "true"/"false" never round-trips into the URL's `.boolean()` filter schema.
    accessorKey: 'enabled',
    header: ({ column }) => <ColumnHeader column={column} title={t('status')} />,
    enableSorting: false,
    meta: {
      label: t('status'),
      filterKey: 'enabled',
      filterVariant: 'select',
      filterOptions: statusFilterOptions(t),
      filterParse: (raw) => (raw === '' ? undefined : raw === 'true'),
      filterFormat: (value) => (typeof value === 'boolean' ? String(value) : null),
    },
    cell: ({ row }) => (
      <UserStatusBadge
        enabled={row.original.enabled}
        emailVerified={row.original.emailVerified}
      />
    ),
  },
  {
    accessorKey: 'orderCount',
    header: ({ column }) => <ColumnHeader column={column} title={t('orders')} />,
    enableSorting: false,
    meta: { label: t('orders') },
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.orderCount}</div>
    ),
  },
  {
    accessorKey: 'lifetimeTotal',
    header: ({ column }) => <ColumnHeader column={column} title={t('lifetime')} />,
    enableSorting: false,
    meta: { label: t('lifetime') },
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">
        {formatPrice(row.original.lifetimeTotal)}
      </div>
    ),
  },
  {
    // The design handoff's "Joined" column - `createdDate`, but shown by default unlike the rest of the
    // audit trail below (`AUDIT_COLUMN_VISIBILITY` hides those; the Users page overrides just this one back
    // on, see `initialColumnVisibility` on its `AllFeatureTable` call).
    accessorKey: 'createdDate',
    header: ({ column }) => <ColumnHeader column={column} title={t('joined')} />,
    meta: { label: t('joined'), filterKey: 'createdDate', filterVariant: 'date' },
    cell: ({ row }) => formatDateTime(row.original.createdDate),
  },
  // The rest of the audit trail (who created/last touched the row, and when) - createdDate is already
  // shown above as "Joined", so it is dropped here to avoid a duplicate column id.
  ...auditColumns<UserResponse>().filter(
    (column) => !('accessorKey' in column && column.accessorKey === COLUMN_CREATED_DATE),
  ),
  {
    id: COLUMN_ACTIONS,
    cell: ({ row }) => {
      const user = row.original;
      const navigate = useNavigate();
      const queryClient = useQueryClient();
      const toUserDetails = (userId: string) =>
        navigate({ to: `/users/${userId}` });

      const { mutate: deleteUserMutation } = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
          toast.success(t('actionSuccessfully'));
          queryClient.invalidateQueries({
            queryKey: ['users'],
          });
        },
      });

      return (
        <RowButtons
          buttons={[
            <Button
              variant="secondary"
              onClick={() => toUserDetails(user.userId)}
            >
              <UserPen />
            </Button>,
            <AlertDialogDestructive
              buttonContent={<UserMinus />}
              title={t('deleteVar', {
                var1: t('user').toLowerCase(),
                var2: user.firstName + ' ' + user.lastName,
              })}
              description={t('deleteVarDescription', {
                var: t('user'),
              })}
              action={() => deleteUserMutation(user.userId)}
            />,
          ]}
        />
      );
    },
  },
];
