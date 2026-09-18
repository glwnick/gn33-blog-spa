import { describe, expect, it } from 'vitest';
import { BOARD_COLUMN_STATUSES, orderBoardCardSchema } from './order-board';

describe('orderBoardCardSchema', () => {
  it('parses a board card with preview lines', () => {
    const payload = {
      orderId: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      orderNumber: 'RO-2482',
      status: 'IN_PRODUCTION',
      itemCount: 3,
      total: 148.99,
      createdDate: '2026-08-01T10:00:00',
      dueDate: '2026-08-08',
      previewLines: [],
    };
    expect(orderBoardCardSchema.parse(payload)).toMatchObject({
      orderNumber: 'RO-2482',
      status: 'IN_PRODUCTION',
      dueDate: '2026-08-08',
    });
  });

  it('accepts a null due date, for an order whose lines resolve no making lead time', () => {
    const payload = {
      orderId: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      orderNumber: 'RO-2482',
      status: 'PAID',
      itemCount: 1,
      total: 20,
      createdDate: '2026-08-01T10:00:00',
      dueDate: null,
      previewLines: [],
    };
    expect(orderBoardCardSchema.parse(payload).dueDate).toBeNull();
  });
});

describe('BOARD_COLUMN_STATUSES', () => {
  it('covers exactly the five active-pipeline statuses, in display order', () => {
    expect(BOARD_COLUMN_STATUSES).toEqual([
      'PAID',
      'IN_PRODUCTION',
      'PACKED',
      'SHIPPED',
      'CANCELLED',
    ]);
  });

  it('excludes PENDING_PAYMENT and every terminal status the board has no column for', () => {
    for (const status of ['PENDING_PAYMENT', 'DELIVERED', 'REFUNDED', 'RETURNED']) {
      expect(BOARD_COLUMN_STATUSES).not.toContain(status);
    }
  });
});
