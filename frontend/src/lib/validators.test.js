import { describe, it, expect } from 'vitest';
import { required, email, phone, pincode, gst, minLength, runValidators } from './validators';

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
});
