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

  describe('buildDefaultPackages - deterministic non-colliding tier generation', () => {
    it('returns default tiers with rate: "" when startPrice is missing, 0, or NaN', () => {
      const pkgNull = buildDefaultPackages(null, 1, 'months');
      expect(pkgNull).toHaveLength(3);
      expect(pkgNull[0].isBase).toBe(true);
      expect(pkgNull[0].rate).toBe('');
      expect(pkgNull[1].isBase).toBe(false);
      expect(pkgNull[1].rate).toBe('');
      expect(pkgNull[2].isBase).toBe(false);
      expect(pkgNull[2].rate).toBe('');

      const pkgZero = buildDefaultPackages(0, 1, 'months');
      expect(pkgZero).toHaveLength(3);
      expect(pkgZero[1].rate).toBe('');

      const pkgNaN = buildDefaultPackages('invalid', 1, 'months');
      expect(pkgNaN).toHaveLength(3);
      expect(pkgNaN[1].rate).toBe('');
    });

    it('correctly parses comma-formatted startPrice strings and computes promotional rates', () => {
      const pkgs = buildDefaultPackages('150,000', 1, 'months');
      expect(pkgs).toHaveLength(3);
      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].rate).toBe('');
      expect(pkgs[0].isCustomRate).toBe(false);

      // Promo 1: 90 days (10% off) -> 150000 * 90 * 0.90 = 12150000.00
      expect(pkgs[1].rate).toBe('12150000.00');
      expect(pkgs[1].isCustomRate).toBe(false);

      // Promo 2: 180 days (20% off) -> 150000 * 180 * 0.80 = 21600000.00
      expect(pkgs[2].rate).toBe('21600000.00');
      expect(pkgs[2].isCustomRate).toBe(false);
    });

    it('base = 1 day (1, "days") with startPrice = 1000 selects 1 Month and 3 Months', () => {
      const pkgs = buildDefaultPackages(1000, 1, 'days');
      expect(pkgs).toHaveLength(3);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(1);
      expect(pkgs[0].rate).toBe('');

      // Promo 1: 30 days (5% off) -> 1000 * 30 * 0.95 = 28500.00
      expect(pkgs[1].isBase).toBe(false);
      expect(pkgs[1].durationDays).toBe(30);
      expect(pkgs[1].rate).toBe('28500.00');

      // Promo 2: 90 days (10% off) -> 1000 * 90 * 0.90 = 81000.00
      expect(pkgs[2].isBase).toBe(false);
      expect(pkgs[2].durationDays).toBe(90);
      expect(pkgs[2].rate).toBe('81000.00');
    });

    it('base = 30 days (1, "months") with startPrice = 1000 selects 3 Months and 6 Months', () => {
      const pkgs = buildDefaultPackages(1000, 1, 'months');
      expect(pkgs).toHaveLength(3);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(30);

      // Promo 1: 90 days (10% off) -> 81000.00
      expect(pkgs[1].durationDays).toBe(90);
      expect(pkgs[1].rate).toBe('81000.00');

      // Promo 2: 180 days (20% off) -> 1000 * 180 * 0.80 = 144000.00
      expect(pkgs[2].durationDays).toBe(180);
      expect(pkgs[2].rate).toBe('144000.00');
    });

    it('base = 90 days (3, "months") with startPrice = 1000 selects 6 Months and 1 Year', () => {
      const pkgs = buildDefaultPackages(1000, 3, 'months');
      expect(pkgs).toHaveLength(3);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(90);

      // Promo 1: 180 days (20% off) -> 144000.00
      expect(pkgs[1].durationDays).toBe(180);
      expect(pkgs[1].rate).toBe('144000.00');

      // Promo 2: 365 days (30% off) -> 1000 * 365 * 0.70 = 255500.00
      expect(pkgs[2].durationDays).toBe(365);
      expect(pkgs[2].rate).toBe('255500.00');
    });

    it('base = 180 days (6, "months") with startPrice = 1000 selects 1 Year and 2 Years (no collision)', () => {
      const pkgs = buildDefaultPackages(1000, 6, 'months');
      expect(pkgs).toHaveLength(3);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(180);

      // Promo 1: 365 days (30% off) -> 255500.00
      expect(pkgs[1].durationDays).toBe(365);
      expect(pkgs[1].rate).toBe('255500.00');

      // Promo 2: 730 days (35% off) -> 1000 * 730 * 0.65 = 474500.00
      expect(pkgs[2].durationDays).toBe(730);
      expect(pkgs[2].rate).toBe('474500.00');
    });

    it('base = 365 days (1, "years") with startPrice = 1000 selects 2 Years and 3 Years (no collision)', () => {
      const pkgs = buildDefaultPackages(1000, 1, 'years');
      expect(pkgs).toHaveLength(3);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(365);

      // Promo 1: 730 days (35% off) -> 474500.00
      expect(pkgs[1].durationDays).toBe(730);
      expect(pkgs[1].rate).toBe('474500.00');

      // Promo 2: 1095 days (40% off) -> 1000 * 1095 * 0.60 = 657000.00
      expect(pkgs[2].durationDays).toBe(1095);
      expect(pkgs[2].rate).toBe('657000.00');
    });

    it('base = 730 days (2, "years") with startPrice = 1000 selects 3 Years (no collision)', () => {
      const pkgs = buildDefaultPackages(1000, 2, 'years');
      expect(pkgs).toHaveLength(2);

      expect(pkgs[0].isBase).toBe(true);
      expect(pkgs[0].durationDays).toBe(730);

      // Promo 1: 1095 days (40% off) -> 657000.00
      expect(pkgs[1].durationDays).toBe(1095);
      expect(pkgs[1].rate).toBe('657000.00');
    });

    it('guarantees unique durationDays in all generated tiers across any base', () => {
      const testBases = [
        [1, 'days'],
        [7, 'days'],
        [14, 'days'],
        [30, 'days'],
        [1, 'months'],
        [2, 'months'],
        [3, 'months'],
        [6, 'months'],
        [1, 'years'],
        [2, 'years'],
        [3, 'years'],
      ];

      for (const [val, unit] of testBases) {
        const pkgs = buildDefaultPackages(1500, val, unit);
        const days = pkgs.map((p) => p.durationDays);
        const uniqueDays = new Set(days);
        expect(uniqueDays.size).toBe(days.length);
        // All promotional tiers must be strictly greater than base
        for (let i = 1; i < pkgs.length; i++) {
          expect(pkgs[i].durationDays).toBeGreaterThan(pkgs[0].durationDays);
        }
      }
    });
  });
});
