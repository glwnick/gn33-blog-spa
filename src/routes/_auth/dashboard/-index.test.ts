import { describe, expect, it } from 'vitest';
import { Route } from './index';

// `validateSearch` is the route's zod schema itself, so exercise it through `parse`.
const validate = (search: Record<string, unknown>) =>
  (Route.options.validateSearch as unknown as { parse: (v: unknown) => unknown }).parse(search);

describe('/dashboard search params', () => {
  it('defaults to no query', () => {
    expect(validate({})).toEqual({ q: '' });
  });

  it('keeps a usable query, trimmed', () => {
    expect(validate({ q: ' trip ' })).toEqual({ q: 'trip' });
  });

  it('drops a one-character query instead of letting the loader hit a 400', () => {
    expect(validate({ q: 'a' })).toEqual({ q: '' });
  });
});
