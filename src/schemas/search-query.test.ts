import { describe, expect, it } from 'vitest';
import { searchQuerySchema } from './search-query';

describe('searchQuerySchema', () => {
  it.each([
    ['a normal query', 'carpathians', 'carpathians'],
    ['surrounding whitespace', '  hello  ', 'hello'],
    ['a single character (the backend rejects it)', 'a', ''],
    ['whitespace around a single character', ' a ', ''],
    ['an over-long query', 'a'.repeat(101), ''],
    ['a non-string value', 42, ''],
    ['a missing value', undefined, ''],
  ])('parses %s', (_label, input, expected) => {
    expect(searchQuerySchema.parse(input)).toBe(expected);
  });
});
