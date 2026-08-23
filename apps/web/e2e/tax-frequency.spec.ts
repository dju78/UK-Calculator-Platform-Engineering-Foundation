import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Browser regressions for the UK Tax & Salary frequency, tax-code and pension
 * enhancements. These complement the engine benchmarks: they prove the UI
 * collects the right inputs and renders the right numbers, including the human
 * percentage convention (the user types 5, not 0.05).
 */

const TAKE_HOME = '/calculators/take-home-pay-calculator';
const SALARY = '/calculators/uk-salary-calculator';

async function setSelect(page: Page, name: string, value: string) {
  await page.locator(`select[name="${name}"]`).selectOption(value);
}

async function setNumber(page: Page, name: string, value: string) {
  const field = page.locator(`input[name="${name}"]`);
  await field.fill('');
  await field.fill(value);
}

async function calculateAndRead(page: Page, key: string): Promise<string> {
  await page.getByRole('button', { name: /Calculate/i }).click();
  return (await page.locator(`[data-output-key="${key}"]`).first().innerText()).trim();
}

function toNumber(text: string): number {
  const negative = text.trim().startsWith('-');
  const n = parseFloat(text.replace(/[^0-9.]/g, ''));
  return negative ? -n : n;
}

test.describe('TAX-003 take-home pay', () => {
  test('accepts a human percentage and reproduces the approved 5% sacrifice figures', async ({ page }) => {
    await page.goto(TAKE_HOME);

    await setNumber(page, 'gross', '32000');
    await setSelect(page, 'income_frequency', 'annual');
    await setSelect(page, 'payroll_frequency', 'monthly');
    await setSelect(page, 'jurisdiction', 'England/Wales/NI');
    await setSelect(page, 'tax_code', '1257L');
    await setSelect(page, 'pension_arrangement', 'salary_sacrifice');

    // The critical UX assertion: the browser must accept 5, not 0.05.
    await setNumber(page, 'pension_pct', '5');

    await page.getByRole('button', { name: /Calculate/i }).click();

    const read = async (key: string) =>
      toNumber(await page.locator(`[data-output-key="${key}"]`).first().innerText());

    expect(await read('employee_pension')).toBeCloseTo(1600, 2);
    expect(await read('tax')).toBeCloseTo(3566, 2);
    expect(await read('ni')).toBeCloseTo(1426.4, 2);
    expect(await read('net_annual')).toBeCloseTo(25407.6, 2);
    expect(await read('net_monthly')).toBeCloseTo(2117.3, 2);
  });

  test('formats money consistently with £, grouping and 2 decimal places', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '32000');
    await setSelect(page, 'pension_arrangement', 'salary_sacrifice');
    await setNumber(page, 'pension_pct', '5');

    const netAnnual = await calculateAndRead(page, 'net_annual');
    const tax = await page.locator('[data-output-key="tax"]').first().innerText();

    expect(netAnnual).toBe('£25,407.60');
    expect(tax.trim()).toBe('£3,566.00');
  });

  test('shows take-home for every period, with the hourly figure labelled an equivalent', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '32000');
    await page.getByRole('button', { name: /Calculate/i }).click();

    for (const key of ['net_yearly', 'net_monthly', 'net_weekly', 'net_hourly_equivalent']) {
      await expect(page.locator(`[data-output-key="${key}"]`).first()).toBeVisible();
    }

    // The hourly figure must never be presented as an exact payslip amount.
    await expect(page.getByText(/Estimated net hourly equivalent/i)).toBeVisible();
    await expect(page.getByText(/Based on your entered working hours and paid weeks/i)).toBeVisible();
  });

  test('periodic take-home reconciles to the annual figure', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '32000');
    await page.getByRole('button', { name: /Calculate/i }).click();

    const read = async (key: string) =>
      toNumber(await page.locator(`[data-output-key="${key}"]`).first().innerText());

    const yearly = await read('net_yearly');
    const monthly = await read('net_monthly');
    const weekly = await read('net_weekly');
    const hourly = await read('net_hourly_equivalent');

    // Within display rounding of half a penny per period.
    expect(Math.abs(monthly * 12 - yearly)).toBeLessThanOrEqual(0.005 * 12);
    expect(Math.abs(weekly * 52 - yearly)).toBeLessThanOrEqual(0.005 * 52);
    expect(Math.abs(hourly * 37.5 * 52 - yearly)).toBeLessThanOrEqual(0.005 * 1950);
  });

  test('all four income frequencies give the same annual take-home', async ({ page }) => {
    const results: number[] = [];

    for (const [frequency, amount] of [
      ['annual', '32000'],
      ['monthly', String(32000 / 12)],
      ['weekly', String(32000 / 52)],
      ['hourly', String(32000 / 1950)]
    ] as const) {
      await page.goto(TAKE_HOME);
      await setSelect(page, 'income_frequency', frequency);
      await setNumber(page, 'gross', amount);
      results.push(toNumber(await calculateAndRead(page, 'net_annual')));
    }

    for (const value of results.slice(1)) {
      expect(value).toBeCloseTo(results[0], 1);
    }
  });

  test('payroll frequency is independent of how income was entered', async ({ page }) => {
    await page.goto(TAKE_HOME);
    // An hourly worker paid monthly is a legitimate combination.
    await setSelect(page, 'income_frequency', 'hourly');
    await setNumber(page, 'gross', '15');
    await setSelect(page, 'payroll_frequency', 'weekly');

    await page.getByRole('button', { name: /Calculate/i }).click();
    await expect(page.locator('[data-output-key="payroll_frequency"]').first()).toHaveText('weekly');

    // 15 x 37.5 x 52 = 29,250
    const gross = toNumber(await page.locator('[data-output-key="gross_annual"]').first().innerText());
    expect(gross).toBeCloseTo(29250, 2);
  });

  test('working pattern is editable and visibly drives the annualised gross', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setSelect(page, 'income_frequency', 'hourly');
    await setNumber(page, 'gross', '15');
    await setNumber(page, 'hours_per_week', '37.5');
    await setNumber(page, 'paid_weeks_per_year', '52');

    expect(toNumber(await calculateAndRead(page, 'gross_annual'))).toBeCloseTo(29250, 2);

    await setNumber(page, 'hours_per_week', '20');
    expect(toNumber(await calculateAndRead(page, 'gross_annual'))).toBeCloseTo(15600, 2);
  });
});

