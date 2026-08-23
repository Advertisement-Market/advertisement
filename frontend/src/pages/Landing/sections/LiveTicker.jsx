import { cn } from '@/lib/cn';
import { TICKER_ITEMS } from '@/data/landing';

/** Infinite marquee of live activity. Items are rendered twice for a seamless loop. */
export function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="live-ticker">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span className="ticker-item" key={i}>
            <span className={cn('t-tag', `t-${item.tag}`)}>{item.tagLabel}</span>{' '}
            <strong>{item.title}</strong> · {item.city} <span className="ticker-dot" /> {item.note}
          </span>
        ))}
      </div>
    </div>
  );
}
