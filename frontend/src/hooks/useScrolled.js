import { useEffect, useState } from 'react';

/**
 * Returns true once the window has scrolled past `threshold` pixels.
 * Replaces the vanilla `scroll` listener that toggled `.scrolled` on the nav.
 *
 * @param {number} [threshold=40]
 * @returns {boolean}
 */
export function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > threshold : false,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
