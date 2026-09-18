import { useStore } from '@tanstack/react-form';
import { Plus, Trash2 } from 'lucide-react';
import type { AdminProductVariantDetail } from '@/schemas/admin-products';
import type { Category } from '@/schemas/products';
import type { AdminYarn } from '@/schemas/yarns';
import type { AdminSize } from '@/schemas/sizes';
import type { AdminMaterial } from '@/schemas/materials';
import type { ProductFormApi } from '@/pages/admin/product-form-page';
import { emptyProductFormVariant } from '@/pages/admin/product-form-page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YarnSwatch } from '@/pages/admin/yarn-swatch';
import { StockAdjustControl } from '@/pages/admin/stock-adjust-control';
import { formatDate, formatPrice } from '@/lib/formatting';
import { useTranslation } from '@/hooks/use-translation';

type ProductVariantRowsProps = {
  readonly form: ProductFormApi;
  readonly categories: Array<Category> | undefined;
  /** The managed lists behind each row's size/yarn/material pickers - see `/admin/library`. */
  readonly yarns: Array<AdminYarn> | undefined;
  readonly sizes: Array<AdminSize> | undefined;
  readonly materials: Array<AdminMaterial> | undefined;
  /** {@code product.firstPublishedAt == null} - decides whether "Remove" deletes outright or marks unavailable. */
  readonly neverPublished: boolean;
  /** The saved product's own variants, for the price-history disclosure - form state never carries history. */
  readonly existingVariants: Array<AdminProductVariantDetail> | undefined;
};

/**
 * Repeatable variant rows (plans/PLAN-catalogue-admin.md stage 1). "Remove" on a never-published product
 * deletes the row outright; on a published one it sets `permanentlyUnavailable` instead and the row moves to
 * the collapsed "Not for sale" section below - conflict 2's two branches, applied client-side the same way the
 * backend's diff falls back if a row is simply omitted, so the control's label is never a lie.
 */
