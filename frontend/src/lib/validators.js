/**
 * Reusable field validators. Each validator is a function `(value) => string|null`
 * that returns an error message when invalid, or `null` when valid. Format
 * validators pass on empty values so they compose with `required()` — i.e. a
 * field is only "required" if you add `required()`.
 */

export const MSG = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  phone: 'Enter a valid 10-digit mobile number.',
  number: 'Enter a valid number.',
  url: 'Enter a valid URL (https://…).',
  pincode: 'Enter a valid 6-digit PIN code.',
  gst: 'Enter a valid 15-character GSTIN.',
  pan: 'Enter a valid PAN (e.g. AAAAA0000A).',
};

const isEmpty = (v) => v == null || String(v).trim() === '';

export const required =
  (msg = MSG.required) =>
  (v) =>
    isEmpty(v) ? msg : null;

export const email =
  (msg = MSG.email) =>
  (v) =>
    isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? null : msg;

export const phone =
  (msg = MSG.phone) =>
  (v) =>
    isEmpty(v) || String(v).replace(/\D/g, '').length === 10 ? null : msg;

export const number =
  (msg = MSG.number) =>
  (v) =>
    isEmpty(v) || !Number.isNaN(Number(v)) ? null : msg;

export const url =
  (msg = MSG.url) =>
  (v) =>
    isEmpty(v) || /^https?:\/\/[^\s.]+\.[^\s]+$/.test(String(v).trim()) ? null : msg;

export const pincode =
  (msg = MSG.pincode) =>
  (v) =>
    isEmpty(v) || /^\d{6}$/.test(String(v).trim()) ? null : msg;

const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const gst =
  (msg = MSG.gst) =>
  (v) =>
    isEmpty(v) || GST_RE.test(String(v).trim().toUpperCase()) ? null : msg;

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const pan =
  (msg = MSG.pan) =>
  (v) =>
    isEmpty(v) || PAN_RE.test(String(v).trim().toUpperCase()) ? null : msg;

export const minLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).length >= n ? null : msg || `Must be at least ${n} characters.`;

export const maxLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).length <= n ? null : msg || `Must be at most ${n} characters.`;

export const range = (min, max, msg) => (v) => {
  if (isEmpty(v)) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return MSG.number;
  return n >= min && n <= max ? null : msg || `Enter a value between ${min} and ${max}.`;
};

/** Runs validators in order and returns the first error, or null. */
export function runValidators(value, validators = []) {
  for (const validate of validators) {
    const error = validate(value);
    if (error) return error;
  }
  return null;
}

/**
 * Default validators inferred from an input `type` (plus optional min/max for
 * numbers). Combine with `required()` for required fields.
 */
export function validatorsForType(type, { min, max } = {}) {
  switch (type) {
    case 'email':
      return [email()];
    case 'tel':
      return [phone()];
    case 'url':
      return [url()];
    case 'number':
      return min != null || max != null
        ? [range(min ?? Number.NEGATIVE_INFINITY, max ?? Number.POSITIVE_INFINITY)]
        : [number()];
    default:
      return [];
  }
}
