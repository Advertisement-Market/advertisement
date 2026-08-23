import { useCallback, useState } from 'react';

/**
 * Boolean state with stable open/close/toggle helpers.
 *
 * @param {boolean} [initial=false]
 * @returns {[boolean, { toggle: () => void, open: () => void, close: () => void, set: (v: boolean) => void }]}
 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const open = useCallback(() => setValue(true), []);
  const close = useCallback(() => setValue(false), []);
  return [value, { toggle, open, close, set: setValue }];
}
