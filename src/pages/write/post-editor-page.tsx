import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import type { GalleryImage, PostDetail, PostSaveInput } from '@/schemas/posts';
import { AppContent } from '@/components/layout/app-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Markdown } from '@/components/ui/markdown';
import { ImageRefInput } from '@/pages/write/image-ref-input';
import { HeaderAlert } from '@/components/header-alert';
import { POST_KEY } from '@/query-options/post-options';
import { createPost, updatePost } from '@/api/posts-api';
import {
  MAX_BODY_LENGTH,
  MAX_TAGS,
  MAX_TAGS_INPUT_LENGTH,
  MAX_TAG_LENGTH,
  emptyPostSaveInput,
  findTagsProblem,
  isImageRef,
} from '@/schemas/posts';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';

type PostEditorPageProps = {
  readonly post?: PostDetail;
};

const toSaveInput = (post: PostDetail | undefined): PostSaveInput =>
  post
    ? {
        title: post.title,
        excerpt: null,
        bodyMarkdown: post.bodyMarkdown,
        coverImageUrl: post.coverImageUrl,
        tagsInput: post.tags.join(', '),
        gallery: post.gallery,
      }
    : emptyPostSaveInput;

export function PostEditorPage({ post }: PostEditorPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PostSaveInput>(() => toSaveInput(post));

  // A gallery row left blank is an unfinished "Add image" click, not a request for an empty image.
  const payload: PostSaveInput = {
    ...draft,
    gallery: draft.gallery.filter((image) => image.imageUrl.trim() !== ''),
  };

  const { mutate, isPending, alertError, clearAlertError } = useAlertMutation({
    mutationFn: () =>
      post ? updatePost(post.id, payload) : createPost(payload),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: [POST_KEY] });
      await navigate({ to: '/posts/$postId', params: { postId: saved.id } });
    },
  });

  // Uploads in flight. A finished upload writes into its gallery row by index, so removing any row (which shifts
  // the indices) or publishing (which would drop the pending image) has to wait for them.
  const [uploadsInFlight, setUploadsInFlight] = useState(0);
  const onUploadPendingChange = useCallback(
    (pending: boolean) => setUploadsInFlight((n) => n + (pending ? 1 : -1)),
    [],
  );

  const setField = <TKey extends keyof PostSaveInput>(
    key: TKey,
    value: PostSaveInput[TKey],
  ) => {
    clearAlertError();
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setGalleryImage = (index: number, patch: Partial<GalleryImage>) => {
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.map((image, i) =>
        i === index ? { ...image, ...patch } : image,
      ),
    }));
  };

  const addGalleryImage = () =>
    setDraft((prev) => ({
      ...prev,
      gallery: [...prev.gallery, { imageUrl: '', caption: null }],
    }));

  const removeGalleryImage = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));

  const coverInvalid =
    draft.coverImageUrl !== null && !isImageRef(draft.coverImageUrl);
  const isGalleryRowInvalid = (image: GalleryImage) =>
    image.imageUrl.trim() !== '' && !isImageRef(image.imageUrl);
  const tagsProblem = findTagsProblem(draft.tagsInput);
  const bodyTooLong = draft.bodyMarkdown.length > MAX_BODY_LENGTH;
  const canPublish =
    draft.title.trim().length > 0 &&
    draft.bodyMarkdown.trim().length > 0 &&
    !coverInvalid &&
    uploadsInFlight === 0 &&
    tagsProblem === null &&
    !bodyTooLong &&
    !draft.gallery.some(isGalleryRowInvalid);

  return (
    <AppContent title={t(post ? 'editorEditTitle' : 'editorCreateTitle')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <HeaderAlert error={alertError} />

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="post-title">{t('editorTitleLabel')}</FieldLabel>
            <Input
              id="post-title"
              value={draft.title}
              onChange={(event) => setField('title', event.target.value)}
              maxLength={200}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="post-excerpt">
              {t('editorExcerptLabel')}
            </FieldLabel>
            <Textarea
              id="post-excerpt"
              value={draft.excerpt ?? ''}
              onChange={(event) =>
                setField('excerpt', event.target.value || null)
              }
              placeholder={t('editorExcerptPlaceholder')}
              maxLength={500}
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="post-tags">{t('editorTagsLabel')}</FieldLabel>
            <Input
              id="post-tags"
              value={draft.tagsInput}
              onChange={(event) => setField('tagsInput', event.target.value)}
              placeholder={t('editorTagsPlaceholder')}
              aria-invalid={tagsProblem !== null}
            />
            {tagsProblem === 'tooMany' && (
              <FieldError>{t('editorTagsTooMany', { max: MAX_TAGS })}</FieldError>
            )}
            {tagsProblem === 'tooLong' && (
              <FieldError>
                {t('editorTagTooLong', { max: MAX_TAG_LENGTH })}
              </FieldError>
            )}
            {tagsProblem === 'inputTooLong' && (
              <FieldError>
                {t('editorTagsInputTooLong', { max: MAX_TAGS_INPUT_LENGTH })}
              </FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="post-cover">
              {t('editorCoverImageLabel')}
            </FieldLabel>
            <ImageRefInput
              id="post-cover"
              value={draft.coverImageUrl ?? ''}
              onValueChange={(value) =>
                setField('coverImageUrl', value || null)
              }
              onPendingChange={onUploadPendingChange}
              placeholder={t('editorCoverImagePlaceholder')}
              aria-invalid={coverInvalid}
            />
            {coverInvalid && <FieldError>{t('editorImageUrlHttps')}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="post-body">{t('editorBodyLabel')}</FieldLabel>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">{t('editorWriteTab')}</TabsTrigger>
                <TabsTrigger value="preview">{t('editorPreviewTab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  id="post-body"
                  value={draft.bodyMarkdown}
                  onChange={(event) =>
                    setField('bodyMarkdown', event.target.value)
                  }
                  rows={16}
                  className="font-mono text-sm"
                  aria-invalid={bodyTooLong}
                />
                {bodyTooLong && (
                  <FieldError>
                    {t('editorBodyTooLong', {
                      max: MAX_BODY_LENGTH.toLocaleString(i18n.language),
                    })}
                  </FieldError>
                )}
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-96 rounded-md border p-3">
                  {draft.bodyMarkdown.trim() ? (
                    <Markdown>{draft.bodyMarkdown}</Markdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('editorPreviewEmpty')}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Field>

          <Field>
            <FieldLabel>{t('galleryTitle')}</FieldLabel>
            <div className="flex flex-col gap-3">
              {draft.gallery.map((image, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <ImageRefInput
                      value={image.imageUrl}
                      onValueChange={(value) =>
                        setGalleryImage(index, { imageUrl: value })
                      }
                      onPendingChange={onUploadPendingChange}
                      placeholder={t('editorGalleryImageUrlPlaceholder')}
                      aria-invalid={isGalleryRowInvalid(image)}
                    />
                    {isGalleryRowInvalid(image) && (
                      <FieldError>{t('editorImageUrlHttps')}</FieldError>
                    )}
                    <Input
                      value={image.caption ?? ''}
                      onChange={(event) =>
                        setGalleryImage(index, {
                          caption: event.target.value || null,
                        })
                      }
                      placeholder={t('editorGalleryCaptionPlaceholder')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('editorGalleryRemove')}
                    disabled={uploadsInFlight > 0}
                    onClick={() => removeGalleryImage(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={addGalleryImage}
              >
                <Plus className="size-4" />
                {t('editorGalleryAdd')}
              </Button>
            </div>
          </Field>
        </FieldGroup>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: '/dashboard' })}
          >
            {t('editorCancel')}
          </Button>
          <Button disabled={!canPublish || isPending} onClick={() => mutate()}>
            {t('editorPublish')}
          </Button>
        </div>
      </div>
    </AppContent>
  );
}
