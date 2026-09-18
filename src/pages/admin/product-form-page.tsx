import { useEffect, useRef, useState } from 'react';
import { revalidateLogic, useStore } from '@tanstack/react-form';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Copy, ExternalLink } from 'lucide-react';
import type {
  AdminProductDetail,
  AdminProductSaveInput,
  AdminProductVariantInput,
} from '@/schemas/admin-products';
import type { ProductLegalClassification } from '@/schemas/products';
import type { TranslationKey } from '@/hooks/use-translation';
import {
  createAdminProduct,
  duplicateAdminProduct,
  updateAdminProduct,
  updateAdminProductFeatured,
  updateAdminProductStatus,
} from '@/api/admin-products-api';
import {
  ADMIN_PRODUCT_KEY,
  adminProductDefaultsOptions,
  adminProductOptions,
} from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { categoriesOptions } from '@/query-options/category-options';
import { adminYarnsOptions } from '@/query-options/yarn-options';
import { adminSizesOptions } from '@/query-options/size-options';
import { adminMaterialsOptions } from '@/query-options/material-options';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/formatting';
import { AppContent } from '@/components/layout/app-content';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderAlert } from '@/components/header-alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnchorLink } from '@/components/anchor-link';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProductImageManager } from '@/pages/admin/product-image-manager';
import { ProductVariantRows } from '@/pages/admin/product-variant-rows';
import { ProductStatusBadge, STATUS_LABEL_KEY } from '@/pages/admin/product-status-badge';

// --- Local form-state shape -----------------------------------------------------------------------------------
//
// Deliberately not AdminProductSaveInput: every text field the wire schema types `string | null` becomes plain
// `string` here (empty string = "not set") because the shared TextField/TextareaField form components bind
// `useFieldContext<string>()` straight to a controlled input, and handing one `null` trips React's controlled-
// input warning. `leadTimeDays` is the one genuinely nullable field that stays nullable, rendered through a raw
// `form.Field` rather than the shared NumberField wrapper for the same reason - see product-variant-rows.tsx.

export type ProductFormVariant = {
  id: string | null;
  sku: string;
  sizeId: string;
  yarnId: string;
  materialId: string;
  price: number;
  stock: number;
  oneOfAKind: boolean;
  permanentlyUnavailable: boolean;
  productionBatchCode: string;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  displayOrder: number;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  makerNote: string;
  seasonal: boolean;
  legalClassification: ProductLegalClassification;
  manufacturerIdentity: string;
  ceMarked: boolean;
  fibreCompositionFilling: string;
  careInstructions: string;
  ageWarning: string;
  safetyWarning: string;
  dppIdentifier: string;
  categoryIds: Array<string>;
  variants: Array<ProductFormVariant>;
};

const requiredText = z.string().min(1, 'required');

const productFormValuesSchema = z.object({
  name: requiredText,
  slug: z.string(),
  description: requiredText,
  makerNote: z.string(),
  seasonal: z.boolean(),
  legalClassification: z.enum(['TOY', 'NOT_TOY']),
  manufacturerIdentity: requiredText,
  ceMarked: z.boolean(),
  fibreCompositionFilling: z.string(),
  careInstructions: z.string(),
  ageWarning: z.string(),
  safetyWarning: z.string(),
  dppIdentifier: z.string(),
  categoryIds: z.array(z.uuid()),
  variants: z.array(
    z.object({
      id: z.uuid().nullable(),
      sku: requiredText,
      sizeId: z.string(),
      yarnId: z.string(),
      materialId: z.string(),
      price: z.number().positive('required'),
      stock: z.number().int().min(0),
      oneOfAKind: z.boolean(),
      permanentlyUnavailable: z.boolean(),
      productionBatchCode: z.string(),
      madeToOrder: z.boolean(),
      leadTimeDays: z.number().int().nullable(),
      displayOrder: z.number().int(),
    }),
  ),
});

const blankToNull = (value: string): string | null =>
  value.trim() === '' ? null : value;

export const emptyProductFormVariant = (
  displayOrder: number,
): ProductFormVariant => ({
  id: null,
  sku: '',
  sizeId: '',
  yarnId: '',
  materialId: '',
  price: 0,
  stock: 0,
  oneOfAKind: false,
  permanentlyUnavailable: false,
  productionBatchCode: '',
  madeToOrder: true,
  leadTimeDays: null,
  displayOrder,
});

