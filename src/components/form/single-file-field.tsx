import { useLayoutEffect, useState } from 'react';
import { ImageIcon, XIcon } from 'lucide-react';
import type { FC } from 'react';

import type { FormFieldProps } from '@/types/form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { useFieldContext } from '@/hooks/use-form-context';
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import TranslatedFieldError from '@/components/form/translated-field-error';

const SingleFileField: FC<FormFieldProps> = ({
  label,
  description,
  mandatoryLabel = false,
}) => {
  const { t } = useTranslation();
  const field = useFieldContext<File | undefined>();
  const file = field.state.value;

  const [preview, setPreview] = useState<string>();

  // useLayoutEffect (not useEffect) so the preview is ready before the
  // browser paints - otherwise an edit-mode field that mounts with an
  // already-set file (the room/location dialogs preload the existing
  // picture) flashes the placeholder icon for one frame first.
  useLayoutEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [
    { isDragging },
    {
      getInputProps,
      openFileDialog,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    multiple: false,
    onFilesAdded: (addedFiles) => {
      const addedFile = addedFiles[0]?.file;
      if (addedFile instanceof File) {
        field.handleChange(addedFile);
      }
    },
  });

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name} mandatory={mandatoryLabel}>
        {label}
      </FieldLabel>
      <Attachment
        className={cn('w-full', isDragging && 'bg-accent/50')}
        data-dragging={isDragging || undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        state={isInvalid ? 'error' : file ? 'done' : 'idle'}
      >
        <AttachmentMedia variant={file && preview ? 'image' : 'icon'}>
          {file && preview ? (
            <img alt={file.name} src={preview} />
          ) : (
            <ImageIcon />
          )}
        </AttachmentMedia>
        <AttachmentContent>
          {file ? (
            <>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>
                {file.type} · {formatBytes(file.size)}
              </AttachmentDescription>
            </>
          ) : (
            <AttachmentDescription>{t('dropImageHint')}</AttachmentDescription>
          )}
        </AttachmentContent>
        <AttachmentActions>
          {file && (
            <AttachmentAction
              aria-label={t('removeImage')}
              onClick={(e) => {
                e.stopPropagation();
                field.handleChange(undefined);
              }}
              type="button"
            >
              <XIcon />
            </AttachmentAction>
          )}
        </AttachmentActions>
        <AttachmentTrigger
          aria-label={file ? t('changeImage') : t('uploadPicture')}
          onClick={openFileDialog}
        />
      </Attachment>
      <input
        {...getInputProps({ accept: 'image/png, image/jpeg' })}
        aria-invalid={isInvalid}
        className="sr-only"
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        tabIndex={-1}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <TranslatedFieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export default SingleFileField;
