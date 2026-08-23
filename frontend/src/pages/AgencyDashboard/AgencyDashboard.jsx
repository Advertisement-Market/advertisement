import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/layout/Logo';
import {
  NAV, TITLES, NOTIFICATIONS, ONBOARD_STEPS, TENDERS, BIDS, CAMPAIGNS, CLIENTS, CASESTUDIES,
  ANALYTICS_CLIENTS, CHART_MONTHS, CHART_REVENUE, CHART_BIDS, CHART_WON,
} from './data';
import './AgencyDashboard.css';

const html = (s) => ({ __html: s });
const displayName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Agency';
const initialsOf = (user) =>
  ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'A';

function Sidebar({ active, onNav }) {
  const { user } = useAuth();
  return (
    <aside className="sb">
      <div className="sb-logo">
        <Link to={ROUTES.home}><LogoMark size={24} style={{ marginRight: 8 }} /><span className="logo-the">The</span><span className="logo-ad">Ad</span><span className="logo-bsk">Basket</span></Link>
        <div className="sb-logo-role">Agency Portal</div>
      </div>
      <div className="sb-user">
        <div className="sb-avatar">{initialsOf(user)}</div>
        <div><div className="sb-user-name">{displayName(user)}</div><div className="sb-user-plan">Verified Agency · Pro Plan</div></div>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Back to Home
        </Link>
      </div>
    </aside>
  );
}

function Topbar({ title }) {
  const { showToast } = useToast();
  const { user } = useAuth();
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
        <Link to={ROUTES.browse} className="btn-ghost btn-sm">Browse Billboards →</Link>
        <div style={{ position: 'relative', zIndex: 201 }} ref={ref}>
          <button className="notif-btn" onClick={() => setOpen((o) => !o)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
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
        <div className="sb-avatar" style={{ cursor: 'pointer' }}>{initialsOf(user)}</div>
      </div>
    </div>
  );
}

function Chart({ maxH, containerHeight }) {
  const maxR = Math.max(...CHART_REVENUE), maxB = Math.max(...CHART_BIDS), maxW = Math.max(...CHART_WON);
  return (
    <div className="chart-bar-group" style={containerHeight ? { height: containerHeight } : undefined}>
      {CHART_MONTHS.map((m, i) => (
        <div className="chart-bar-col" key={m}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%' }}>
            <div className="chart-bar gold-bar" style={{ height: (CHART_REVENUE[i] / maxR) * maxH, flex: 1 }} title={`₹${CHART_REVENUE[i]}L revenue`} />
            <div className="chart-bar indigo-bar" style={{ height: (CHART_BIDS[i] / maxB) * (maxH * 0.6), flex: 1 }} title={`${CHART_BIDS[i]} bids`} />
            <div className="chart-bar teal-bar" style={{ height: (CHART_WON[i] / maxW) * (maxH * 0.4), flex: 1 }} title={`${CHART_WON[i]} won`} />
          </div>
          <div className="chart-bar-label">{m}</div>
        </div>
      ))}
    </div>
  );
}

