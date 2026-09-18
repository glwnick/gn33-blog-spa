import { queryOptions } from '@tanstack/react-query';
import { getOriginalPicture, getThumbnail } from '@/api/file-api';

export const thumbnailBlobOptions = (
  key: string,
  objectId: string,
  picture: string,
) => {
  return queryOptions({
    queryKey: [key, objectId, 'thumbnail-blob', picture],
    queryFn: async () => getThumbnail(objectId, picture),
    retry: false,
    staleTime: Infinity,
    meta: {
      skipGlobalErrorToast: true,
    },
    enabled: !!objectId && !!picture,
  });
};

export const originalPictureBlobOptions = (
  key: string,
  objectId: string,
  picture: string,
) => {
  return queryOptions({
    queryKey: [key, objectId, 'original-picture-blob', picture],
    queryFn: async () => getOriginalPicture(objectId, picture),
    retry: false,
    staleTime: Infinity,
    meta: {
      skipGlobalErrorToast: true,
    },
    enabled: !!objectId && !!picture,
  });
};
