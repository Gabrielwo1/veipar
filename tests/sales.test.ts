import { describe, expect, it } from 'vitest';
import { parseAmount } from '../api/sales.js';

describe('parseAmount', () => {
  it.each([
    ['150', 150], ['150,5', 150.5], ['1.234,56', 1234.56], ['R$ 89,90', 89.9], [42.129, 42.13], ['1234.5', 1234.5],
  ])('%s → %s', (input, expected) => expect(parseAmount(input)).toBe(expected));

  it.each([['0'], ['-10'], ['abc'], [''], [null], [Infinity]])('rejeita %s', (input) =>
    expect(parseAmount(input)).toBeNull());
});
