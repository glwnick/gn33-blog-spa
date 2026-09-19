import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import type { ComponentProps, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadPostImage } from '@/api/post-image-api';
import { useTranslation } from '@/hooks/use-translation';
import { resolveImageUrl } from '@/lib/image-url';
import { isImageRef } from '@/schemas/posts';

type ImageRefInputProps = Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChange'
> & {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Called with true while an upload is in flight, so the editor can hold back actions that would misplace it. */
  readonly onPendingChange?: (pending: boolean) => void;
};

/**
 * An image field that takes either a pasted https URL or an uploaded file. Uploading swaps the field's value for
 * the path the backend returns, so the rest of the editor treats both the same way.
 */
export const ImageRefInput: FC<ImageRefInputProps> = ({
  value,
  onValueChange,
  onPendingChange,
  onBlur,
  ...inputProps
}) => {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  // A pasted URL is only previewed once the field is left (or was already saved that way): previewing on every
  // keystroke would request each valid-looking prefix, like https://e, from whatever host is being typed.
  const [settledValue, setSettledValue] = useState(value);
  const upload = useMutation({
    mutationFn: uploadPostImage,
    onSuccess: (path) => {
      setSettledValue(path);
      onValueChange(path);
    },
  });

  const isPending = upload.isPending;
  useEffect(() => {
    if (!isPending) {
      return;
    }
    onPendingChange?.(true);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          {...inputProps}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={(event) => {
            setSettledValue(event.target.value);
            onBlur?.(event);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-1.5"
          disabled={isPending}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="size-4" />
          {t(isPending ? 'editorUploadingImage' : 'editorUploadImage')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png, image/jpeg"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset so picking the same file again after a failure still fires onChange.
            event.target.value = '';
            if (file) {
              upload.mutate(file);
            }
          }}
        />
      </div>
      {value && value === settledValue && isImageRef(value) && (
        <img
          src={resolveImageUrl(value)}
          alt=""
          className="h-24 w-fit max-w-full rounded-md border object-cover"
        />
      )}
    </div>
  );
};
