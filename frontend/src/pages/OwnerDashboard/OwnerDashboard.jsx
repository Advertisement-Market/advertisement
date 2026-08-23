import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/layout/Logo';
import {
  NAV, TITLES, NOTIFICATIONS, ONBOARD_STEPS, LISTINGS, LISTING_NAMES, QUOTES, TENDERS, BOOKINGS,
  CHART_MONTHS_12, CHART_REVENUE_12, CHART_VIEWS_12, REVENUE_BY_LISTING, VIEWS_BY_LISTING,
  VIEWS_DATA, OCCUPANCY_DATA, MONTHS, DAY_NAMES, initCalData, dayKey,
} from './data';
import './OwnerDashboard.css';

const html = (s) => ({ __html: s });
const displayName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Owner';
const initialsOf = (user) =>
  ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'A';

/* ── Sidebar ── */
function Sidebar({ active, onNav, userName }) {
  const { user } = useAuth();
  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-logo-mark">
          <LogoMark size={34} />
          <div className="sb-logo-text">The<span>AdBasket</span></div>
        </div>
        <div className="sb-logo-role">Billboard Owner Portal</div>
      </div>
      <div className="sb-user">
        <div className="sb-avatar">{initialsOf(user)}</div>
        <div><div className="sb-user-name">{userName}</div><div className="sb-user-plan">Growth Plan · ₹2,999/mo</div></div>
      </div>
      <nav className="sb-nav">
        {NAV.map((g) => (
          <div key={g.section}>
            <div className="sb-section">{g.section}</div>
            {g.items.map((it) => (
              <button key={it.page} className={cn('sb-item', active === it.page && 'active')} onClick={() => onNav(it.page)}>
                {it.icon}{it.label}{it.badge && <span className="sb-badge">{it.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-bottom">
        <Link to={ROUTES.home} className="sb-item" style={{ display: 'flex' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Back to Home
        </Link>
      </div>
    </aside>
  );
}

function Topbar({ title, onAddListing, onNav }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);
  const hasUnread = notifs.some((n) => n.unread);
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <button className="btn-teal btn-sm" onClick={onAddListing}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Listing
        </button>
        <div className="notif-wrap" ref={ref}>
          <button className="notif-btn" onClick={() => setOpen((o) => !o)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            {hasUnread && <span className="notif-badge-dot" />}
          </button>
          <div className={cn('notif-dropdown', open && 'open')}>
            <div className="nd-header"><h4>Notifications</h4><button onClick={() => { setNotifs((p) => p.map((n) => ({ ...n, unread: false }))); showToast('All notifications marked as read.'); }}>Mark all read</button></div>
            {notifs.map((n, i) => (
              <div key={i} className={cn('nd-item', n.unread && 'unread')} onClick={() => setNotifs((p) => p.map((x, idx) => (idx === i ? { ...x, unread: false } : x)))}>
                <div className={cn('nd-dot', n.dot)} /><div><div className="nd-text">{n.text}</div><div className="nd-time">{n.time}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="sb-avatar" style={{ cursor: 'pointer' }} onClick={() => onNav('settings')}>{initialsOf(user)}</div>
      </div>
    </div>
  );
}

/* ── SVG combo (bar + line) chart ── */
function ComboChart({ labels, bars, line, opts }) {
  const { width: W, height: H, barColor, lineColor, barLabel, barPrefix = '', barSuffix = '', lineLabel, lineSuffix = '' } = opts;
  const [hover, setHover] = useState(null);
  const padL = 34, padR = 10, padT = 14, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxBar = Math.max(...bars) * 1.15 || 1;
  const maxLine = Math.max(...line) * 1.15 || 1;
  const n = labels.length, slot = plotW / n;
  const grid = [];
  for (let g = 0; g <= 4; g++) {
    const y = padT + plotH - (g / 4) * plotH;
    grid.push({ y, label: ((maxBar * g) / 4).toFixed(1) });
  }
  const cols = labels.map((lbl, i) => {
    const cx = padL + slot * i + slot / 2;
    const bw = Math.min(slot * 0.42, 28);
    const bh = (bars[i] / maxBar) * plotH;
    const by = padT + plotH - bh;
    const ly = padT + plotH - (line[i] / maxLine) * plotH;
    return { i, lbl, cx, bw, bh: Math.max(bh, 1), by, ly };
  });
  const linePts = cols.map((c) => `${c.cx.toFixed(1)},${c.ly.toFixed(1)}`);
  const areaPath = `M${padL},${(padT + plotH).toFixed(1)} L${linePts.join(' L')} L${(W - padR)},${(padT + plotH).toFixed(1)} Z`;
  const linePath = `M${linePts.join(' L')}`;
  const gradId = `grad-${barLabel}-${W}`;
  const h = hover != null ? cols[hover] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg className="combo-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lineColor} stopOpacity="0.28" /><stop offset="100%" stopColor={lineColor} stopOpacity="0" /></linearGradient></defs>
        {grid.map((g, i) => (<line key={i} className="combo-grid-line" x1={padL} y1={g.y.toFixed(1)} x2={W - padR} y2={g.y.toFixed(1)} />))}
        {grid.map((g, i) => (<text key={`a${i}`} className="combo-axis-label" x={padL - 6} y={(g.y + 3).toFixed(1)} textAnchor="end">{g.label}</text>))}
        <path className="combo-area" d={areaPath} fill={`url(#${gradId})`} />
        {cols.map((c) => (<rect key={c.i} className="combo-bar" x={(c.cx - c.bw / 2).toFixed(1)} y={c.by.toFixed(1)} width={c.bw.toFixed(1)} height={c.bh.toFixed(1)} rx="3" fill={barColor} />))}
        <path className="combo-line" d={linePath} stroke={lineColor} />
        {cols.map((c) => (<circle key={c.i} className="combo-dot" cx={c.cx.toFixed(1)} cy={c.ly.toFixed(1)} r="3.5" />))}
        {cols.map((c) => (<text key={c.i} className="combo-axis-label" x={c.cx.toFixed(1)} y={H - 6} textAnchor="middle">{c.lbl}</text>))}
        {cols.map((c) => (<rect key={c.i} x={(padL + slot * c.i).toFixed(1)} y={padT} width={slot.toFixed(1)} height={plotH} fill="transparent" onMouseEnter={() => setHover(c.i)} onMouseLeave={() => setHover(null)} />))}
      </svg>
      {h && (
        <div className="chart-tooltip" style={{ opacity: 1, left: `${(h.cx / W) * 100}%`, top: `${(h.ly / H) * 100}%`, transform: 'translate(-50%,-115%)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.lbl}</div>
          <div className="tt-row"><span className="tt-dot" style={{ background: barColor }} />{barLabel}: {barPrefix}{bars[hover]}{barSuffix}</div>
          <div className="tt-row"><span className="tt-dot" style={{ background: lineColor }} />{lineLabel}: {line[hover]}{lineSuffix}</div>
        </div>
      )}
    </div>
  );
}

/* ── Revenue split donut ── */
function Donut() {
  const data = [
    { name: 'BKC LED Screen', val: REVENUE_BY_LISTING[0][11], color: 'var(--teal)' },
    { name: 'Andheri Flyover', val: REVENUE_BY_LISTING[1][11], color: 'var(--indigo)' },
    { name: 'Powai IT Park LED', val: REVENUE_BY_LISTING[2][11], color: 'var(--amber)' },
  ];
  const total = data.reduce((a, d) => a + d.val, 0);
  const cx = 100, cy = 100, r = 72, sw = 28, circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = data.map((d) => {
    const len = (d.val / total) * circ;
    const seg = { ...d, len, offset };
    offset += len;
    return seg;
  });
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" width="200" height="200">
        {segs.map((d) => (
          <circle key={d.name} className="donut-seg" cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={sw} strokeDasharray={`${d.len.toFixed(2)} ${(circ - d.len).toFixed(2)}`} strokeDashoffset={(-d.offset).toFixed(2)} transform={`rotate(-90 ${cx} ${cy})`}>
            <title>{d.name}: ₹{d.val.toFixed(2)}L</title>
          </circle>
        ))}
        <text className="donut-center-label" x={cx} y={cy - 2} textAnchor="middle" fontSize="22">₹{total.toFixed(1)}L</text>
        <text className="donut-center-sub" x={cx} y={cy + 16} textAnchor="middle" fontSize="10">Total this month</text>
      </svg>
      <div className="donut-legend">
        {data.map((d) => (
          <div className="donut-legend-item" key={d.name}>
            <span className="donut-legend-swatch" style={{ background: d.color }} />{d.name} <span style={{ color: 'var(--ink-faint)' }}>({((d.val / total) * 100).toFixed(0)}%)</span><span className="donut-legend-val">₹{d.val.toFixed(2)}L</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Calendar grid (shared) ── */
function CalGrid({ month, year, statusFor, dayProps, extra }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];
  DAY_NAMES.forEach((d) => cells.push(<div key={`n${d}`} className="cal-day-name">{d}</div>));
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />);
  for (let d = 1; d <= daysIn; d++) {
    const status = statusFor(d);
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const cls = cn('cal-day', status === 'booked' ? 'booked' : 'available', isToday && 'today', extra ? extra(d) : '');
    cells.push(<div key={d} className={cls} {...(dayProps ? dayProps(d) : {})}>{d}</div>);
  }
  return <div className="cal-grid">{cells}</div>;
}

function MiniCalendar({ calData }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  return (
    <div className="section-card">
      <div className="sc-header"><h3>{MONTHS[month]} Calendar</h3></div>
      <div className="avail-calendar">
        <div className="cal-header">
          <button className="cal-nav" onClick={prev}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button>
          <span className="cal-month">{MONTHS[month]} {year}</span>
          <button className="cal-nav" onClick={next}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
        </div>
        <CalGrid month={month} year={year} statusFor={(d) => calData[0][dayKey(year, month, d)] || 'available'} />
        <div className="cal-legend">
          <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--green)' }} />Available</div>
          <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--rose)' }} />Booked</div>
          <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--indigo)' }} />Today</div>
        </div>
      </div>
    </div>
  );
}

const STAT = (tone, inner, label, val, sub) => ({ tone, inner, label, val, sub });
function StatCards({ items }) {
  return (
    <div className="stats-row">
      {items.map((s) => (
        <div className={cn('stat-card', s.tone)} key={s.label}>
          <div className={cn('card-icon', s.tone)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{s.inner}</svg></div>
          <div className="card-label">{s.label}</div><div className="card-val">{s.val}</div><div className="card-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
function PageHeader({ title, sub, children }) {
  return (<div className="page-header"><div><h2>{title}</h2><p>{sub}</p></div>{children}</div>);
}

/* ── Overview ── */
function Overview({ onNav, calData }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [onboard, setOnboard] = useState(true);
  const [steps, setSteps] = useState(ONBOARD_STEPS);
  const done = steps.filter((s) => s.done).length;
  const complete = (i) => setSteps((prev) => {
    if (prev[i].done) return prev;
    const next = prev.map((s, idx) => (idx === i ? { ...s, done: true } : s));
    if (next.every((s) => s.done)) showToast('All steps complete! Listings fully optimised.', 'success');
    return next;
  });
  const check = <div className="onboard-step-check"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,6 4.5,9 10.5,3" /></svg></div>;
  return (
    <div className="page active">
      {onboard && (
        <div className="onboard-card">
          <div className="onboard-header">
            <div><h3>Welcome back, {user?.firstName || 'there'}. Let&apos;s get you earning.</h3><p>Complete these steps to start receiving inbound leads.</p></div>
            <button className="onboard-dismiss" onClick={() => setOnboard(false)}>Dismiss</button>
          </div>
          <div className="onboard-progress-bar"><div className="onboard-progress-fill" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <div className="onboard-steps">
            {steps.map((s, i) => (
              <div key={s.label} className={cn('onboard-step', s.done && 'done')} onClick={() => complete(i)}>{check}{s.label}</div>
            ))}
          </div>
        </div>
      )}
      <StatCards items={[
        STAT('blue', <><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M12 16v5M8 21h8" /></>, 'Active Listings', '3', <span className="card-trend neutral">All verified</span>),
        STAT('teal', <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>, 'Quote Requests', '4', <><span className="card-trend up">+3</span> this week</>),
        STAT('gold', <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, 'Profile Views', '247', <><span className="card-trend up">↑34%</span> this week</>),
        STAT('green', <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>, 'Est. Monthly Revenue', '₹9.8L', 'across 3 booked campaigns'),
      ]}
      />
      <div className="content-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header"><h3>My Listings</h3><button className="link" onClick={() => onNav('listings')}>Manage all →</button></div>
            {LISTINGS.map((l) => (
              <div className="listing-row" key={l.name} onClick={() => onNav('listings')}>
                <div className="lr-icon" style={{ background: l.color }} dangerouslySetInnerHTML={html(`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">${l.svgInner}</svg>`)} />
                <div className="lr-info"><div className="lr-name">{l.name}</div><div className="lr-meta">{l.meta}</div></div>
                <div className="lr-stats"><div className="lr-stat"><div className="lr-stat-val">{l.views}</div><div className="lr-stat-label">views</div></div><div className="lr-stat"><div className="lr-stat-val">{l.price}</div><div className="lr-stat-label">/month</div></div></div>
                <span className={cn('chip', l.sc)}>{l.status}</span>
              </div>
            ))}
          </div>
          <div className="section-card">
            <div className="sc-header"><h3>Revenue — Last 6 Months</h3><button className="link" onClick={() => onNav('analytics')}>Full analytics →</button></div>
            <div className="chart-wrap">
              <div className="chart-toolbar"><div className="chart-kpi"><div className="chart-kpi-item"><span className="chart-kpi-label">Revenue (6mo)</span><span className="chart-kpi-val up">₹9.8L</span></div><div className="chart-kpi-item"><span className="chart-kpi-label">Views (6mo)</span><span className="chart-kpi-val up">247</span></div></div></div>
              <ComboChart labels={CHART_MONTHS_12.slice(6)} bars={CHART_REVENUE_12.slice(6)} line={CHART_VIEWS_12.slice(6)} opts={{ width: 600, height: 200, barColor: 'var(--teal)', lineColor: 'var(--amber)', barLabel: 'Revenue', barPrefix: '₹', barSuffix: 'L', lineLabel: 'Views', lineSuffix: ' views' }} />
              <div className="chart-legend"><div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />Revenue (₹L)</div><div className="chart-legend-item"><div className="chart-legend-dot line" style={{ background: 'var(--amber)' }} />Profile Views</div></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header"><h3>Quote Requests</h3><button className="link" onClick={() => onNav('quotes')}>View all →</button></div>
            {QUOTES.slice(0, 2).map((q) => (
              <div className="quote-item" key={q.init}>
                <div className="qi-avatar" style={{ background: `linear-gradient(135deg,${q.c1},${q.c2})` }}>{q.init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="qi-title">{q.name} · {q.listing}</div>
                  <div className="qi-meta">{q.meta}</div>
                  <div className="qi-actions"><button className="btn-teal btn-sm" onClick={() => showToast('Opening response form…')}>Respond</button><button className="btn-ghost btn-sm" onClick={() => showToast('Quote declined.')}>Decline</button></div>
                </div>
                <span className={cn('chip', q.sc)}>{q.status}</span>
              </div>
            ))}
          </div>
          <MiniCalendar calData={calData} />
        </div>
      </div>
    </div>
  );
}

function Listings({ onEdit }) {
  const { showToast } = useToast();
  const [listings, setListings] = useState(LISTINGS);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const toggle = (i) => setListings((prev) => prev.map((l, idx) => (idx === i ? { ...l, status: l.status === 'Available' ? 'Booked' : 'Available', sc: l.status === 'Available' ? 'chip-booked' : 'chip-available' } : l)));
  const filtered = listings.filter((l) => (!q || l.name.toLowerCase().includes(q.toLowerCase()) || l.meta.toLowerCase().includes(q.toLowerCase())) && (status === 'all' || l.status.toLowerCase() === status));
  return (
    <div className="page active">
      <PageHeader title="My Listings" sub="Manage your billboard inventory, pricing, and visibility.">
        <button className="btn-teal" onClick={() => onEdit(null)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add New Listing</button>
      </PageHeader>
      <div className="filter-bar">
        <div className="search-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input type="text" placeholder="Search listings..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="form-control" style={{ width: 'auto', fontSize: 12.5, padding: '7px 12px', borderRadius: 9 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option><option value="available">Available</option><option value="booked">Booked</option>
        </select>
      </div>
      <div style={{ padding: '4px 0' }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M12 16v5M8 21h8" /></svg><p>No listings match your search.</p></div>
        ) : filtered.map((l) => {
          const idx = listings.indexOf(l);
          return (
            <div className="listing-card-full" key={l.name}>
              <div className="lcf-header">
                <div className="lcf-img" style={{ background: l.color }} dangerouslySetInnerHTML={html(`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">${l.svgInner}</svg>`)} />
                <div className="lcf-info"><div className="lcf-name">{l.name}</div><div className="lcf-meta">{l.meta}</div></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={cn('chip', l.sc)}>{l.status}</span>
                  <button className="btn-ghost btn-sm" onClick={() => onEdit(l.name)}>Edit</button>
                  <button className="btn-teal btn-sm" onClick={() => showToast(`"${l.name}" boosted for 7 days!`, 'success')}>Boost</button>
                  <button className="btn-danger btn-sm" onClick={() => { toggle(idx); showToast(`"${l.name}" marked as ${l.status === 'Available' ? 'Booked' : 'Available'}.`, 'success'); }}>{l.status === 'Available' ? 'Mark Booked' : 'Mark Available'}</button>
                </div>
              </div>
              <div className="lcf-stats">
                <div className="lcf-stat"><div className="lcf-stat-val">{l.views}</div><div className="lcf-stat-label">Profile views</div></div>
                <div className="lcf-stat"><div className="lcf-stat-val">{l.quotes}</div><div className="lcf-stat-label">Quote requests</div></div>
                <div className="lcf-stat"><div className="lcf-stat-val">{l.price}</div><div className="lcf-stat-label">Monthly rate</div></div>
                <div className="lcf-stat"><div className="lcf-stat-val">4.8 ★</div><div className="lcf-stat-label">Owner rating</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPage({ calData, setCalData }) {
  const { showToast } = useToast();
  const [listing, setListing] = useState(0);
  const [mode, setMode] = useState('block');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [range, setRange] = useState({ start: null, end: null });
  const drag = useRef(false);
  useEffect(() => { const up = () => { drag.current = false; }; document.addEventListener('mouseup', up); return () => document.removeEventListener('mouseup', up); }, []);
  const isPast = (d) => new Date(year, month, d) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const down = (d) => { if (isPast(d)) return; drag.current = true; setRange({ start: d, end: d }); };
  const enter = (d) => { if (drag.current) setRange((r) => ({ ...r, end: d })); };
  const clearSel = () => setRange({ start: null, end: null });
  const changeMonth = (delta) => { clearSel(); let m = month + delta; let y = year; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setMonth(m); setYear(y); };
  const rs = range.start != null ? Math.min(range.start, range.end ?? range.start) : null;
  const re = range.start != null ? Math.max(range.start, range.end ?? range.start) : null;
  const apply = () => {
    if (range.start == null) { showToast('Select dates on the calendar first.'); return; }
    setCalData((prev) => {
      const next = { ...prev, [listing]: { ...prev[listing] } };
      for (let d = rs; d <= re; d++) { const k = dayKey(year, month, d); if (mode === 'available') delete next[listing][k]; else next[listing][k] = mode; }
      return next;
    });
    const msgs = { block: 'Dates blocked', available: 'Dates marked available', booked: 'Dates marked as booked' };
    showToast(`${msgs[mode]}: ${re - rs + 1} day(s) on ${LISTING_NAMES[listing]}.`, 'success');
    clearSel();
  };
  const [qb, setQb] = useState({ from: '', to: '', type: 'booked' });
  const applyQuick = () => {
    if (!qb.from || !qb.to) { showToast('Select both from and to dates.', 'error'); return; }
    if (qb.from > qb.to) { showToast('From date must be before To date.', 'error'); return; }
    let d = new Date(qb.from); const end = new Date(qb.to); let count = 0;
    setCalData((prev) => {
      const next = { ...prev, [listing]: { ...prev[listing] } };
      while (d <= end) { const pad = (n) => (n < 10 ? `0${n}` : `${n}`); const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; if (qb.type === 'available') delete next[listing][k]; else next[listing][k] = qb.type; d = new Date(d); d.setDate(d.getDate() + 1); count++; }
      return next;
    });
    const fd = new Date(qb.from); setMonth(fd.getMonth()); setYear(fd.getFullYear());
    showToast(`${count} day(s) updated on ${LISTING_NAMES[listing]}.`, 'success');
  };
  const rangeText = range.start == null ? null : `${{ block: 'Blocking', available: 'Marking available', booked: 'Marking as booked' }[mode]}: ${MONTHS[month]} ${rs}${rs !== re ? ` – ${re}` : ''}, ${year} (${re - rs + 1} day${re - rs > 0 ? 's' : ''})`;
  return (
    <div className="page active">
      <PageHeader title="Availability Calendar" sub="Click or drag to select a date range. Choose a mode then click Apply." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }} className="cal-layout">
        <div className="section-card">
          <div className="sc-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h3>{LISTING_NAMES[listing]} — Availability</h3>
            <select className="form-control" style={{ width: 'auto', fontSize: 12.5, padding: '7px 12px', borderRadius: 9 }} value={listing} onChange={(e) => { setListing(Number(e.target.value)); clearSel(); }}>
              {LISTING_NAMES.map((nm, i) => (<option key={nm} value={i}>{nm}</option>))}
            </select>
          </div>
          <div className="cal-toolbar">
            {[['block', 'Block Dates'], ['available', 'Mark Available'], ['booked', 'Mark Booked']].map(([m, lbl]) => (
              <button key={m} className={cn('cal-mode-btn', mode === m && 'active')} onClick={() => setMode(m)}>{lbl}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="cal-nav" onClick={() => changeMonth(-1)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button>
              <span className="cal-month" style={{ padding: '0 8px', minWidth: 120, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
              <button className="cal-nav" onClick={() => changeMonth(1)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
            </div>
          </div>
          <div className={cn('cal-range-info', range.start != null && 'visible')}>
            <span className="cal-range-text">{rangeText || 'No dates selected'}</span>
            <div className="cal-range-actions"><button className="btn-teal btn-sm" onClick={apply}>Apply</button><button className="btn-ghost btn-sm" onClick={clearSel}>Clear</button></div>
          </div>
          <div className="avail-calendar" style={{ padding: '18px 22px' }}>
            <CalGrid
              month={month} year={year}
              statusFor={(d) => calData[listing][dayKey(year, month, d)] || 'available'}
              extra={(d) => {
                let c = isPast(d) ? 'past' : '';
                if (rs != null) { if (d === rs && d === re) c += ' selected'; else if (d === rs) c += ' range-start'; else if (d === re) c += ' range-end'; else if (d > rs && d < re) c += ' in-range'; }
                return c;
              }}
              dayProps={(d) => ({ onMouseDown: () => down(d), onMouseEnter: () => enter(d) })}
            />
            <div className="cal-legend" style={{ marginTop: 16 }}>
              <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--green)' }} />Available</div>
              <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--rose)' }} />Booked</div>
              <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--teal)' }} />Selected Range</div>
              <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background: 'var(--indigo)' }} />Today</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--ink-faint)', marginBottom: 16 }}>Upcoming Bookings</div>
            {BOOKINGS.map((b) => (
              <div className="booking-row" key={b.name}>
                <div className="booking-name">{b.name}</div>
                <div className="booking-dates">{b.listing} · {b.dates}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}><div className="booking-price">{b.price}</div><button className="btn-ghost btn-xs" onClick={() => showToast('Booking details opened.')}>View</button></div>
              </div>
            ))}
          </div>
          <div className="section-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--ink-faint)', marginBottom: 14 }}>Quick Block by Date Range</div>
            <div className="form-group"><label>From</label><input type="date" className="form-control" value={qb.from} onChange={(e) => setQb({ ...qb, from: e.target.value })} /></div>
            <div className="form-group"><label>To</label><input type="date" className="form-control" value={qb.to} onChange={(e) => setQb({ ...qb, to: e.target.value })} /></div>
            <div className="form-group" style={{ marginBottom: 12 }}><label>Mark as</label>
              <select className="form-control" value={qb.type} onChange={(e) => setQb({ ...qb, type: e.target.value })}><option value="booked">Booked</option><option value="block">Blocked</option><option value="available">Available</option></select>
            </div>
            <button className="btn-teal" style={{ width: '100%', justifyContent: 'center' }} onClick={applyQuick}>Apply Date Range</button>
          </div>
          <div className="section-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--ink-faint)', marginBottom: 14 }}>Booking Rules</div>
            <div className="form-group"><label>Minimum Duration</label><select className="form-control" defaultValue="3 Months" onChange={() => showToast('Booking rule updated.')}><option>1 Month</option><option>3 Months</option><option>6 Months</option></select></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Advance Notice</label><select className="form-control" defaultValue="14 days" onChange={() => showToast('Notice period saved.')}><option>7 days</option><option>14 days</option><option>30 days</option></select></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotesPage({ onRespond }) {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState(QUOTES);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const decline = (i) => { setQuotes((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: 'Declined', sc: 'chip-declined' } : x))); showToast('Quote declined.'); };
  const filtered = quotes.filter((x) => (!q || x.name.toLowerCase().includes(q.toLowerCase()) || x.listing.toLowerCase().includes(q.toLowerCase())) && (status === 'all' || x.status.toLowerCase() === status));
  return (
    <div className="page active">
      <PageHeader title="Quote Requests" sub="Respond to inbound quote requests from verified businesses." />
      <div className="section-card">
        <div className="sc-header">
          <h3>All Requests ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input" style={{ minWidth: 140 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input type="text" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: '7px 12px 7px 30px', borderRadius: 9, fontSize: 12 }} /></div>
            <select className="form-control" style={{ width: 'auto', fontSize: 12.5, padding: '6px 10px' }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="new">New</option><option value="pending">Pending</option><option value="responded">Responded</option><option value="declined">Declined</option></select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg><p>No quote requests found.</p></div>
        ) : filtered.map((x) => {
          const idx = quotes.indexOf(x);
          const isDone = x.status === 'Responded' || x.status === 'Declined';
          return (
            <div className="quote-item" key={x.init + x.name}>
              <div className="qi-avatar" style={{ background: `linear-gradient(135deg,${x.c1},${x.c2})` }}>{x.init}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="qi-title">{x.name} · {x.listing}</div><div className="qi-meta">{x.meta}</div>
                <div className="qi-actions">
                  {!isDone && <button className="btn-teal btn-sm" onClick={() => onRespond(x.name, x.listing)}>Send Quote</button>}
                  <button className="btn-ghost btn-sm" onClick={() => showToast('Message thread opened.')}>Message</button>
                  {!isDone && <button className="btn-ghost btn-sm" onClick={() => decline(idx)}>Decline</button>}
                </div>
              </div>
              <span className={cn('chip', x.sc)}>{x.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TendersPage({ onBid }) {
  const [city, setCity] = useState('all');
  const filtered = city === 'all' ? TENDERS : TENDERS.filter((t) => t.city === city);
  return (
    <div className="page active">
      <PageHeader title="Tender Board" sub="Browse and bid on active advertiser tenders that match your listings." />
      <div className="section-card">
        <div className="sc-header">
          <h3>Active Tenders (5)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Growth plan · unlimited bids</span>
            <select className="form-control" style={{ width: 'auto', fontSize: 12.5, padding: '6px 10px' }} value={city} onChange={(e) => setCity(e.target.value)}><option value="all">All Cities</option><option>Mumbai</option><option>Delhi NCR</option><option>Pune</option><option>Hyderabad</option><option>Pan India</option></select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg><p>No tenders match your filter.</p></div>
        ) : filtered.map((t) => (
          <div className="tender-item" key={t.ind}>
            <div className="ti-info"><div className="ti-name">{t.ind}{t.isNew && <span className="ti-new">NEW</span>}</div><div className="ti-meta">{t.desc} · {t.city} · {t.dur}</div><span className="ti-deadline">{t.deadline}</span></div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}><div className="ti-budget">{t.budget}</div><div className="ti-budget-label">per month</div></div>
            <button className="btn-teal btn-sm" onClick={() => onBid(`${t.ind} – ${t.city}`)}>Bid Now →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('revenue');
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState(6);
  const bars = filter === 'all' ? CHART_REVENUE_12 : REVENUE_BY_LISTING[filter];
  const line = filter === 'all' ? CHART_VIEWS_12 : VIEWS_BY_LISTING[filter];
  const start = 12 - range;
  const b = bars.slice(start), l = line.slice(start), labels = CHART_MONTHS_12.slice(start);
  const totalRev = b.reduce((a, v) => a + v, 0);
  const totalViews = l.reduce((a, v) => a + v, 0);
  const growth = b.length > 1 && b[0] > 0 ? Math.round(((b[b.length - 1] - b[0]) / b[0]) * 100) : 0;
  return (
    <div className="page active">
      <PageHeader title="Analytics" sub="Track your listing performance, views, and revenue over time.">
        <button className="btn-ghost" onClick={() => showToast('Report downloaded as CSV.', 'success')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Export Report</button>
      </PageHeader>
      <StatCards items={[
        STAT('blue', <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, 'Total Views', '247', <><span className="card-trend up">↑34%</span> this month</>),
        STAT('teal', <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>, 'Quote Requests', '14', '4 pending response'),
        STAT('gold', <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>, 'Revenue YTD', '₹43L', <><span className="card-trend up">↑22%</span> vs last year</>),
        STAT('green', <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, 'Occupancy Rate', '78%', 'across all listings'),
      ]}
      />
      <div className="section-card">
        <div className="tab-bar">
          {[['revenue', 'Revenue'], ['views', 'Views'], ['occupancy', 'Occupancy'], ['split', 'Revenue Split']].map(([id, lbl]) => (
            <button key={id} className={cn('tab-btn', tab === id && 'active')} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
        {tab === 'revenue' && (
          <div className="tab-content active">
            <div className="chart-wrap">
              <div className="chart-toolbar">
                <div className="chart-kpi">
                  <div className="chart-kpi-item"><span className="chart-kpi-label">Total Revenue</span><span className="chart-kpi-val">₹{totalRev.toFixed(1)}L</span></div>
                  <div className="chart-kpi-item"><span className="chart-kpi-label">Total Views</span><span className="chart-kpi-val">{totalViews}</span></div>
                  <div className="chart-kpi-item"><span className="chart-kpi-label">Avg Monthly</span><span className="chart-kpi-val">₹{(totalRev / b.length).toFixed(1)}L</span></div>
                  <div className="chart-kpi-item"><span className="chart-kpi-label">Growth</span><span className={cn('chart-kpi-val', growth >= 0 ? 'up' : 'down')}>{Math.abs(growth)}%</span></div>
                </div>
                <div className="chart-toolbar-controls">
                  <select className="chart-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All Listings</option><option value="0">BKC LED Screen</option><option value="1">Andheri Flyover</option><option value="2">Powai IT Park LED</option></select>
                  <div className="range-toggle"><button className={cn(range === 6 && 'active')} onClick={() => setRange(6)}>6M</button><button className={cn(range === 12 && 'active')} onClick={() => setRange(12)}>12M</button></div>
                </div>
              </div>
              <ComboChart labels={labels} bars={b} line={l} opts={{ width: 800, height: 240, barColor: 'var(--teal)', lineColor: 'var(--amber)', barLabel: 'Revenue', barPrefix: '₹', barSuffix: 'L', lineLabel: 'Views', lineSuffix: ' views' }} />
              <div className="chart-legend"><div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />Revenue (₹L)</div><div className="chart-legend-item"><div className="chart-legend-dot line" style={{ background: 'var(--amber)' }} />Profile Views</div></div>
            </div>
          </div>
        )}
        {tab === 'views' && (
          <div className="tab-content active"><div className="chart-wrap"><div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 14 }}>Profile Views per listing — this month</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {VIEWS_DATA.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', minWidth: 170 }}>{d.name}</div>
                  <div style={{ flex: 1, background: 'var(--canvas)', borderRadius: 50, height: 10, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 50, background: d.color, width: `${(d.views / 142) * 100}%` }} /></div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-rich)', minWidth: 40, textAlign: 'right' }}>{d.views}</div>
                </div>
              ))}
            </div>
          </div></div>
        )}
        {tab === 'occupancy' && (
          <div className="tab-content active"><div className="chart-wrap"><div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 14 }}>Occupancy rate per listing</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {OCCUPANCY_DATA.map((d) => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{d.name}</span><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-rich)' }}>{d.pct}%</span></div>
                  <div style={{ background: 'var(--canvas)', borderRadius: 50, height: 10, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 50, background: d.color, width: `${d.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div></div>
        )}
        {tab === 'split' && (
          <div className="tab-content active"><div className="chart-wrap"><div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 16 }}>Revenue contribution by listing — current month</div><Donut /></div></div>
        )}
      </div>
    </div>
  );
}

function SettingsPage({ onSaveName }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [first, setFirst] = useState(user?.firstName || '');
  const [last, setLast] = useState(user?.lastName || '');
  const prefs = ['New quote requests', 'Tender board matches', 'Payment confirmations', 'Weekly digest'];
  return (
    <div className="page active">
      <PageHeader title="Account Settings" sub="Manage your profile, billing, and notification preferences." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="settings-grid">
        <div className="section-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-.3px', marginBottom: 20 }}>Owner Profile</h3>
          <div className="form-row"><div className="form-group"><label>First Name</label><input type="text" className="form-control" value={first} onChange={(e) => setFirst(e.target.value)} /></div><div className="form-group"><label>Last Name</label><input type="text" className="form-control" value={last} onChange={(e) => setLast(e.target.value)} /></div></div>
          <div className="form-group"><label>Email</label><input type="email" className="form-control" defaultValue="vikram@billboardsco.in" /></div>
          <div className="form-group"><label>Phone</label><input type="tel" className="form-control" defaultValue="+91 97654 32109" /></div>
          <div className="form-group"><label>Business Name</label><input type="text" className="form-control" defaultValue="Kumar Billboards Pvt Ltd" /></div>
          <div className="form-group"><label>GST Number</label><input type="text" className="form-control" defaultValue="27AABCK1234P1Z5" readOnly /></div>
          <div className="form-group" style={{ marginBottom: 20 }}><label>City</label><select className="form-control" defaultValue="Mumbai"><option>Mumbai</option><option>Delhi</option><option>Bangalore</option><option>Pune</option><option>Hyderabad</option></select></div>
          <button className="btn-teal" onClick={() => { onSaveName(`${first} ${last}`); showToast('Profile saved successfully!', 'success'); }}>Save Changes</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-.3px', marginBottom: 16 }}>Current Plan</h3>
            <div className="plan-card">
              <div className="plan-name">Growth Plan</div><div className="plan-price">₹2,999/month · Renews 10 Jul 2026</div>
              <div className="plan-features">
                {['Up to 10 billboard listings', 'Unlimited quote responses', 'Tender board access', 'Analytics dashboard'].map((f) => (
                  <div className="plan-feature" key={f}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{f}</div>
                ))}
              </div>
            </div>
            <button className="btn-teal" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast('Opening plan upgrade...')}>Upgrade to Enterprise →</button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => showToast('Opening billing portal...')}>Manage Billing</button>
          </div>
          <div className="section-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-.3px', marginBottom: 16 }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prefs.map((p, i) => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, color: 'var(--ink-muted)' }}>{p}<input type="checkbox" defaultChecked={i < 3} onChange={() => showToast('Preference saved.')} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--teal)' }} /></label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modals ── */
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{title}</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function OwnerDashboard() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState('overview');
  const [calData, setCalData] = useState(initCalData);
  const [userName, setUserName] = useState(() => displayName(user));
  const [modal, setModal] = useState(null); // {type, brand, listing, tender, name}
  const today = new Date().toISOString().slice(0, 10);

  const closeModal = () => setModal(null);
  const nav = (p) => { setPage(p); };

  return (
    <div className="owner-dashboard-page">
      <Sidebar active={page} onNav={nav} userName={userName} />
      <div className="main">
        <Topbar title={TITLES[page] || 'Dashboard'} onAddListing={() => setModal({ type: 'addListing' })} onNav={nav} />
        {page === 'overview' && <Overview onNav={nav} calData={calData} />}
        {page === 'listings' && <Listings onEdit={(name) => setModal({ type: 'addListing', name })} />}
        {page === 'calendar' && <CalendarPage calData={calData} setCalData={setCalData} />}
        {page === 'quotes' && <QuotesPage onRespond={(brand, listing) => setModal({ type: 'quote', brand, listing })} />}
        {page === 'tenders' && <TendersPage onBid={(tender) => setModal({ type: 'bid', tender })} />}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'settings' && <SettingsPage onSaveName={setUserName} />}
      </div>

      {modal?.type === 'addListing' && (
        <Modal title="Add New Listing" onClose={closeModal}
          footer={<><button className="btn-ghost" onClick={closeModal}>Cancel</button><button className="btn-teal" onClick={closeModal}>Add Listing</button></>}>
          <div className="form-row"><div className="form-group"><label>Listing Name</label><input type="text" className="form-control" defaultValue={modal.name || ''} placeholder="e.g. Bandra Station LED" /></div><div className="form-group"><label>Format</label><select className="form-control"><option>LED Digital</option><option>Static Hoarding</option><option>Unipole</option><option>Bus Shelter</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Width (ft)</label><input type="number" className="form-control" placeholder="40" /></div><div className="form-group"><label>Height (ft)</label><input type="number" className="form-control" placeholder="20" /></div></div>
          <div className="form-row"><div className="form-group"><label>City</label><select className="form-control"><option>Mumbai</option><option>Delhi NCR</option><option>Bangalore</option><option>Pune</option><option>Hyderabad</option></select></div><div className="form-group"><label>Monthly Rate (₹)</label><input type="text" className="form-control" placeholder="e.g. 3,50,000" /></div></div>
          <div className="form-group"><label>Location / Landmark</label><input type="text" className="form-control" placeholder="e.g. Near Bandra Station, Western Express Highway" /></div>
        </Modal>
      )}
      {modal?.type === 'quote' && (
        <Modal title="Send Quote Response" onClose={closeModal}
          footer={<><button className="btn-ghost" onClick={closeModal}>Cancel</button><button className="btn-teal" onClick={() => { showToast('Quote response sent!', 'success'); closeModal(); }}>Send Response</button></>}>
          <div style={{ background: 'var(--canvas)', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 12.5, color: 'var(--ink-muted)' }}>Responding to: <strong style={{ color: 'var(--ink-rich)' }}>{modal.brand}</strong> for <strong style={{ color: 'var(--ink-rich)' }}>{modal.listing}</strong></div>
          <div className="form-row"><div className="form-group"><label>Your Rate (₹/month)</label><input type="text" className="form-control" placeholder="e.g. 5,80,000" /></div><div className="form-group"><label>Duration</label><select className="form-control"><option>1 Month</option><option>3 Months</option><option>6 Months</option><option>12 Months</option></select></div></div>
          <div className="form-group"><label>Message</label><textarea className="form-control" rows="3" style={{ resize: 'vertical' }} placeholder="Brief note about your listing and availability..." /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Available From</label><input type="date" className="form-control" defaultValue={today} /></div>
        </Modal>
      )}
      {modal?.type === 'bid' && (
        <Modal title="Submit Bid" onClose={closeModal}
          footer={<><button className="btn-ghost" onClick={closeModal}>Cancel</button><button className="btn-teal" onClick={() => { showToast('Bid submitted successfully!', 'success'); closeModal(); }}>Submit Bid</button></>}>
          <div style={{ background: 'var(--canvas)', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 12.5, color: 'var(--ink-muted)' }}>Bidding on: <strong style={{ color: 'var(--ink-rich)' }}>{modal.tender}</strong></div>
          <div className="form-group"><label>Select Listing</label><select className="form-control"><option>BKC LED Screen</option><option>Andheri Flyover Hoarding</option><option>Powai IT Park LED</option></select></div>
          <div className="form-row"><div className="form-group"><label>Bid Rate (₹/month)</label><input type="text" className="form-control" placeholder="e.g. 4,50,000" /></div><div className="form-group"><label>Available From</label><input type="date" className="form-control" defaultValue={today} /></div></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Pitch (optional)</label><textarea className="form-control" rows="3" style={{ resize: 'vertical' }} placeholder="Why your space is ideal for this campaign..." /></div>
        </Modal>
      )}
    </div>
  );
}
