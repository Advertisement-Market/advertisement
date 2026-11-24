export const CANDIDATE_TIERS = [
  {
    durationValue: 1,
    durationUnit: 'months',
    durationDays: 30,
    discount: 0.05,
    note: '5% off — 1 Month',
  },
  {
    durationValue: 3,
    durationUnit: 'months',
    durationDays: 90,
    discount: 0.1,
    note: '10% off — Popular',
  },
  {
    durationValue: 6,
    durationUnit: 'months',
    durationDays: 180,
    discount: 0.2,
    note: '20% off — Best value',
  },
  {
    durationValue: 1,
    durationUnit: 'years',
    durationDays: 365,
    discount: 0.3,
    note: '30% off — Long-term',
  },
  {
    durationValue: 2,
    durationUnit: 'years',
    durationDays: 730,
    discount: 0.35,
    note: '35% off — 2 Years',
  },
  {
    durationValue: 3,
    durationUnit: 'years',
    durationDays: 1095,
    discount: 0.4,
    note: '40% off — 3 Years',
  },
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
 * Returns 3 package tiers by default:
 * 1. Base tier: Set from the owner's minimum booking duration with rate: ''
 *    (auto-calculated by backend / UI from daily starting price * base duration days).
 * 2. Second tier: Blank promotional tier with default duration of 1 month and rate: ''.
 * 3. Third tier: Blank promotional tier with default duration of 1 month and rate: ''.
 *
 * Promotional tiers are blank by default without arbitrary autofilled discounts (like 10% or 30%).
 * The owner can enter custom durations and rates if they wish, or leave them blank.
 * Blank promotional tiers are safely omitted when serializing to the backend.
 * Additional packages can be added as needed.
 */
export function buildDefaultPackages(startPrice, minVal = 1, minUnit = 'months') {
  const normUnit = (minUnit || 'months').toLowerCase();
  const val = Number(minVal) || 1;
  const baseDays = toDays(val, normUnit);

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

  const promoTier1 = {
    id: 2,
    num: '3',
    unit: 'months',
    durationValue: 3,
    durationUnit: 'months',
    durationDays: 90,
    rate: '',
    note: '',
    notePlaceholder: '30% off',
    isBase: false,
    isCustomRate: false,
  };

  const promoTier2 = {
    id: 3,
    num: '6',
    unit: 'months',
    durationValue: 6,
    durationUnit: 'months',
    durationDays: 180,
    rate: '',
    note: '',
    notePlaceholder: 'Best value',
    isBase: false,
    isCustomRate: false,
  };

  return [baseTier, promoTier1, promoTier2];
}
