import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductSummary, ProductVariant } from '@/schemas/products';
import { ProductBadgeLabel } from '@/pages/shop/product-badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-provider';
import { useCart } from '@/context/cart-provider';
import { useToggleFavorite } from '@/hooks/use-toggle-favorite';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';
import { productOptions } from '@/query-options/product-options';

/**
 * The catalogue grid card. `ProductSummary` carries no variant id (it's a rollup: min price, distinct
 * colours/sizes across every variant), so the quick-add button fetches the full product detail on click to
 * get a real variant to add - same default-variant pick as the detail page (`available` first, else the
 * first one), and `staleTime: 0` for the same reason the detail page forces it: stock has to be checked at
 * add time, not served from a possibly-stale cache. The wishlist button is wired to the real favorites
 * domain; both buttons stop propagation so they do not also trigger the card-wide navigation to the product
 * page.
 *
 * `compact` is the home dashboard's teaser variant (`plans/PLAN-slice-5-member-home.md`): a square image and
 * no Add button, since a 3-card teaser has no room for it.
 */

/**
 * Same default-variant pick as the product detail page's own `useState` initialiser: the first `available`
 * variant, or - if the product is entirely sold out - the first one regardless, so the caller can still show
 * an honest "sold out" rather than silently adding nothing. Exported as a standalone function (rather than
 * inlined in the mutation below) so the pick itself is unit-testable without rendering the card.
 */
export function pickDefaultVariant(
  variants: ReadonlyArray<ProductVariant>,
): ProductVariant | undefined {
  return variants.find((variant) => variant.available) ?? variants.at(0);
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductSummary;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { favorited, toggle, isPending: isTogglingFavorite } = useToggleFavorite(
    product.id,
    product.favorited,
  );

  const { mutate: quickAdd, isPending: isAddingToCart } = useMutation({
    mutationFn: async () => {
      const detail = await queryClient.fetchQuery({
        ...productOptions(product.slug),
        staleTime: 0,
      });
      return pickDefaultVariant(detail.variants);
    },
    onSuccess: (variant) => {
      if (!variant || !variant.available) {
        toast.error(t('shopSoldOut'));
        return;
      }
      addItem({
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: product.imageUrl,
        imageAltText: product.imageAltText,
        sku: variant.sku,
        size: variant.size,
        colourName: variant.colourName,
        unitPrice: variant.price,
        quantity: 1,
        oneOfAKind: variant.oneOfAKind,
        madeToOrder: variant.madeToOrder,
        leadTimeDays: variant.leadTimeDays,
      });
      toast.success(t('shopAddedToCart'), {
        action: {
          label: t('shopViewCart'),
          onClick: () => void navigate({ to: '/cart' }),
        },
      });
    },
  });

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    quickAdd();
  };

  const meta = [
    product.fibreComposition,
    product.sizes.length === 1
      ? product.sizes[0]
      : product.sizes.length > 1
        ? t('shopSizeCount', { count: product.sizes.length })
        : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-t-xl bg-muted',
          compact ? 'aspect-square' : 'aspect-4/5',
        )}
      >
        {product.imageUrl && (
          <img
            src={productImageSrc(product.imageUrl)}
            alt={product.imageAltText ?? ''}
            className="size-full object-cover"
            loading="lazy"
          />
        )}
        {product.badge && (
          <div className="absolute top-2 left-2">
            <ProductBadgeLabel badge={product.badge} />
          </div>
        )}
        {!compact && (
          <button
            type="button"
            aria-label={t(favorited ? 'shopWishlistRemove' : 'shopWishlistAdd')}
            disabled={isTogglingFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                void navigate({ to: '/login' });
                return;
              }
              toggle();
            }}
            // `bg-card`, not the handoff's literal `bg-white/90`: the mock is light-mode only, and a hardcoded
            // white disc reads as a bright hole on a dark photo once `.dark` is on. `--card` is pure white in
            // light mode, so this is the same pixel there and the right one in dark mode.
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:bg-card disabled:pointer-events-none disabled:opacity-60"
          >
            <Heart className={cn('size-3.5', favorited && 'fill-current')} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 pb-3.5">
        <p className="truncate text-sm font-medium">{product.name}</p>

        {/* "Organic cotton · 3 sizes". A single size is named rather than counted ("22 cm" beats "1 size"),
            which is also how the handoff's own examples read. Omitted entirely when the product has neither -
            an empty 13px line would just push the price row down for nothing. */}
        {meta.length > 0 && (
          <p className="truncate text-[13px] text-muted-foreground">{meta.join(' · ')}</p>
        )}

        {product.colours.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            {product.colours.map((colour) => (
              <span
                key={colour.name}
                title={colour.name}
                className="size-3.5 rounded-full ring-1 ring-foreground/15"
                style={colour.hex ? { backgroundColor: colour.hex } : undefined}
              />
            ))}
          </div>
        )}

        <div className={cn('mt-auto flex items-center justify-between pt-3')}>
          <p className="text-[15px] font-semibold">
            {product.price === null ? null : formatPrice(product.price)}
          </p>
          {!compact && (
            // One button, not two: below `lg` it collapses to icon-only (the bag icon the top nav also uses for
            // the cart, so it reads as "into the bag" rather than a generic plus), at `lg` and up it expands back
            // to the labelled pill - matching the grid's own `lg:grid-cols-3` breakpoint (`catalogue-page.tsx`)
            // rather than `sm`, since the grid is still 2-up below `lg` and a labelled button re-crowds the same
            // row the icon exists to relieve. `aria-label` (not the swapped visible content) is the single
            // source of the accessible name, so it tracks `isAddingToCart` the same way at every width.
            <Button
              size="sm"
              className="w-7 gap-0 px-0 lg:w-auto lg:gap-1 lg:px-2.5"
              disabled={isAddingToCart}
              aria-label={isAddingToCart ? t('shopAdding') : t('shopAdd')}
              onClick={handleQuickAdd}
            >
              <span className="lg:hidden">
                {isAddingToCart ? <Spinner className="size-3.5" /> : <ShoppingBag className="size-3.5" />}
              </span>
              <span className="hidden lg:inline">
                {isAddingToCart ? t('shopAdding') : t('shopAdd')}
              </span>
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
