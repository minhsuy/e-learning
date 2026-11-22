/**
 * TMDEMY — Exact Whole-VND BigInt Currency Utilities (STEP 09.5)
 *
 * All monetary fields from `/api/teacher/earnings*`, `/api/admin/commissions*`,
 * and `/api/admin/earnings*` arrive as canonical whole-VND decimal strings
 * (e.g. "0", "280000", "-280000").
 *
 * CRITICAL INVARIANT:
 * - Never use Number() or parseFloat() for monetary arithmetic, sums, or comparisons.
 * - Perform all exact calculations and formatting with BigInt so values even above
 *   Number.MAX_SAFE_INTEGER (9,007,199,254,740,991) retain 100% precision.
 * - Uses `BigInt(...)` constructor constants for full compatibility with TS target < ES2020.
 */

const WHOLE_VND_REGEX = /^-?\d+$/;
const BI_ZERO = BigInt(0);
const BI_THOUSAND = BigInt(1000);
const BI_HUNDRED_THOUSAND = BigInt(100000);
const BI_MILLION = BigInt(1000000);
const BI_HUNDRED_MILLION = BigInt(100000000);
const BI_BILLION = BigInt(1000000000);
const BI_TEN_THOUSAND = BigInt(10000);

const vndCurrencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const vndNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

/**
 * Strictly parses a whole-VND decimal string (or bigint) into a BigInt.
 * Throws if the input is not a canonical whole integer string.
 */
export function parseVndBigInt(value: string | bigint): bigint {
  if (typeof value === 'bigint') return value;
  const trimmed = value.trim();
  if (!WHOLE_VND_REGEX.test(trimmed)) {
    throw new RangeError(`Invalid whole-VND monetary string: "${value}"`);
  }
  return BigInt(trimmed);
}

/**
 * Safely parses a whole-VND string into BigInt, returning fallback (BigInt(0)) for null/undefined/invalid.
 */
export function tryParseVndBigInt(
  value: string | bigint | null | undefined,
  fallback: bigint = BI_ZERO
): bigint {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'bigint') return value;
  const trimmed = value.trim();
  if (!WHOLE_VND_REGEX.test(trimmed)) return fallback;
  return BigInt(trimmed);
}

/**
 * Returns the absolute value of a BigInt.
 */
export function absBigInt(value: bigint): bigint {
  return value < BI_ZERO ? -value : value;
}

/**
 * Adds two whole-VND decimal strings using exact BigInt arithmetic.
 */
export function addVndStrings(a: string | bigint, b: string | bigint): string {
  return (parseVndBigInt(a) + parseVndBigInt(b)).toString();
}

/**
 * Subtracts b from a using exact BigInt arithmetic.
 */
export function subtractVndStrings(a: string | bigint, b: string | bigint): string {
  return (parseVndBigInt(a) - parseVndBigInt(b)).toString();
}

/**
 * Sums an array of whole-VND decimal strings using exact BigInt arithmetic.
 */
export function sumVndStrings(values: ReadonlyArray<string | bigint | null | undefined>): string {
  let total = BI_ZERO;
  for (const val of values) {
    total += tryParseVndBigInt(val, BI_ZERO);
  }
  return total.toString();
}

/**
 * Compares two whole-VND strings using exact BigInt comparison.
 */
export function compareVndStrings(a: string | bigint, b: string | bigint): -1 | 0 | 1 {
  const biA = parseVndBigInt(a);
  const biB = parseVndBigInt(b);
  if (biA < biB) return -1;
  if (biA > biB) return 1;
  return 0;
}

/**
 * Returns true if the whole-VND string equals exactly 0.
 */
export function isZeroVnd(value: string | bigint | null | undefined): boolean {
  return tryParseVndBigInt(value, BI_ZERO) === BI_ZERO;
}

/**
 * Returns true if the whole-VND string is strictly negative.
 */
export function isNegativeVnd(value: string | bigint | null | undefined): boolean {
  return tryParseVndBigInt(value, BI_ZERO) < BI_ZERO;
}

/**
 * Returns true if the whole-VND string is strictly positive.
 */
export function isPositiveVnd(value: string | bigint | null | undefined): boolean {
  return tryParseVndBigInt(value, BI_ZERO) > BI_ZERO;
}

