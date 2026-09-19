import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/get-initials';
import API_ENDPOINTS from '@/config/api-endpoints';
import env from '@/config/env';

type AuthorAvatarProps = {
  readonly authorId: string;
  readonly profilePictureUrl: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly size?: 'default' | 'sm' | 'lg';
  readonly className?: string;
};

/**
 * The author's thumbnail from the public `/v1/users/{id}/author-avatar/{file}` endpoint (`/v1/files/**` is
 * authenticated, so an anonymous visitor could not load it), falling back to text initials while it loads, when
 * the author has no picture, or if it fails.
 */
export function AuthorAvatar({
  authorId,
  profilePictureUrl,
  firstName,
  lastName,
  size = 'default',
  className,
}: AuthorAvatarProps) {
  const initials = getInitials(`${firstName} ${lastName}`.trim()) || '?';

  return (
    <Avatar size={size} className={cn('rounded-lg after:rounded-lg', className)}>
      {profilePictureUrl ? (
        <AvatarImage
          src={`${env.API_URL}${API_ENDPOINTS.files.authorAvatar(authorId, profilePictureUrl)}`}
          alt=""
          className="rounded-lg"
        />
      ) : null}
      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
    </Avatar>
  );
}
