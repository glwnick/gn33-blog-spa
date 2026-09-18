import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AvatarUploader from '@/components/avatar-uploader';
import { Spinner } from '@/components/ui/spinner';
import { thumbnailBlobOptions } from '@/query-options/user-options';

interface IUserAvatarProps {
  readonly userId: string;
  readonly profilePictureUrl: string | null;
}

export const UserAvatar = memo<IUserAvatarProps>(
  ({ userId, profilePictureUrl }) => {
    const { data, isLoading } = useQuery(
      thumbnailBlobOptions(userId, profilePictureUrl || ''),
    );

    return (
      <>
        {isLoading ? (
          <Spinner />
        ) : (
          <AvatarUploader picture={data} userId={userId} />
        )}
      </>
    );
  },
);