/**
 * Formats a whole-VND decimal string (positive, zero, or negative) using Intl.NumberFormat(BigInt).
 * Zero precision loss even for values exceeding Number.MAX_SAFE_INTEGER.
 */
export function formatVnd(
  value: string | bigint | null | undefined,
  options?: { showPlusSign?: boolean }
): string {
  const bi = tryParseVndBigInt(value, BI_ZERO);
  const formatted = vndCurrencyFormatter.format(bi);
  if (options?.showPlusSign && bi > BI_ZERO) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Formats a whole-VND value as grouped digits without the currency symbol (exact BigInt).
 */
export function formatVndPlain(value: string | bigint | null | undefined): string {
  const bi = tryParseVndBigInt(value, BI_ZERO);
  return vndNumberFormatter.format(bi);
}

/**
 * Formats a whole-VND BigInt into a compact Vietnamese label for SVG chart axes
 * using pure BigInt integer scaling (never overflows Number.MAX_SAFE_INTEGER).
 */
export function formatCompactVndBigInt(value: string | bigint | null | undefined): string {
  const bi = tryParseVndBigInt(value, BI_ZERO);
  if (bi === BI_ZERO) return '0 ₫';

  const sign = bi < BI_ZERO ? '-' : '';
  const abs = absBigInt(bi);

  if (abs >= BI_BILLION) {
    const whole = abs / BI_BILLION;
    const tenths = (abs % BI_BILLION) / BI_HUNDRED_MILLION;
    return tenths > BI_ZERO
      ? `${sign}${whole.toString()}.${tenths.toString()} tỷ`
      : `${sign}${whole.toString()} tỷ`;
  }
  if (abs >= BI_MILLION) {
    const whole = abs / BI_MILLION;
    const tenths = (abs % BI_MILLION) / BI_HUNDRED_THOUSAND;
    return tenths > BI_ZERO
      ? `${sign}${whole.toString()}.${tenths.toString()} tr`
      : `${sign}${whole.toString()} tr`;
  }
  if (abs >= BI_THOUSAND) {
    const whole = abs / BI_THOUSAND;
    return `${sign}${whole.toString()}k`;
  }
  return `${sign}${abs.toString()} ₫`;
}

/**
 * Computes a clamped 0..100 visual percentage ratio between two non-negative BigInt VND values
 * strictly for SVG chart bar/line geometry scaling (never for financial sums).
 */
export function vndRatioPercent(
  part: string | bigint | null | undefined,
  total: string | bigint | null | undefined
): number {
  const p = absBigInt(tryParseVndBigInt(part, BI_ZERO));
  const t = absBigInt(tryParseVndBigInt(total, BI_ZERO));
  if (t === BI_ZERO || p === BI_ZERO) return 0;
  if (p >= t) return 100;
  // Scale to basis-point precision (0..10000) inside BigInt before safe small-integer division
  const scaled = Number((p * BI_TEN_THOUSAND) / t);
  return Math.max(0, Math.min(100, scaled / 100));
}

/**
 * Returns the maximum BigInt value across a list of whole-VND strings (minimum BigInt(0)).
 */
export function maxVndBigInt(values: ReadonlyArray<string | bigint | null | undefined>): bigint {
  let max = BI_ZERO;
  for (const val of values) {
    const bi = tryParseVndBigInt(val, BI_ZERO);
    if (bi > max) max = bi;
  }
  return max;
}

/**
 * Formats integer basis points (0..10000) as a clean Vietnamese percentage label.
 * Example: 7000 -> "70%", 7250 -> "72.5%", 7255 -> "72.55%".
 */
export function formatBpsPercent(bps: number): string {
  if (!Number.isFinite(bps)) return '0%';
  const pct = bps / 100;
  return `${Number(pct.toFixed(2))}%`;
}

/**
 * Converts a user-entered percentage (0..100, up to 2 decimal places) to exact integer BPS (0..10000).
 * Returns null if out of range or invalid.
 */
export function percentToBps(input: string | number): number | null {
  const raw = typeof input === 'number' ? String(input) : input.trim().replace(',', '.');
  if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  const bps = Math.round(parsed * 100);
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) return null;
  return bps;
}
