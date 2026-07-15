import { useEffect } from 'react';

/**
 * Calls `handler` when a pointerdown/touchstart occurs outside `ref`.
 * Used to close custom dropdowns (mirrors the document click listener in index.html).
 *
 * @param {import('react').RefObject<HTMLElement>} ref
 * @param {(event: Event) => void} handler
 * @param {boolean} [active=true]
 */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const listener = (event) => {
      const el = ref.current;
      if (!el || el.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);
}