export function ProductVariantRows({
  form,
  categories,
  yarns,
  sizes,
  materials,
  neverPublished,
  existingVariants,
}: ProductVariantRowsProps) {
  const { t } = useTranslation();
  const categoryIds = useStore(form.store, (state) => state.values.categoryIds);

  const categoryFallbackDays = (() => {
    const days = (categories ?? [])
      .filter((c) => categoryIds.includes(c.id))
      .map((c) => c.makingLeadTimeDays)
      .filter((d): d is number => d !== null);
    return days.length === 0 ? null : Math.max(...days);
  })();

  // Built once for every row rather than per row. A discontinued yarn is kept only when a row already points at
  // it: retiring a yarn should stop it appearing on new pieces without silently blanking the ones already made
  // from it, which is what filtering it out unconditionally would do to this controlled Select.
  const selectedYarnIds = useStore(form.store, (state) =>
    state.values.variants.map((v) => v.yarnId),
  );
  const yarnItems = [
    { value: '', label: t('adminYarnNone'), hex: null as string | null },
    ...(yarns ?? [])
      .filter((yarn) => !yarn.discontinued || selectedYarnIds.includes(yarn.id))
      .map((yarn) => ({ value: yarn.id, label: yarn.name, hex: yarn.hex })),
  ];

  // Same "keep a discontinued row's own current pick" reasoning as yarnItems above.
  const selectedSizeIds = useStore(form.store, (state) =>
    state.values.variants.map((v) => v.sizeId),
  );
  const sizeItems = [
    { value: '', label: t('adminSizeNone') },
    ...(sizes ?? [])
      .filter((size) => !size.discontinued || selectedSizeIds.includes(size.id))
      .map((size) => ({ value: size.id, label: size.name })),
  ];

  const selectedMaterialIds = useStore(form.store, (state) =>
    state.values.variants.map((v) => v.materialId),
  );
  const materialItems = [
    { value: '', label: t('adminMaterialNone') },
    ...(materials ?? [])
      .filter((material) => !material.discontinued || selectedMaterialIds.includes(material.id))
      .map((material) => ({ value: material.id, label: material.name })),
  ];

  return (
    <form.Field name="variants" mode="array">
      {(variantsField) => {
        const rows = variantsField.state.value;
        const indexed = rows.map((row, index) => ({ row, index }));
        const available = indexed.filter(({ row }) => !row.permanentlyUnavailable);
        const unavailable = indexed.filter(({ row }) => row.permanentlyUnavailable);

        const handleRemove = (index: number) => {
          if (neverPublished) {
            form.removeFieldValue('variants', index);
          } else {
            form.setFieldValue(`variants[${index}].permanentlyUnavailable`, true);
          }
        };

        return (
          <div className="flex flex-col gap-4">
            {available.length === 0 && (
              <FieldDescription>{t('adminProductNoVariantsYet')}</FieldDescription>
            )}
            {available.map(({ row, index }) => (
              <VariantRow
                key={row.id ?? `new-${index}`}
                form={form}
                index={index}
                priceHistory={
                  existingVariants?.find((v) => v.id === row.id)?.priceHistory
                }
                categoryFallbackDays={categoryFallbackDays}
                yarnItems={yarnItems}
                sizeItems={sizeItems}
                materialItems={materialItems}
                removeLabel={
                  neverPublished ? t('delete') : t('adminProductMarkUnavailable')
                }
                onRemove={() => handleRemove(index)}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() =>
                form.pushFieldValue('variants', emptyProductFormVariant(rows.length))
              }
            >
              <Plus className="-ms-1" />
              {t('adminProductAddVariant')}
            </Button>

            {unavailable.length > 0 && (
              <Accordion>
                <AccordionItem value="unavailable">
                  <AccordionTrigger>
                    {t('adminProductNotForSaleSection', { count: unavailable.length })}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      {unavailable.map(({ row, index }) => (
                        <VariantRow
                          key={row.id ?? `new-${index}`}
                          form={form}
                          index={index}
                          priceHistory={
                            existingVariants?.find((v) => v.id === row.id)
                              ?.priceHistory
                          }
                          categoryFallbackDays={categoryFallbackDays}
                          yarnItems={yarnItems}
                          sizeItems={sizeItems}
                          materialItems={materialItems}
                          removeLabel={t('adminProductRestore')}
                          onRemove={() =>
                            form.setFieldValue(
                              `variants[${index}].permanentlyUnavailable`,
                              false,
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}

type VariantRowProps = {
  readonly form: ProductFormApi;
  readonly index: number;
  readonly priceHistory: AdminProductVariantDetail['priceHistory'] | undefined;
  readonly categoryFallbackDays: number | null;
  readonly yarnItems: Array<{ value: string; label: string; hex: string | null }>;
  readonly sizeItems: Array<{ value: string; label: string }>;
  readonly materialItems: Array<{ value: string; label: string }>;
  readonly removeLabel: string;
  readonly onRemove: () => void;
};

function VariantRow({
  form,
  index,
  priceHistory,
  categoryFallbackDays,
  yarnItems,
  sizeItems,
  materialItems,
  removeLabel,
  onRemove,
}: VariantRowProps) {
  const { t } = useTranslation();
  const prefix = `variants[${index}]` as const;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <form.AppField
          name={`${prefix}.sku`}
          children={(field) => <field.TextField label={t('sku')} mandatoryLabel />}
        />
        {/* Three pickers where there used to be free-text boxes. All three are managed on /admin/library, so a
            size, colour or material cannot be invented per SKU any more - which is what made the storefront's
            filters drift. */}
        <form.AppField name={`${prefix}.sizeId`}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`${prefix}-size`}>{t('shopSize')}</FieldLabel>
              <Select
                items={sizeItems}
                // The form keeps '' for "no size", not null - same controlled-Select reasoning as yarnId below.
                value={field.state.value}
                onValueChange={(value) => field.handleChange(String(value))}
              >
                <SelectTrigger id={`${prefix}-size`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.AppField>
        <form.AppField name={`${prefix}.yarnId`}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`${prefix}-yarn`}>{t('shopColour')}</FieldLabel>
              <Select
                items={yarnItems}
                // The form keeps '' for "no yarn", not null - it is a controlled Select, and the whole form
                // shape uses '' for empty and converts to null once on submit (`blankToNull`).
                value={field.state.value}
                onValueChange={(value) => field.handleChange(String(value))}
              >
                <SelectTrigger id={`${prefix}-yarn`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yarnItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <span className="flex items-center gap-2">
                        <YarnSwatch hex={item.hex} className="size-3" />
                        {item.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.AppField>
        <form.AppField name={`${prefix}.materialId`}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`${prefix}-material`}>
                {t('adminProductMaterial')}
              </FieldLabel>
              <Select
                items={materialItems}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(String(value))}
              >
                <SelectTrigger id={`${prefix}-material`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.AppField>
        <form.AppField
          name={`${prefix}.price`}
          children={(field) => (
            <field.NumberField label={t('shopPrice')} suffix="RON" mandatoryLabel />
          )}
        />
        <form.AppField
          name={`${prefix}.productionBatchCode`}
          children={(field) => (
            <field.TextField
              label={t('adminProductBatchCode')}
              description={t('adminProductBatchCodeHint')}
            />
          )}
        />
        <form.Field name={`${prefix}.leadTimeDays`}>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('adminProductLeadTimeDays')}</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                }
              />
              <FieldDescription>
                {categoryFallbackDays === null
                  ? t('adminProductLeadTimeNoFallback')
                  : t('adminProductLeadTimeFallback', { days: categoryFallbackDays })}
              </FieldDescription>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form.AppField
          name={`${prefix}.madeToOrder`}
          children={(field) => <field.CheckboxField label={t('adminProductMadeToOrder')} />}
        />
        <form.AppField
          name={`${prefix}.oneOfAKind`}
          children={(field) => <field.CheckboxField label={t('adminProductOneOfAKind')} />}
        />
      </div>

      <form.Field name={`${prefix}.id`}>
        {(idField) =>
          idField.state.value ? (
            <Field orientation="horizontal">
              <FieldLabel>{t('stock')}</FieldLabel>
              <StockAdjustControl
                variantId={idField.state.value}
                stock={form.getFieldValue(`${prefix}.stock`)}
                size="sm"
              />
              <FieldDescription>{t('adminProductStockSeparateHint')}</FieldDescription>
            </Field>
          ) : (
            <form.AppField
              name={`${prefix}.stock`}
              children={(field) => (
                <field.NumberField
                  label={t('stock')}
                  description={t('adminProductStockNewRowHint')}
                />
              )}
            />
          )
        }
      </form.Field>

      {priceHistory && priceHistory.length > 1 && (
        <Accordion>
          <AccordionItem value="price-history">
            <AccordionTrigger>{t('adminProductPriceHistory')}</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {priceHistory.map((entry, i) => (
                  <li key={i}>
                    {formatPrice(entry.price)} · {formatDate(entry.effectiveFrom)}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <Separator />

      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={onRemove}>
        <Trash2 className="-ms-1" />
        {removeLabel}
      </Button>
    </div>
  );
}
