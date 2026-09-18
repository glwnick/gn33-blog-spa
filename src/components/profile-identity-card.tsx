import { useQuery } from '@tanstack/react-query';
import { Heart, Package } from 'lucide-react';
import type { QueryClient } from '@tanstack/react-query';
import type { TranslationKey } from '@/hooks/use-translation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { profileOptions } from '@/query-options/user-details';
import { myOrderCountOptions } from '@/query-options/order-options';
import { myFavoritesCountOptions } from '@/query-options/favorites-options';

// Highest staff role wins the badge; a plain account holder falls back to "Customer". INSTRUCTOR is dead
// weight carried over from gn33 (frontend-conventions) and never granted in the shop, so it has no entry here.
const STAFF_ROLE_LABELS: ReadonlyArray<readonly [string, TranslationKey]> = [
  ['ROLE_ADMIN', 'profileRoleAdmin'],
  ['ROLE_MANAGER', 'profileRoleManager'],
];

/**
 * Everything `ProfileIdentityCard` reads, warmed from each `/profile*` route's own `loader` - the same
 * `ensureQueryData` house pattern as `routes/_auth/home/index.tsx`. Without this, the card (shared across all
 * three routes via `ProfileLayout`) would render as a loading skeleton on first paint on `security` and
 * `privacy`, which otherwise need no client query at all, then refetch once hydrated.
 */
export const prefetchProfileIdentity = (
  queryClient: QueryClient,
  userId: string,
) =>
  Promise.all([
    queryClient.ensureQueryData(profileOptions(userId)),
    queryClient.ensureQueryData(myOrderCountOptions()),
    queryClient.ensureQueryData(myFavoritesCountOptions()),
  ]);

/**
 * The sticky left rail of the account section: avatar, name, email, a role badge, an "enabled" account-status
 * badge, and the Orders/Saved-pieces counts. Shared by all three `/profile*` routes via `ProfileLayout`, so
 * it reads `useAuth()` rather than taking props - `security.tsx` and `privacy.tsx` never fetch the full
 * profile DTO themselves.
 */
export function ProfileIdentityCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: profile } = useQuery(profileOptions(user!.userId));
  const { data: orderCount } = useQuery(myOrderCountOptions());
  const { data: favoritesCount } = useQuery(myFavoritesCountOptions());

  const roleLabelKey =
    STAFF_ROLE_LABELS.find(([role]) => user!.roles.includes(role))?.[1] ??
    'profileRoleCustomer';
  // `profile.enabled` is the freshly-fetched value; `user.enabled` is the session snapshot taken at login and
  // can go stale if staff disable the account mid-session, so the fresher one wins once it has loaded.
  const enabled = profile?.enabled ?? user!.enabled;

  return (
    <Card className="items-center px-4 text-center">
      <CardContent className="flex w-full flex-col items-center gap-3 px-0">
        {profile ? (
          <UserAvatar
            userId={profile.userId}
            profilePictureUrl={profile.profilePictureUrl}
          />
        ) : (
          <Skeleton className="size-22 rounded-xl" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{user!.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {user!.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge variant="accent">{t(roleLabelKey)}</Badge>
          {enabled && (
            <Badge variant="secondary">{t('profileActiveBadge')}</Badge>
          )}
        </div>
        <Separator />
        <div className="grid w-full grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-lg font-semibold">
              <Package className="size-4 text-muted-foreground" />
              {orderCount === undefined ? (
                <Skeleton className="h-5 w-4" />
              ) : (
                orderCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('profileOrdersStat')}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-lg font-semibold">
              <Heart className="size-4 text-muted-foreground" />
              {favoritesCount === undefined ? (
                <Skeleton className="h-5 w-4" />
              ) : (
                favoritesCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('profileSavedPiecesStat')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
