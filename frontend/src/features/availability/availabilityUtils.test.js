import { describe, it, expect } from 'vitest';
import {
  formatDateKey,
  parseDateParts,
  addDays,
  isBefore,
  daysBetweenInclusive,
  blocksToDayStatusMap,
  dayStatusMapToRanges,
  extractRetryAfterSeconds,
} from './availabilityUtils';

describe('availabilityUtils', () => {
  describe('formatDateKey & parseDateParts', () => {
    it('formats year, 0-indexed month, and day with zero-padding', () => {
      expect(formatDateKey(2026, 0, 5)).toBe('2026-01-05');
      expect(formatDateKey(2026, 10, 15)).toBe('2026-11-15');
    });

    it('parses YYYY-MM-DD into numeric year, 0-indexed month, and day', () => {
      expect(parseDateParts('2026-01-05')).toEqual({ year: 2026, month: 0, day: 5 });
      expect(parseDateParts('2026-11-15')).toEqual({ year: 2026, month: 10, day: 15 });
      expect(parseDateParts(null)).toBeNull();
      expect(parseDateParts('')).toBeNull();
    });
  });

  describe('addDays & daysBetweenInclusive', () => {
    it('adds days across months and leap years correctly', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('computes inclusive day count', () => {
      expect(daysBetweenInclusive('2026-11-01', '2026-11-01')).toBe(1);
      expect(daysBetweenInclusive('2026-11-01', '2026-11-10')).toBe(10);
      expect(daysBetweenInclusive('', '2026-11-10')).toBe(0);
    });
  });

  describe('isBefore', () => {
    it('compares dates lexicographically without client timezone drift', () => {
      expect(isBefore('2026-11-05', '2026-11-06')).toBe(true);
      expect(isBefore('2026-11-06', '2026-11-06')).toBe(false);
      expect(isBefore('2026-11-07', '2026-11-06')).toBe(false);
    });
  });

  describe('blocksToDayStatusMap', () => {
    it('maps OWNER_BLOCKED, CONFIRMED_BOOKING, and BOOKING_HOLD to day statuses', () => {
      const blocks = [
        { startDate: '2026-11-01', endDate: '2026-11-03', blockType: 'OWNER_BLOCKED' },
        { startDate: '2026-11-05', endDate: '2026-11-06', blockType: 'CONFIRMED_BOOKING' },
        { startDate: '2026-11-10', endDate: '2026-11-10', blockType: 'BOOKING_HOLD' },
      ];

      const { statusMap, confirmedDates, holdDates } = blocksToDayStatusMap(blocks);

      expect(statusMap['2026-11-01']).toBe('blocked');
      expect(statusMap['2026-11-02']).toBe('blocked');
      expect(statusMap['2026-11-03']).toBe('blocked');
      expect(statusMap['2026-11-04']).toBeUndefined();

      expect(statusMap['2026-11-05']).toBe('booked');
      expect(statusMap['2026-11-06']).toBe('booked');
      expect(confirmedDates.has('2026-11-05')).toBe(true);
      expect(confirmedDates.has('2026-11-06')).toBe(true);
      expect(confirmedDates.has('2026-11-01')).toBe(false);

      expect(statusMap['2026-11-10']).toBe('hold');
      expect(holdDates.has('2026-11-10')).toBe(true);
    });
  });

  describe('dayStatusMapToRanges', () => {
    it('groups contiguous blocked days into sorted intervals', () => {
      const dayStatusMap = {
        '2026-11-01': 'blocked',
        '2026-11-02': 'blocked',
        '2026-11-03': 'blocked',
        '2026-11-07': 'blocked',
        '2026-11-08': 'blocked',
        '2026-11-15': 'blocked',
      };

      const ranges = dayStatusMapToRanges(dayStatusMap);
      expect(ranges).toEqual([
        { startDate: '2026-11-01', endDate: '2026-11-03' },
        { startDate: '2026-11-07', endDate: '2026-11-08' },
        { startDate: '2026-11-15', endDate: '2026-11-15' },
      ]);
    });

    it('strips confirmed booking dates from owner ranges (read-only protection)', () => {
      const dayStatusMap = {
        '2026-11-01': 'blocked',
        '2026-11-02': 'blocked',
        '2026-11-03': 'booked',
        '2026-11-04': 'blocked',
      };
      const confirmedDates = new Set(['2026-11-03']);

      const ranges = dayStatusMapToRanges(dayStatusMap, confirmedDates);
      expect(ranges).toEqual([
        { startDate: '2026-11-01', endDate: '2026-11-02' },
        { startDate: '2026-11-04', endDate: '2026-11-04' },
      ]);
    });

    it('preserves non-confirmed dates with booked or blocked status as owner ranges', () => {
      const dayStatusMap = {
        '2026-11-03': 'booked',
        '2026-11-04': 'booked',
        '2026-11-25': 'blocked',
      };
      const confirmedDates = new Set();
      const ranges = dayStatusMapToRanges(dayStatusMap, confirmedDates);
      expect(ranges).toEqual([
        { startDate: '2026-11-03', endDate: '2026-11-04' },
        { startDate: '2026-11-25', endDate: '2026-11-25' },
      ]);
    });

    it('returns empty array when no dates are blocked', () => {
      expect(dayStatusMapToRanges({})).toEqual([]);
    });
  });

  describe('extractRetryAfterSeconds', () => {
    it('parses Retry-After header correctly with fallback', () => {
      const errWithHeader = { response: { headers: { 'retry-after': '12' } } };
      expect(extractRetryAfterSeconds(errWithHeader)).toBe(12);

      const errInvalid = { response: { headers: { 'retry-after': 'invalid' } } };
      expect(extractRetryAfterSeconds(errInvalid, 5)).toBe(5);

      const errNone = {};
      expect(extractRetryAfterSeconds(errNone, 5)).toBe(5);
    });
  });
});
