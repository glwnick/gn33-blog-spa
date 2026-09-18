import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { originalPictureOptions } from '@/query-options/user-options';

type OriginalPictureProps = {
  userId: string;
  alt: string;
};

export const OriginalPicture: FC<OriginalPictureProps> = ({ userId, alt }) => {
  const { data: image, isLoading } = useQuery(
    originalPictureOptions(userId, alt),
  );

  return (
    <>
      {isLoading && <Spinner className="size-16" />}
      {!isLoading && (
        <img src={image ? URL.createObjectURL(image) : undefined} alt={alt} />
      )}
    </>
  );
};
