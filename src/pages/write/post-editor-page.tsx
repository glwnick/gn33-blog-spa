import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import type { GalleryImage, PostDetail, PostSaveInput } from '@/schemas/posts';
import { AppContent } from '@/components/layout/app-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Markdown } from '@/components/ui/markdown';
import { HeaderAlert } from '@/components/header-alert';
import { POST_KEY } from '@/query-options/post-options';
import { createPost, updatePost } from '@/api/posts-api';
import { emptyPostSaveInput } from '@/schemas/posts';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PostSaveInput>(() => toSaveInput(post));

  const { mutate, isPending, alertError, clearAlertError } = useAlertMutation({
    mutationFn: () =>
      post ? updatePost(post.id, draft) : createPost(draft),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: [POST_KEY] });
      await navigate({ to: '/posts/$postId', params: { postId: saved.id } });
    },
  });

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

  const canPublish =
    draft.title.trim().length > 0 && draft.bodyMarkdown.trim().length > 0;

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
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="post-cover">
              {t('editorCoverImageLabel')}
            </FieldLabel>
            <Input
              id="post-cover"
              value={draft.coverImageUrl ?? ''}
              onChange={(event) =>
                setField('coverImageUrl', event.target.value || null)
              }
              placeholder={t('editorCoverImagePlaceholder')}
            />
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
                />
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
                    <Input
                      value={image.imageUrl}
                      onChange={(event) =>
                        setGalleryImage(index, { imageUrl: event.target.value })
                      }
                      placeholder={t('editorGalleryImageUrlPlaceholder')}
                    />
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