const toApiInput = (values: ProductFormValues): AdminProductSaveInput => ({
  name: values.name,
  slug: values.slug,
  description: values.description,
  makerNote: blankToNull(values.makerNote),
  seasonal: values.seasonal,
  legalClassification: values.legalClassification,
  manufacturerIdentity: values.manufacturerIdentity,
  ceMarked: values.ceMarked,
  fibreCompositionFilling: blankToNull(values.fibreCompositionFilling),
  careInstructions: blankToNull(values.careInstructions),
  ageWarning: blankToNull(values.ageWarning),
  safetyWarning: blankToNull(values.safetyWarning),
  dppIdentifier: blankToNull(values.dppIdentifier),
  categoryIds: values.categoryIds,
  variants: values.variants.map(
    (v): AdminProductVariantInput => ({
      id: v.id,
      sku: v.sku,
      sizeId: blankToNull(v.sizeId),
      yarnId: blankToNull(v.yarnId),
      materialId: blankToNull(v.materialId),
      price: v.price,
      stock: v.stock,
      oneOfAKind: v.oneOfAKind,
      permanentlyUnavailable: v.permanentlyUnavailable,
      productionBatchCode: blankToNull(v.productionBatchCode),
      madeToOrder: v.madeToOrder,
      leadTimeDays: v.leadTimeDays,
      displayOrder: v.displayOrder,
    }),
  ),
});

/**
 * A named wrapper around `useAppForm`, not called inline in `ProductForm`, purely so `ProductFormApi` below can
 * be derived from it - `product-variant-rows.tsx` needs to accept `form` as a typed prop, and TanStack Form's
 * own extended form-API type carries enough generic parameters that spelling it out by hand is not worth it.
 */
function useProductForm(
  initialValues: ProductFormValues,
  onSubmit: (values: ProductFormValues) => Promise<unknown>,
) {
  return useAppForm({
    defaultValues: initialValues,
    validators: { onDynamic: productFormValuesSchema },
    validationLogic: revalidateLogic(),
    onSubmit: (sub) => onSubmit(sub.value),
  });
}

export type ProductFormApi = ReturnType<typeof useProductForm>;

const toFormValues = (detail: AdminProductDetail): ProductFormValues => ({
  name: detail.name,
  slug: detail.slug,
  description: detail.description,
  makerNote: detail.makerNote ?? '',
  seasonal: detail.seasonal,
  legalClassification: detail.legalClassification,
  manufacturerIdentity: detail.manufacturerIdentity,
  ceMarked: detail.ceMarked,
  fibreCompositionFilling: detail.fibreCompositionFilling ?? '',
  careInstructions: detail.careInstructions ?? '',
  ageWarning: detail.ageWarning ?? '',
  safetyWarning: detail.safetyWarning ?? '',
  dppIdentifier: detail.dppIdentifier ?? '',
  categoryIds: detail.categories.map((c) => c.id),
  variants: detail.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    sizeId: v.sizeId ?? '',
    yarnId: v.yarnId ?? '',
    materialId: v.materialId ?? '',
    price: v.price,
    stock: v.stock,
    oneOfAKind: v.oneOfAKind,
    permanentlyUnavailable: v.permanentlyUnavailable,
    productionBatchCode: v.productionBatchCode ?? '',
    madeToOrder: v.madeToOrder,
    leadTimeDays: v.leadTimeDays,
    displayOrder: v.displayOrder,
  })),
});

// --- Create -----------------------------------------------------------------------------------------------------

export function NewProductPage() {
  const { t } = useTranslation();
  const { data: defaults } = useSuspenseQuery(adminProductDefaultsOptions());

  return (
    <ProductForm
      mode="create"
      initialValues={{
        name: '',
        slug: '',
        description: '',
        makerNote: '',
        seasonal: false,
        legalClassification: 'TOY',
        manufacturerIdentity: defaults.manufacturerIdentity,
        ceMarked: false,
        fibreCompositionFilling: '',
        careInstructions: '',
        ageWarning: '',
        safetyWarning: '',
        dppIdentifier: '',
        categoryIds: [],
        variants: [],
      }}
      title={t('newVar', { var: t('product').toLowerCase() })}
    />
  );
}

// --- Edit --------------------------------------------------------------------------------------------------------

