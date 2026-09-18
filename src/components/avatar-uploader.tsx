import { useMemo, useState } from 'react';
import { CircleUserRoundIcon, XIcon } from 'lucide-react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FileMetadata } from '@/hooks/use-file-upload';
import type { ApiResponseError } from '@/lib/api-error';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentMedia,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useTranslation } from '@/hooks/use-translation';
import { deletePicture, uploadPicture } from '@/api/user-api';
import { USER_KEY } from '@/query-options/user-options';
import TranslatedFieldError from '@/components/form/translated-field-error';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const validatePicture = (
  file: File,
): 'file-invalid' | 'file-tooLarge' | null => {
  if (!file.type.startsWith('image/')) return 'file-invalid';
  if (file.size >= MAX_AVATAR_SIZE) return 'file-tooLarge';
  return null;
};

type AvatarUploaderProps = {
  picture?: Blob;
  userId: string;
  onUploadSuccess?: () => void;
};

export default function AvatarUploader({
  picture,
  userId,
  onUploadSuccess,
}: Readonly<AvatarUploaderProps>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [avatarError, setAvatarError] =
    useState<Array<{ message?: string } | undefined>>();
  const [selectionError, setSelectionError] = useState<string>();

  const initialFiles = useMemo<Array<FileMetadata>>(() => {
    if (!picture || !(picture instanceof Blob)) return [];
    return [
      {
        id: `avatar-${Date.now()}`,
        name: 'avatar.' + picture.type.split('/')[1],
        size: picture.size,
        type: picture.type,
        url: URL.createObjectURL(picture),
      },
    ];
  }, [picture]);

  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    multiple: false,
    initialFiles,
    onFilesAdded: (addedFiles) => {
      const addedFile = addedFiles[0];
      if (!(addedFile.file instanceof File)) return;

      const violation = validatePicture(addedFile.file);
      if (violation) {
        setSelectionError(violation);
        removeFile(addedFile.id);
        return;
      }

      setSelectionError(undefined);
      uploadPictureMutation(addedFile.file);
    },
  });

  const {
    mutateAsync: uploadPictureMutation,
    isPending: uploadPicturePending,
  } = useMutation({
    mutationFn: async (file: File) => {
      await uploadPicture(userId, file);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USER_KEY] });
      onUploadSuccess?.();
    },
    onError: ({ message, validationErrors }: ApiResponseError) => {
      const messages: Array<{ message?: string }> = [];
      if (message) {
        messages.push({ message });
      }
      if (validationErrors && validationErrors.length > 0) {
        messages.push(...validationErrors);
      }
      if (messages.length > 0) {
        setAvatarError(messages);
        removeFile(files[0]?.id);
      }
    },
  });

  const { mutateAsync: removePicture, isPending: removePicturePending } =
    useMutation({
      mutationFn: async () => await deletePicture(userId),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [USER_KEY] });
        removeFile(files[0]?.id);
      },
      onError: ({ message, validationErrors }: ApiResponseError) => {
        const messages: Array<{ message?: string }> = [];
        if (message) {
          messages.push({ message });
        }
        if (validationErrors && validationErrors.length > 0) {
          messages.push(...validationErrors);
        }
        if (messages.length > 0) {
          setAvatarError(messages);
        }
      },
    });

  const previewUrl = files[0]?.preview || null;
  const pending = uploadPicturePending || removePicturePending;
  const hasError =
    selectionError !== undefined || (avatarError && avatarError.length > 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <Attachment
        className="size-22 data-[state=done]:border-0"
        data-dragging={isDragging || undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        orientation="vertical"
        state={
          pending
            ? 'uploading'
            : hasError
              ? 'error'
              : previewUrl
                ? 'done'
                : 'idle'
        }
      >
        <AttachmentMedia
          variant={previewUrl ? 'image' : 'icon'}
        >
          {pending ? (
            <Spinner />
          ) : previewUrl ? (
            <img alt={files[0]?.file?.name || 'avatar'} src={previewUrl} />
          ) : (
            <CircleUserRoundIcon />
          )}
        </AttachmentMedia>
        {!pending && (
          <>
            <AttachmentActions>
              {previewUrl && (
                <AttachmentAction
                  aria-label={t('removeImage')}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePicture();
                  }}
                  type="button"
                >
                  <XIcon />
                </AttachmentAction>
              )}
            </AttachmentActions>
            <AttachmentTrigger
              aria-label={previewUrl ? t('changeImage') : t('uploadPicture')}
              onClick={openFileDialog}
            />
          </>
        )}
      </Attachment>
      <input
        {...getInputProps({
          accept: 'image/png, image/jpeg',
          disabled: pending,
        })}
        aria-label={t('uploadPicture')}
        className="sr-only"
        tabIndex={-1}
      />
      {selectionError && (
        <TranslatedFieldError errors={[{ message: selectionError }]} />
      )}
      {avatarError && avatarError.length > 0 && (
        <FieldError errors={avatarError} />
      )}
    </div>
  );
}
