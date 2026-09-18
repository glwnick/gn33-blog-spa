import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { thumbnailBlobOptions } from '@/query-options/user-options';
import { getInitials } from '@/lib/get-initials';
import { useObjectUrl } from '@/hooks/use-object-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserThumbnailAvatarProps = {
  readonly userId: string;
  readonly profilePictureUrl: string | null | undefined;
  readonly name: string;
  readonly size?: 'sm' | 'default' | 'lg';
};

/**
 * Read-only user avatar. The backend stores only the picture filename, so the
 * image must be fetched as an authenticated thumbnail blob; falls back to the
 * user's initials while loading or when no picture is set.
 */
export const UserThumbnailAvatar: FC<UserThumbnailAvatarProps> = ({
  userId,
  profilePictureUrl,
  name,
  size = 'default',
}) => {
  const { data: thumbBlob } = useQuery(
    thumbnailBlobOptions(userId, profilePictureUrl ?? ''),
  );
  const thumbUrl = useObjectUrl(thumbBlob);
  return (
    <Avatar size={size}>
      {thumbUrl && <AvatarImage src={thumbUrl} alt={name} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
};