export function EditProductPage({ productId }: { readonly productId: string }) {
  const { t } = useTranslation();
  const { data: detail } = useSuspenseQuery(adminProductOptions(productId));

  return (
    <ProductForm
      mode="edit"
      productId={productId}
      detail={detail}
      initialValues={toFormValues(detail)}
      title={detail.name || t('editVar', { var: t('product').toLowerCase() })}
    />
  );
}

// --- Loading skeleton, wired as `pendingComponent` on both routes (see `plans/PLAN-catalogue-admin.md`'s own
// `CataloguePageSkeleton` for the same convention) - the two-argument variant is only ever seen on a client-side
// navigation into this route with a cold query cache, since a hard load renders the real page server-side and an
// `intent`-preloaded link already has the data by the time the click lands. Without it, that navigation showed
// nothing at all while `ensureQueryData` was in flight: the left nav and both cards below mirror the real
// six-section layout closely enough that the page doesn't visibly jump once the actual content mounts. ------------

export function ProductFormPageSkeleton() {
  return (
    <AppContent title={<Skeleton className="h-7 w-48" />}>
      <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-[200px_1fr]">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {Array.from({ length: SECTIONS.length }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full shrink-0" />
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {/* One card per real section, not an arbitrary shorter count - otherwise the skeleton undercounts
              (Basics, Categories, Compliance, Variants, Images, Publishing) and the extra cards popping in once
              the real data lands produces exactly the layout jump this skeleton exists to avoid. */}
          {Array.from({ length: SECTIONS.length }, (_card, cardIndex) => (
            <Card key={cardIndex}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_row, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppContent>
  );
}

// --- Section scaffolding -------------------------------------------------------------------------------------

const SECTIONS = [
  { id: 'basics', titleKey: 'adminProductSectionBasics' },
  { id: 'categories', titleKey: 'adminProductSectionCategories' },
  { id: 'compliance', titleKey: 'adminProductSectionCompliance' },
  { id: 'variants', titleKey: 'adminProductSectionVariants' },
  { id: 'images', titleKey: 'adminProductSectionImages' },
  { id: 'publishing', titleKey: 'adminProductSectionPublishing' },
] as const satisfies ReadonlyArray<{ id: string; titleKey: TranslationKey }>;

type SectionId = (typeof SECTIONS)[number]['id'];

const sectionDomId = (id: SectionId) => `product-form-section-${id}`;

// --- Shared form ---------------------------------------------------------------------------------------------------

type ProductFormProps = {
  readonly mode: 'create' | 'edit';
  readonly productId?: string;
  readonly detail?: AdminProductDetail;
  readonly initialValues: ProductFormValues;
  readonly title: string;
};

function ProductForm({ mode, productId, detail, initialValues, title }: ProductFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: categories } = useQuery(categoriesOptions());
  const { data: yarns } = useQuery(adminYarnsOptions());
  const { data: sizes } = useQuery(adminSizesOptions());
  const { data: materials } = useQuery(adminMaterialsOptions());
  const [activeSection, setActiveSection] = useState<SectionId>('basics');
  const sectionElsRef = useRef<Partial<Record<SectionId, HTMLDivElement>>>({});
  // A clicked nav pill scrolls smoothly, which passes several other sections through the thin "current
  // section" band below along the way - without this, the pill you just clicked flips to whichever section
  // the scroll happened to pass last. Cleared by the `scrollend` event (the actual end of the scroll, however
  // long it takes on a tall page), with a fixed timeout as a backstop for browsers that don't fire it yet.
  const suppressAutoActiveRef = useRef(false);

  const registerSectionRef = (id: SectionId, node: HTMLDivElement | null) => {
    if (node) sectionElsRef.current[id] = node;
  };

  useEffect(() => {
    const clearSuppression = () => {
      suppressAutoActiveRef.current = false;
    };
    window.addEventListener('scrollend', clearSuppression);
    return () => window.removeEventListener('scrollend', clearSuppression);
  }, []);

  // A single observer over all six cards, rather than one per card: with one per card, several can report
  // "visible" on the very first render (a short form fits more than one card in the viewport), and whichever
  // fires last would win regardless of order, so the page could open on a highlighted section that isn't
  // actually at the top. Narrowing the observed band to near the top of the viewport and, on every change,
  // taking the visible entry with the smallest `boundingClientRect.top` gives the true topmost section instead.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressAutoActiveRef.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        const match = SECTIONS.find((s) => sectionDomId(s.id) === topmost.target.id);
        if (match) setActiveSection(match.id);
      },
      { rootMargin: '-10% 0px -75% 0px' },
    );
    Object.values(sectionElsRef.current).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const invalidateProductCaches = () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
    queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
  };

  // Returned, not fire-and-forget: TanStack Form only keeps `isSubmitting` (and therefore `canSubmit`, which
  // `StickySaveBar` disables the button on) true for as long as this function's returned promise is pending. A
  // bare `createMutation(input)` call resolved before the request ever reached the server, so the button
  // re-enabled itself while the first save was still in flight - a second click sent a second identical save,
  // and the two raced: `AdminProductServiceImpl.diffVariants` on the backend treats whichever save started from
  // the older snapshot as one where the variant the other save just committed was *removed* (it's not in that
  // stale payload), so it deletes it and re-adds an identical-looking row - or, with unluckier timing, the two
  // `UPDATE products` statements deadlock and one save fails outright.
  //
  // The promise is returned rather than awaited-and-caught here, matching `checkout-page.tsx`'s own
  // `onSubmit: ({ value }) => { ...; return submitCheckout(payload); }` - a caught rejection would stop it from
  // ever reaching TanStack Form's own `handleSubmit`, which is what sets `isSubmitSuccessful` to `false` on a
  // failed attempt. `StickySaveBar` reads exactly that flag to decide whether to still show "Unsaved changes"
  // and the reset button, so swallowing the rejection here made a failed save look saved. `useAlertMutation`'s
  // `onError` still shows the failure via `alertError` independently of this - it fires whether the caller uses
  // `mutate` or `mutateAsync` - so nothing here needs its own try/catch for that.
  const form = useProductForm(initialValues, (values) => {
    clearAlertError();
    const input = toApiInput(values);
    return mode === 'create' ? createMutation(input) : updateMutation(input);
  });

  const {
    mutateAsync: createMutation,
    alertError: createError,
    clearAlertError: clearCreateError,
  } = useAlertMutation({
    mutationFn: createAdminProduct,
    onSuccess: (res) => {
      invalidateProductCaches();
      toast.success(t('varCreatedSuccessfully', { var: t('product') }));
      navigate({ to: `/admin/products/${res.objectId}` });
    },
  });

  const {
    mutateAsync: updateMutation,
    alertError: updateError,
    clearAlertError: clearUpdateError,
  } = useAlertMutation({
    mutationFn: (data: AdminProductSaveInput) =>
      updateAdminProduct(productId as string, data),
    onSuccess: () => {
      invalidateProductCaches();
      toast.success(t('varUpdatedSuccessfully', { var: t('product') }));
    },
  });

  // Plain useMutation, not useAlertMutation - same choice product-columns.tsx's own row action makes. A failure
  // here doesn't belong to any of this form's fields, so the global mutation-error toast is enough.
  const { mutate: duplicateMutation, isPending: duplicatePending } = useMutation({
    mutationFn: () => duplicateAdminProduct(productId as string),
    onSuccess: (res) => {
      invalidateProductCaches();
      toast.success(t('varCreatedSuccessfully', { var: t('product') }));
      navigate({ to: `/admin/products/${res.objectId}` });
    },
  });

  const alertError = mode === 'create' ? createError : updateError;
  const clearAlertError = mode === 'create' ? clearCreateError : clearUpdateError;

  const categoryItems = categories?.map((c) => ({ label: c.name, value: c.id }));

  const variantCount = useStore(form.store, (state) => state.values.variants.length);
  const imageCount = detail?.images.length ?? 0;
  const isDirty = useStore(form.store, (state) => state.isDirty);

  // Scoped to exactly the fields plans/PLAN-catalogue-admin.md's publish preconditions check for compliance
  // (legalClassification is always set - the enum has no blank option - manufacturerIdentity non-blank, and,
  // only for TOY, both warnings non-blank). Variant/image preconditions are their own sections' own badges.
  const legalClassification = useStore(form.store, (state) => state.values.legalClassification);
  const manufacturerIdentity = useStore(form.store, (state) => state.values.manufacturerIdentity);
  const ageWarning = useStore(form.store, (state) => state.values.ageWarning);
  const safetyWarning = useStore(form.store, (state) => state.values.safetyWarning);
  const complianceComplete =
    manufacturerIdentity.trim() !== '' &&
    (legalClassification !== 'TOY' ||
      (ageWarning.trim() !== '' && safetyWarning.trim() !== ''));

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    suppressAutoActiveRef.current = true;
    document
      .getElementById(sectionDomId(id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Backstop for browsers without `scrollend` (e.g. Safari < 17.4): the effect above clears this the moment
    // the scroll actually finishes on everything else, so this timeout firing first would only matter there.
    window.setTimeout(() => {
      suppressAutoActiveRef.current = false;
    }, 2000);
  };

  return (
    <AppContent
      title={
        <ProductFormHeader
          detail={detail}
          title={title}
          variantCount={variantCount}
          onDuplicate={() => duplicateMutation()}
          duplicatePending={duplicatePending}
          duplicateDisabled={isDirty}
        />
      }
    >
      <HeaderAlert error={alertError} />
      {mode === 'create' && (
        <p className="mb-4 text-sm text-muted-foreground">{t('adminProductNewHint')}</p>
      )}

      <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-[200px_1fr]">
        <SectionNav
          activeSection={activeSection}
          onSelect={scrollToSection}
          variantCount={variantCount}
          imageCount={imageCount}
        />

        <div className="flex flex-col gap-6">
          <FormSection
            id="basics"
            title={t('adminProductSectionBasics')}
            registerRef={registerSectionRef}
          >
            <FieldGroup>
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField label={t('name')} mandatoryLabel />
                )}
              />
              <form.AppField
                name="slug"
                children={(field) => (
                  <field.TextField
                    label={t('slug')}
                    description={
                      detail?.firstPublishedAt
                        ? t('adminProductSlugFrozenHint')
                        : t('adminProductSlugHint')
                    }
                  />
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField label={t('description')} mandatoryLabel />
                )}
              />
              <form.AppField
                name="makerNote"
                children={(field) => (
                  <field.TextareaField
                    label={t('adminProductMakerNote')}
                    description={t('adminProductMakerNoteHint')}
                  />
                )}
              />
            </FieldGroup>
          </FormSection>

          <FormSection
            id="categories"
            title={t('adminProductSectionCategories')}
            registerRef={registerSectionRef}
          >
            <FieldGroup>
              <form.AppField
                name="categoryIds"
                children={(field) => (
                  <field.ComboboxMultipleField
                    label={t('shopCategory')}
                    items={categoryItems}
                    placeholder={
                      categoryItems?.length ? undefined : t('adminProductNoCategoriesYet')
                    }
                  />
                )}
              />
              <form.AppField
                name="seasonal"
                children={(field) => (
                  <field.CheckboxField
                    label={t('adminProductSeasonal')}
                    description={t('adminProductSeasonalHint')}
                  />
                )}
              />
            </FieldGroup>
          </FormSection>

          <FormSection
            id="compliance"
            title={t('adminProductSectionCompliance')}
            badge={
              <Badge variant={complianceComplete ? 'accent' : 'outline'}>
                {t(
                  complianceComplete
                    ? 'adminProductComplianceComplete'
                    : 'adminProductComplianceIncomplete',
                )}
              </Badge>
            }
            registerRef={registerSectionRef}
          >
            <FieldGroup>
              <form.AppField
                name="legalClassification"
                children={(field) => (
                  <field.SelectField
                    label={t('adminProductLegalClassification')}
                    defaultValue="TOY"
                    items={[
                      { label: t('productLegalClassificationToy'), value: 'TOY' },
                      {
                        label: t('productLegalClassificationNotToy'),
                        value: 'NOT_TOY',
                      },
                    ]}
                    mandatoryLabel
                  />
                )}
              />
              <form.AppField
                name="manufacturerIdentity"
                children={(field) => (
                  <field.TextareaField
                    label={t('adminProductManufacturerIdentity')}
                    description={t('adminProductManufacturerIdentityHint')}
                    mandatoryLabel
                  />
                )}
              />
              <form.AppField
                name="ceMarked"
                children={(field) => <field.CheckboxField label={t('shopCeMarked')} />}
              />
              {/* No yarn-composition field here any more: it is a property of the yarn, edited once on
                  /admin/library, and reaches the storefront through whichever yarns this product's variants use. */}
              <form.AppField
                name="fibreCompositionFilling"
                children={(field) => (
                  <field.TextField label={t('adminProductFibreFilling')} />
                )}
              />
              <form.AppField
                name="careInstructions"
                children={(field) => (
                  <field.TextareaField label={t('adminProductCareInstructions')} />
                )}
              />
              <form.AppField
                name="ageWarning"
                children={(field) => (
                  <field.TextareaField label={t('adminProductAgeWarning')} />
                )}
              />
              <form.AppField
                name="safetyWarning"
                children={(field) => (
                  <field.TextareaField label={t('adminProductSafetyWarning')} />
                )}
              />
              <form.AppField
                name="dppIdentifier"
                children={(field) => (
                  <field.TextField label={t('adminProductDppIdentifier')} />
                )}
              />
            </FieldGroup>
          </FormSection>

          <FormSection
            id="variants"
            title={t('adminProductSectionVariants')}
            badge={<Badge variant="secondary">{variantCount}</Badge>}
            registerRef={registerSectionRef}
          >
            <ProductVariantRows
              form={form}
              categories={categories}
              yarns={yarns}
              sizes={sizes}
              materials={materials}
              neverPublished={!detail?.firstPublishedAt}
              existingVariants={detail?.variants}
            />
          </FormSection>

          <FormSection
            id="images"
            title={t('adminProductSectionImages')}
            badge={<Badge variant="secondary">{imageCount}</Badge>}
            registerRef={registerSectionRef}
          >
            {detail && productId ? (
              <ProductImageManager
                productId={productId}
                images={detail.images}
                variants={detail.variants}
              />
            ) : (
              <FieldDescription>{t('adminProductImagesCreateFirstHint')}</FieldDescription>
            )}
          </FormSection>

          <FormSection
            id="publishing"
            title={t('adminProductSectionPublishing')}
            registerRef={registerSectionRef}
          >
            {mode === 'create' ? (
              <Alert>
                <AlertDescription>{t('adminProductCreateTwoStepHint')}</AlertDescription>
              </Alert>
            ) : (
              detail &&
              productId && <PublishingControls productId={productId} detail={detail} />
            )}
          </FormSection>
        </div>
      </div>

      <StickySaveBar
        form={form}
        submitLabel={mode === 'create' ? t('create') : t('save')}
        resetLabel={t('cancel')}
      />
    </AppContent>
  );
}

