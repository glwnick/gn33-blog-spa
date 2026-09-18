import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GripVertical, ImagePlus, Star, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import type { AdminProductImage, AdminProductVariantDetail } from '@/schemas/admin-products';
import {
  deleteAdminProductImage,
  reorderAdminProductImages,
  uploadAdminProductImage,
} from '@/api/admin-products-api';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { productImageSrc } from '@/lib/product-image-src';
import { useTranslation } from '@/hooks/use-translation';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
} from '@/components/ui/attachment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import TranslatedFieldError from '@/components/form/translated-field-error';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

function validateImageFile(file: File): 'file-invalid' | 'file-tooLarge' | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'file-invalid';
  if (file.size >= MAX_IMAGE_SIZE) return 'file-tooLarge';
  return null;
}

type ProductImageManagerProps = {
  readonly productId: string;
  readonly images: Array<AdminProductImage>;
  readonly variants: Array<AdminProductVariantDetail>;
};

/**
 * plans/PLAN-catalogue-admin.md stage 2's admin gallery. Alt text and the optional variant binding are only
 * ever set at upload time - the backend has no endpoint to edit an existing image's metadata, only to reorder,
 * change which one is primary, or delete it outright, so that is the whole of what this manages after upload.
 *
 * <p>Reordering is both a native HTML5 drag (pointer users) and move-left/move-right buttons (keyboard and
 * screen-reader users, who cannot complete a drag gesture) - no drag-and-drop library is a dependency of this
 * app, and hand-rolling the drag events is simpler than adding one for a single admin-only gallery.
 */
