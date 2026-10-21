import { describe, it, expect } from 'vitest';
import { DEFAULT_BILLBOARD_TYPES, resolveInitialType, formatBillboardType } from './data';

describe('OwnerDashboard Billboard Type LOV helpers', () => {
  it('DEFAULT_BILLBOARD_TYPES contains canonical enum codes and excludes legacy Skywalk', () => {
    const codes = DEFAULT_BILLBOARD_TYPES.map((t) => t.code);
    expect(codes).toEqual([
      'LED_DIGITAL',
      'STATIC_HOARDING',
      'UNIPOLE',
      'GANTRY',
      'BUS_SHELTER',
      'KIOSK',
      'DIGITAL_SCREEN',
      'OTHER',
    ]);
    expect(codes).not.toContain('Skywalk');
  });

  describe('resolveInitialType', () => {
    it('defaults to LED_DIGITAL when empty or undefined', () => {
      expect(resolveInitialType('')).toBe('LED_DIGITAL');
      expect(resolveInitialType(null)).toBe('LED_DIGITAL');
      expect(resolveInitialType(undefined)).toBe('LED_DIGITAL');
    });

    it('resolves display labels to enum codes', () => {
      expect(resolveInitialType('LED Digital')).toBe('LED_DIGITAL');
      expect(resolveInitialType('Static Hoarding')).toBe('STATIC_HOARDING');
      expect(resolveInitialType('Unipole')).toBe('UNIPOLE');
      expect(resolveInitialType('Gantry')).toBe('GANTRY');
      expect(resolveInitialType('Bus Shelter')).toBe('BUS_SHELTER');
      expect(resolveInitialType('Kiosk')).toBe('KIOSK');
      expect(resolveInitialType('Digital Screen')).toBe('DIGITAL_SCREEN');
      expect(resolveInitialType('Other')).toBe('OTHER');
    });

    it('preserves valid enum codes', () => {
      expect(resolveInitialType('STATIC_HOARDING')).toBe('STATIC_HOARDING');
      expect(resolveInitialType('LED_DIGITAL')).toBe('LED_DIGITAL');
      expect(resolveInitialType('OTHER')).toBe('OTHER');
    });

    it('maps legacy Skywalk value to OTHER', () => {
      expect(resolveInitialType('Skywalk')).toBe('OTHER');
      expect(resolveInitialType('skywalk')).toBe('OTHER');
    });
  });

  describe('formatBillboardType', () => {
    it('returns empty string for null or empty values', () => {
      expect(formatBillboardType('')).toBe('');
      expect(formatBillboardType(null)).toBe('');
    });

    it('formats enum codes to human-readable labels', () => {
      expect(formatBillboardType('LED_DIGITAL')).toBe('LED Digital');
      expect(formatBillboardType('STATIC_HOARDING')).toBe('Static Hoarding');
      expect(formatBillboardType('BUS_SHELTER')).toBe('Bus Shelter');
    });

    it('formats OTHER with optional companion text', () => {
      expect(formatBillboardType('OTHER')).toBe('Other');
      expect(formatBillboardType('OTHER', 'Skywalk')).toBe('Other (Skywalk)');
      expect(formatBillboardType('OTHER', 'Bridge Panel')).toBe('Other (Bridge Panel)');
    });

    it('returns original label if already formatted', () => {
      expect(formatBillboardType('LED Digital')).toBe('LED Digital');
    });
  });
});
