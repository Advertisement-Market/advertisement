/**
 * India Post PIN-code lookup (frontend-direct).
 *
 * The public, key-less India Post API classifies a 6-digit PIN into its Post Offices
 * (localities/areas) along with District and State:
 *   https://api.postalpincode.in/pincode/<PIN>
 *
 * Pure helpers (`sanitizePincode`, `parsePincodeResponse`) are unit-tested; `fetchPincode`
 * wraps them around the network call.
 */

export const INDIA_POST_URL = 'https://api.postalpincode.in/pincode/';

/** Keep only digits, capped at 6 characters. */
export function sanitizePincode(raw) {
  if (raw == null) return '';
  return String(raw).replace(/\D/g, '').slice(0, 6);
}

/** True for a well-formed 6-digit Indian PIN (first digit 1-9). */
export function isValidPincode(pin) {
  return /^[1-9][0-9]{5}$/.test(pin || '');
}

/**
 * Normalize the India Post API payload into `{ ok, city, state, areas }`.
 * `areas` is the de-duplicated, sorted list of Post Office (locality) names.
 */
export function parsePincodeResponse(payload) {
  const entry = Array.isArray(payload) ? payload[0] : null;
  const offices =
    entry && entry.Status === 'Success' && Array.isArray(entry.PostOffice) ? entry.PostOffice : [];
  if (!offices.length) {
    return { ok: false, city: '', state: '', areas: [] };
  }
  const first = offices[0];
  // India Post names often carry trailing spaces (e.g. "Bangalore "); trim before de-duplicating
  // so whitespace variants collapse and the dropdown shows no stray spaces.
  const areas = [
    ...new Set(offices.map((o) => (o.Name ? String(o.Name).trim() : '')).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  return {
    ok: true,
    city: (first.District || '').trim(),
    state: (first.State || '').trim(),
    areas,
  };
}

/**
 * Look up a PIN via India Post. Returns `{ ok, city, state, areas }`; `ok` is false for an
 * invalid PIN, a "no records" response, or a network/parse error (never throws).
 */
export async function fetchPincode(pin, { signal } = {}) {
  const pincode = sanitizePincode(pin);
  if (!isValidPincode(pincode)) {
    return { ok: false, city: '', state: '', areas: [] };
  }
  try {
    const res = await fetch(INDIA_POST_URL + pincode, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, city: '', state: '', areas: [] };
    const data = await res.json();
    return parsePincodeResponse(data);
  } catch {
    return { ok: false, city: '', state: '', areas: [] };
  }
}
