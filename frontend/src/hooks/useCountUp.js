import { useEffect, useState } from 'react';

/**
 * Counts from 0 up to `target` over `duration` ms once `active` becomes true.
 * Mirrors the animateCounters() routine in index.html (1400ms ramp).
 *
 * @param {number} target
 * @param {{ active?: boolean, duration?: number }} [options]
 * @returns {number} current value (integer)
 */
export function useCountUp(target, { active = true, duration = 1400 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}