test.describe('TAX-003 tax codes', () => {
  test('applies the selected code rather than assuming the standard one', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');

    await setSelect(page, 'tax_code', '1257L');
    const standard = toNumber(await calculateAndRead(page, 'tax'));

    await setSelect(page, 'tax_code', 'BR');
    const basicRateOnly = toNumber(await calculateAndRead(page, 'tax'));

    await setSelect(page, 'tax_code', 'NT');
    const noTax = toNumber(await calculateAndRead(page, 'tax'));

    expect(standard).toBeCloseTo(7486, 2);
    // BR taxes all 50,000 at the basic rate with no allowance.
    expect(basicRateOnly).toBeCloseTo(10000, 2);
    expect(noTax).toBeCloseTo(0, 2);
  });

  test('supports a custom numeric code through the interpretation layer', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');
    await setSelect(page, 'tax_code', 'custom');

    const custom = page.locator('input[name="tax_code_custom"]');
    await expect(custom).toBeVisible();
    await custom.fill('1100L');

    // 1100L means an £11,000 allowance.
    expect(toNumber(await calculateAndRead(page, 'personal_allowance'))).toBeCloseTo(11000, 2);
  });

  test('reports K codes as unsupported instead of silently using 1257L', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');
    await setSelect(page, 'tax_code', 'custom');
    await page.locator('input[name="tax_code_custom"]').fill('K475');
    await page.getByRole('button', { name: /Calculate/i }).click();

    await expect(page.getByText(/not yet supported by this annual estimate/i)).toBeVisible();
    // It must NOT have quietly produced a standard-allowance answer.
    await expect(page.locator('[data-output-key="net_annual"]')).toHaveCount(0);
  });

  test('reports Week 1/Month 1 codes as unsupported rather than stripping the marker', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');
    await setSelect(page, 'tax_code', 'custom');
    await page.locator('input[name="tax_code_custom"]').fill('1257L W1');
    await page.getByRole('button', { name: /Calculate/i }).click();

    await expect(page.getByText(/not yet supported by this annual estimate/i)).toBeVisible();
    await expect(page.locator('[data-output-key="net_annual"]')).toHaveCount(0);
  });

  test('the default code follows the jurisdiction, but never overrides a deliberate choice', async ({ page }) => {
    await page.goto(TAKE_HOME);
    const taxCode = page.locator('select[name="tax_code"]');
    await expect(taxCode).toHaveValue('1257L');

    await setSelect(page, 'jurisdiction', 'Scotland');
    await expect(taxCode).toHaveValue('S1257L');

    await setSelect(page, 'jurisdiction', 'England/Wales/NI');
    await expect(taxCode).toHaveValue('1257L');

    // Once the user picks a code themselves, changing jurisdiction leaves it be.
    await setSelect(page, 'tax_code', 'BR');
    await setSelect(page, 'jurisdiction', 'Scotland');
    await expect(taxCode).toHaveValue('BR');
  });

  test('Scottish codes use the Scottish bands', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');
    await setSelect(page, 'jurisdiction', 'Scotland');
    await setSelect(page, 'tax_code', 'S1257L');

    const scottish = toNumber(await calculateAndRead(page, 'tax'));
    // Scottish bands produce a different liability from England/Wales/NI.
    expect(scottish).toBeCloseTo(8982.05, 1);
  });
});

