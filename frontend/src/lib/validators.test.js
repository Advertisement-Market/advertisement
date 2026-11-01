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
  cleanText,
  stripHtmlTags,
  sanitizeText,
} from './validators';
import sharedFixtures from '../../../backend/src/test/resources/fixtures/sanitization-fixtures.json';

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

  it('strips leading and trailing whitespace and invisible Unicode characters with cleanText', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
    expect(cleanText('')).toBe('');
    expect(cleanText('   ')).toBe('');
    expect(cleanText('\u200B')).toBe('');
    expect(cleanText('  560001  ')).toBe('560001');
    expect(cleanText('560001\u200B')).toBe('560001');
    expect(cleanText('\u200B560001\u200B')).toBe('560001');
    expect(cleanText(' \u00A0\u200C Special Landmark \u200D\uFEFF ')).toBe('Special Landmark');
  });

  describe('HTML Tag Stripping and Sanitization', () => {
    it('strips HTML tags and handles null/undefined with stripHtmlTags', () => {
      expect(stripHtmlTags(null)).toBe('');
      expect(stripHtmlTags(undefined)).toBe('');
      expect(stripHtmlTags('<b>Bold</b>')).toBe('Bold');
    });

    it('executes all shared test fixtures with expected outputs', () => {
      for (const fixture of sharedFixtures) {
        const actual = sanitizeText(fixture.input);
        expect(actual, `Fixture failed: ${fixture.name}`).toBe(fixture.expected);
      }
    });

    it('enforces idempotency: sanitizeText(sanitizeText(x)) === sanitizeText(x)', () => {
      const samples = [
        '<<script>script>alert(1)</script>',
        '<img src=x onerror=alert(1) Main Road',
        '   \u200B<b>Hello World</b>\uFEFF  ',
        '10% off for > 3 months',
        'Clearance < 15 ft',
      ];
      for (const sample of samples) {
        const pass1 = sanitizeText(sample);
        const pass2 = sanitizeText(pass1);
        expect(pass2).toBe(pass1);
      }
    });

    it('satisfies invariant: output never contains < followed by a letter, /, or ! (property fuzz test)', () => {
      const tagStarts = ['a', 'div', 'SCRIPT', 'img', 'svg', 'iframe', '/', '!doctype', '!--'];
      const payloads = [
        '<b>bold</b>',
        '<script>alert(1)</script>',
        '<<<nested>>>',
        '<img src=x onerror=alert(1)',
        'text <a href="test">link</a> more',
        '10% off for > 3 months and < 5 days',
      ];

      // Fuzz with synthetic permutations of tag starts, brackets, and random characters
      const fuzzed = [...payloads];
      for (let i = 0; i < 50; i++) {
        const tag = tagStarts[i % tagStarts.length];
        fuzzed.push(`<${tag}>content<${tag}/>`);
        fuzzed.push(`prefix <${tag} attr="val" dangling`);
        fuzzed.push(`<<<${tag}>>nested`);
      }

      const INVARIANT_VIOLATION = /<[a-zA-Z/!]/;
      for (const input of fuzzed) {
        const sanitized = sanitizeText(input);
        expect(
          INVARIANT_VIOLATION.test(sanitized),
          `Invariant violated for input: "${input}" -> got "${sanitized}"`,
        ).toBe(false);
      }
    });
  });
});
