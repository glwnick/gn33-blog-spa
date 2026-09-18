import { LogOut, Shield, ShieldCheck, UserPen } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { NavUserAvatar } from '@/components/layout/nav-user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-provider';
import { logoutUser } from '@/api/auth-api';
import { useTranslation } from '@/hooks/use-translation';

export function TopBarUser() {
  const { user, logout, isInitializing } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      logout(); // clear auth state first
      navigate({ to: '/login' });
    },
    onError: (err: unknown) => {
      console.log('Logout failed: ', err);
    },
  });

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="p-0">
            <NavUserAvatar
              userId={user.userId}
              // `!isInitializing`, not just the compliance flags: on the server this is always
              // `false` (see `lib/server-auth.ts`), so SSR is unaffected, but on the client it starts
              // `true` even for an authenticated visitor - `router.tsx`'s `hydrate` deliberately never
              // ships the real access token, only `AuthProvider`'s own refresh effect does (same
              // reasoning as `_auth.tsx`'s `beforeLoad` guard). Firing this query before that effect
              // resolves sent every hard reload's own-profile fetch out with no Authorization header
              // at all - a guaranteed 401, silently self-healed by `lib/axios.ts`'s retry-after-refresh
              // logic, but only after a second, redundant `/v1/auth/refresh` call race with the first.
              enabled={
                !isInitializing &&
                user.termsAccepted &&
                user.gdprConsentGiven
              }
            />
          </Button>
        }
      />
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left">
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{user.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
            <UserPen />
            {t('profile')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate({ to: '/profile/security' })}
          >
            <Shield />
            {t('security')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/profile/privacy' })}>
            <ShieldCheck />
            {t('privacyAndData')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logoutMutation.mutateAsync()}
            disabled={logoutMutation.isPending}
          >
            <LogOut />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
