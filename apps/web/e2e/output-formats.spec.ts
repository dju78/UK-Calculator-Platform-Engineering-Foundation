import { test, expect } from '@playwright/test';
import {
  classifyOutput,
  formatOutputValue,
  parseDisplayedValue
} from '../src/components/calculators/outputFormats';

/**
 * Unit coverage for the central display formatter. It lives in the Playwright
 * runner rather than the Node suite because apps/web compiles to CommonJS,
 * which the root ESM test suite cannot named-import.
 *
 * No browser is needed - these are pure function assertions.
 */
test.describe('Central output formatting', () => {
  test('ratios are shown to people as percentages', () => {
    expect(formatOutputValue('PRO-010', 'ltv', 0.917)).toBe('91.7%');
    expect(formatOutputValue('PRO-011', 'ltv', 0.7)).toBe('70%');
    expect(formatOutputValue('FIN-013', 'savings_rate', 0.35)).toBe('35%');
    expect(formatOutputValue('BUS-001', 'margin', 0.4)).toBe('40%');
    expect(formatOutputValue('PRO-016', 'net_yield', 0.05)).toBe('5%');
    expect(formatOutputValue('BUS-001', 'markup', -0.16666666666666666)).toBe('-16.67%');
  });

  test('money uses consistent en-GB currency formatting', () => {
    expect(formatOutputValue('TAX-003', 'net_annual', 25407.6)).toBe('£25,407.60');
    expect(formatOutputValue('FIN-001', 'monthly_payment', 193.328)).toBe('£193.33');
    expect(formatOutputValue('PRO-023', 'sdlt', 20000)).toBe('£20,000.00');
    // Never a bare 3566 or 1,426.4 alongside properly formatted money.
    expect(formatOutputValue('TAX-003', 'tax', 3566)).toBe('£3,566.00');
    expect(formatOutputValue('TAX-003', 'ni', 1426.4)).toBe('£1,426.40');
  });

  test('the same key is classified per calculator, never globally', () => {
    // margin is a ratio in BUS-001 but an absolute width in STA-006.
    expect(classifyOutput('BUS-001', 'margin')).toBe('percent');
    expect(classifyOutput('STA-006', 'margin')).not.toBe('percent');
  });

  test('ICR stays a multiple rather than becoming a percentage', () => {
    expect(classifyOutput('PRO-018', 'icr')).toBe('ratio');
    expect(formatOutputValue('PRO-018', 'icr', 1.500952380952381)).toBe('1.501');
  });

  test('counts render as whole numbers', () => {
    expect(formatOutputValue('DAT-001', 'total_days', 13382)).toBe('13,382');
    expect(formatOutputValue('STA-008', 'n', 385)).toBe('385');
    expect(formatOutputValue('PRO-004', 'months_saved', 17)).toBe('17');
  });

  test('broken values never reach the screen', () => {
    for (const bad of [NaN, Infinity, -Infinity, undefined, null]) {
      expect(formatOutputValue('FIN-001', 'monthly_payment', bad)).toBe('—');
    }
    expect(formatOutputValue('FIN-001', 'anything', {})).toBe('—');
  });

  test('the display transform round-trips for the parity harness', () => {
    const cases: Array<[string, string, number]> = [
      ['PRO-010', 'ltv', 0.917],
      ['BUS-001', 'margin', 0.4],
      ['BUS-001', 'markup', -0.16666666666666666],
      ['TAX-003', 'net_annual', 25407.6],
      ['PRO-018', 'icr', 1.5009]
    ];
    for (const [calc, key, value] of cases) {
      const rendered = formatOutputValue(calc, key, value);
      expect(parseDisplayedValue(calc, key, rendered)).toBeCloseTo(value, 3);
    }
  });
});
