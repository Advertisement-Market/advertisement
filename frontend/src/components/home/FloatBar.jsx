import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Floating nudge bar that appears after the reader scrolls ~25% down the page
 * and can be dismissed. Content is provided as children; actions are rendered
 * to the right.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.text
 * @param {import('react').ReactNode} props.actions
 */
export function FloatBar({ text, actions }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return undefined;
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      setVisible(pct > 0.25);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className={cn('float-bar', visible && 'visible')}>
      <span className="float-bar-text">{text}</span>
      <div className="float-bar-divider" />
      <div className="float-bar-actions">{actions}</div>
      <button className="float-bar-close" onClick={() => setDismissed(true)} title="Dismiss">
        ×
      </button>
    </div>
  );
}
