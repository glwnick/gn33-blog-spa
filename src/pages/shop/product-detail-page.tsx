import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Heart,
  ShieldCheck,
  Truck,
  WashingMachine,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProductImage, ProductVariant } from '@/schemas/products';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { AppContent } from '@/components/layout/app-content';
import { GalleryControlButton } from '@/pages/shop/gallery-control-button';
import { ImageLightbox } from '@/pages/shop/image-lightbox';
import { productOptions } from '@/query-options/product-options';
import { useAuth } from '@/context/auth-provider';
import { useCart } from '@/context/cart-provider';
import { useToggleFavorite } from '@/hooks/use-toggle-favorite';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';

// The image staff flagged `primary` in the admin gallery is the variant's default; falling back to array order
// (which is just `displayOrder`) would lead with whatever was uploaded first rather than what was chosen to
// lead with.
export function defaultIndexFor(images: Array<ProductImage>): number {
  const index = images.findIndex((image) => image.primary);
  return index === -1 ? 0 : index;
}

// Standard wrap-around modulo - `((n % len) + len) % len` rather than `n % len` alone, because JS's `%` keeps
// the sign of the dividend, so a plain `-1 % 3` is `-1`, not `2`.
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

// Shared by `selectBy` (below) and the colour swatch's representative-photo lookup, so the photo a swatch shows
// is always the same variant `selectBy` would actually land on for that colour - never a sibling variant (same
// colour, different size) that merely happens to have a photo when the one that would really get selected does
// not.
export function resolveVariant<T extends { available: boolean }>(
  candidates: Array<T>,
  keepsOtherAxis: (variant: T) => boolean,
): T | undefined {
  return (
    candidates.find((v) => keepsOtherAxis(v) && v.available) ??
    candidates.find((v) => v.available) ??
    candidates.at(0)
  );
}

/** A colour swatch is a plain hex disc, never the variant's photo - a yarn with no hex falls back to the muted token. */
export function ColourSwatchButton({
  name,
  hex,
  selected,
  available,
  onSelect,
}: {
  name: string;
  hex: string | null;
  selected: boolean;
  available: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={name}
      aria-label={name}
      disabled={!available}
      onClick={onSelect}
      className={cn(
        'size-[30px] rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
        !hex && 'bg-muted',
        selected ? 'ring-primary' : 'ring-transparent',
        !available && 'opacity-40',
      )}
      style={hex ? { backgroundColor: hex } : undefined}
    />
  );
}

/**
 * Compliance disclosures split between always-visible and accordion, per the conflict-2 resolution in
 * plans/PLAN-shop-surfaces.md: ROADMAP.md requires disclosures "rendered inline rather than hidden in a policy
 * page", so safety-critical facts (age/safety warnings, CE marking, fibre composition, manufacturer identity)
 * sit next to the buy column rather than behind a click, while care instructions and the maker's note - real
 * but not safety-critical - stay in the accordion the handoff specifies.
 */
