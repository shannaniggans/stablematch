import { describe, expect, it } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats cents to AUD by default', () => {
    expect(formatCurrency(12345)).toContain('123.45');
  });

  it('supports alternate currency codes', () => {
    expect(formatCurrency(1000, 'USD')).toContain('10.00');
  });
});
