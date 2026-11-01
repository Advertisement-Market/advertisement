import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchPincode, sanitizePincode } from '@/features/auth/pincodeLookup';
import * as v from '@/lib/validators';

import { useRegister } from './RegisterContext';
import { useFieldError } from './useFieldError';

/**
 * PIN-code field hook shared across the registration and billboard-listing wizards.
 *
 * On blur of a completed 6-digit PIN it calls the live India Post classifier
 * (`features/auth/pincodeLookup`), auto-fills City and State when those fields are still
 * blank, and exposes the resolved localities so a form can offer an optional area dropdown.
 * In-flight lookups are cancelled when a newer PIN is entered, and any failure degrades to
 * manual entry (`status` tells the user, fields stay editable).
 *
 * @param {string} name        field key holding the PIN
 * @param {string} [cityField] field key to auto-fill with the resolved City (District)
 * @param {string} [stateField] field key to auto-fill with the resolved State
 * @param {string} [areaField] field key holding a selected locality; it is cleared whenever the
 *   PIN changes to one whose localities no longer include it, so a stale area is never persisted
 *   under a different city/PIN.
 */
export function usePincode(name, cityField, stateField, areaField) {
  const { field, setField } = useRegister();
  const val = field(name);
  const err = useFieldError(name, [v.required(), v.pincode()]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [areas, setAreas] = useState([]);
  const abortRef = useRef(null);
  const lastPinRef = useRef(null);

  const resetLookup = () => {
    if (abortRef.current) abortRef.current.abort();
    lastPinRef.current = null;
    setLoading(false);
    setStatus('');
    setAreas([]);
    if (areaField && field(areaField)) setField(areaField, '');
  };

  const set = (val2) => {
    const sanitized = sanitizePincode(val2);
    setField(name, sanitized);
    // A partial PIN can no longer match — drop any in-flight lookup and its stale result.
    if (sanitized.length < 6) resetLookup();
  };

  const lookup = useCallback(
    async (pin) => {
      // Skip a redundant round-trip when the already-resolved PIN hasn't changed.
      if (pin === lastPinRef.current) return;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setStatus('Looking up…');
      const r = await fetchPincode(pin, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setLoading(false);
      if (r.ok) {
        lastPinRef.current = pin;
        setAreas(r.areas);
        setStatus([r.city, r.state].filter(Boolean).join(', '));
        if (cityField && !field(cityField).trim() && r.city) setField(cityField, r.city);
        if (stateField && !field(stateField).trim() && r.state) setField(stateField, r.state);
        // Drop a previously selected locality that this PIN no longer offers.
        if (areaField && field(areaField) && !r.areas.includes(field(areaField))) {
          setField(areaField, '');
        }
      } else {
        setAreas([]);
        setStatus('PIN not found — enter details manually.');
      }
    },
    [cityField, stateField, areaField, field, setField],
  );

  // Re-hydrate the badge and locality list when the field remounts (e.g. navigating back to an
  // earlier wizard step) and the stored PIN is already a complete 6 digits, so the dropdown and
  // confirmation badge don't vanish until the user manually re-focuses the input.
  useEffect(() => {
    const pin = sanitizePincode(val);
    if (pin.length !== 6) return undefined;
    // Defer past the mount commit so the lookup's state updates don't cascade synchronously;
    // lookup() dedupes via lastPinRef so a later blur won't re-fetch.
    const id = setTimeout(() => lookup(pin), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBlur = (e) => {
    err.onBlur(e);
    const pin = sanitizePincode(val);
    if (pin.length === 6) lookup(pin);
    else resetLookup();
  };

  return { val, status, loading, areas, err, set, onBlur };
}
