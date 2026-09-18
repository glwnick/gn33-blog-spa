import '@/lib/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderStatusBadge } from './order-status-badge';
import type { OrderStatus } from '@/schemas/orders';

/**
 * Locks the status-to-variant mapping down with an explicit expectation per status, rather than looping
 * over `Object.keys`, so a future `OrderStatus` addition that the component's `Record` types would already
 * catch at compile time also fails loudly here if the runtime mapping and the label text ever diverge.
 */
const EXPECTATIONS: ReadonlyArray<{
  status: OrderStatus;
  variantClass: string;
  label: string;
}> = [
  { status: 'PENDING_PAYMENT', variantClass: 'text-foreground', label: 'Pending payment' },
  { status: 'PAID', variantClass: 'bg-accent', label: 'Paid' },
  { status: 'IN_PRODUCTION', variantClass: 'bg-accent', label: 'In the making' },
  { status: 'PACKED', variantClass: 'bg-accent', label: 'Packed' },
  { status: 'SHIPPED', variantClass: 'bg-accent', label: 'Shipped' },
  { status: 'DELIVERED', variantClass: 'bg-secondary', label: 'Delivered' },
  { status: 'CANCELLED', variantClass: 'text-destructive', label: 'Cancelled' },
  { status: 'REFUNDED', variantClass: 'text-destructive', label: 'Refunded' },
  { status: 'RETURNED', variantClass: 'text-destructive', label: 'Returned' },
];

describe('OrderStatusBadge', () => {
  it.each(EXPECTATIONS)('renders $status as "$label"', ({ status, variantClass, label }) => {
    render(<OrderStatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge.className).toContain(variantClass);
  });
});
