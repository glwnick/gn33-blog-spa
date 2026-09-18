import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useObjectUrl } from '@/hooks/use-object-url';
import {
  thumbnailBlobOptions,
  userOptions,
} from '@/query-options/user-options';

interface NavUserAvatarProps {
  userId: string;
  // Own-profile reads are gated behind terms/GDPR compliance server-side (`TermsAndConditionsFilter`/
  // `GdprFilter`), which a visitor who just signed up through Google/Facebook has not given yet - the
  // provider never shows a consent checkbox, and `/terms` is exactly where such a visitor is sent to give
  // it. `TopNav` renders on every route, `/terms` included, so without this the avatar fetch below would
  // 403 on that very page. Defaults to enabled: every other caller already has a compliant user.
  enabled?: boolean;
}

export const NavUserAvatar = ({ userId, enabled = true }: NavUserAvatarProps) => {
  const { data: user } = useQuery({ ...userOptions(userId), enabled });
  const picture = user?.profilePictureUrl || '';
  // `thumbnailBlobOptions` sets its own `enabled: !!objectId && !!picture` - AND with it here rather
  // than overriding, or a compliant user with no profile picture would fire a doomed fetch for an
  // empty filename on every render instead of correctly skipping it.
  const baseThumbnailOptions = thumbnailBlobOptions(userId, picture);
  const { data: thumbnail, isLoading } = useQuery({
    ...baseThumbnailOptions,
    enabled: enabled && baseThumbnailOptions.enabled,
  });
  const thumbnailUrl = useObjectUrl(thumbnail);
  return (
    <>
      {isLoading && <Spinner className="size-8" />}
      {!isLoading && (
        <Avatar
          className={
            thumbnail
              ? 'cursor-pointer rounded-lg after:rounded-lg'
              : 'rounded-lg after:rounded-lg'
          }
        >
          <AvatarImage
            src={thumbnailUrl ?? ''}
            alt={picture}
            className="rounded-lg"
          />
          <AvatarFallback className="select-none rounded-lg">
            {user &&
              user.firstName.charAt(0).toUpperCase() +
                user.lastName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </>
  );
};
