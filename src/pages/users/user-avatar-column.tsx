import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OriginalPicture } from '@/components/original-picture';
import { thumbnailBlobOptions } from '@/query-options/user-options';

type UserAvatarColumnProps = {
  userId: string;
  picture?: string | null;
  firstName: string;
  lastName: string;
};

export const UserAvatarColumn = ({
  userId,
  picture,
  firstName,
  lastName,
}: UserAvatarColumnProps) => {
  const { data: thumbnail, isLoading } = useQuery(
    thumbnailBlobOptions(userId, picture || ''),
  );
  const [openDialog, setOpenDialog] = useState(false);
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
          onClick={() => {
            thumbnail && setOpenDialog(true);
          }}
        >
          <AvatarImage
            src={thumbnail ? URL.createObjectURL(thumbnail) : ''}
            alt={picture || ''}
            className="rounded-lg"
          />
          <AvatarFallback className="select-none rounded-lg">
            {firstName.charAt(0).toUpperCase() +
              lastName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
        <DialogContent className="w-fit h-fit">
          <DialogTitle>{firstName + ' ' + lastName}</DialogTitle>
          <OriginalPicture userId={userId} alt={picture || ''} />
        </DialogContent>
      </Dialog>
    </>
  );
};
