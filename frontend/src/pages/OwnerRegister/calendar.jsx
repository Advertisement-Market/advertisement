import { useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRegister } from '@/features/register';
import { RegisterContext } from '@/features/register/RegisterContext';
import {
  addDays,
  daysBetweenInclusive,
  formatDateKey,
  isBefore,
  isValidDateKey,
} from '@/features/availability/availabilityUtils';

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
const MAX_HORIZON_DAYS = 730;

/** Interactive availability calendar — click a start then end date to mark a blocked range. */
export function AvailabilityCalendar() {
  const reg = useContext(RegisterContext);
  const [localBlocked, setLocalBlocked] = useState({});
  const [rangeStart, setRangeStart] = useState(null);

  const clientTodayKey = useMemo(() => {
    const t = new Date();
    return formatDateKey(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const serverToday = reg?.field('f_availabilityServerToday');
  const todayKey = isValidDateKey(serverToday) ? serverToday : clientTodayKey;

  const [view, setView] = useState(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });

  const rawBlocked = reg ? reg.field('f_blockedDates') : localBlocked;
  const blockedMap = useMemo(() => {
    const map = {};
    if (Array.isArray(rawBlocked)) {
      for (const k of rawBlocked) {
        if (isValidDateKey(k)) map[k] = 'blocked';
      }
      return map;
    }
    if (rawBlocked && typeof rawBlocked === 'object') {
      for (const [k, v] of Object.entries(rawBlocked)) {
        if (isValidDateKey(k) && (v === 'blocked' || v === 'block' || v === 'booked')) {
          map[k] = 'blocked';
        }
      }
    }
    return map;
  }, [rawBlocked]);

  const rawLockedBooked = reg?.field('f_lockedBookedDates');
  const rawLockedHolds = reg?.field('f_lockedHoldDates');
  const lockedBookedSet = useMemo(
    () => new Set(Array.isArray(rawLockedBooked) ? rawLockedBooked.filter(isValidDateKey) : []),
    [rawLockedBooked],
  );
  const lockedHoldSet = useMemo(
    () => new Set(Array.isArray(rawLockedHolds) ? rawLockedHolds.filter(isValidDateKey) : []),
    [rawLockedHolds],
  );

  const commitBlocked = (nextMap) => {
    if (reg) {
      reg.setField('f_blockedDates', nextMap);
      reg.setField('f_availabilityDirty', true);
    } else {
      setLocalBlocked(nextMap);
    }
  };

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
    const k = formatDateKey(view.y, view.m, d);
    if (isBefore(k, todayKey)) return;
    if (lockedBookedSet.has(k) || lockedHoldSet.has(k)) {
      reg?.showToast('Confirmed bookings and active checkout holds cannot be modified.', 'info');
      return;
    }
    if (daysBetweenInclusive(todayKey, k) > MAX_HORIZON_DAYS) {
      reg?.showToast(`Cannot block dates more than ${MAX_HORIZON_DAYS} days in advance.`, 'error');
      return;
    }

    if (blockedMap[k] && !rangeStart) {
      const next = { ...blockedMap };
      delete next[k];
      commitBlocked(next);
      return;
    }

    if (!rangeStart) {
      setRangeStart(k);
    } else {
      const [a, b] = rangeStart <= k ? [rangeStart, k] : [k, rangeStart];
      if (daysBetweenInclusive(a, b) > MAX_HORIZON_DAYS) {
        reg?.showToast(`Blocked range cannot exceed ${MAX_HORIZON_DAYS} days.`, 'error');
        setRangeStart(null);
        return;
      }
      const next = { ...blockedMap };
      let cur = a;
      while (cur && cur <= b) {
        if (
          !isBefore(cur, todayKey) &&
          !lockedBookedSet.has(cur) &&
          !lockedHoldSet.has(cur) &&
          daysBetweenInclusive(todayKey, cur) <= MAX_HORIZON_DAYS
        ) {
          next[cur] = 'blocked';
        }
        cur = addDays(cur, 1);
      }
      commitBlocked(next);
      setRangeStart(null);
    }
  };

  const handleClearAll = () => {
    commitBlocked({});
    setRangeStart(null);
  };

  const blockedCount = Object.keys(blockedMap).length;
  const summary = blockedCount
    ? `${blockedCount} day${blockedCount === 1 ? '' : 's'} marked as blocked`
    : 'All upcoming dates available — click any date range to block';

  return (
    <div className="calendar-preview">
      <div className="cal-header">
        <span className="cal-month">
          {MONTHS[view.m]} {view.y}
        </span>
        <div className="cal-nav-btns">
          <button
            type="button"
            className="cal-nav-btn"
            aria-label="Previous month"
            onClick={() => move(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="cal-nav-btn"
            aria-label="Next month"
            onClick={() => move(1)}
          >
            →
          </button>
        </div>
      </div>
      {rangeStart && (
        <div className="cal-selection-hint">
          <span>
            Start date selected: <strong>{rangeStart}</strong> — click an end date to block range
          </span>
          <button type="button" className="cal-inline-btn" onClick={() => setRangeStart(null)}>
            Cancel
          </button>
        </div>
      )}
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div className="cal-day-name" key={d}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div className="cal-day empty" key={`e${i}`} />;
          const k = formatDateKey(view.y, view.m, d);
          const past = isBefore(k, todayKey);
          const isBooked = lockedBookedSet.has(k);
          const isHold = lockedHoldSet.has(k);
          const isBlocked = Boolean(blockedMap[k]);
          const isToday = k === todayKey;
          const selecting = rangeStart === k;
          const statusClass = isBooked
            ? 'booked'
            : isHold
              ? 'hold'
              : isBlocked
                ? 'blocked'
                : 'available';
          return (
            <div
              key={k}
              data-date={k}
              aria-label={k}
              className={cn(
                'cal-day',
                statusClass,
                past && 'past',
                isToday && 'today',
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
            style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.35)' }}
          />
          Available
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-dot"
            style={{
              background: 'rgba(245,158,11,0.22)',
              border: '1px solid rgba(217,119,6,0.45)',
            }}
          />
          Blocked by Owner
        </div>
        {lockedBookedSet.size > 0 && (
          <div className="cal-legend-item">
            <span
              className="cal-legend-dot"
              style={{
                background: 'rgba(229,57,53,0.15)',
                border: '1px solid rgba(229,57,53,0.35)',
              }}
            />
            Confirmed Booking
          </div>
        )}
        {lockedHoldSet.size > 0 && (
          <div className="cal-legend-item">
            <span
              className="cal-legend-dot"
              style={{ background: 'rgba(249,115,22,0.18)', border: '1px dashed #ea580c' }}
            />
            Checkout Hold
          </div>
        )}
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: '#e5e7eb' }} />
          Past
        </div>
      </div>
      <div className="cal-footer-bar">
        <div className="cal-summary">{summary}</div>
        {blockedCount > 0 && (
          <button type="button" className="cal-inline-btn" onClick={handleClearAll}>
            Clear blocked dates
          </button>
        )}
      </div>
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