export function ProductImageManager({
  productId,
  images,
  variants,
}: ProductImageManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<Array<AdminProductImage>>(() =>
    [...images].sort((a, b) => a.displayOrder - b.displayOrder),
  );

  useEffect(() => {
    setOrder([...images].sort((a, b) => a.displayOrder - b.displayOrder));
  }, [images]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
    queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
  };

  const { mutate: reorder } = useMutation({
    mutationFn: (next: Array<AdminProductImage>) =>
      reorderAdminProductImages(productId, {
        imageIds: next.map((image) => image.id),
        primaryImageId: next.find((image) => image.primary)?.id ?? null,
      }),
    onSuccess: invalidate,
  });

  const { mutate: setPrimary } = useMutation({
    mutationFn: (imageId: string) =>
      reorderAdminProductImages(productId, {
        imageIds: order.map((image) => image.id),
        primaryImageId: imageId,
      }),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      invalidate();
    },
  });

  const { mutate: removeImage, isPending: deletePending } = useMutation({
    mutationFn: (imageId: string) => deleteAdminProductImage(productId, imageId),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      invalidate();
    },
  });

  const applyOrder = (next: Array<AdminProductImage>) => {
    setOrder(next);
    reorder(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    applyOrder(next);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    applyOrder(next);
  };

  const openFileDialog = () => inputRef.current?.click();

  const handleFileChange = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const violation = validateImageFile(file);
    if (violation) {
      setSelectionError(violation);
    } else {
      setSelectionError(null);
      setPendingFile(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <FieldDescription>{t('adminProductImagesHint')}</FieldDescription>
      <AttachmentGroup>
        {order.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            <Attachment orientation="vertical" className="w-32" size="sm">
              <AttachmentMedia variant="image">
                <img src={productImageSrc(image.url)} alt={image.altText} />
              </AttachmentMedia>
              <div className="flex w-full flex-col gap-1 px-1 pb-1">
                <p className="truncate text-xs text-muted-foreground" title={image.altText}>
                  {image.altText}
                </p>
                {image.variantId && (
                  <p className="truncate text-xs text-muted-foreground">
                    {variants.find((v) => v.id === image.variantId)?.sku}
                  </p>
                )}
                <div className="flex items-center justify-between gap-1">
                  <GripVertical
                    className="size-3.5 shrink-0 cursor-grab text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0}
                      aria-label={t('adminProductMoveEarlier')}
                      onClick={() => move(index, -1)}
                    >
                      ←
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === order.length - 1}
                      aria-label={t('adminProductMoveLater')}
                      onClick={() => move(index, 1)}
                    >
                      →
                    </Button>
                    <Button
                      type="button"
                      variant={image.primary ? 'default' : 'ghost'}
                      size="icon-xs"
                      aria-label={t('adminProductSetPrimary')}
                      onClick={() => setPrimary(image.id)}
                    >
                      <Star />
                    </Button>
                    <AlertDialogDestructive
                      triggerButton={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={deletePending}
                          aria-label={t('delete')}
                        >
                          <Trash2 />
                        </Button>
                      }
                      title={t('deleteVar', { var1: t('adminProductPhoto').toLowerCase(), var2: image.altText })}
                      description={t('adminProductDeletePhotoDescription')}
                      action={() => removeImage(image.id)}
                    />
                  </div>
                </div>
              </div>
            </Attachment>
          </div>
        ))}

        <button
          type="button"
          onClick={openFileDialog}
          className="flex aspect-square w-32 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ImagePlus className="size-6" />
          <span className="text-xs">{t('adminProductAddPhoto')}</span>
        </button>
      </AttachmentGroup>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        className="sr-only"
        tabIndex={-1}
        aria-label={t('adminProductAddPhoto')}
        onChange={handleFileChange}
      />
      <FieldDescription>{t('adminProductImageFormatsHint')}</FieldDescription>
      {selectionError && <TranslatedFieldError errors={[{ message: selectionError }]} />}

      {pendingFile && (
        <UploadImageDialog
          productId={productId}
          file={pendingFile}
          variants={variants}
          suggestAsPrimary={order.length === 0}
          onOpenChange={(open) => !open && setPendingFile(null)}
          onUploaded={() => {
            setPendingFile(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

type UploadImageDialogProps = {
  readonly productId: string;
  readonly file: File;
  readonly variants: Array<AdminProductVariantDetail>;
  readonly suggestAsPrimary: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUploaded: () => void;
};

function UploadImageDialog({
  productId,
  file,
  variants,
  suggestAsPrimary,
  onOpenChange,
  onUploaded,
}: UploadImageDialogProps) {
  const { t } = useTranslation();
  const [altText, setAltText] = useState('');
  const [variantId, setVariantId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(suggestAsPrimary);
  const previewUrl = useState(() => URL.createObjectURL(file))[0];

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () =>
      uploadAdminProductImage(productId, {
        file,
        altText,
        variantId: variantId ?? undefined,
        isPrimary,
      }),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      onUploaded();
    },
  });

  const variantItems = variants.map((v) => ({
    label: [v.sku, v.colourName].filter(Boolean).join(' · '),
    value: v.id,
  }));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('adminProductAddPhoto')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <img
            src={previewUrl}
            alt=""
            className="mx-auto aspect-square w-32 rounded-lg object-cover"
          />
          <div>
            <Label htmlFor="image-alt-text">{t('adminProductAltText')}</Label>
            <Input
              id="image-alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder={t('adminProductAltTextPlaceholder')}
            />
            <FieldDescription>{t('adminProductAltTextHint')}</FieldDescription>
          </div>
          {variantItems.length > 0 && (
            <div>
              <Label>{t('adminProductImageVariant')}</Label>
              <Select
                items={variantItems}
                value={variantId}
                onValueChange={(value) => setVariantId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminProductImageWholeProduct')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">
                      <span className="text-muted-foreground">
                        {t('adminProductImageWholeProduct')}
                      </span>
                    </SelectItem>
                    {variantItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t('adminProductImageVariantHint')}</FieldDescription>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            <FieldLabel>{t('adminProductSetPrimary')}</FieldLabel>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button
            disabled={isPending || altText.trim() === ''}
            onClick={() => upload()}
          >
            {isPending ? <Spinner /> : t('adminProductUpload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
