import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, Trash } from 'lucide-react';
import type { RoleType } from '@/api/role-api';
import type { FC } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { rolesOptions, userRolesOptions } from '@/query-options/role-options';
import { assignRole, removeRole } from '@/api/role-api';

type UserRoleCardProps = {
  userId: string;
};

export const UserRoleCard: FC<UserRoleCardProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { data: roles } = useQuery(rolesOptions());
  const { data: userRoles } = useQuery(userRolesOptions(userId));
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (roleId: string) => {
      if (userRoles?.includes(roleId)) {
        await removeRole(userId, roleId);
      } else {
        await assignRole(userId, roleId);
      }
      queryClient.invalidateQueries(userRolesOptions(userId));
    },
    onError: (err) => {
      console.log(err);
    },
  });

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>{t('userRoles')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="max-w-sm">
          {roles &&
            userRoles &&
            roles.map((r) => (
              <RoleField
                key={r.roleId}
                roleType={r}
                hasRole={userRoles.includes(r.roleId)}
                mutateAsync={mutateAsync}
                isPending={isPending}
              />
            ))}
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

const RoleField = ({
  roleType,
  hasRole,
  mutateAsync,
  isPending,
}: {
  roleType: RoleType;
  hasRole: boolean;
  mutateAsync: (roleId: string) => void;
  isPending: boolean;
}) => {
  const isUserRole = roleType.role.key === 'USER';
  return (
    <FieldLabel>
      <Field orientation="horizontal">
        <CheckSquare
          className={hasRole ? 'size-4 text-primary-strong' : 'size-4 text-accent'}
        />
        <FieldTitle>{roleType.role.localizedMessage}</FieldTitle>
        <Button
          size="icon-xs"
          variant={isUserRole ? 'ghost' : hasRole ? 'destructive' : 'default'}
          disabled={isUserRole || isPending}
          onClick={() => mutateAsync(roleType.roleId)}
        >
          {isPending ? <Spinner /> : hasRole ? <Trash /> : <Plus />}
        </Button>
      </Field>
    </FieldLabel>
  );
};
