import { describe, it, expect, vi } from 'vitest';
import { TYPE_OPTIONS as WIZARD_TYPE_OPTIONS } from './steps';
import { TYPE_OPTIONS as REGISTER_TYPE_OPTIONS } from '../OwnerRegister/steps';
import { validate } from './NewBillboardListing';

/**
 * Cross-stack canonical parity code list.
 * Mirrors backend enum constants in com.theadbasket.backend.lov.BillboardType,
 * verified on the backend by LovServiceTest.frontendCanonicalCodes_matchBillboardTypeEnumExactValueOf().
 * Keep these lists in exact synchronization.
 */
const BACKEND_CANONICAL_CODES = [
  'STATIC_HOARDING',
  'LED_DIGITAL',
  'UNIPOLE',
  'GANTRY',
  'BUS_SHELTER',
  'KIOSK',
  'DIGITAL_SCREEN',
  'OTHER',
];

describe('NewBillboardListing - Canonical Codes & Step 1 Validation', () => {
  describe('TYPE_OPTIONS Parity with Backend Enum', () => {
    it('ensures every option in wizard TYPE_OPTIONS has code and label', () => {
      expect(WIZARD_TYPE_OPTIONS.length).toBe(BACKEND_CANONICAL_CODES.length);
      WIZARD_TYPE_OPTIONS.forEach((opt) => {
        expect(opt.code).toBeDefined();
        expect(typeof opt.code).toBe('string');
        expect(opt.label).toBeDefined();
      });
      const wizardCodes = WIZARD_TYPE_OPTIONS.map((opt) => opt.code);
      expect(wizardCodes).toEqual(BACKEND_CANONICAL_CODES);
    });

    it('ensures OwnerRegister TYPE_OPTIONS matches wizard TYPE_OPTIONS canonical codes', () => {
      expect(REGISTER_TYPE_OPTIONS.length).toBe(BACKEND_CANONICAL_CODES.length);
      const registerCodes = REGISTER_TYPE_OPTIONS.map((opt) => opt.code);
      expect(registerCodes).toEqual(BACKEND_CANONICAL_CODES);
    });
  });

  describe('Wizard Step 1 Validation for Other Companion Text', () => {
    const validBaseData = {
      f_bbName: 'Prime Highway Billboard',
      f_bbAddr: '12 Express Way',
      f_bbCity: 'Mumbai',
      f_bbState: 'Maharashtra',
      f_bbPin: '400001',
      f_bbType: 'STATIC_HOARDING',
      f_bbWidth: '40',
      f_bbHeight: '20',
      f_facing: 'North',
      f_trafficType: 'Vehicular',
      f_audience: 'Commuters',
    };

    it('passes validation when all standard fields are present without Other', () => {
      const showToast = vi.fn();
      const isValid = validate(1, { data: validBaseData, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_bbType is OTHER but f_bbTypeOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_bbType: 'OTHER', f_bbTypeOther: '' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the billboard type.', 'error');
    });

    it('allows step 1 advance when f_bbType is OTHER and f_bbTypeOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_bbType: 'OTHER', f_bbTypeOther: 'Skywalk Hoarding' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_trafficType is other but f_trafficOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_trafficType: 'other', f_trafficOther: '   ' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the traffic type.', 'error');
    });

    it('allows step 1 advance when f_trafficType is other and f_trafficOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_trafficType: 'other', f_trafficOther: 'Port Corridor' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_audience is other but f_audienceOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_audience: 'other', f_audienceOther: '' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the audience type.', 'error');
    });

    it('allows step 1 advance when f_audience is other and f_audienceOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_audience: 'other', f_audienceOther: 'Cruise passengers' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });
  });
});
