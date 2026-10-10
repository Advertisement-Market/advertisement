import { describe, it, expect } from 'vitest';
import { sanitizePincode, isValidPincode, parsePincodeResponse } from './pincodeLookup';

describe('pincodeLookup', () => {
  describe('sanitizePincode', () => {
    it('keeps digits only and caps at 6 characters', () => {
      expect(sanitizePincode('400-053')).toBe('400053');
      expect(sanitizePincode(' 560 001 ABC ')).toBe('560001');
      expect(sanitizePincode('123456789')).toBe('123456');
      expect(sanitizePincode(null)).toBe('');
      expect(sanitizePincode(undefined)).toBe('');
    });
  });

  describe('isValidPincode', () => {
    it('accepts a 6-digit PIN whose first digit is 1-9', () => {
      expect(isValidPincode('400053')).toBe(true);
      expect(isValidPincode('012345')).toBe(false);
      expect(isValidPincode('4000')).toBe(false);
      expect(isValidPincode('')).toBe(false);
    });
  });

  describe('parsePincodeResponse', () => {
    const success = [
      {
        Status: 'Success',
        PostOffice: [
          { Name: 'Tardeo', District: 'Mumbai', State: 'Maharashtra' },
          { Name: 'Grant Road', District: 'Mumbai', State: 'Maharashtra' },
          { Name: 'Tardeo', District: 'Mumbai', State: 'Maharashtra' }, // duplicate
        ],
      },
    ];

    it('extracts city/state and a de-duplicated, sorted list of localities', () => {
      const r = parsePincodeResponse(success);
      expect(r.ok).toBe(true);
      expect(r.city).toBe('Mumbai');
      expect(r.state).toBe('Maharashtra');
      expect(r.areas).toEqual(['Grant Road', 'Tardeo']);
    });

    it('returns ok:false for an error / no-records response', () => {
      expect(parsePincodeResponse([{ Status: 'Error', PostOffice: null }]).ok).toBe(false);
      expect(parsePincodeResponse([]).ok).toBe(false);
      expect(parsePincodeResponse(null).ok).toBe(false);
    });
  });
});
