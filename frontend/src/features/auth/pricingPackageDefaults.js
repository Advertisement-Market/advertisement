export const CANDIDATE_TIERS = [
  { durationValue: 1, durationUnit: 'months', durationDays: 30, discount: 0.05, note: '5% off — 1 Month' },
  { durationValue: 3, durationUnit: 'months', durationDays: 90, discount: 0.10, note: '10% off — Popular' },
  { durationValue: 6, durationUnit: 'months', durationDays: 180, discount: 0.20, note: '20% off — Best value' },
  { durationValue: 1, durationUnit: 'years', durationDays: 365, discount: 0.30, note: '30% off — Long-term' },
  { durationValue: 2, durationUnit: 'years', durationDays: 730, discount: 0.35, note: '35% off — 2 Years' },
  { durationValue: 3, durationUnit: 'years', durationDays: 1095, discount: 0.40, note: '40% off — 3 Years' },
];

export function toDays(val, unit) {
  const v = Number(val) || 0;
  const u = (unit || '').toUpperCase();
  switch (u) {
    case 'DAYS':
      return v * 1;
    case 'WEEKS':
      return v * 7;
    case 'MONTHS':
      return v * 30;
    case 'YEARS':
      return v * 365;
    default:
      return v * 30;
  }
}

/**
 * Builds deterministic default pricing package tiers for a billboard.
 *
 * Base tier is set from the owner's minimum booking duration with rate: ''
 * (auto-calculated by the backend from daily starting price * base duration days).
 *
 * Promotional tiers are chosen from CANDIDATE_TIERS strictly greater than baseDays,
 * eliminating all duplicate duration collisions across any base value.
 *
 * If startPrice is not provided or <= 0, promotional tiers are still generated
 * with rate: '' so the owner sees standard 3M/6M tiers ready for rate entry.
 */
export function buildDefaultPackages(startPrice, minVal = 1, minUnit = 'months') {
  const normUnit = (minUnit || 'months').toLowerCase();
  const val = Number(minVal) || 1;
  const baseDays = toDays(val, normUnit);
  const dailyRate = Number(String(startPrice ?? '').replace(/,/g, ''));
  const hasValidPrice = Number.isFinite(dailyRate) && dailyRate > 0;

  const baseTier = {
    id: 1,
    num: String(val),
    unit: normUnit,
    durationValue: val,
    durationUnit: normUnit,
    durationDays: baseDays,
    rate: '',
    note: '',
    notePlaceholder: 'Standard',
    isBase: true,
    isCustomRate: false,
  };

  const promotionalTiers = CANDIDATE_TIERS
    .filter((c) => c.durationDays > baseDays)
    .slice(0, 2)
    .map((c, idx) => {
      let rateStr = '';
      if (hasValidPrice) {
        const unrounded = dailyRate * c.durationDays * (1 - c.discount);
        rateStr = (Math.round((unrounded + Number.EPSILON) * 100) / 100).toFixed(2);
      }
      return {
        id: idx + 2,
        num: String(c.durationValue),
        unit: c.durationUnit,
        durationValue: c.durationValue,
        durationUnit: c.durationUnit,
        durationDays: c.durationDays,
        rate: rateStr,
        note: c.note,
        notePlaceholder: c.note,
        isBase: false,
        isCustomRate: false,
      };
    });

  return [baseTier, ...promotionalTiers];
}
