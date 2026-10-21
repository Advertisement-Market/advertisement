import { describe, it, expect } from 'vitest';
import {
  required,
  email,
  phone,
  pincode,
  gst,
  minLength,
  runValidators,
  isOther,
  isBlank,
  isNotBlank,
} from './validators';

describe('Frontend Field Validators', () => {
  it('validates required fields', () => {
    const validate = required('Field is required');
    expect(validate('')).toBe('Field is required');
    expect(validate(null)).toBe('Field is required');
    expect(validate('hello')).toBeNull();
  });

  it('validates email addresses', () => {
    const validate = email();
    expect(validate('invalid-email')).toBe('Enter a valid email address.');
    expect(validate('user@example.com')).toBeNull();
    expect(validate('')).toBeNull();
  });

  it('validates 10-digit phone numbers', () => {
    const validate = phone();
    expect(validate('98765')).toBe('Enter a valid 10-digit mobile number.');
    expect(validate('9876543210')).toBeNull();
  });

  it('validates PIN code and GST', () => {
    expect(pincode()('12345')).toBe('Enter a valid 6-digit PIN code.');
    expect(pincode()('560001')).toBeNull();
    expect(gst()('27AAAAA0000A1Z5')).toBeNull();
  });

  it('runs multiple validators in chain', () => {
    const rules = [required(), minLength(3)];
    expect(runValidators('', rules)).toBe('This field is required.');
    expect(runValidators('ab', rules)).toBe('Must be at least 3 characters.');
    expect(runValidators('abc', rules)).toBeNull();
  });

  it('correctly detects other values with isOther case-insensitively', () => {
    expect(isOther('OTHER')).toBe(true);
    expect(isOther('other')).toBe(true);
    expect(isOther('  Other  ')).toBe(true);
    expect(isOther('STATIC_HOARDING')).toBe(false);
    expect(isOther(null)).toBe(false);
    expect(isOther(undefined)).toBe(false);
    expect(isOther('')).toBe(false);
  });

  it('detects blank, whitespace-only, and zero-width invisible characters with isBlank', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('\t\n\r')).toBe(true);
    expect(isBlank('\u00A0')).toBe(true); // NBSP
    expect(isBlank('\u200B')).toBe(true); // Zero-width space
    expect(isBlank('\u200C')).toBe(true); // ZWNJ
    expect(isBlank('\u200D')).toBe(true); // ZWJ
    expect(isBlank('\u2060')).toBe(true); // Word joiner
    expect(isBlank('\uFEFF')).toBe(true); // BOM
    expect(isBlank(' \u200B \u00A0 ')).toBe(true);

    expect(isBlank('Skywalk')).toBe(false);
    expect(isBlank('  Skywalk \u200B ')).toBe(false);
    expect(isNotBlank('Skywalk')).toBe(true);
    expect(isNotBlank('\u200B')).toBe(false);
  });
});
