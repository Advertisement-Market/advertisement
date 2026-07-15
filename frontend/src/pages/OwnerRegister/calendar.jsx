import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRegister } from '@/features/register';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const key = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Interactive availability calendar — click a start then end date to mark a booked range. */
export function AvailabilityCalendar() {
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [booked, setBooked] = useState(() => new Set());
  const [rangeStart, setRangeStart] = useState(null);

  const first = new Date(view.y, view.m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const move = (delta) => {
    setView((v) => {
      const nm = v.m + delta;
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const onDay = (d) => {
    const date = new Date(view.y, view.m, d);
    if (date < today) return;
    const k = key(view.y, view.m, d);
    if (booked.has(k) && !rangeStart) {
      setBooked((s) => {
        const next = new Set(s);
        next.delete(k);
        return next;
      });
      return;
    }
    if (!rangeStart) {
      setRangeStart(date);
    } else {
      const [a, b] = rangeStart <= date ? [rangeStart, date] : [date, rangeStart];
      setBooked((s) => {
        const next = new Set(s);
        for (let cur = new Date(a); cur <= b; cur.setDate(cur.getDate() + 1)) {
          next.add(key(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        }
        return next;
      });
      setRangeStart(null);
    }
  };

  const summary = booked.size
    ? `${booked.size} day${booked.size === 1 ? '' : 's'} marked as booked`
    : '';

  return (
    <div className="calendar-preview">
      <div className="cal-header">
        <span className="cal-month">
          {MONTHS[view.m]} {view.y}
        </span>
        <div className="cal-nav-btns">
          <button type="button" className="cal-nav-btn" onClick={() => move(-1)}>
            ←
          </button>
          <button type="button" className="cal-nav-btn" onClick={() => move(1)}>
            →
          </button>
        </div>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div className="cal-day-name" key={d}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div className="cal-day empty" key={`e${i}`} />;
          const date = new Date(view.y, view.m, d);
          const k = key(view.y, view.m, d);
          const past = date < today;
          const isBooked = booked.has(k);
          const selecting = rangeStart && rangeStart.getTime() === date.getTime();
          return (
            <div
              key={k}
              className={cn(
                'cal-day',
                past ? 'past' : isBooked ? 'booked' : 'available',
                selecting && 'selecting',
              )}
              onClick={() => onDay(d)}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <div className="cal-legend-item">
          <span
            className="cal-legend-dot"
            style={{ background: 'var(--cream-warm)', border: '1px solid var(--border-medium)' }}
          />
          Available
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-dot"
            style={{ background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.3)' }}
          />
          Booked
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: 'rgba(156,163,175,0.15)' }} />
          Past
        </div>
      </div>
      <div className="cal-summary">{summary}</div>
    </div>
  );
}

/* ── Pricing table with auto-calculated base rate + discounts ── */
const UNIT_DAYS = { days: 1, weeks: 7, months: 30, years: 365 };

function PriceRow({ defaultNum, defaultUnit, notePlaceholder, base, isBase }) {
  const [num, setNum] = useState(defaultNum);
  const [unit, setUnit] = useState(defaultUnit);
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');

  const autoRate = isBase && base ? Math.round(base) : null;
  const effRate = rate !== '' ? Number(rate) : autoRate;

  let discount = '—';
  if (isBase) discount = 'Base rate';
  else if (effRate && base && num) {
    const expected = base * ((Number(num) * UNIT_DAYS[unit]) / 30);
    if (expected > 0) {
      const pct = Math.round((1 - effRate / expected) * 100);
      if (pct > 0) discount = `${pct}% off`;
    }
  }

  return (
    <div className="pricing-table-row">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number"
          className="price-input"
          value={num}
          min="1"
          style={{ width: 54, textAlign: 'center' }}
          onChange={(e) => setNum(e.target.value)}
        />
        <select
          className="price-input"
          style={{ padding: '6px 8px', cursor: 'pointer' }}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>
      <input
        type="number"
        className="price-input"
        placeholder={isBase ? 'auto' : ''}
        value={rate === '' && autoRate ? autoRate : rate}
        onChange={(e) => setRate(e.target.value)}
      />
      <div
        className="discount-badge"
        style={{ fontSize: 11.5, color: isBase ? 'var(--ink-faint)' : undefined }}
      >
        {discount}
      </div>
      <input
        type="text"
        className="price-input"
        placeholder={notePlaceholder}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

export function PricingTable() {
  const { field } = useRegister();
  const daily = Number(field('f_startPrice')) || 0;
  const base = daily * 30;
  return (
    <div className="pricing-table">
      <div className="pricing-table-header">
        <span>Duration</span>
        <span>Rate (₹)</span>
        <span>Discount vs Base</span>
        <span>Notes</span>
      </div>
      <PriceRow defaultNum="1" defaultUnit="months" notePlaceholder="Standard" base={base} isBase />
      <PriceRow defaultNum="3" defaultUnit="months" notePlaceholder="30% off" base={base} />
      <PriceRow defaultNum="6" defaultUnit="months" notePlaceholder="Best value" base={base} />
      <PriceRow defaultNum="9" defaultUnit="months" notePlaceholder="" base={base} />
      <PriceRow defaultNum="12" defaultUnit="months" notePlaceholder="" base={base} />
    </div>
  );
}

/* ── Map pin verification (static placeholder → reveals coords) ── */
export function MapPin() {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <div
        style={{
          width: '100%',
          height: 320,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border-strong)',
          background: '#e8f0e0',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'linear-gradient(135deg,#e0f2fe 0%,#f0fdf4 100%)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--teal)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
            {loaded
              ? 'Drag the pin to adjust the exact location'
              : 'Map loads after you enter your billboard pincode (Step 3)'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            {loaded
              ? 'Demo map — pin set at pincode centre'
              : 'Enter pincode on the previous step to activate the map'}
          </div>
          {!loaded && (
            <button
              type="button"
              onClick={() => setLoaded(true)}
              style={{
                marginTop: 6,
                background: 'var(--teal)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '9px 20px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Load Map Now
            </button>
          )}
        </div>
      </div>
      {loaded && (
        <div
          style={{
            marginTop: 10,
            padding: '9px 13px',
            background: 'var(--green-light)',
            border: '1px solid rgba(5,150,105,0.2)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--green)',
            fontWeight: 500,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ verticalAlign: -2, marginRight: 4 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Pin set · 19.1197° N, 72.8464° E</span>
        </div>
      )}
    </>
  );
}