const STAT = (tone, stroke, inner, label, val, sub) => ({ tone, stroke, inner, label, val, sub });
function StatCards({ items }) {
  return (
    <div className="stats-row">
      {items.map((s) => (
        <div className={cn('stat-card', s.tone)} key={s.label}>
          <div className={cn('sc-icon', s.tone)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.inner}</svg></div>
          <div className="sc-label">{s.label}</div><div className="sc-val">{s.val}</div><div className="sc-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
function PageHeader({ title, sub, children }) {
  return (<div className="page-header"><div><h2>{title}</h2><p>{sub}</p></div>{children}</div>);
}

function TenderItem({ t, onToast }) {
  return (
    <div className="tender-item" onClick={() => onToast('Opening tender details…')}>
      <div className="ti-dot" style={{ background: t.color }} />
      <div className="ti-info">
        <div className="ti-sector">{t.sector}{t.isNew && <span style={{ fontSize: 9.5, background: 'var(--gold-light)', color: 'var(--gold-dark)', padding: '2px 8px', borderRadius: 50, fontWeight: 700, letterSpacing: '0.3px', marginLeft: 4 }}>NEW</span>}</div>
        <div className="ti-name">{t.name}</div>
        <div className="ti-meta"><span>{t.city}</span><span>{t.dur}</span><span>{t.fmt}</span></div>
      </div>
      <div className="ti-budget"><span className="ti-budget-val">{t.budget}</span><span className="ti-budget-lbl">per month</span></div>
      <button className="btn-gold btn-sm" onClick={(e) => { e.stopPropagation(); onToast('Opening bid form…'); }}>Bid Now →</button>
    </div>
  );
}

/* ── Overview ── */
function Overview({ onNav }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [onboard, setOnboard] = useState(true);
  const [steps, setSteps] = useState(ONBOARD_STEPS);
  const done = steps.filter((s) => s.done).length;
  const stepClick = (i) => setSteps((prev) => {
    if (prev[i].done) return prev;
    const next = prev.map((s, idx) => (idx === i ? { ...s, done: true } : s));
    if (next.every((s) => s.done)) showToast("Agency profile complete! You're now fully visible to advertisers.");
    return next;
  });
  return (
    <div className="page active">
      {onboard && (
        <div className="onboard-card">
          <div className="onboard-header">
            <div><h3>Welcome to The AdBasket, {user?.firstName || 'there'}!</h3><p>Complete your agency profile to unlock more tenders and direct briefs.</p></div>
            <button className="onboard-dismiss" onClick={() => { setOnboard(false); showToast('You can update your profile anytime in Agency Profile.'); }}>Dismiss</button>
          </div>
          <div className="onboard-progress-bar"><div className="onboard-progress-fill" style={{ width: `${(done / 5) * 100}%` }} /></div>
          <div className="onboard-steps">
            {steps.map((s, i) => (
              <div key={s.label} className={cn('onboard-step', s.done && 'done')} onClick={() => stepClick(i)}><div className="onboard-step-check">{s.done ? '✓' : ''}</div>{s.label}</div>
            ))}
          </div>
        </div>
      )}
      <StatCards items={[
        STAT('blue', 'var(--gold-dark)', <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>, 'Active Bids', '5', <><span className="sc-trend up">+3</span> this week</>),
        STAT('teal', 'var(--indigo-dark)', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></>, 'Tenders Won', '12', <><span className="sc-trend up">+2</span> this month</>),
        STAT('gold', 'var(--teal)', <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="17" /><line x1="9.5" y1="14.5" x2="14.5" y2="14.5" /></>, 'Active Campaigns', '4', '₹34.5L total value'),
        STAT('green', 'var(--green)', <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, 'Revenue This Month', '₹18.2L', <><span className="sc-trend up">↑24%</span> vs last month</>),
      ]}
      />
      <div className="content-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header"><h3>Tenders Matching Your Profile</h3><button className="link" onClick={() => onNav('tenders')}>View all 12 →</button></div>
            {TENDERS.slice(0, 3).map((t) => (<TenderItem key={t.name} t={t} onToast={showToast} />))}
          </div>
          <div className="section-card">
            <div className="sc-header"><h3>Revenue — Last 6 Months</h3><button className="link" onClick={() => onNav('analytics')}>Full analytics →</button></div>
            <div className="chart-wrap">
              <Chart maxH={140} />
              <div className="chart-legend"><div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--gold)' }} />Revenue (₹L)</div><div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--indigo)' }} />Bids Submitted</div></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header"><h3>My Active Bids</h3><button className="link" onClick={() => onNav('mybids')}>View all →</button></div>
            {[['FM', 'var(--gold),#FBBF24', 'FMCG Summer Launch · Mumbai', '₹8–12L/mo · 3 months · Static or LED', '₹9.5L / month', 'chip-new', 'Shortlisted'],
              ['AT', 'var(--indigo),#818CF8', 'Auto Brand · Hyderabad', '₹15–25L/mo · 3 months · Gantry', '₹18L / month', 'chip-pending', 'Under Review']].map(([init, grad, title, sub, price, chip, status]) => (
              <div className="bid-card" key={init}>
                <div className="bid-avatar" style={{ background: `linear-gradient(135deg,${grad})` }}>{init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bid-title">{title}</div><div className="bid-sub">{sub}</div><div className="bid-price">Your bid: {price}</div>
                  <div className="bid-actions"><button className="btn-gold btn-sm" onClick={() => showToast('Opening bid details…')}>Track Bid</button><button className="btn-ghost btn-sm" onClick={() => showToast('Bid updated!')}>Edit</button></div>
                </div>
                <span className={cn('chip', chip)}>{status}</span>
              </div>
            ))}
          </div>
          <div className="section-card">
            <div className="sc-header"><h3>Direct Briefs</h3><span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>1 new</span></div>
            {[['Reliance Retail — Q3 OOH Drive', 'Pan India · 12 months · ₹1Cr+ · Sent 1 day ago', 'View Brief', 'Message', 'Message sent!', 'chip-new', 'New', true],
              ['EdTech Startup — Pune College Drive', 'Pune · 2 months · ₹2–5L · Sent 4 days ago', 'View Brief', 'Send Proposal', 'Proposal sent!', 'chip-pending', 'Responded', false]].map(([name, meta, b1, b2, t2, chip, status], i) => (
              <div key={name} style={{ padding: '16px 22px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-rich)' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>{meta}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}><button className="btn-gold btn-sm" onClick={() => showToast('Opening brief…')}>{b1}</button><button className="btn-ghost btn-sm" onClick={() => showToast(t2)}>{b2}</button></div>
                  </div>
                  <span className={cn('chip', chip)}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tenders({ onToast }) {
  return (
    <div className="page active">
      <PageHeader title="Tender Board" sub="Live advertiser tenders matched to your agency profile. Pro plan — unlimited bids.">
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="sort-select" onChange={() => onToast('Filter applied.')}><option>All Sectors</option><option>FMCG</option><option>Real Estate</option><option>Automotive</option><option>Education</option><option>Finance</option></select>
          <select className="sort-select" onChange={() => onToast('Filter applied.')}><option>All Cities</option><option>Mumbai</option><option>Delhi NCR</option><option>Bengaluru</option><option>Hyderabad</option><option>Pune</option></select>
        </div>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header"><h3>Active Tenders (12)</h3><span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Updated live</span></div>
        {TENDERS.map((t) => (<TenderItem key={t.name} t={t} onToast={onToast} />))}
      </div>
    </div>
  );
}

function MyBids({ onToast }) {
  return (
    <div className="page active">
      <PageHeader title="My Bids" sub="Track all bids you've submitted — shortlisted, under review, won, and lost." />
      <div className="section-card">
        <div className="sc-header"><h3>All Bids (5)</h3><select className="sort-select"><option>All Status</option><option>Shortlisted</option><option>Under Review</option><option>Won</option><option>Lost</option></select></div>
        {BIDS.map((b) => (
          <div className="bid-row" key={b.name} onClick={() => onToast('Opening bid details…')}>
            <div className="bid-row-dot" style={{ background: b.color }} />
            <div className="bid-row-info"><div className="bid-row-name">{b.name}</div><div className="bid-row-meta">{b.meta}</div></div>
            <div className="bid-row-right"><div><div className="brr-val">{b.bid}</div><div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>your bid</div></div></div>
            <span className={cn('chip', b.chip)}>{b.status}</span>
            <button className="btn-gold btn-sm" onClick={(e) => { e.stopPropagation(); onToast('Opening bid details…'); }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Campaigns({ onToast }) {
  return (
    <div className="page active">
      <PageHeader title="Active Campaigns" sub="Campaigns you are currently managing on behalf of clients.">
        <button className="btn-gold" onClick={() => onToast('Browse tenders to win new campaigns.')}>+ New Campaign</button>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header"><h3>Running Campaigns (4)</h3><select className="sort-select"><option>All Status</option><option>Live</option><option>Scheduled</option><option>Completed</option></select></div>
        {CAMPAIGNS.map((c) => (
          <div key={c.name} className="campaign-list-row" onClick={() => onToast('Opening campaign details…')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 22px', borderBottom: '1px solid var(--border)', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={html(c.icon)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-rich)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>{c.meta}</div>
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--ink-muted)', flexShrink: 0 }}>
              <div><div style={{ fontWeight: 500, color: 'var(--ink-rich)' }}>{c.impressions}</div><div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>impressions</div></div>
              <div><div style={{ fontWeight: 500, color: 'var(--ink-rich)' }}>{c.spend}</div><div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>spend</div></div>
            </div>
            <span className={cn('chip', c.chip)}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Clients({ onToast }) {
  return (
    <div className="page active">
      <PageHeader title="Clients" sub="All brands and businesses you've worked with or are currently serving.">
        <button className="btn-gold" onClick={() => onToast('Client added!')}>+ Add Client</button>
      </PageHeader>
      <div className="section-card">
        <div className="sc-header"><h3>All Clients (6)</h3><span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>₹1.4Cr total value</span></div>
        {CLIENTS.map((c) => (
          <div className="client-row" key={c.name} onClick={() => onToast('Opening client profile…')}>
            <div className="client-avatar" style={{ background: c.color }}>{c.init}</div>
            <div className="client-info"><div className="client-name">{c.name}</div><div className="client-meta">{c.meta}</div></div>
            <div><div className="client-val">{c.val}</div><div className="client-val-sub">{c.sub}</div></div>
            <button className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onToast('Opening client details…'); }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudies({ onToast, onNav }) {
  const bars = [['Profile completeness', '82%', 'var(--gold)', 82], ['Tender response rate', '78%', 'var(--indigo)', 78], ['Client satisfaction', '4.9 / 5', 'var(--green)', 98]];
  const stats = [['Profile views (30d)', '342'], ['Direct briefs received', '8'], ['Tenders won this year', '12']];
  return (
    <div className="page active">
      <PageHeader title="Case Studies" sub="Showcase your best work. Published case studies improve your tender win rate.">
        <button className="btn-gold" onClick={() => onToast('Case study editor opening…')}>+ Add Case Study</button>
      </PageHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        <div className="section-card">
          <div className="sc-header"><h3>Published Case Studies (3)</h3><span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Visible on your public profile</span></div>
          {CASESTUDIES.map((cs) => (
            <div className="case-row" key={cs.name} onClick={() => onToast('Opening case study editor…')}>
              <div className="case-thumb" style={{ background: cs.bg }} dangerouslySetInnerHTML={html(cs.icon)} />
              <div className="case-info"><div className="case-name">{cs.name}</div><div className="case-meta">{cs.meta}</div></div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}><div className="case-result">{cs.result}</div><button className="btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={(e) => { e.stopPropagation(); onToast('Opening case study editor…'); }}>Edit</button></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-faint)', marginBottom: 14 }}>Profile Strength</div>
            {bars.map(([label, val, color, pct]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}><span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{label}</span><span style={{ fontWeight: 500 }}>{val}</span></div>
                <div style={{ background: 'var(--cream-warm)', borderRadius: 50, height: 6 }}><div style={{ background: color, borderRadius: 50, height: '100%', width: `${pct}%` }} /></div>
              </div>
            ))}
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNav('profile')}>View Public Profile →</button>
          </div>
          <div className="section-card" style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-faint)', marginBottom: 14 }}>Quick Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.map(([k, v]) => (<div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>Total reviews</span><span style={{ fontWeight: 500, color: 'var(--gold-dark)' }}>★ 4.9 · 14 reviews</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Analytics({ onToast }) {
  return (
    <div className="page active">
      <PageHeader title="Analytics & Revenue" sub="Track your agency's bid performance, revenue growth, and client ROI.">
        <button className="btn-ghost" onClick={() => onToast('Report exported!')}>Export Report</button>
      </PageHeader>
      <StatCards items={[
        STAT('blue', 'var(--gold-dark)', <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, 'Revenue YTD', '₹1.4Cr', <><span className="sc-trend up">↑31%</span> vs last year</>),
        STAT('teal', 'var(--indigo-dark)', <><circle cx="12" cy="8" r="6" /><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" /></>, 'Tender Win Rate', '38%', '12 of 31 bids won'),
        STAT('gold', 'var(--teal)', <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, 'Profile Views', '342', <><span className="sc-trend up">↑18%</span> this month</>),
        STAT('green', 'var(--green)', <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>, 'Avg. Client Rating', '4.9', 'across 14 reviews'),
      ]}
      />
      <div className="section-card">
        <div className="sc-header"><h3>Monthly Revenue — Last 6 Months</h3></div>
        <div className="chart-wrap" style={{ padding: '28px 24px' }}>
          <Chart maxH={180} containerHeight={200} />
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--gold)' }} />Revenue (₹L)</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--indigo)' }} />Bids Submitted</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />Tenders Won</div>
          </div>
        </div>
      </div>
      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="sc-header"><h3>Revenue by Client</h3></div>
        {ANALYTICS_CLIENTS.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
            <div className="client-avatar" style={{ background: c.color, width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.init}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-rich)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 2 }}>{c.campaigns} active campaign{c.campaigns > 1 ? 's' : ''}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px' }}>{c.revenue}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>{c.share} of revenue</div>
            </div>
            <div style={{ width: 80 }}><div style={{ background: 'var(--cream-warm)', borderRadius: 50, height: 6 }}><div style={{ background: 'var(--gold)', borderRadius: 50, height: '100%', width: c.share }} /></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile({ onToast }) {
  const industries = [['FMCG', true], ['Real Estate', true], ['Automotive', true], ['Education', false], ['Finance', false], ['Healthcare', false], ['Technology', false], ['Retail', false]];
  return (
    <div className="page active">
      <PageHeader title="Agency Profile" sub="Your public-facing profile visible to all advertisers on The AdBasket.">
        <button className="btn-gold" onClick={() => onToast('Profile saved!')}>Save Changes</button>
      </PageHeader>
      <div className="profile-banner">
        <div className="pb-logo">PP</div>
        <div className="pb-info">
          <div className="pb-name">Pixel &amp; Print Co.</div>
          <div className="pb-sub">Full-Service Ad Agency · Mumbai · Since 2014</div>
          <div className="pb-tags">
            <span className="pb-tag">OOH Planning</span><span className="pb-tag">Creative</span><span className="pb-tag">FMCG</span><span className="pb-tag">Production</span>
            <span className="pb-verified">✓ GST Verified</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', position: 'relative', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>★ 4.9</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 300 }}>14 reviews</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginTop: 4 }}>342 profile views / month</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="section-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px', marginBottom: 20 }}>Agency Details</h3>
          <div className="form-row"><div className="form-group"><label>Agency Name</label><input type="text" className="form-control" defaultValue="Pixel & Print Co." /></div><div className="form-group"><label>Founded Year</label><input type="text" className="form-control" defaultValue="2014" /></div></div>
          <div className="form-group"><label>Tagline</label><input type="text" className="form-control" defaultValue="Bold ideas. Visible impact." /></div>
          <div className="form-group"><label>About Your Agency</label><textarea className="form-control" rows="3" style={{ resize: 'vertical' }} defaultValue="Full-service OOH advertising agency specializing in high-impact campaigns across Mumbai, Delhi, and Bengaluru. 10+ years of experience, 200+ campaigns delivered." /></div>
          <div className="form-row"><div className="form-group"><label>City</label><input type="text" className="form-control" defaultValue="Mumbai" /></div><div className="form-group"><label>Team Size</label><select className="form-control" defaultValue="16–50"><option>1–5</option><option>6–15</option><option>16–50</option><option>50+</option></select></div></div>
          <div className="form-group"><label>Website</label><input type="url" className="form-control" defaultValue="https://pixelandprint.in" /></div>
          <button className="btn-gold" onClick={() => onToast('Profile saved!')}>Save Details</button>
        </div>
        <div className="section-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px', marginBottom: 20 }}>Services &amp; Specialisations</h3>
          <div className="form-group"><label>Primary Service Type</label>
            <select className="form-control" defaultValue="Full-Service Agency"><option>Full-Service Agency</option><option>Media Planning Only</option><option>Production House</option><option>OOH Specialist</option><option>PR and Integrated</option></select>
          </div>
          <div className="form-group"><label>Industry Specialisations</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {industries.map(([name, checked]) => (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-muted)', cursor: 'pointer', background: 'var(--cream)', border: '1px solid var(--border-medium)', padding: '5px 12px', borderRadius: 50 }}>
                  <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--gold)' }} /> {name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}><label>Min Campaign Budget</label>
            <select className="form-control" defaultValue="₹5L+"><option>Any</option><option>₹1L+</option><option>₹5L+</option><option>₹25L+</option><option>₹1Cr+</option></select>
          </div>
          <div className="form-group"><label>Coverage Cities</label><input type="text" className="form-control" defaultValue="Mumbai, Delhi NCR, Bengaluru, Pune" /></div>
          <button className="btn-gold" onClick={() => onToast('Services updated!')}>Save Services</button>
        </div>
      </div>
    </div>
  );
}

function Settings({ onToast }) {
  const { user } = useAuth();
  const prefs = [['New tender posted', 'Email + App'], ['Bid shortlisted', 'Email + App'], ['Direct brief received', 'Email + App'], ['Tender won / lost', 'Email'], ['Weekly performance report', 'Email']];
  const [on, setOn] = useState(prefs.map(() => true));
  return (
    <div className="page active">
      <PageHeader title="Account Settings" sub="Manage your contact details, notifications, and billing plan." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="section-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px', marginBottom: 20 }}>Contact Details</h3>
          <div className="form-row"><div className="form-group"><label>First Name</label><input type="text" className="form-control" defaultValue={user?.firstName || ''} /></div><div className="form-group"><label>Last Name</label><input type="text" className="form-control" defaultValue={user?.lastName || ''} /></div></div>
          <div className="form-group"><label>Business Email</label><input type="email" className="form-control" defaultValue="priya@pixelandprint.in" /></div>
          <div className="form-group"><label>Phone</label><input type="tel" className="form-control" defaultValue="+91 98200 11234" /></div>
          <div className="form-group"><label>GST Number</label><input type="text" className="form-control" defaultValue="27AABCP5678R1Z4" readOnly style={{ background: '#F3F4F6', color: 'var(--ink-muted)' }} /></div>
          <div className="form-group"><label>PAN Number</label><input type="text" className="form-control" defaultValue="AABCP5678R" readOnly style={{ background: '#F3F4F6', color: 'var(--ink-muted)' }} /></div>
          <button className="btn-gold" onClick={() => onToast('Contact details saved!')}>Save Changes</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px', marginBottom: 6 }}>Current Plan</h3>
            <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold-dark)', letterSpacing: '-0.5px' }}>Pro Agency Plan</div>
              <div style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 300, marginTop: 4 }}>₹4,999/month · Renews 10 Jul 2026</div>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13, color: 'var(--gold-dark)', fontWeight: 300, lineHeight: 2 }}>
                {['Unlimited tender bids', 'Verified agency badge', '5 case study slots', 'Priority listing in search', 'Direct brief inbox'].map((f) => (<li key={f}>{f}</li>))}
              </ul>
            </div>
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onToast('Opening upgrade plans…')}>Upgrade to Enterprise →</button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => onToast('Opening billing portal…')}>Manage Billing</button>
          </div>
          <div className="section-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink-rich)', letterSpacing: '-0.3px', marginBottom: 20 }}>Notification Preferences</h3>
            {prefs.map(([label, sub], i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--ink-rich)' }}>{label}</div><div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 300 }}>{sub}</div></div>
                <div className={cn('toggle-switch', on[i] && 'on')} onClick={() => setOn((p) => p.map((v, idx) => (idx === i ? !v : v)))} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function AgencyDashboard() {
  const { showToast } = useToast();
  const [page, setPage] = useState('overview');
  const nav = (p) => setPage(p);
  return (
    <div className="agency-dashboard-page">
      <Sidebar active={page} onNav={nav} />
      <div className="main">
        <Topbar title={TITLES[page] || 'Dashboard'} />
        {page === 'overview' && <Overview onNav={nav} />}
        {page === 'tenders' && <Tenders onToast={showToast} />}
        {page === 'mybids' && <MyBids onToast={showToast} />}
        {page === 'campaigns' && <Campaigns onToast={showToast} />}
        {page === 'clients' && <Clients onToast={showToast} />}
        {page === 'casestudies' && <CaseStudies onToast={showToast} onNav={nav} />}
        {page === 'analytics' && <Analytics onToast={showToast} />}
        {page === 'profile' && <Profile onToast={showToast} />}
        {page === 'settings' && <Settings onToast={showToast} />}
      </div>
    </div>
  );
}