export function ProductDetailPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  // `staleTime: 0` rather than `productOptions`'s default hour-long cache: the Add to cart button
  // below reads `selectedVariant.available` directly off this data, and stock has to be checked on
  // add, not just on the cart's own view-time re-check (see `cart-page.tsx`).
  const { data: product } = useSuspenseQuery({ ...productOptions(slug), staleTime: 0 });
  const {
    favorited,
    toggle: toggleFavorite,
    isPending: isTogglingFavorite,
  } = useToggleFavorite(product.id, product.favorited);
  const handleWishlistClick = () => {
    if (!user) {
      void navigate({ to: '/login' });
      return;
    }
    toggleFavorite();
  };

  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter((s): s is string => s !== null))),
    [product.variants],
  );
  const colours = useMemo(
    () =>
      Array.from(
        new Map(
          product.variants
            .filter((v) => v.colourName !== null)
            .map((v) => [v.colourName as string, v.colourHex]),
        ).entries(),
      ),
    [product.variants],
  );

  // The selected *variant* is the single source of truth, and the size/colour chips are derived from it. Holding
  // size and colour as two independent states instead lets the pair drift onto a combination no variant has (a
  // size sold only in Oat, plus Sage from another size), which then has to fall back to some other variant - and
  // the page ends up showing one variant's price and lead time under another variant's highlighted chips.
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => (product.variants.find((v) => v.available) ?? product.variants[0]).id,
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant: ProductVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];

  // A one-of-a-kind piece cannot go into the cart more than once, regardless of what the stepper
  // was left at from a previous, non-unique variant selection.
  const effectiveQuantity = selectedVariant.oneOfAKind ? 1 : quantity;

  /**
   * Move to the variant the shopper just asked for on one axis, holding the other axis steady where such a
   * variant exists - so picking a size does not silently throw away the chosen colour. Every branch resolves to
   * a variant that really exists, because both chip lists are built from `product.variants` in the first place.
   */
  const selectBy = (
    matchesChosenAxis: (variant: ProductVariant) => boolean,
    keepsOtherAxis: (variant: ProductVariant) => boolean,
  ) => {
    const next = resolveVariant(product.variants.filter(matchesChosenAxis), keepsOtherAxis);
    if (next) {
      setSelectedVariantId(next.id);
    }
  };

  // Shared images (`variantId === null`) plus the selected variant's own - never another variant's, so the
  // gallery only ever shows photos of the piece the shopper is about to buy.
  const gallery = useMemo(
    () =>
      product.images.filter(
        (image) => image.variantId === null || image.variantId === selectedVariant.id,
      ),
    [product.images, selectedVariant.id],
  );

  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => defaultIndexFor(gallery));
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Jump back to the new variant's own default photo rather than carrying over whatever index the shopper had
  // swiped to on the previous variant's (entirely different) image set. `useLayoutEffect`, not `useEffect`: it
  // runs before the browser paints, so there is no one-frame flash of the wrong photo under the new gallery.
  useLayoutEffect(() => {
    const index = defaultIndexFor(gallery);
    setActiveIndex(index);
    // Read the ref fresh inside this closure rather than capturing `galleryScrollRef.current` once outside it -
    // the deferred call below must see whatever node is actually attached when it fires, not whichever one was
    // attached a frame earlier.
    const applyPosition = () => {
      const el = galleryScrollRef.current;
      if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'instant' });
    };
    applyPosition();
    // Re-applied one frame later: on first mount (including straight off SSR-rendered HTML) the browser can
    // settle a snap-mandatory container's scroll position after this effect already ran, silently discarding
    // the jump above. A same-frame `scrollTo` costs nothing extra when nothing moved the position in between.
    // Confirmed load-bearing, not leftover defensiveness: removing it and reloading reliably reproduces the
    // reset back to `scrollLeft: 0`.
    const raf = requestAnimationFrame(applyPosition);
    return () => cancelAnimationFrame(raf);
  }, [selectedVariantId, gallery]);

  // Keeps the dots/thumbnails/arrows in sync when the shopper swipes the hero directly instead of clicking a
  // control - the browser's native scroll does the actual work, this just mirrors the resulting position back
  // into state.
  useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el.clientWidth) return;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActiveIndex((current) => (current === index ? current : index));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
    // Re-attaches on every gallery change rather than once on mount - cheap, and it means a swipe is always
    // wired to whichever scroll container is actually live rather than one captured the first time this ran.
  }, [gallery]);

  const goToImage = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (gallery.length === 0) return;
    const clamped = wrapIndex(index, gallery.length);
    setActiveIndex(clamped);
    const el = galleryScrollRef.current;
    if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior });
  };

  // `.at(0)`, not `[0]`: a product with no images at all is a real state (photography is still pending for the
  // whole catalogue), and only `at` types that honestly as possibly-undefined without `noUncheckedIndexedAccess`.
  const hero = gallery.at(activeIndex) ?? gallery.at(0);

  // Shared by the in-column action row and the fixed mobile bar, which are the same action rendered at two
  // breakpoints rather than two behaviours.
  const handleAddToCart = () => {
    addItem({
      variantId: selectedVariant.id,
      productSlug: product.slug,
      productName: product.name,
      imageUrl: hero?.url ?? null,
      imageAltText: hero?.altText ?? null,
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      colourName: selectedVariant.colourName,
      unitPrice: selectedVariant.price,
      quantity: effectiveQuantity,
      oneOfAKind: selectedVariant.oneOfAKind,
      madeToOrder: selectedVariant.madeToOrder,
      leadTimeDays: selectedVariant.leadTimeDays,
    });
    toast.success(t('shopAddedToCart'), {
      action: {
        label: t('shopViewCart'),
        onClick: () => void navigate({ to: '/cart' }),
      },
    });
  };

  // The buy column carries the product's own `h1`, so the shell's title slot takes the handoff's breadcrumb
  // instead. Passing `product.name` here as well printed the name twice on the page, as two competing `h1`s.
  const breadcrumbCategory = product.categories.at(0);

  return (
    <AppContent
      title={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/shop" />}>{t('shopTitle')}</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link to="/shop" search={{ category: breadcrumbCategory.slug }} />
                    }
                  >
                    {breadcrumbCategory.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      {product.status !== 'ACTIVE' && (
        <Alert className="mb-6 border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-400">
          <EyeOff />
          <AlertTitle>{t('shopDraftPreviewTitle')}</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400/90">
            {t('shopDraftPreviewDescription')}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-3 sm:flex-row">
          {gallery.length > 1 && (
            // Hidden below `sm`, where the handoff's mobile gallery is a dot pager rather than a thumbnail
            // strip: a second scrolling row of 72px thumbs under a full-bleed hero is most of a phone screen.
            <div className="hidden gap-2 sm:flex sm:w-18 sm:flex-col">
              {gallery.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  aria-label={image.altText}
                  aria-current={index === activeIndex}
                  onClick={() => goToImage(index)}
                  className={cn(
                    'size-18 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 transition-all',
                    index === activeIndex ? 'ring-2 ring-primary' : 'ring-foreground/10 hover:ring-foreground/30',
                  )}
                >
                  <img src={productImageSrc(image.url)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-1 flex-col gap-3">
            <div className="relative">
              {/* Swipeable on every width via native scroll-snap - no gesture library needed, and it comes
                  with free momentum/rubber-banding. The arrow buttons and thumbnails/dots below just call
                  `scrollTo` on this same element, and the `scroll` listener above mirrors a manual swipe back
                  into `activeIndex` so every control stays in sync regardless of which one moved it. */}
              <div
                ref={galleryScrollRef}
                role="group"
                aria-label={t('shopProductGallery')}
                tabIndex={gallery.length > 1 ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    goToImage(activeIndex - 1);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    goToImage(activeIndex + 1);
                  }
                }}
                className="flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-xl bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.map((image, index) => (
                  <img
                    key={image.url}
                    src={productImageSrc(image.url)}
                    alt={image.altText}
                    // Eager for the active photo and its immediate neighbours (so a swipe in either direction
                    // has no blank frame), lazy for the rest - a scroll-snap gallery has to render every slide
                    // up front to be scrollable at all, but that doesn't mean every photo needs to be fetched
                    // before the shopper has swiped anywhere near it.
                    loading={Math.abs(index - activeIndex) <= 1 ? 'eager' : 'lazy'}
                    className="size-full shrink-0 snap-center object-cover"
                  />
                ))}
              </div>
              {/* Shown whenever there is a photo at all - unlike the prev/next arrows below, a single-image
                  product still has something to zoom into even with nothing to page through. Gated on
                  `gallery.length > 0` rather than shown unconditionally: with no photos at all `hero` is
                  undefined and `ImageLightbox` renders nothing, so an ungated button here would be a dead
                  click over the placeholder square. */}
              {gallery.length > 0 && (
                <GalleryControlButton
                  aria-label={t('shopZoomImage')}
                  onClick={() => setLightboxOpen(true)}
                  className="absolute right-2 bottom-2 size-9"
                >
                  <ZoomIn className="size-5" />
                </GalleryControlButton>
              )}
              {gallery.length > 1 && (
                <>
                  {/* Desktop only - mobile relies on the swipe gesture itself, where a persistent arrow would
                      just be clutter on top of the dot pager below. */}
                  <GalleryControlButton
                    aria-label={t('shopPreviousImage')}
                    onClick={() => goToImage(activeIndex - 1)}
                    className="absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 sm:flex"
                  >
                    <ChevronLeft className="size-5" />
                  </GalleryControlButton>
                  <GalleryControlButton
                    aria-label={t('shopNextImage')}
                    onClick={() => goToImage(activeIndex + 1)}
                    className="absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 sm:flex"
                  >
                    <ChevronRight className="size-5" />
                  </GalleryControlButton>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex justify-center gap-1.5 sm:hidden">
                {gallery.map((image, index) => (
                  <button
                    key={image.url}
                    type="button"
                    aria-label={image.altText}
                    aria-current={index === activeIndex}
                    onClick={() => goToImage(index)}
                    // A 24px tap target around a 6px dot: the dot itself is the handoff's size, but a bare 6px
                    // button is well under the 24px minimum a touch target needs to be reliably hittable.
                    className="flex size-6 items-center justify-center"
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full transition-colors',
                        index === activeIndex ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ImageLightbox
          images={gallery}
          index={activeIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onNavigate={goToImage}
        />

        <div className="flex flex-col gap-4">
          {selectedVariant.madeToOrder && (
            <Badge variant="accent" className="w-fit">
              {t('shopHandmadeToOrder')}
            </Badge>
          )}

          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{product.name}</h1>

          <p className="text-[28px] font-semibold">{formatPrice(selectedVariant.price)}</p>
          <p className="text-sm text-muted-foreground">
            {selectedVariant.madeToOrder
              ? selectedVariant.leadTimeDays
                ? t('shopIncludesVatLeadTime', { days: selectedVariant.leadTimeDays })
                : t('shopIncludesVatMadeToOrder')
              : t('shopIncludesVatReadyToShip')}
          </p>

          {sizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t('shopSize')}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  // Availability is asked of the size across every colour it comes in, because picking it will
                  // also move the colour if the current one is not made in that size.
                  const availableForSize = product.variants.some((v) => v.size === size && v.available);
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!availableForSize}
                      onClick={() =>
                        selectBy(
                          (v) => v.size === size,
                          (v) => v.colourName === selectedVariant.colourName,
                        )
                      }
                      className={cn(
                        'h-[34px] rounded-full border px-3.5 text-sm font-medium transition-colors',
                        selectedVariant.size === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : availableForSize
                            ? 'border-border text-foreground hover:border-primary'
                            : 'border-border text-muted-foreground line-through',
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {colours.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                {t('shopColour')}
                {selectedVariant.colourName && (
                  <span className="ml-1 text-muted-foreground">{selectedVariant.colourName}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {colours.map(([name, hex]) => {
                  const availableForColour = product.variants.some(
                    (v) => v.colourName === name && v.available,
                  );
                  return (
                    <ColourSwatchButton
                      key={name}
                      name={name}
                      hex={hex}
                      selected={selectedVariant.colourName === name}
                      available={availableForColour}
                      onSelect={() =>
                        selectBy(
                          (v) => v.colourName === name,
                          (v) => v.size === selectedVariant.size,
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <NumberField
              value={effectiveQuantity}
              onValueChange={(value) => setQuantity(value ?? 1)}
              min={1}
              max={selectedVariant.oneOfAKind ? 1 : undefined}
              className="w-32"
            >
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
            {/* Hidden below `lg`, where the same two controls live in the fixed bottom bar instead. The
                stepper stays in the column at every width: the handoff's mobile bar has no room for it, but
                dropping quantity entirely on a phone would be a functional regression, not a layout choice. */}
            <Button
              className="hidden h-10 flex-1 lg:inline-flex"
              disabled={!selectedVariant.available}
              onClick={handleAddToCart}
            >
              {selectedVariant.available ? t('shopAddToCart') : t('shopSoldOut')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-10 lg:inline-flex"
              aria-label={t(favorited ? 'shopWishlistRemove' : 'shopWishlistAdd')}
              disabled={isTogglingFavorite}
              onClick={handleWishlistClick}
            >
              <Heart className={cn('size-4', favorited && 'fill-current')} />
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-2 text-[13px]">
              {product.safetyWarning && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                  <span>{product.safetyWarning}</span>
                </div>
              )}
              {product.ageWarning && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                  <span>{product.ageWarning}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                <span>{t('shopDeliveryReassurance')}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {(product.fibreCompositionYarn || product.fibreCompositionFilling) && (
              <p>
                {[product.fibreCompositionYarn, product.fibreCompositionFilling].filter(Boolean).join(' · ')}
              </p>
            )}
            {/* The selected variant's own material - distinct from the fibre-composition line above, which is
                the yarn's EU 1007/2011 disclosure. A piece can combine a yarn body with, say, a felt appliqué. */}
            {selectedVariant.material && (
              <p>
                {t('adminProductMaterial')}: {selectedVariant.material}
              </p>
            )}
            {product.ceMarked && <p>{t('shopCeMarked')}</p>}
            <p>{product.manufacturerIdentity}</p>
          </div>

          <Accordion className="border-t pt-2">
            {product.careInstructions && (
              <AccordionItem value="care">
                <AccordionTrigger>
                  <WashingMachine className="mr-2 inline size-4" />
                  {t('shopMaterialsCare')}
                </AccordionTrigger>
                <AccordionContent>{product.careInstructions}</AccordionContent>
              </AccordionItem>
            )}
            {product.makerNote && (
              <AccordionItem value="making">
                <AccordionTrigger>{t('shopHowItsMade')}</AccordionTrigger>
                <AccordionContent>{product.makerNote}</AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="returns">
              <AccordionTrigger>{t('shopReturnsCancellation')}</AccordionTrigger>
              <AccordionContent>
                {selectedVariant.madeToOrder ? t('shopReturnsMadeToOrder') : t('shopReturnsStandard')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-sm">{product.description}</p>
        </div>
      </div>

      {/*
        The handoff's mobile action bar: 48px targets, pinned, below `lg` only - by the time a shopper has read
        the disclosures and the accordion, the buy column has scrolled away.

        `sticky`, not `fixed`: a fixed bar is out of flow, so it hangs over whatever the page ends with, and
        what this page ends with is `SiteFooter` (mounted in `__root.tsx`, outside `AppContent`, so no amount
        of padding *here* can clear it). Sticky pins it to the viewport bottom while there is page left and
        then lets it come to rest above the footer. `-mx-3` cancels `AppContent`'s own padding so the bar still
        spans the full width.
      */}
      <div className="sticky bottom-0 z-40 -mx-3 mt-6 flex gap-2 border-t bg-background/95 px-3 py-3 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur md:-mx-4 md:px-4 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="size-12 shrink-0"
          aria-label={t(favorited ? 'shopWishlistRemove' : 'shopWishlistAdd')}
          disabled={isTogglingFavorite}
          onClick={handleWishlistClick}
        >
          <Heart className={cn('size-4', favorited && 'fill-current')} />
        </Button>
        <Button
          className="h-12 flex-1"
          disabled={!selectedVariant.available}
          onClick={handleAddToCart}
        >
          {selectedVariant.available
            ? t('shopAddToCartWithPrice', { price: formatPrice(selectedVariant.price) })
            : t('shopSoldOut')}
        </Button>
      </div>
    </AppContent>
  );
}
