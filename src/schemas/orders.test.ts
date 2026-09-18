import { describe, expect, it } from 'vitest';
import { orderDetailSchema, orderListFilterSchema, orderStatusSchema } from './orders';

const lineFixture = {
  productName: 'Bunny plush',
  sku: 'BUN-01',
  size: null,
  colourName: 'Sand',
  unitPrice: 129,
  quantity: 1,
  imageUrl: null,
  imageAltText: null,
  productSlug: 'bunny-plush',
};

const addressFixture = {
  fullName: 'Ana Pop',
  phone: '+40712345678',
  street: 'Str. Exemplu 1',
  city: 'Cluj-Napoca',
  postalCode: '400000',
  companyName: undefined,
  companyCui: undefined,
};

describe('orderDetailSchema', () => {
  it('parses a cancellable order', () => {
    const payload = {
      id: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      orderNumber: 'RO-2482',
      status: 'PENDING_PAYMENT',
      subtotal: 129,
      shippingCost: 19.99,
      total: 148.99,
      placedAt: '2026-08-01T10:00:00',
      cancelledAt: null,
      lines: [lineFixture],
      shippingAddress: addressFixture,
      cancellable: true,
      cancellableUntil: '2026-08-02T10:00:00',
    };
    expect(orderDetailSchema.parse(payload)).toMatchObject({
      orderNumber: 'RO-2482',
      cancellable: true,
    });
  });

  it('parses a cancelled order with cancellableUntil null', () => {
    const payload = {
      id: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      orderNumber: 'RO-2482',
      status: 'CANCELLED',
      subtotal: 129,
      shippingCost: 19.99,
      total: 148.99,
      placedAt: '2026-08-01T10:00:00',
      cancelledAt: '2026-08-01T12:00:00',
      lines: [lineFixture],
      shippingAddress: addressFixture,
      cancellable: false,
      cancellableUntil: null,
    };
    expect(orderDetailSchema.parse(payload).cancellable).toBe(false);
  });

  it('rejects a status outside the known lifecycle', () => {
    const payload = {
      id: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      orderNumber: 'RO-2482',
      status: 'ON_THE_MOON',
      subtotal: 129,
      shippingCost: 19.99,
      total: 148.99,
      placedAt: '2026-08-01T10:00:00',
      cancelledAt: null,
      lines: [lineFixture],
      shippingAddress: addressFixture,
      cancellable: false,
      cancellableUntil: null,
    };
    expect(() => orderDetailSchema.parse(payload)).toThrow();
  });
});

describe('orderStatusSchema', () => {
  it('accepts every value of the full Phase 4 lifecycle', () => {
    const statuses = [
      'PENDING_PAYMENT',
      'PAID',
      'IN_PRODUCTION',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
      'RETURNED',
    ];
    for (const status of statuses) {
      expect(orderStatusSchema.parse(status)).toBe(status);
    }
  });
});

describe('orderListFilterSchema', () => {
  it('accepts the four filter pills', () => {
    for (const filter of ['ALL', 'OPEN', 'DELIVERED', 'CANCELLED']) {
      expect(orderListFilterSchema.parse(filter)).toBe(filter);
    }
  });

  it('rejects a status masquerading as a filter', () => {
    expect(() => orderListFilterSchema.parse('PENDING_PAYMENT')).toThrow();
  });
});
