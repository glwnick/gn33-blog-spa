import { describe, expect, it } from 'vitest';
import {
  roleFilterSchema,
  userFiltersSchema,
  userResponseSchema,
  userStatsResponseSchema,
} from './users';

const userFixture = {
  userId: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
  firstName: 'Ana',
  lastName: 'Pop',
  email: 'ana@test.com',
  signInType: 'FORM_LOGIN',
  profilePictureUrl: null,
  phoneNumber: null,
  createdBy: 'admin@test.com',
  createdDate: '2026-08-01T10:00:00',
  lastModifiedBy: 'admin@test.com',
  lastModifiedDate: '2026-08-01T10:00:00',
  enabled: true,
  emailVerified: true,
  userRoleType: 'USER',
  orderCount: 3,
  lifetimeTotal: 450.5,
};

describe('userResponseSchema', () => {
  it('parses the Orders/Lifetime columns, the Active/Blocked status and the Role column', () => {
    const parsed = userResponseSchema.parse(userFixture);
    expect(parsed.orderCount).toBe(3);
    expect(parsed.lifetimeTotal).toBe(450.5);
    expect(parsed.enabled).toBe(true);
    expect(parsed.userRoleType).toBe('USER');
  });

  it('parses a user with no orders', () => {
    const parsed = userResponseSchema.parse({
      ...userFixture,
      enabled: false,
      orderCount: 0,
      lifetimeTotal: 0,
    });
    expect(parsed.enabled).toBe(false);
    expect(parsed.orderCount).toBe(0);
  });
});

describe('roleFilterSchema', () => {
  it('accepts the three real roles', () => {
    for (const role of ['ADMIN', 'MANAGER', 'USER']) {
      expect(roleFilterSchema.parse(role)).toBe(role);
    }
  });

  it('rejects the inherited-but-unused INSTRUCTOR role', () => {
    expect(() => roleFilterSchema.parse('INSTRUCTOR')).toThrow();
  });
});

describe('userFiltersSchema', () => {
  it('parses the Role/Status column filters and the toolbar search filter alongside pagination', () => {
    const parsed = userFiltersSchema.parse({
      page: 0,
      size: 20,
      userRoleType: 'MANAGER',
      enabled: true,
      search: 'ana@test.com',
    });
    expect(parsed.userRoleType).toBe('MANAGER');
    expect(parsed.enabled).toBe(true);
    expect(parsed.search).toBe('ana@test.com');
  });

  it('drops an invalid role rather than throwing, via .catch()', () => {
    const parsed = userFiltersSchema.parse({ userRoleType: 'NOT_A_ROLE' });
    expect(parsed.userRoleType).toBeUndefined();
  });
});

describe('userStatsResponseSchema', () => {
  it('parses the four stat cards', () => {
    const parsed = userStatsResponseSchema.parse({
      totalCustomers: 42,
      newThisMonth: 5,
      activeAccounts: 38,
      blockedAccounts: 4,
    });
    expect(parsed).toEqual({
      totalCustomers: 42,
      newThisMonth: 5,
      activeAccounts: 38,
      blockedAccounts: 4,
    });
  });
});