// --- Header: breadcrumb, name, status/featured badges, meta line, preview/duplicate ------------------------------

type ProductFormHeaderProps = {
  readonly detail: AdminProductDetail | undefined;
  readonly title: string;
  readonly variantCount: number;
  readonly onDuplicate: () => void;
  readonly duplicatePending: boolean;
  /** True while the form has unsaved edits - duplicating calls the backend on the last *saved* product, so
   * doing it mid-edit would silently drop whatever's only on screen. Disabled with an explanatory tooltip
   * rather than just letting that happen quietly. */
  readonly duplicateDisabled: boolean;
};

function ProductFormHeader({
  detail,
  title,
  variantCount,
  onDuplicate,
  duplicatePending,
  duplicateDisabled,
}: ProductFormHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-2 flex flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="..">{t('products')}</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {detail && <ProductStatusBadge status={detail.status} />}
          {detail?.featured && <Badge variant="accent">{t('adminProductFeatured')}</Badge>}
        </div>

        {detail && (
          <div className="flex items-center gap-2">
            <AnchorLink
              to="/shop/$slug"
              params={{ slug: detail.slug }}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <ExternalLink />
              {t('preview')}
            </AnchorLink>
            {duplicateDisabled ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'cursor-not-allowed opacity-50',
                      )}
                    />
                  }
                >
                  <Copy />
                  {t('adminProductDuplicate')}
                </TooltipTrigger>
                <TooltipContent>{t('adminProductDuplicateDirtyHint')}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={duplicatePending}
                onClick={onDuplicate}
              >
                <Copy />
                {t('adminProductDuplicate')}
              </Button>
            )}
          </div>
        )}
      </div>

      {detail && (
        <p className="text-sm text-muted-foreground">
          {t('adminProductVariantCount', { count: variantCount })}
          {' · '}
          {t('adminProductLastSaved', { date: formatDateTime(detail.updatedAt) })}
        </p>
      )}
    </div>
  );
}

