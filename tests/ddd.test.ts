import { describe, expect, it } from 'vitest';
import { dddOf } from '../web/src/lib/ddd.js';

describe('dddOf', () => {
  it.each([
    ['5546991233498', '46'],
    ['554635230000', '46'],
    ['5511987654321', '11'],
    ['5523987654321', null], // DDD 23 não existe
    ['14155550100', null], // EUA
    ['m1792000000000', null], // cliente manual sem telefone
  ])('%s → %s', (waId, ddd) => expect(dddOf(waId)).toBe(ddd));
});
