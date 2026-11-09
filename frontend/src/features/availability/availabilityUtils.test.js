import { describe, it, expect } from 'vitest';
import {
  MAX_RETRY_AFTER_SECONDS,
  isValidDateKey,
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
  describe('isValidDateKey, formatDateKey & parseDateParts', () => {
    it('validates real ISO calendar dates and rejects invalid ones', () => {
      expect(isValidDateKey('2026-11-15')).toBe(true);
      expect(isValidDateKey('2024-02-29')).toBe(true);
      expect(isValidDateKey('2026-02-29')).toBe(false);
      expect(isValidDateKey('2026-02-30')).toBe(false);
      expect(isValidDateKey('2026-13-01')).toBe(false);
      expect(isValidDateKey('not-a-date')).toBe(false);
      expect(isValidDateKey(null)).toBe(false);
    });

    it('formats year, 0-indexed month, and day with zero-padding', () => {
      expect(formatDateKey(2026, 0, 5)).toBe('2026-01-05');
      expect(formatDateKey(2026, 10, 15)).toBe('2026-11-15');
    });

    it('parses YYYY-MM-DD into numeric year, 0-indexed month, and day', () => {
      expect(parseDateParts('2026-01-05')).toEqual({ year: 2026, month: 0, day: 5 });
      expect(parseDateParts('2026-11-15')).toEqual({ year: 2026, month: 10, day: 15 });
      expect(parseDateParts('2026-02-30')).toBeNull();
      expect(parseDateParts(null)).toBeNull();
      expect(parseDateParts('')).toBeNull();
    });
  });

  describe('addDays & daysBetweenInclusive', () => {
    it('adds days across months and leap years correctly', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('invalid-date', 1)).toBeNull();
      expect(addDays('2026-11-01', Number.NaN)).toBeNull();
    });

    it('computes inclusive day count and returns 0 on invalid input', () => {
      expect(daysBetweenInclusive('2026-11-01', '2026-11-01')).toBe(1);
      expect(daysBetweenInclusive('2026-11-01', '2026-11-10')).toBe(10);
      expect(daysBetweenInclusive('', '2026-11-10')).toBe(0);
      expect(daysBetweenInclusive('2026-02-30', '2026-03-05')).toBe(0);
    });
  });

  describe('isBefore', () => {
    it('compares valid dates lexicographically without client timezone drift', () => {
      expect(isBefore('2026-11-05', '2026-11-06')).toBe(true);
      expect(isBefore('2026-11-06', '2026-11-06')).toBe(false);
      expect(isBefore('2026-11-07', '2026-11-06')).toBe(false);
      expect(isBefore('invalid', '2026-11-06')).toBe(false);
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

    it('enforces precedence booked > hold > blocked and ignores malformed or reversed blocks', () => {
      const blocks = [
        { startDate: '2026-11-05', endDate: '2026-11-05', blockType: 'CONFIRMED_BOOKING' },
        { startDate: '2026-11-05', endDate: '2026-11-07', blockType: 'BOOKING_HOLD' },
        { startDate: '2026-11-05', endDate: '2026-11-08', blockType: 'OWNER_BLOCKED' },
        { startDate: '2026-11-20', endDate: '2026-11-10', blockType: 'OWNER_BLOCKED' },
        { startDate: '2026-02-30', endDate: '2026-03-02', blockType: 'OWNER_BLOCKED' },
      ];

      const { statusMap, confirmedDates, holdDates } = blocksToDayStatusMap(blocks);

      expect(statusMap['2026-11-05']).toBe('booked');
      expect(confirmedDates.has('2026-11-05')).toBe(true);
      expect(holdDates.has('2026-11-05')).toBe(false);

      expect(statusMap['2026-11-06']).toBe('hold');
      expect(holdDates.has('2026-11-06')).toBe(true);

      expect(statusMap['2026-11-08']).toBe('blocked');
      expect(statusMap['2026-11-20']).toBeUndefined();
      expect(statusMap['2026-03-01']).toBeUndefined();
    });

    it('caps single pathological multi-millennium span without hanging', () => {
      const blocks = [
        { startDate: '2026-01-01', endDate: '9999-12-31', blockType: 'OWNER_BLOCKED' },
      ];

      const { statusMap } = blocksToDayStatusMap(blocks);
      expect(Object.keys(statusMap).length).toBeLessThanOrEqual(3650);
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

    it('strips confirmed booking dates and hold dates from owner ranges (read-only protection)', () => {
      const dayStatusMap = {
        '2026-11-01': 'blocked',
        '2026-11-02': 'blocked',
        '2026-11-03': 'booked',
        '2026-11-04': 'blocked',
        '2026-11-05': 'hold',
      };
      const confirmedDates = new Set(['2026-11-03']);
      const holdDates = new Set(['2026-11-04', '2026-11-05']);

      const ranges = dayStatusMapToRanges(dayStatusMap, confirmedDates, holdDates);
      expect(ranges).toEqual([{ startDate: '2026-11-01', endDate: '2026-11-02' }]);
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
    it('parses strictly numeric Retry-After header correctly with clamping and fallback', () => {
      const errWithHeader = { response: { headers: { 'retry-after': '12' } } };
      expect(extractRetryAfterSeconds(errWithHeader)).toBe(12);

      const errTooLarge = { response: { headers: { 'retry-after': '99999' } } };
      expect(extractRetryAfterSeconds(errTooLarge)).toBe(MAX_RETRY_AFTER_SECONDS);

      const errPartialInvalid = { response: { headers: { 'retry-after': '12abc' } } };
      expect(extractRetryAfterSeconds(errPartialInvalid, 5)).toBe(5);

      const errInvalid = { response: { headers: { 'retry-after': 'invalid' } } };
      expect(extractRetryAfterSeconds(errInvalid, 5)).toBe(5);

      const errNone = {};
      expect(extractRetryAfterSeconds(errNone, 5)).toBe(5);
    });
  });
});
