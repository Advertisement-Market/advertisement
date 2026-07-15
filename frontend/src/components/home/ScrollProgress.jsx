import { useEffect, useRef } from 'react';

/** Thin progress bar (`#scrollBar`) that fills as the page scrolls. */
export function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (ref.current) ref.current.style.width = `${pct}%`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div id="scrollBar" ref={ref} />;
}
