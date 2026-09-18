import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { AppContent } from '@/components/layout/app-content';
import { Button, buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/cart-provider';
import { productOptions } from '@/query-options/product-options';
import { storefrontConfigOptions } from '@/query-options/checkout-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice, roundToCents } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  // Several lines can share a product (different size/colour), so each distinct slug is only
  // re-fetched once. `staleTime: 0` overrides `productOptions`'s hour-long catalogue cache: stock
  // has to be re-checked every time the cart is viewed, per ROADMAP.md's "stock validation on add,
  // on view, and again at checkout" - a stale cache hit here would defeat the point of checking at all.
  const productSlugs = Array.from(new Set(items.map((item) => item.productSlug)));
  const productQueries = useQueries({
    queries: productSlugs.map((slug) => ({ ...productOptions(slug), staleTime: 0 })),
  });

  // The same read checkout makes, so the delivery cost the cart states is the one the order will charge
  // rather than an estimate the review step then contradicts.
  const { data: storefrontConfig } = useQuery(storefrontConfigOptions());
  const shippingCost = storefrontConfig
    ? storefrontConfig.freeShippingThreshold !== null &&
      subtotal >= storefrontConfig.freeShippingThreshold
      ? 0
      : storefrontConfig.flatRate
    : undefined;
  const total = shippingCost === undefined ? undefined : roundToCents(subtotal + shippingCost);

  const availableByVariantId = new Map<string, boolean>();
  for (const query of productQueries) {
    for (const variant of query.data?.variants ?? []) {
      availableByVariantId.set(variant.id, variant.available);
    }
  }
  // A variant whose product hasn't resolved yet (still loading, or the product 404s outright) is
  // treated as available - checkout re-checks stock for real, so a slow or broken revalidation here
  // should not itself block a shopper who has a perfectly fine cart.
  const isAvailable = (variantId: string) => availableByVariantId.get(variantId) ?? true;
  const hasUnavailableItem = items.some((item) => !isAvailable(item.variantId));

  if (items.length === 0) {
    return (
      <AppContent title={t('shopCartTitle')}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('shopCartEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('shopCartEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
            {t('shopBrowseCatalogue')}
          </ButtonNavLink>
        </Empty>
      </AppContent>
    );
  }

  const goToCheckout = () => navigate({ to: '/checkout' });

  /** Subtotal / Delivery / VAT-included, shared by the sticky desktop summary and the mobile bar's total. */
  const summaryRows = (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('checkoutSubtotal')}</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('checkoutShipping')}</span>
        <span>
          {shippingCost === undefined
            ? '…'
            : shippingCost === 0
              ? t('shopCartDeliveryFree')
              : formatPrice(shippingCost)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('shopCartVatIncluded')}</span>
      </div>
    </div>
  );

  return (
    <AppContent title={t('shopCartTitle')}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="gap-0 divide-y p-0">
          {items.map((item) => {
            const available = isAvailable(item.variantId);
            return (
              <div key={item.variantId} className="flex gap-4 p-4">
                {/* 64px on a phone, the handoff's 84px from `sm` up - a 84px thumb plus the controls row
                    does not leave the variant line a readable width at 390px. */}
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-21">
                  {item.imageUrl && (
                    <img
                      src={productImageSrc(item.imageUrl)}
                      alt={item.imageAltText ?? ''}
                      className="size-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-[15px] font-medium">{item.productName}</p>
                  {(item.size || item.colourName) && (
                    <p className="text-sm text-muted-foreground">
                      {[item.size, item.colourName].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-accent-foreground">
                    {item.madeToOrder
                      ? item.leadTimeDays
                        ? t('shopCartEtaLeadTime', { days: item.leadTimeDays })
                        : t('shopCartEtaMadeToOrder')
                      : t('shopCartEtaReadyToShip')}
                  </p>
                  {!available && (
                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5" />
                      {t('shopCartUnavailableTitle')}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <NumberField
                      value={item.quantity}
                      onValueChange={(value) => updateQuantity(item.variantId, value ?? 1)}
                      min={1}
                      max={item.oneOfAKind ? 1 : undefined}
                      className="w-28"
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-sm text-destructive hover:underline"
                    >
                      {t('shopCartRemove')}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between text-right">
                  <p className="text-[15px] font-semibold">
                    {formatPrice(roundToCents(item.unitPrice * item.quantity))}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)}</p>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Replaced below `lg` by the fixed bar, which is the handoff's mobile cart summary. */}
        <Card className="hidden h-fit lg:sticky lg:top-20 lg:block">
          <CardContent className="flex flex-col gap-3">
            {summaryRows}
            <Separator />
            <div className="flex items-center justify-between text-xl font-semibold">
              <p>{t('shopCartTotal')}</p>
              <p>{total === undefined ? '…' : formatPrice(total)}</p>
            </div>
            {hasUnavailableItem && (
              <p className="text-xs font-medium text-destructive">
                {t('shopCartUnavailableBlocksCheckout')}
              </p>
            )}
            <Button
              className="h-10 w-full"
              disabled={hasUnavailableItem || total === undefined}
              onClick={goToCheckout}
            >
              {t('shopCartGoToCheckout')}
            </Button>
            {/* Suppressed when the window is zero: the setting's own semantics are that self-serve
                cancellation is switched off, so promising it here would be a lie the order page then
                contradicts. */}
            {storefrontConfig && storefrontConfig.orderCancellationWindowHours > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('shopCartFreeCancellationNote', {
                  hours: storefrontConfig.orderCancellationWindowHours,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* The handoff's mobile summary bar. `sticky` rather than `fixed` for the same reason the product page's
          action bar is - see the comment there: a fixed bar hangs over `SiteFooter`, which is mounted outside
          this page entirely. */}
      <div className="sticky bottom-0 z-40 -mx-3 mt-6 flex flex-col gap-2 border-t bg-background/95 px-3 py-3 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur md:-mx-4 md:px-4 lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('checkoutShipping')}</span>
          <span>
            {shippingCost === undefined
              ? '…'
              : shippingCost === 0
                ? t('shopCartDeliveryFree')
                : formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{t('shopCartTotal')}</span>
          <span>{total === undefined ? '…' : formatPrice(total)}</span>
        </div>
        {hasUnavailableItem && (
          <p className="text-xs font-medium text-destructive">
            {t('shopCartUnavailableBlocksCheckout')}
          </p>
        )}
        <Button
          className="h-12 w-full"
          disabled={hasUnavailableItem || total === undefined}
          onClick={goToCheckout}
        >
          {t('shopCartGoToCheckout')}
        </Button>
      </div>
    </AppContent>
  );
}
