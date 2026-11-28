import { describe, it, expect } from 'vitest';
import {
  getRecentListings,
  formatListingMeta,
  formatListingMonthlyPrice,
  getListingStatusBadge,
  escapeRegExp,
} from './ownerDashboardUtils';

describe('ownerDashboardUtils', () => {
  describe('escapeRegExp', () => {
    it('escapes all RegExp metacharacters properly', () => {
      expect(escapeRegExp("St. John's (East) [Sec-1]?")).toBe(
        "St\\. John's \\(East\\) \\[Sec-1\\]\\?",
      );
    });
  });

  describe('getRecentListings', () => {
    it('returns empty array when input is null, undefined, empty, or limit <= 0', () => {
      expect(getRecentListings(null)).toEqual([]);
      expect(getRecentListings(undefined)).toEqual([]);
      expect(getRecentListings([])).toEqual([]);
      expect(getRecentListings([{ id: 1 }], 0)).toEqual([]);
      expect(getRecentListings([{ id: 1 }], -1)).toEqual([]);
    });

    it('returns top 3 latest listings in strict descending createdAt order and excludes 4th and 5th items', () => {
      const input = [
        { id: 1, name: 'Item 1', createdAt: '2026-01-01T10:00:00Z' },
        { id: 2, name: 'Item 2', createdAt: '2026-03-01T10:00:00Z' },
        { id: 3, name: 'Item 3', createdAt: '2026-05-01T10:00:00Z' },
        { id: 4, name: 'Item 4', createdAt: '2026-04-01T10:00:00Z' },
        { id: 5, name: 'Item 5', createdAt: '2026-02-01T10:00:00Z' },
      ];

      const copyBefore = JSON.stringify(input);
      const result = getRecentListings(input, 3);

      // Does not mutate input array
      expect(JSON.stringify(input)).toBe(copyBefore);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3); // 2026-05-01
      expect(result[1].id).toBe(4); // 2026-04-01
      expect(result[2].id).toBe(2); // 2026-03-01

      // 4th and 5th items excluded
      const ids = result.map((r) => r.id);
      expect(ids).not.toContain(5);
      expect(ids).not.toContain(1);
    });

    it('handles unparsable dates, null, or undefined createdAt gracefully without throwing or breaking sort stability', () => {
      const input = [
        { id: 1, name: 'Invalid Date', createdAt: 'invalid-date' },
        { id: 2, name: 'Valid Date', createdAt: '2026-06-01T00:00:00Z' },
        { id: 3, name: 'Null Date', createdAt: null },
      ];

      const result = getRecentListings(input, 3);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(2); // Valid recent date is first
    });

    it('uses numeric id descending as secondary tiebreaker when createdAt is identical', () => {
      const input = [
        { id: 10, name: 'Old ID', createdAt: '2026-06-01T00:00:00Z' },
        { id: 25, name: 'New ID', createdAt: '2026-06-01T00:00:00Z' },
      ];

      const result = getRecentListings(input, 2);
      expect(result[0].id).toBe(25);
      expect(result[1].id).toBe(10);
    });
  });

  describe('formatListingMeta', () => {
    it('returns empty string when listing is null or undefined', () => {
      expect(formatListingMeta(null)).toBe('');
      expect(formatListingMeta(undefined)).toBe('');
    });

    it('deduplicates city when landmark already contains city name as a full word', () => {
      const l = {
        landmark: 'Near City Center, Pune',
        city: 'Pune',
        widthFt: 40,
        heightFt: 20,
        type: 'LED_DIGITAL',
      };
      const meta = formatListingMeta(l);
      expect(meta).toBe('Near City Center, Pune · 40×20 ft · LED Digital');
      expect(meta).not.toContain('Pune · Pune');
    });

    it('deduplicates city across hyphen and slash separators', () => {
      const l1 = { landmark: 'MG Road-Pune', city: 'Pune' };
      expect(formatListingMeta(l1)).toBe('MG Road-Pune');

      const l2 = { landmark: 'MG Road/Pune', city: 'Pune' };
      expect(formatListingMeta(l2)).toBe('MG Road/Pune');
    });

    it('escapes special characters in city and avoids breaking regex or false suppression', () => {
      const l = {
        landmark: "Plot 42, St. John's (East)",
        city: "St. John's (East)",
      };
      expect(formatListingMeta(l)).toBe("Plot 42, St. John's (East)");
    });

    it('preserves city when location name has city as a substring within a larger word', () => {
      const l = {
        landmark: 'Punewadi Flyover',
        city: 'Pune',
        widthFt: 30,
        heightFt: 15,
        type: 'STATIC_HOARDING',
      };
      const meta = formatListingMeta(l);
      expect(meta).toBe('Punewadi Flyover · Pune · 30×15 ft · Static Hoarding');
    });

    it('handles missing landmark by falling back to addressLine1 and city', () => {
      const l = {
        addressLine1: 'MG Road',
        city: 'Bengaluru',
        widthFt: 20,
        heightFt: 10,
        type: 'BUS_SHELTER',
      };
      expect(formatListingMeta(l)).toBe('MG Road · Bengaluru · 20×10 ft · Bus Shelter');
    });

    it('handles missing dimensions cleanly without printing null×null', () => {
      const l = {
        landmark: 'Airport Road',
        city: 'Mumbai',
        type: 'LED_DIGITAL',
      };
      expect(formatListingMeta(l)).toBe('Airport Road · Mumbai · LED Digital');
    });
  });

  describe('formatListingMonthlyPrice', () => {
    it('returns "Price on request" for null, undefined, or missing price listings', () => {
      expect(formatListingMonthlyPrice(null)).toBe('Price on request');
      expect(formatListingMonthlyPrice({})).toBe('Price on request');
      expect(formatListingMonthlyPrice({ startPrice: 0 })).toBe('Price on request');
      expect(formatListingMonthlyPrice({ startPrice: -500 })).toBe('Price on request');
    });

    it('prioritizes base pricing package rate over startPrice when valid', () => {
      const listing = {
        startPrice: 1000, // 30,000 monthly
        pricingPackages: [
          { isBase: true, rate: 85000, durationDays: 30 },
          { isBase: false, rate: 200000, durationDays: 90 },
        ],
      };
      expect(formatListingMonthlyPrice(listing)).toBe('₹85,000');
    });

    it('falls back to startPrice if base pricing package has durationDays <= 0 or missing rate', () => {
      const listing = {
        startPrice: 2000, // 60,000 monthly
        pricingPackages: [{ isBase: true, rate: 85000, durationDays: 0 }],
      };
      expect(formatListingMonthlyPrice(listing)).toBe('₹60,000');
    });

    it('handles numeric string startPrice correctly', () => {
      const listing = { startPrice: '1500' }; // 45,000 monthly
      expect(formatListingMonthlyPrice(listing)).toBe('₹45,000');
    });

    it('formats boundary near 1 Lakh correctly by rounding first', () => {
      // 99,999.6 rounds to 100,000 -> should format as ₹1L (not ₹100,000 or ₹1.0L)
      const listing = { startPrice: 99999.6 / 30 };
      expect(formatListingMonthlyPrice(listing)).toBe('₹1L');
    });

    it('formats Lakhs and strips trailing .0', () => {
      // 5,96,000 /month -> 5.96L -> rounds to 6.0L -> strips to ₹6L
      const listing1 = { startPrice: 596000 / 30 };
      expect(formatListingMonthlyPrice(listing1)).toBe('₹6L');

      // 5,80,000 /month -> 5.8L
      const listing2 = { startPrice: 580000 / 30 };
      expect(formatListingMonthlyPrice(listing2)).toBe('₹5.8L');
    });

    it('promotes 99,96,000 to 1Cr (since 99.96L rounds to 100L = 1Cr)', () => {
      const listing = { startPrice: 9996000 / 30 };
      expect(formatListingMonthlyPrice(listing)).toBe('₹1Cr');
    });

    it('keeps 99,94,000 as 99.9L', () => {
      const listing = { startPrice: 9994000 / 30 };
      expect(formatListingMonthlyPrice(listing)).toBe('₹99.9L');
    });

    it('formats exactly 10Cr without trimming 10 into 1', () => {
      // 10,00,00,000 / month = 10 Crore -> ₹10Cr
      const listing = { startPrice: 100000000 / 30 };
      expect(formatListingMonthlyPrice(listing)).toBe('₹10Cr');
    });

    it('formats 1.05Cr with two decimals', () => {
      // 1,05,00,000 / month = 1.05 Crore -> ₹1.05Cr
      const listing = { startPrice: 10500000 / 30 };
      expect(formatListingMonthlyPrice(listing)).toBe('₹1.05Cr');
    });
  });

  describe('getListingStatusBadge', () => {
    it('returns Available for ACTIVE and AVAILABLE', () => {
      expect(getListingStatusBadge('ACTIVE')).toEqual({
        label: 'Available',
        className: 'chip-available',
      });
      expect(getListingStatusBadge('available')).toEqual({
        label: 'Available',
        className: 'chip-available',
      });
    });

    it('returns Booked for BOOKED', () => {
      expect(getListingStatusBadge('BOOKED')).toEqual({
        label: 'Booked',
        className: 'chip-booked',
      });
    });

    it('returns Under Review for PENDING_APPROVAL and PENDING_VERIFICATION', () => {
      expect(getListingStatusBadge('PENDING_APPROVAL')).toEqual({
        label: 'Under Review',
        className: 'chip-pending',
      });
      expect(getListingStatusBadge('UNDER_REVIEW')).toEqual({
        label: 'Under Review',
        className: 'chip-pending',
      });
    });

    it('returns Draft with neutral chip-draft class', () => {
      expect(getListingStatusBadge('DRAFT')).toEqual({
        label: 'Draft',
        className: 'chip-draft',
      });
    });

    it('returns Unavailable for SUSPENDED and REJECTED', () => {
      expect(getListingStatusBadge('SUSPENDED')).toEqual({
        label: 'Unavailable',
        className: 'chip-declined',
      });
      expect(getListingStatusBadge('REJECTED')).toEqual({
        label: 'Unavailable',
        className: 'chip-declined',
      });
    });

    it('replaces underscores and title-cases unknown statuses', () => {
      expect(getListingStatusBadge('ON_HOLD')).toEqual({
        label: 'On Hold',
        className: 'chip-neutral',
      });
      expect(getListingStatusBadge('ARCHIVED_TEMP')).toEqual({
        label: 'Archived Temp',
        className: 'chip-neutral',
      });
    });

    it('returns Unknown for null or undefined', () => {
      expect(getListingStatusBadge(null)).toEqual({
        label: 'Unknown',
        className: 'chip-neutral',
      });
      expect(getListingStatusBadge(undefined)).toEqual({
        label: 'Unknown',
        className: 'chip-neutral',
      });
    });
  });
});