test.describe('TAX-003 pension arrangements', () => {
  const setUp = async (page: Page, arrangement: string) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '80000');
    await setSelect(page, 'pension_arrangement', arrangement);
    if (arrangement !== 'none') await setNumber(page, 'pension_pct', '5');
  };

  test('salary sacrifice reduces National Insurance but net pay does not', async ({ page }) => {
    await setUp(page, 'salary_sacrifice');
    const sacrificeNi = toNumber(await calculateAndRead(page, 'ni'));

    await setUp(page, 'net_pay');
    const netPayNi = toNumber(await calculateAndRead(page, 'ni'));

    expect(sacrificeNi).toBeLessThan(netPayNi);
  });

  test('relief at source shows the provider top-up', async ({ page }) => {
    await setUp(page, 'relief_at_source');
    await page.getByRole('button', { name: /Calculate/i }).click();

    const read = async (key: string) =>
      toNumber(await page.locator(`[data-output-key="${key}"]`).first().innerText());

    // 5% of 80,000 = 4,000 gross; employee pays 3,200 and the provider adds 800.
    expect(await read('employee_pension')).toBeCloseTo(4000, 2);
    expect(await read('employee_pension_cash_cost')).toBeCloseTo(3200, 2);
    expect(await read('pension_tax_relief')).toBeCloseTo(800, 2);
  });

  test('employer contribution is shown but never deducted from take-home', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '50000');
    const withoutEmployer = toNumber(await calculateAndRead(page, 'net_annual'));

    await setNumber(page, 'employer_pension_pct', '3');
    await page.getByRole('button', { name: /Calculate/i }).click();

    const withEmployer = toNumber(await page.locator('[data-output-key="net_annual"]').first().innerText());
    const employer = toNumber(await page.locator('[data-output-key="employer_pension"]').first().innerText());

    expect(withEmployer).toBeCloseTo(withoutEmployer, 2);
    expect(employer).toBeCloseTo(1500, 2);
  });

  test('the contribution field only appears once an arrangement is chosen', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setSelect(page, 'pension_arrangement', 'none');
    await expect(page.locator('input[name="pension_pct"]')).toHaveCount(0);

    await setSelect(page, 'pension_arrangement', 'salary_sacrifice');
    await expect(page.locator('input[name="pension_pct"]')).toBeVisible();
    await expect(page.getByText('Enter 5 for 5%.').first()).toBeVisible();
  });
});

test.describe('TAX-002 salary frequency converter', () => {
  test('derives the other frequencies from any single entry', async ({ page }) => {
    for (const [frequency, amount] of [
      ['annual', '39000'],
      ['monthly', '3250'],
      ['weekly', '750'],
      ['hourly', '20']
    ] as const) {
      await page.goto(SALARY);
      await setSelect(page, 'income_frequency', frequency);
      await setNumber(page, 'salary', amount);
      await setNumber(page, 'hours_week', '37.5');
      await setNumber(page, 'weeks', '52');
      await page.getByRole('button', { name: /Calculate/i }).click();

      const read = async (key: string) =>
        toNumber(await page.locator(`[data-output-key="${key}"]`).first().innerText());

      expect(await read('gross_annual')).toBeCloseTo(39000, 2);
      expect(await read('gross_monthly')).toBeCloseTo(3250, 2);
      expect(await read('gross_weekly')).toBeCloseTo(750, 2);
      expect(await read('gross_hourly')).toBeCloseTo(20, 2);
    }
  });
});

test.describe('TAX family accessibility and layout', () => {
  const pages = [
    { url: TAKE_HOME, name: 'Take-Home Pay Calculator' },
    { url: SALARY, name: 'UK Salary Calculator' },
    { url: '/calculators/uk-income-tax-calculator', name: 'UK Income Tax Calculator' },
    { url: '/calculators/national-insurance-calculator', name: 'National Insurance Calculator' },
    { url: '/calculators/student-loan-repayment-calculator', name: 'Student Loan Repayment Calculator' }
  ];

  for (const { url, name } of pages) {
    test(`${name} has no serious or critical Axe violations with results shown`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('heading', { name })).toBeVisible();
      await page.getByRole('button', { name: /Calculate/i }).click();

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(blocking).toEqual([]);
    });
  }

  test('every control on the take-home form has an accessible name', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await setSelect(page, 'income_frequency', 'hourly');
    await setSelect(page, 'pension_arrangement', 'relief_at_source');
    await setSelect(page, 'tax_code', 'custom');

    const controls = page.locator('form input, form select');
    const count = await controls.count();
    expect(count).toBeGreaterThan(8);

    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      const id = await control.getAttribute('id');
      expect(id, 'every control needs an id to be labelled').toBeTruthy();
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
  });

  test('results stay within the viewport on a narrow mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(TAKE_HOME);
    await setNumber(page, 'gross', '123456.78');
    await page.getByRole('button', { name: /Calculate/i }).click();

    await expect(page.locator('[data-output-key="net_yearly"]').first()).toBeVisible();

    // The periodic results must reflow rather than force the page sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the take-home page states its PAYE estimate limitations', async ({ page }) => {
    await page.goto(TAKE_HOME);
    await page.getByRole('button', { name: /Calculate/i }).click();
    await expect(page.getByText(/may differ from a payslip/i)).toBeVisible();
  });
});
