import { describe, it, expect } from 'vitest';
import { toDays, buildDefaultPackages, CANDIDATE_TIERS } from './pricingPackageDefaults';

describe('pricingPackageDefaults', () => {
  describe('toDays', () => {
    it('converts duration units to normalized days', () => {
      expect(toDays(1, 'days')).toBe(1);
      expect(toDays(14, 'DAYS')).toBe(14);
      expect(toDays(2, 'weeks')).toBe(14);
      expect(toDays(3, 'months')).toBe(90);
      expect(toDays(1, 'years')).toBe(365);
      expect(toDays(2, 'YEARS')).toBe(730);
    });

    it('defaults to months (30 days) when unit is unknown or omitted', () => {
      expect(toDays(2, '')).toBe(60);
      expect(toDays(2, 'unknown')).toBe(60);
    });

    it('handles zero and invalid values defensively', () => {
      expect(toDays(0, 'days')).toBe(0);
      expect(toDays('abc', 'months')).toBe(0);
      expect(toDays(null, 'weeks')).toBe(0);
    });
  });

  describe('buildDefaultPackages - 3 default package tiers without autofilled discounts', () => {
    it('returns 3 package tiers: 1 base tier and 2 blank promotional tiers with duration 1 month', () => {
      const pkgs = buildDefaultPackages(null, 1, 'months');
      expect(pkgs).toHaveLength(3);

      // Row 1: Base tier
      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].num).toBe('1');
      expect(pkgs[0].unit).toBe('months');
      expect(pkgs[0].durationDays).toBe(30);
      expect(pkgs[0].rate).toBe('');
      expect(pkgs[0].note).toBe('');
      expect(pkgs[0].notePlaceholder).toBe('Standard');
      expect(pkgs[0].isCustomRate).toBe(false);

      // Row 2: Blank promotional tier with default duration of 1 month
      expect(pkgs[1].isBase).toBe(false);
      expect(pkgs[1].num).toBe('1');
      expect(pkgs[1].unit).toBe('months');
      expect(pkgs[1].durationDays).toBe(30);
      expect(pkgs[1].rate).toBe('');
      expect(pkgs[1].note).toBe('');
      expect(pkgs[1].notePlaceholder).toBe('30% off');
      expect(pkgs[1].isCustomRate).toBe(false);

      // Row 3: Blank promotional tier with default duration of 1 month
      expect(pkgs[2].isBase).toBe(false);
      expect(pkgs[2].num).toBe('1');
      expect(pkgs[2].unit).toBe('months');
      expect(pkgs[2].durationDays).toBe(30);
      expect(pkgs[2].rate).toBe('');
      expect(pkgs[2].note).toBe('');
      expect(pkgs[2].notePlaceholder).toBe('Best value');
      expect(pkgs[2].isCustomRate).toBe(false);
    });

    it('defaults base duration to 1 when minVal is omitted, null, or invalid', () => {
      const pkgOmitted = buildDefaultPackages(5000);
      expect(pkgOmitted).toHaveLength(3);
      expect(pkgOmitted[0].num).toBe('1');
      expect(pkgOmitted[0].unit).toBe('months');
      expect(pkgOmitted[0].durationDays).toBe(30);
      expect(pkgOmitted[0].rate).toBe('');

      const pkgInvalid = buildDefaultPackages(5000, 'abc', 'days');
      expect(pkgInvalid).toHaveLength(3);
      expect(pkgInvalid[0].num).toBe('1');
      expect(pkgInvalid[0].unit).toBe('days');
      expect(pkgInvalid[0].durationDays).toBe(1);
    });

    it('keeps all rates blank even when startPrice is provided so no 10% or 30% discounts are autofilled', () => {
      const pkgs = buildDefaultPackages('150,000', 1, 'months');
      expect(pkgs).toHaveLength(3);
      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].rate).toBe('');
      expect(pkgs[0].note).toBe('');

      expect(pkgs[1].isBase).toBe(false);
      expect(pkgs[1].rate).toBe('');
      expect(pkgs[1].note).toBe('');

      expect(pkgs[2].isBase).toBe(false);
      expect(pkgs[2].rate).toBe('');
      expect(pkgs[2].note).toBe('');
    });

    it('respects custom minimum booking duration values and units for the base tier', () => {
      const pkgDays = buildDefaultPackages(1000, 7, 'days');
      expect(pkgDays).toHaveLength(3);
      expect(pkgDays[0].num).toBe('7');
      expect(pkgDays[0].unit).toBe('days');
      expect(pkgDays[0].durationDays).toBe(7);
      // Promotional tiers remain 1 month default
      expect(pkgDays[1].num).toBe('1');
      expect(pkgDays[1].unit).toBe('months');
      expect(pkgDays[2].num).toBe('1');
      expect(pkgDays[2].unit).toBe('months');

      const pkgWeeks = buildDefaultPackages(1000, 2, 'weeks');
      expect(pkgWeeks).toHaveLength(3);
      expect(pkgWeeks[0].num).toBe('2');
      expect(pkgWeeks[0].unit).toBe('weeks');
      expect(pkgWeeks[0].durationDays).toBe(14);

      const pkgYears = buildDefaultPackages(1000, 1, 'years');
      expect(pkgYears).toHaveLength(3);
      expect(pkgYears[0].num).toBe('1');
      expect(pkgYears[0].unit).toBe('years');
      expect(pkgYears[0].durationDays).toBe(365);
    });

    it('never autofills promotional discount percentages (10%, 30%, etc.) into rate or note by default', () => {
      const testCases = [
        [1000, 1, 'days'],
        [1000, 1, 'months'],
        [1000, 3, 'months'],
        [1000, 6, 'months'],
        [1000, 1, 'years'],
        [1000, 2, 'years'],
      ];

      for (const [price, val, unit] of testCases) {
        const pkgs = buildDefaultPackages(price, val, unit);
        expect(pkgs).toHaveLength(3);
        expect(pkgs[0].isBase).toBe(true);
        expect(pkgs[0].rate).toBe('');
        expect(pkgs[1].isBase).toBe(false);
        expect(pkgs[1].rate).toBe('');
        expect(pkgs[1].note).toBe('');
        expect(pkgs[2].isBase).toBe(false);
        expect(pkgs[2].rate).toBe('');
        expect(pkgs[2].note).toBe('');
      }
    });
  });
});
