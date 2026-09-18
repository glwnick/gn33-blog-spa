import '@/lib/i18n';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ActiveOrderRail } from './active-order-card';
import type { OrderStatus } from '@/schemas/orders';

// Every case renders the same four node labels, unlike order-status-badge.test.tsx's per-status unique text,
// so an un-unmounted previous render would make a later `getByText` ambiguous.
afterEach(cleanup);

const NODE_LABELS = ['Placed', 'In the making', 'Shipped', 'Delivered'] as const;

/**
 * Locks the status-to-rank bucketing down explicitly, the same reasoning as
 * `order-status-badge.test.tsx`: the component's `Record<OrderStatus, number>` already fails to compile on a
 * missed status, this catches the mapping itself drifting from the label text.
 */
const EXPECTATIONS: ReadonlyArray<{ status: OrderStatus; completedLabels: ReadonlyArray<string> }> = [
  { status: 'PENDING_PAYMENT', completedLabels: ['Placed'] },
  { status: 'PAID', completedLabels: ['Placed', 'In the making'] },
  { status: 'IN_PRODUCTION', completedLabels: ['Placed', 'In the making'] },
  { status: 'PACKED', completedLabels: ['Placed', 'In the making'] },
  { status: 'SHIPPED', completedLabels: ['Placed', 'In the making', 'Shipped'] },
  { status: 'DELIVERED', completedLabels: ['Placed', 'In the making', 'Shipped', 'Delivered'] },
];

describe('ActiveOrderRail', () => {
  it.each(EXPECTATIONS)('marks the right nodes complete for $status', ({ status, completedLabels }) => {
    render(<ActiveOrderRail status={status} />);
    for (const label of NODE_LABELS) {
      const node = screen.getByText(label);
      if (completedLabels.includes(label)) {
        expect(node.className).toContain('font-medium');
      } else {
        expect(node.className).toContain('text-muted-foreground');
      }
    }
  });
});