// --- Sticky left section nav ------------------------------------------------------------------------------------

type SectionNavProps = {
  readonly activeSection: SectionId;
  readonly onSelect: (id: SectionId) => void;
  readonly variantCount: number;
  readonly imageCount: number;
};

function SectionNav({ activeSection, onSelect, variantCount, imageCount }: SectionNavProps) {
  const { t } = useTranslation();

  const countFor = (id: SectionId): number | null => {
    if (id === 'variants') return variantCount;
    if (id === 'images') return imageCount;
    return null;
  };

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 md:sticky md:top-20 md:h-fit md:flex-col md:overflow-visible md:pb-0">
      {SECTIONS.map((item) => {
        const active = activeSection === item.id;
        const count = countFor(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => onSelect(item.id)}
            className={cn(
              buttonVariants({ variant: active ? 'default' : 'ghost', size: 'sm' }),
              'shrink-0 justify-between gap-2 md:w-full',
            )}
          >
            {t(item.titleKey)}
            {count !== null && (
              <Badge variant={active ? 'secondary' : 'outline'}>{count}</Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// --- One card per section, each observed so the nav above tracks scroll position ---------------------------------

type FormSectionProps = {
  readonly id: SectionId;
  readonly title: string;
  readonly badge?: React.ReactNode;
  readonly registerRef: (id: SectionId, node: HTMLDivElement | null) => void;
  readonly children: React.ReactNode;
};

function FormSection({ id, title, badge, registerRef, children }: FormSectionProps) {
  return (
    <Card id={sectionDomId(id)} ref={(node: HTMLDivElement | null) => registerRef(id, node)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge && <CardAction>{badge}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

// --- Sticky bottom save bar - same form.handleSubmit/form.reset the shared SubmitAndResetButtons uses, just
// restyled sticky-full-width with an unsaved-changes indicator, since that shared component is used by every
// other form in the app and isn't the place for a page-specific layout. ------------------------------------------

function StickySaveBar({
  form,
  submitLabel,
  resetLabel,
}: {
  readonly form: ProductFormApi;
  readonly submitLabel: string;
  readonly resetLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isDirty, state.isSubmitSuccessful]}
      children={([canSubmit, isDirty, isSubmitSuccessful]) => (
        <div className="sticky bottom-0 z-40 -mx-3 mt-2 flex items-center justify-between gap-3 border-t bg-background/95 px-3 py-3 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur md:-mx-4 md:px-4">
          <span className="text-sm text-muted-foreground">
            {isDirty && !isSubmitSuccessful ? t('adminProductUnsavedChanges') : null}
          </span>
          <div className="flex items-center gap-2">
            {isDirty && !isSubmitSuccessful && (
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                {resetLabel}
              </Button>
            )}
            <Button type="button" onClick={form.handleSubmit} disabled={!canSubmit || !isDirty}>
              {submitLabel}
            </Button>
          </div>
        </div>
      )}
    />
  );
}

// --- Publishing controls (edit only) - immediate-fire, not part of the aggregate save --------------------------

function PublishingControls({
  productId,
  detail,
}: {
  readonly productId: string;
  readonly detail: AdminProductDetail;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
    queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
  };

  const { mutate: setStatus } = useMutationWithToast(
    (status: AdminProductDetail['status']) => updateAdminProductStatus(productId, status),
    invalidate,
  );
  const { mutate: setFeatured } = useMutationWithToast(
    (featured: boolean) => updateAdminProductFeatured(productId, featured),
    invalidate,
  );

  const statusItems = (['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((status) => ({
    label: t(STATUS_LABEL_KEY[status]),
    value: status,
  }));

  return (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldLabel>{t('status')}</FieldLabel>
        <Select
          items={statusItems}
          value={detail.status}
          onValueChange={(value) => value && setStatus(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field orientation="horizontal">
        <Switch
          checked={detail.featured}
          onCheckedChange={(checked) => setFeatured(checked)}
        />
        <FieldLabel>{t('adminProductFeatured')}</FieldLabel>
      </Field>
    </FieldGroup>
  );
}

function useMutationWithToast<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  onSettled: () => void,
) {
  const { t } = useTranslation();
  return useAlertMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      onSettled();
    },
  });
}
