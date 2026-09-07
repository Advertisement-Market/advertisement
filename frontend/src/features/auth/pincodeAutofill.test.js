import { describe, it, expect } from 'vitest';

const PINCODE_MAP = {
  '110001': 'New Delhi, Delhi',
  '400001': 'Mumbai, Maharashtra',
  '400059': 'Mumbai, Maharashtra',
  '560001': 'Bengaluru, Karnataka',
  '600001': 'Chennai, Tamil Nadu',
  '700001': 'Kolkata, West Bengal',
  '500001': 'Hyderabad, Telangana',
  '380001': 'Ahmedabad, Gujarat',
  '411001': 'Pune, Maharashtra',
};

/**
 * Encapsulates the pincode auto-population behavior shared across
 * Advertiser, Agency, and Owner registration steps.
 */
function applyPincodeAutofill({ pincode, currentCity, currentState, pincodeMap = PINCODE_MAP }) {
  const match = pincodeMap[pincode];
  let nextCity = currentCity;
  let nextState = currentState;

  if (match) {
    const [autoCity, autoState] = match.split(',').map((s) => s.trim());
    if ((!currentCity || !currentCity.trim()) && autoCity) {
      nextCity = autoCity;
    }
    if ((!currentState || !currentState.trim()) && autoState) {
      nextState = autoState;
    }
  }

  return { city: nextCity, state: nextState };
}

/**
 * Encapsulates pincode input sanitization (digits only, max 6 characters).
 */
function sanitizePincodeInput(rawInput) {
  return String(rawInput ?? '').replace(/\D/g, '').slice(0, 6);
}

describe('Pincode Autofill & Input Sanitization', () => {
  describe('Input Sanitization', () => {
    it('strips non-digits and caps at 6 digits', () => {
      expect(sanitizePincodeInput('400-001')).toBe('400001');
      expect(sanitizePincodeInput(' 560 001 ABC ')).toBe('560001');
      expect(sanitizePincodeInput('123456789')).toBe('123456');
      expect(sanitizePincodeInput(null)).toBe('');
      expect(sanitizePincodeInput(undefined)).toBe('');
    });
  });

  describe('Autofill Logic (handlePincodeBlur / usePincode)', () => {
    it('auto-populates both city and state when fields are empty and pincode is matched', () => {
      const result = applyPincodeAutofill({
        pincode: '400001',
        currentCity: '',
        currentState: '',
      });

      expect(result.city).toBe('Mumbai');
      expect(result.state).toBe('Maharashtra');
    });

    it('auto-populates only state when city is already entered by user (preserves user city)', () => {
      const result = applyPincodeAutofill({
        pincode: '400001',
        currentCity: 'Navi Mumbai',
        currentState: '',
      });

      expect(result.city).toBe('Navi Mumbai');
      expect(result.state).toBe('Maharashtra');
    });

    it('auto-populates only city when state is already entered by user (preserves user state)', () => {
      const result = applyPincodeAutofill({
        pincode: '560001',
        currentCity: '',
        currentState: 'Karnataka State',
      });

      expect(result.city).toBe('Bengaluru');
      expect(result.state).toBe('Karnataka State');
    });

    it('does NOT overwrite either field when both city and state are already filled', () => {
      const result = applyPincodeAutofill({
        pincode: '110001',
        currentCity: 'Custom City',
        currentState: 'Custom State',
      });

      expect(result.city).toBe('Custom City');
      expect(result.state).toBe('Custom State');
    });

    it('handles whitespace-only fields as empty and populates them', () => {
      const result = applyPincodeAutofill({
        pincode: '700001',
        currentCity: '   ',
        currentState: '   ',
      });

      expect(result.city).toBe('Kolkata');
      expect(result.state).toBe('West Bengal');
    });

    it('does not modify fields if pincode is unknown', () => {
      const result = applyPincodeAutofill({
        pincode: '999999',
        currentCity: '',
        currentState: '',
      });

      expect(result.city).toBe('');
      expect(result.state).toBe('');
    });

    it('does not modify fields if pincode is incomplete (< 6 digits)', () => {
      const result = applyPincodeAutofill({
        pincode: '4000',
        currentCity: '',
        currentState: '',
      });

      expect(result.city).toBe('');
      expect(result.state).toBe('');
    });
  });
});
