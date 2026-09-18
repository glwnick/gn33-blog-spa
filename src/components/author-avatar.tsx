import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type AuthorAvatarProps = {
  readonly firstName: string;
  readonly lastName: string;
  readonly size?: 'default' | 'sm' | 'lg';
  readonly className?: string;
};

/**
 * Text-initials only, never a fetched photo - matches the design handoff's own author avatars ("Avatars are
 * text-initials badges, not photos"). Deliberate, not a shortcut: `/v1/files/**` sits behind
 * `anyRequest().authenticated()` in `SecurityConfig` (profile-picture thumbnails are for the account holder's
 * own settings pages, not for a public byline), so the feed, a post's byline, its comments and the author
 * profile screen - every one of them reachable by an anonymous visitor - would 401 on a real photo anyway.
 */
export function AuthorAvatar({
  firstName,
  lastName,
  size = 'default',
  className,
}: AuthorAvatarProps) {
  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';

  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
