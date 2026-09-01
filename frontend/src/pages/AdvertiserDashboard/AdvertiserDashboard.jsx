import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/layout/Logo';
import {
  NAV,
  TITLES,
  NOTIFICATIONS,
  ONBOARD_STEPS,
  QUOTES,
  MEDIA_PLAN_INIT,
  SAVED,
  NOTIF_PREFS,
  CHART_MONTHS,
  CHART_IMPRESSIONS,
  CHART_SPEND,
} from './data';
import './AdvertiserDashboard.css';

const L = (n) => (n / 100000).toFixed(1);
const html = (s) => ({ __html: s });
const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Advertiser';
const initialsOf = (user) =>
  ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'A';

/* ── Sidebar ── */
function Sidebar({ active, onNav }) {
  const { user } = useAuth();
  return (
    <aside className="sb">
      <div className="sb-logo">
        <Link to={ROUTES.home}>
          <LogoMark size={24} style={{ marginRight: 8 }} />
          <span className="logo-the">The</span>
          <span className="logo-ad">Ad</span>
          <span className="logo-bsk">Basket</span>
        </Link>
        <div className="sb-logo-role">Advertiser Portal</div>
      </div>
      <div className="sb-user">
        <div className="sb-avatar">{initialsOf(user)}</div>
        <div>
          <div className="sb-user-name">{displayName(user)}</div>
          <div className="sb-user-plan">Growth Plan · Free Trial</div>
        </div>
      </div>
      <nav className="sb-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="sb-section">{group.section}</div>
            {group.items.map((it) => (
              <button
                key={it.page}
                className={cn('sb-item', active === it.page && 'active')}
                onClick={() => onNav(it.page)}
              >
                {it.icon}
                {it.label}
                {it.badge && <span className="sb-badge">{it.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-bottom">
        <Link to={ROUTES.home} className="sb-item" style={{ display: 'flex' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Home
        </Link>
      </div>
    </aside>
  );
}

/* ── Topbar with notifications ── */
function Topbar({ title }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);
  const hasUnread = notifs.some((n) => n.unread);
  const markRead = (i) =>
    setNotifs((prev) => prev.map((n, idx) => (idx === i ? { ...n, unread: false } : n)));
  const markAll = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read.');
  };
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <Link to={ROUTES.browse} className="btn-ghost btn-sm">
          Browse Billboards →
        </Link>
        <div style={{ position: 'relative' }} ref={ref}>
          <button className="notif-btn" onClick={() => setOpen((o) => !o)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasUnread && <span className="notif-badge-dot" />}
          </button>
          <div className={cn('notif-dropdown', open && 'open')}>
            <div className="nd-header">
              <h4>Notifications</h4>
              <button onClick={markAll}>Mark all read</button>
            </div>
            {notifs.map((n, i) => (
              <div
                key={i}
                className={cn('nd-item', n.unread && 'unread')}
                onClick={() => markRead(i)}
              >
                <div className={cn('nd-dot', n.dot)} />
                <div>
                  <div className="nd-text">{n.text}</div>
                  <div className="nd-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="sb-avatar" style={{ cursor: 'pointer' }}>
          {initialsOf(user)}
        </div>
      </div>
    </div>
  );
}

/* ── Bar chart ── */
function Chart({ maxH }) {
  const maxI = Math.max(...CHART_IMPRESSIONS);
  const maxS = Math.max(...CHART_SPEND);
  return (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: maxH, marginBottom: 10 }}
    >
      {CHART_MONTHS.map((m, i) => (
        <div
          key={m}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: maxH }}>
            <div
              className="chart-bar indigo"
              style={{ height: (CHART_IMPRESSIONS[i] / maxI) * maxH, flex: 1 }}
              title={`${CHART_IMPRESSIONS[i]}Cr impressions`}
            />
            <div
              className="chart-bar teal"
              style={{ height: (CHART_SPEND[i] / maxS) * maxH * 0.75, flex: 1 }}
              title={`₹${CHART_SPEND[i]}L spend`}
            />
          </div>
          <div className="chart-bar-label">{m}</div>
        </div>
      ))}
    </div>
  );
}

const ChartLegend = () => (
  <div className="chart-legend">
    <div className="chart-legend-item">
      <div className="chart-legend-dot" style={{ background: 'var(--indigo)' }} />
      Impressions (Cr)
    </div>
    <div className="chart-legend-item">
      <div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />
      Campaign Spend (₹L)
    </div>
  </div>
);

const CAMPAIGNS = [
  {
    dot: 'var(--green)',
    name: 'Summer 2026 — MG Road LED, Bengaluru',
    meta: 'Running · 3 May – 3 Aug 2026 · LED Digital',
    s1: ['1.2Cr', 'impressions'],
    s2: ['₹2.8L', '/month'],
    chip: ['chip-success', 'Live'],
  },
  {
    dot: 'var(--gold)',
    name: 'Pune Launch — NH-48 Unipole',
    meta: 'Pending start · 15 Jun 2026 · Unipole',
    s1: ['—', 'starts soon'],
    s2: ['₹1.4L', '/month'],
    chip: ['chip-pending', 'Scheduled'],
  },
  {
    dot: 'var(--indigo)',
    name: 'BKC LED — Q3 Brand Awareness',
    meta: 'Negotiating · BKC, Mumbai · LED Digital',
    s1: ['—', 'pending'],
    s2: ['₹5.8L', '/month'],
    chip: ['chip-new', 'In Review'],
  },
];

/* ── Pages ── */
function Overview({ onNav, mediaPlan }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [onboard, setOnboard] = useState(true);
  const [steps, setSteps] = useState(ONBOARD_STEPS);
  const done = steps.filter((s) => s.done).length;
  const stepClick = (i) => {
    setSteps((prev) => {
      if (prev[i].done) return prev;
      const next = prev.map((s, idx) => (idx === i ? { ...s, done: true } : s));
      if (next.filter((s) => s.done).length === 5)
        showToast("All steps complete! You're fully set up.");
      return next;
    });
    if (steps[i].goto) onNav(steps[i].goto);
  };
  const mpTotal = mediaPlan.reduce((s, i) => s + i.priceNum, 0);
  return (
    <div className="page active">
      {onboard && (
        <div className="onboard-card">
          <div className="onboard-header">
            <div>
              <h3>Welcome to The AdBasket, {user?.firstName || 'there'}!</h3>
              <p>Complete these steps to get your first campaign live.</p>
            </div>
            <button
              className="onboard-dismiss"
              onClick={() => {
                setOnboard(false);
                showToast('You can find setup tips in Settings anytime.');
              }}
            >
              Dismiss
            </button>
          </div>
          <div className="onboard-progress-bar">
            <div className="onboard-progress-fill" style={{ width: `${(done / 5) * 100}%` }} />
          </div>
          <div className="onboard-steps">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className={cn('onboard-step', s.done && 'done')}
                onClick={() => stepClick(i)}
              >
                <div className="onboard-step-check">{s.done ? '✓' : ''}</div>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-row">
        {[
          [
            'blue',
            'var(--indigo)',
            <>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </>,
            'Active Campaigns',
            '3',
            <>
              <span className="sc-trend up">+1</span> this month
            </>,
          ],
          [
            'teal',
            'var(--teal)',
            <>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </>,
            'Quotes Received',
            '14',
            <>
              <span className="sc-trend up">+5</span> this week
            </>,
          ],
          [
            'gold',
            'var(--gold-dark)',
            <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="12" y2="17" />
            </>,
            'Active Tenders',
            '2',
            '8 total bids received',
          ],
          [
            'green',
            'var(--green)',
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>,
            'Est. Monthly Reach',
            '4.2Cr',
            <>
              <span className="sc-trend up">↑18%</span> vs last month
            </>,
          ],
        ].map(([tone, stroke, icon, label, val, sub]) => (
          <div className={cn('stat-card', tone)} key={label}>
            <div className={cn('sc-icon', tone)}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke={stroke}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="sc-label">{label}</div>
            <div className="sc-val">{val}</div>
            <div className="sc-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header">
              <h3>Active Campaigns</h3>
              <button className="link" onClick={() => onNav('campaigns')}>
                View all →
              </button>
            </div>
            {CAMPAIGNS.map((c) => (
              <div
                className="campaign-row"
                key={c.name}
                onClick={() => showToast('Opening campaign details…')}
              >
                <div className="campaign-dot" style={{ background: c.dot }} />
                <div className="campaign-info">
                  <div className="campaign-name">{c.name}</div>
                  <div className="campaign-meta">{c.meta}</div>
                </div>
                <div className="campaign-stats">
                  <div>
                    <div className="campaign-stat-val">{c.s1[0]}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.s1[1]}</div>
                  </div>
                  <div>
                    <div className="campaign-stat-val">{c.s2[0]}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.s2[1]}</div>
                  </div>
                  <span className={cn('chip', c.chip[0])}>{c.chip[1]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="section-card">
            <div className="sc-header">
              <h3>Impressions This Month</h3>
              <button className="link" onClick={() => onNav('analytics')}>
                Full report →
              </button>
            </div>
            <div className="chart-wrap">
              <Chart maxH={140} />
              <ChartLegend />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header">
              <h3>Recent Quotes</h3>
              <button className="link" onClick={() => onNav('quotes')}>
                View all →
              </button>
            </div>
            {QUOTES.slice(0, 2).map((q) => (
              <div className="quote-card" key={q.id}>
                <div
                  className="quote-avatar"
                  style={{ background: `linear-gradient(135deg,${q.color},#818CF8)` }}
                >
                  {q.init}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="quote-title">{q.title}</div>
                  <div className="quote-sub">{q.sub}</div>
                  <div className="quote-price">{q.price} / month</div>
                  <div className="quote-actions">
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => showToast('Opening quote details…')}
                    >
                      Review
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => showToast('Quote declined.')}
                    >
                      Decline
                    </button>
                  </div>
                </div>
                <span className={cn('chip', q.id === 'q1' ? 'chip-new' : 'chip-pending')}>
                  {q.id === 'q1' ? 'New' : 'Expiring'}
                </span>
              </div>
            ))}
          </div>
          <div className="section-card">
            <div className="sc-header">
              <h3>Media Plan</h3>
              <button className="link" onClick={() => onNav('mediaplan')}>
                Open builder →
              </button>
            </div>
            <div>
              {mediaPlan.map((i) => (
                <div className="mp-item" style={{ padding: '12px 22px' }} key={i.id}>
                  <div
                    className="mp-item-icon"
                    style={{ background: i.color }}
                    dangerouslySetInnerHTML={html(i.icon)}
                  />
                  <div className="mp-item-info">
                    <div className="mp-item-name">{i.name}</div>
                    <div className="mp-item-meta">{i.meta}</div>
                  </div>
                  <div className="mp-item-price">{i.price}</div>
                </div>
              ))}
              <div className="mp-total">
                <div className="mp-total-row">
                  <span className="mp-total-label">Total / month</span>
                  <span className="mp-grand">₹{L(mpTotal)}L</span>
                </div>
                <button
                  className="btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                  onClick={() => onNav('mediaplan')}
                >
                  Open Full Builder →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, sub, children }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Campaigns() {
  const { showToast } = useToast();
  const rows = [
    {
      dot: 'var(--green)',
      name: 'Summer 2026 — MG Road LED, Bengaluru',
      meta: '3 May – 3 Aug 2026 · 3 months · LED Digital · MG Road, Bengaluru',
      v1: ['1.2Cr', 'impressions'],
      v2: ['₹8.4L', 'total spend'],
      chip: ['chip-success', 'Live'],
    },
    {
      dot: 'var(--gold)',
      name: 'Pune Launch — NH-48 Unipole',
      meta: '15 Jun – 15 Sep 2026 · 3 months · Unipole · Wakad, Pune',
      v1: ['—', 'not started'],
      v2: ['₹4.2L', 'total budget'],
      chip: ['chip-pending', 'Scheduled'],
    },
    {
      dot: 'var(--indigo)',
      name: 'BKC LED — Q3 Brand Awareness',
      meta: 'Jul–Dec 2026 · 6 months · LED Digital · BKC, Mumbai',
      v1: ['—', 'pending'],
      v2: ['₹34.8L', 'total budget'],
      chip: ['chip-new', 'In Review'],
    },
  ];
  return (
    <div className="page active">
      <PageHeader
        title="My Campaigns"
        sub="Track all your active, scheduled, and completed campaigns."
      >
        <Link to={ROUTES.browse} className="btn-primary">
          + New Campaign
        </Link>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header">
          <h3>All Campaigns (3)</h3>
          <select className="sort-select" style={{ fontSize: 12, padding: '6px 10px' }}>
            <option>All Status</option>
            <option>Live</option>
            <option>Scheduled</option>
            <option>Completed</option>
          </select>
        </div>
        {rows.map((c) => (
          <div
            className="campaign-row"
            key={c.name}
            onClick={() => showToast('Campaign detail view coming soon!')}
          >
            <div className="campaign-dot" style={{ background: c.dot }} />
            <div className="campaign-info">
              <div className="campaign-name">{c.name}</div>
              <div className="campaign-meta">{c.meta}</div>
            </div>
            <div className="campaign-stats">
              <div>
                <div className="campaign-stat-val">{c.v1[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.v1[1]}</div>
              </div>
              <div>
                <div className="campaign-stat-val">{c.v2[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.v2[1]}</div>
              </div>
              <span className={cn('chip', c.chip[0])}>{c.chip[1]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPlan({ mediaPlan, removeFromMP }) {
  const { showToast } = useToast();
  const total = mediaPlan.reduce((s, i) => s + i.priceNum, 0);
  const cities = new Set(mediaPlan.map((i) => i.name.split('·')[1]?.trim()));
  const totalFoot = mediaPlan.reduce((s, i) => s + i.footfall, 0);
  return (
    <div className="page active">
      <PageHeader
        title="Media Plan Builder"
        sub="Combine multiple billboards into one unified campaign plan with total reach and cost."
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-ghost"
            onClick={() =>
              showToast('Media plan PDF is being generated… Check your email in a minute.')
            }
          >
            Export PDF
          </button>
          <Link to={ROUTES.browse} className="btn-primary">
            + Add Billboards
          </Link>
        </div>
      </PageHeader>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}
      >
        <div className="section-card">
          <div className="sc-header">
            <h3>Selected Billboards</h3>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              {mediaPlan.length} billboard{mediaPlan.length !== 1 ? 's' : ''}
            </span>
          </div>
          {mediaPlan.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-text">
                Your media plan is empty. Browse billboards and click &quot;+ Plan&quot; to add them
                here.
              </div>
              <Link
                to={ROUTES.browse}
                className="btn-primary"
                style={{ display: 'inline-flex', marginTop: 16 }}
              >
                Browse Billboards →
              </Link>
            </div>
          ) : (
            <>
              <div className="media-plan-items">
                {mediaPlan.map((i) => (
                  <div className="mp-item" key={i.id}>
                    <div
                      className="mp-item-icon"
                      style={{ background: i.color }}
                      dangerouslySetInnerHTML={html(i.icon)}
                    />
                    <div className="mp-item-info">
                      <div className="mp-item-name">{i.name}</div>
                      <div className="mp-item-meta">{i.meta}</div>
                    </div>
                    <div className="mp-item-price">{i.price}/mo</div>
                    <button className="mp-remove" onClick={() => removeFromMP(i.id)} title="Remove">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mp-total">
                <div className="mp-total-row">
                  <span className="mp-total-label">Subtotal</span>
                  <span className="mp-total-val">₹{L(total)}L/mo</span>
                </div>
                <div className="mp-total-row">
                  <span className="mp-total-label">3-month total</span>
                  <span className="mp-total-val">₹{L(total * 3)}L</span>
                </div>
                <div className="mp-total-row" style={{ marginTop: 8 }}>
                  <span
                    className="mp-total-label"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-rich)' }}
                  >
                    Monthly total
                  </span>
                  <span className="mp-grand">₹{L(total)}L</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ padding: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: 'var(--ink-faint)',
                marginBottom: 16,
              }}
            >
              Plan Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Billboards', mediaPlan.length],
                ['Cities covered', cities.size],
                ['Total daily footfall', totalFoot.toLocaleString('en-IN')],
                ['Est. monthly impressions', `${((totalFoot * 30) / 10000000).toFixed(1)}Cr`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                >
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 300 }}>
                  Total / month
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--indigo)',
                    letterSpacing: '-0.8px',
                  }}
                >
                  ₹{L(total)}L
                </span>
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
              onClick={() =>
                showToast('Media plan PDF is being generated… Check your email in a minute.')
              }
            >
              Export as PDF →
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => showToast('Sharing link copied!')}
            >
              Share Plan Link
            </button>
          </div>
          <div className="section-card" style={{ padding: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: 'var(--ink-faint)',
                marginBottom: 14,
              }}
            >
              Campaign Duration
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="form-control" defaultValue="2026-07-01" />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <select className="form-control" defaultValue="3 Months">
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>12 Months</option>
              </select>
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => showToast('Quote requests sent to all owners!')}
            >
              Request All Quotes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Quotes() {
  const { showToast } = useToast();
  return (
    <div className="page active">
      <PageHeader
        title="Quotes & Proposals"
        sub="Manage all incoming quote responses from billboard owners."
      />
      <div className="section-card">
        <div className="sc-header">
          <h3>All Quotes (5)</h3>
          <select className="sort-select" style={{ fontSize: 12, padding: '6px 10px' }}>
            <option>All Status</option>
            <option>New</option>
            <option>Reviewed</option>
            <option>Accepted</option>
            <option>Declined</option>
          </select>
        </div>
        {QUOTES.map((q) => (
          <div className="quote-card" key={q.id}>
            <div
              className="quote-avatar"
              style={{
                background: `linear-gradient(135deg,${q.color},${q.color === 'var(--indigo)' ? '#818CF8' : `${q.color}88`})`,
              }}
            >
              {q.init}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="quote-title">{q.title}</div>
              <div className="quote-sub">{q.sub}</div>
              <div className="quote-price">{q.price} / month</div>
              <div className="quote-actions">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => showToast('Opening full quote…')}
                >
                  View Quote
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => showToast('Negotiation request sent!')}
                >
                  Negotiate
                </button>
                <button className="btn-ghost btn-sm" onClick={() => showToast('Quote declined.')}>
                  Decline
                </button>
              </div>
            </div>
            <span className={cn('chip', q.statusClass)}>{q.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tenders() {
  const { showToast } = useToast();
  const rows = [
    {
      name: 'Mumbai FMCG Summer Launch',
      meta: '₹8–12L/mo · 3 months · Static or LED · Posted 3 days ago',
      bids: 5,
    },
    {
      name: 'Pune Market Expansion — Q3',
      meta: '₹2–5L/mo · 6 months · Any format · Posted 1 week ago',
      bids: 3,
    },
  ];
  return (
    <div className="page active">
      <PageHeader
        title="My Tenders"
        sub="View tenders you've posted and manage incoming bids from billboard owners."
      >
        <Link to={ROUTES.home} className="btn-primary">
          + Post New Tender
        </Link>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header">
          <h3>Active Tenders</h3>
        </div>
        {rows.map((t) => (
          <div className="tender-row" key={t.name}>
            <div className="tender-row-info">
              <div className="t-name">{t.name}</div>
              <div className="t-meta">{t.meta}</div>
            </div>
            <div className="tender-row-right">
              <div className="tender-bids">{t.bids}</div>
              <div className="tender-bids-label">bids received</div>
            </div>
            <button
              className="btn-primary btn-sm"
              onClick={() => showToast('Opening tender bids…')}
            >
              View Bids
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Analytics() {
  const { showToast } = useToast();
  const stats = [
    [
      'blue',
      'var(--indigo)',
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>,
      'Total Impressions',
      '4.2Cr',
      <>
        <span className="sc-trend up">↑18%</span> vs last month
      </>,
    ],
    [
      'teal',
      'var(--teal)',
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>,
      'Total Spend',
      '₹8.4L',
      'across 3 campaigns',
    ],
    [
      'gold',
      'var(--gold-dark)',
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>,
      'Effective CPM',
      '₹14',
      'vs ₹62 on Google Display',
    ],
    [
      'green',
      'var(--green)',
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>,
      'Digital Equivalent',
      '₹26L',
      <>
        <span className="sc-trend up">₹17.6L saved</span>
      </>,
    ],
  ];
  return (
    <div className="page active">
      <PageHeader
        title="Analytics & ROI"
        sub="Campaign performance, estimated reach, and cost comparison against digital."
      >
        <button className="btn-ghost" onClick={() => showToast('Report exported!')}>
          Export Report
        </button>
      </PageHeader>
      <div className="stats-row">
        {stats.map(([tone, stroke, icon, label, val, sub]) => (
          <div className={cn('stat-card', tone)} key={label}>
            <div className={cn('sc-icon', tone)}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke={stroke}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="sc-label">{label}</div>
            <div className="sc-val">{val}</div>
            <div className="sc-sub">{sub}</div>
          </div>
        ))}
      </div>
      <div className="section-card">
        <div className="sc-header">
          <h3>Monthly Impressions — Last 6 Months</h3>
        </div>
        <div className="chart-wrap" style={{ padding: '28px 24px' }}>
          <Chart maxH={200} />
          <div className="chart-legend">
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: 'var(--indigo)' }} />
              Impressions (Cr)
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />
              Spend (₹L)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(NOTIF_PREFS.map(() => true));
  return (
    <div className="page active">
      <PageHeader
        title="Account Settings"
        sub="Manage your profile, notifications and billing preferences."
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="section-card" style={{ padding: 28 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--ink-rich)',
              letterSpacing: '-0.3px',
              marginBottom: 20,
            }}
          >
            Profile Details
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" className="form-control" defaultValue={user?.firstName || ''} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" className="form-control" defaultValue={user?.lastName || ''} />
            </div>
          </div>
          <div className="form-group">
            <label>Business Email</label>
            <input type="email" className="form-control" defaultValue="rahul@company.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" className="form-control" defaultValue="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input type="text" className="form-control" defaultValue="Sharma Enterprises" />
          </div>
          <div className="form-group">
            <label>Industry</label>
            <select className="form-control" defaultValue="FMCG / Consumer Goods">
              <option>FMCG / Consumer Goods</option>
              <option>Real Estate</option>
              <option>Technology</option>
            </select>
          </div>
          <button className="btn-primary" onClick={() => showToast('Profile saved successfully!')}>
            Save Changes
          </button>
        </div>
        <div className="section-card" style={{ padding: 28 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--ink-rich)',
              letterSpacing: '-0.3px',
              marginBottom: 20,
            }}
          >
            Notification Preferences
          </h3>
          <div>
            {NOTIF_PREFS.map(([label, sub], i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--ink-rich)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300 }}>
                    {sub}
                  </div>
                </div>
                <div
                  className={cn('toggle-switch', prefs[i] && 'on')}
                  onClick={() => setPrefs((p) => p.map((v, idx) => (idx === i ? !v : v)))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseDash({ addToMP }) {
  const { showToast } = useToast();
  return (
    <div className="page active">
      <PageHeader title="Browse & Shortlist" sub="Your saved billboards and explore new inventory.">
        <Link to={ROUTES.browse} className="btn-primary">
          Open Full Browse →
        </Link>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header">
          <h3>Saved Billboards</h3>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>3 saved</span>
        </div>
        {SAVED.map((s) => (
          <div className="saved-item" key={s.id}>
            <div
              className="saved-item-icon"
              style={{ background: s.color }}
              dangerouslySetInnerHTML={html(s.icon)}
            />
            <div className="saved-item-info">
              <div className="saved-item-name">{s.name}</div>
              <div className="saved-item-meta">{s.meta}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="saved-item-price">{s.price}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>/month</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <button
                className="btn-primary btn-sm"
                onClick={() => showToast('Opening detail view…')}
              >
                View
              </button>
              <button className="btn-ghost btn-sm" onClick={() => addToMP(s)}>
                + Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function AdvertiserDashboard() {
  const { showToast } = useToast();
  const [page, setPage] = useState('overview');
  const [mediaPlan, setMediaPlan] = useState(MEDIA_PLAN_INIT);
  const nextId = useRef(10);

  const addToMP = useCallback(
    (item) => {
      if (mediaPlan.some((m) => m.name === item.name)) {
        showToast('Already in your media plan!');
        return;
      }
      setMediaPlan((prev) => [...prev, { ...item, id: nextId.current++ }]);
      showToast('Added to Media Plan! Open the builder to review.');
    },
    [mediaPlan, showToast],
  );

  const removeFromMP = useCallback(
    (id) => {
      setMediaPlan((prev) => prev.filter((i) => i.id !== id));
      showToast('Removed from media plan.');
    },
    [showToast],
  );

  const pages = useMemo(
    () => ({
      overview: <Overview onNav={setPage} mediaPlan={mediaPlan} />,
      campaigns: <Campaigns />,
      mediaplan: <MediaPlan mediaPlan={mediaPlan} removeFromMP={removeFromMP} />,
      'browse-dash': <BrowseDash addToMP={addToMP} />,
      quotes: <Quotes />,
      tenders: <Tenders />,
      analytics: <Analytics />,
      settings: <Settings />,

    }),
    [mediaPlan, setPage, addToMP, removeFromMP],
  );

  return (
    <div className="advertiser-dashboard-page">
      <Sidebar active={page} onNav={setPage} />
      <div className="main">
        <Topbar title={TITLES[page] || 'Dashboard'} />
        {pages[page]}
      </div>
    </div>
  );
}
