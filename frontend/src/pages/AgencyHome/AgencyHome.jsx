import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { HomeLayout } from '@/components/home';
import { Counter } from '@/components/ui/Counter';
import { AGENCY_FOOTER } from './agencyFooter';
import './AgencyHome.css';

const toastMsg = 'Sign-in coming soon — use Register for now.';

const check = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

function useAgencyNav() {
  const { showToast } = useToast();
  return {
    activeRole: 'agency',
    accentBtn: 'btn-gold',
    dashboardTo: ROUTES.agencyDashboard,
    ctaLabel: 'Register Agency →',
    ctaTo: ROUTES.agencyRegister,
    onSignIn: () => showToast(toastMsg),
    links: [
      { label: 'Why AdBasket', href: '#why' },
      { label: 'Live Tenders', href: '#tenders' },
      { label: 'Your Profile', href: '#profile-preview' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    mobileLinks: [
      { label: 'Why AdBasket', href: '#why' },
      { label: 'Live Tenders', href: '#tenders' },
      { label: 'Your Profile', href: '#profile-preview' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  };
}

/* ── STICKY CTA ── */
function StickyCta() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="sticky-cta">
      <div className="sticky-left">
        <div className="sticky-steps">
          <div className="sticky-step done" />
          <div className="sticky-step" />
          <div className="sticky-step" />
          <div className="sticky-step" />
        </div>
        <div className="sticky-text">
          <strong>5,000+ tenders are live right now.</strong> Register your agency to start bidding
          — free in 15 minutes.
        </div>
      </div>
      <div className="sticky-right">
        <span
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </span>
        <Link to={ROUTES.agencyRegister} className="btn-gold btn-sm">
          Register Free →
        </Link>
      </div>
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  const { showToast } = useToast();
  const rows = [
    [
      'var(--indigo)',
      'FMCG',
      ['new-tag nt-em', 'NEW'],
      'Summer launch · Mumbai & Pune',
      '6 bids · Closes in 8 days',
      '₹8–12L',
      false,
    ],
    [
      'var(--rose)',
      'Automotive',
      ['new-tag nt-red', 'HOT'],
      'Model launch · Hyderabad highways',
      '14 bids · Closes in 3 days',
      '₹15–25L',
      false,
    ],
    [
      'var(--amber)',
      'EdTech',
      ['new-tag nt-amber', 'URGENT'],
      'Admissions push · Pune & Bengaluru',
      '3 bids · Closes in 5 days',
      '₹2–5L',
      false,
    ],
    [
      'var(--purple)',
      'Banking / Finance',
      null,
      'Pan India brand awareness · 8 metros',
      'LED preferred · 12 months',
      '₹50L–1Cr',
      true,
    ],
    [
      'var(--teal)',
      'Real Estate',
      null,
      'Township launch · Delhi NCR highways',
      '6 months · Premium hoardings',
      '₹3–5L',
      true,
    ],
  ];
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" /> For Ad Agencies &amp; Service Providers · India
        </div>
        <h1 className="hero-headline">
          Stop chasing.
          <br />
          Start <em>closing.</em>
        </h1>
        <p className="hero-sub">
          India&apos;s biggest OOH brands post ₹50K to ₹10Cr+ campaign briefs on The AdBasket daily.
          Your next client is already here — they just can&apos;t find you yet.
        </p>
        <div className="hero-actions">
          <Link to={ROUTES.agencyRegister} className="btn-gold btn-large">
            Register Your Agency →
          </Link>
          <a href="#tenders" className="btn-ghost btn-large">
            See Live Tenders
          </a>
        </div>
        <div className="hero-note">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>{' '}
          Verified agencies (GST + PAN) win <strong>3.4× more tenders.</strong> Badge approved in
          2–3 business days.
        </div>
        <div className="hero-trust">
          <div className="hero-trust-stat">
            <Counter className="hero-trust-num" target={5000} />
            <span className="hero-trust-label">Active tenders / month</span>
          </div>
          <div className="hero-trust-divider" />
          <div className="hero-trust-stat">
            <span className="hero-trust-num">₹2.4Cr+</span>
            <span className="hero-trust-label">Average tender value</span>
          </div>
          <div className="hero-trust-divider" />
          <div className="hero-trust-stat">
            <Counter className="hero-trust-num" target={840} />
            <span className="hero-trust-label">Verified agencies</span>
          </div>
          <div className="hero-trust-divider" />
          <div className="hero-trust-stat">
            <span className="hero-trust-num">180+</span>
            <span className="hero-trust-label">Cities across India</span>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="activity-card">
          <div className="ac-header">
            <div className="ac-header-left">
              <div className="ac-dot-r" />
              <div className="ac-dot-y" />
              <div className="ac-dot-g" />
            </div>
            <span className="ac-title">TENDERS POSTED TODAY</span>
            <div className="ac-live">
              <span className="ac-live-dot" />
              Live
            </div>
          </div>
          {rows.map(([color, sector, tag, brief, meta, amount, locked]) => (
            <div
              className="ac-row"
              key={sector}
              style={locked ? { position: 'relative' } : undefined}
              onClick={
                locked
                  ? undefined
                  : () => showToast('Register to view full details and bid on this tender.')
              }
            >
              <div className="ac-sector-dot" style={{ background: color }} />
              <div
                className="ac-info"
                style={locked ? { filter: 'blur(3.5px)', userSelect: 'none' } : undefined}
              >
                <div className="ac-sector-label">
                  {sector} {tag && <span className={tag[0]}>{tag[1]}</span>}
                </div>
                <div className="ac-brief">{brief}</div>
                <div className="ac-meta">{meta}</div>
              </div>
              <div className="ac-amount" style={locked ? { filter: 'blur(3.5px)' } : undefined}>
                {amount}
              </div>
              {locked && (
                <div className="ac-lock">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>{' '}
                  Locked
                </div>
              )}
            </div>
          ))}
          <div className="ac-footer">
            <span className="ac-count">
              +<Counter as="strong" target={47} suffix="" /> more tenders today
            </span>
            <Link to={ROUTES.agencyRegister} className="btn-gold btn-sm">
              Unlock All →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── LIVE TICKER ── */
const TICKER = [
  [
    'tag-open',
    'Open',
    <>
      <strong>FMCG brand</strong> · Mumbai · ₹8–12L/mo · 3 months <span className="ticker-sep" /> 6
      bids
    </>,
  ],
  [
    'tag-new',
    'New',
    <>
      <strong>Real Estate</strong> · Delhi NCR · ₹3–5L/mo · 6 months
    </>,
  ],
  [
    'tag-hot',
    'Hot',
    <>
      <strong>Automotive launch</strong> · Hyderabad · ₹15–25L/mo · 14 agencies bidding
    </>,
  ],
  [
    'tag-open',
    'Open',
    <>
      <strong>EdTech brand</strong> · Pune · ₹2–5L/mo · College clusters
    </>,
  ],
  [
    'tag-new',
    'New',
    <>
      <strong>Banking / Finance</strong> · Pan India · ₹50L–1Cr/mo · LED preferred
    </>,
  ],
  [
    'tag-open',
    'Open',
    <>
      <strong>Retail chain</strong> · Bengaluru · ₹6–9L/mo · Metro stations
    </>,
  ],
  [
    'tag-hot',
    'Hot',
    <>
      <strong>Healthcare brand</strong> · Chennai · ₹4–7L/mo · Hospital corridors
    </>,
  ],
  [
    'tag-new',
    'New',
    <>
      <strong>D2C Startup</strong> · Mumbai · ₹1–3L/mo · Youth localities
    </>,
  ],
];
function Ticker() {
  return (
    <div className="live-ticker">
      <div className="ticker-track">
        {[...TICKER, ...TICKER].map(([cls, label, body], i) => (
          <span className="ticker-item" key={i}>
            <span className={cn('t-tag', cls)}>{label}</span>
            {body}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── TRUST WALL ── */
const TRUST = [
  ['tc-em', 'M', 'Marico'],
  ['tc-indigo', 'H', 'HDFC Bank'],
  ['tc-teal', 'B', "Byju's"],
  ['tc-amber', 'T', 'Tata Motors'],
  ['tc-purple', 'M', 'Myntra'],
  ['tc-rose', 'Z', 'Zomato'],
];
function TrustWall() {
  return (
    <section className="trust-section">
      <div className="trust-inner">
        <span className="trust-label">Trusted by agencies working with</span>
        <div className="trust-logos">
          {TRUST.map(([cls, init, name]) => (
            <div className="trust-chip" key={name}>
              <div className={cn('trust-chip-dot', cls)}>{init}</div>
              {name}
            </div>
          ))}
        </div>
        <div className="trust-verified">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>{' '}
          All brands KYC-verified
        </div>
      </div>
    </section>
  );
}

/* ── WHY ── */
const WHY = [
  [
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    '01',
    'Inbound, Not Outbound',
    'Brands discover your verified profile and send briefs directly. No cold calls, no intermediaries, no ghost-pitch cycles. You respond to real budgets only.',
    '7 days',
    'avg. time to first inquiry after going live',
  ],
  [
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    '02',
    'Anonymous, Fair Bidding',
    'You see the brief and budget. Brands only see bid count, not who submitted. Your identity is revealed only if they choose your proposal. Level playing field — always.',
    '0%',
    'commission on tenders you win',
  ],
  [
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>,
    '03',
    'One Dashboard, Full Pipeline',
    'Tender feed, bid tracker, client inbox, analytics, case study portfolio — every tool your agency needs to run its OOH business in one clean command centre.',
    '840+',
    'agencies already registered across India',
  ],
];
function Why() {
  return (
    <section className="why-section" id="why">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Why The AdBasket
      </div>
      <h2 className="section-title">
        Clients are posting budgets.
        <br />
        <em>Not waiting for pitches.</em>
      </h2>
      <p className="section-subtitle">
        The traditional agency model is built on cold outreach and brokered introductions. AdBasket
        flips it: verified brands come to you with campaign budgets already allocated.
      </p>
      <div className="why-grid">
        {WHY.map(([icon, num, title, desc, mv, ml]) => (
          <div className="why-card" key={num}>
            <div className="why-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="why-num">{num}</div>
            <div className="why-title">{title}</div>
            <div className="why-desc">{desc}</div>
            <div className="why-metric">
              <span className="why-metric-val">{mv}</span>
              <span className="why-metric-label">{ml}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── LIVE TENDERS ── */
const T_FILTERS = [
  ['all', 'All Sectors'],
  ['fmcg', 'FMCG'],
  ['realty', 'Real Estate'],
  ['auto', 'Automotive'],
  ['fin', 'Banking'],
];
const TENDERS = [
  {
    sector: 'fmcg',
    dot: 'c-fmcg',
    label: 'FMCG',
    badge: ['badge-hot', 'HOT'],
    desc: 'Summer launch campaign · Mumbai & Pune · Static + LED hoardings',
    meta: ['3-month campaign', 'Mumbai, Pune, Bengaluru', '6 bids so far'],
    budget: '₹8–12L',
    locked: false,
  },
  {
    sector: 'auto',
    dot: 'c-auto',
    label: 'Automotive',
    badge: ['badge-urgent', 'URGENT'],
    desc: 'New model launch · Hyderabad highway corridors · LED preferred',
    meta: ['2-month campaign', 'Hyderabad, Chennai', '14 bids so far'],
    budget: '₹15–25L',
    locked: false,
  },
  {
    sector: 'edu',
    dot: 'c-edu',
    label: 'EdTech',
    badge: ['badge-new', 'NEW'],
    desc: 'Admissions push campaign · Pune & Bengaluru college clusters',
    meta: ['3-month campaign', 'Pune, Bengaluru', '3 bids so far'],
    budget: '₹2–5L',
    locked: false,
  },
  {
    sector: 'fin',
    dot: 'c-fin',
    label: 'Banking / Finance',
    badge: null,
    desc: 'Pan India brand awareness · 8 metros · 12-month campaign',
    meta: ['Pan India · LED preferred'],
    budget: '₹50L–1Cr',
    locked: true,
  },
  {
    sector: 'realty',
    dot: 'c-realty',
    label: 'Real Estate',
    badge: null,
    desc: 'Township launch · Delhi NCR highway corridors · Premium hoardings',
    meta: ['6 months · Delhi NCR'],
    budget: '₹3–5L',
    locked: true,
  },
];
function LiveTenders() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  return (
    <section className="tenders-section" id="tenders">
      <div className="tenders-header">
        <div>
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            Live Tenders
          </div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Briefs posted today.
            <br />
            <em>Waiting for your bid.</em>
          </h2>
        </div>
        <div className="tender-filter-bar">
          {T_FILTERS.map(([key, label]) => (
            <button
              key={key}
              className={cn('t-filter', filter === key && 'active')}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="section-subtitle" style={{ marginBottom: 28 }}>
        Verified businesses post campaign budgets anonymously. Your bid is blind — company identity
        revealed only after they accept your proposal.
      </p>
      <div className="tender-list">
        {TENDERS.map((t) => (
          <div
            className={cn('tender-row', t.locked && 'locked')}
            key={t.label}
            style={{ display: filter === 'all' || t.sector === filter ? undefined : 'none' }}
            onClick={t.locked ? undefined : () => showToast('Register to bid on this tender.')}
          >
            <div className={cn('t-dot', t.dot)} />
            <div className="t-info">
              <div className="t-sector">
                {t.label} {t.badge && <span className={cn('badge', t.badge[0])}>{t.badge[1]}</span>}
              </div>
              <div className="t-desc">{t.desc}</div>
              <div className="t-meta">
                {t.meta.map((m, i) => (
                  <span key={m} style={{ display: 'contents' }}>
                    {i > 0 && <span>·</span>}
                    {i === t.meta.length - 1 && t.meta.length > 1 ? (
                      <div className="t-bids">
                        <div className="t-bids-dot" />
                        {m}
                      </div>
                    ) : (
                      <span>{m}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="t-budget">
              <span className="t-budget-val">{t.budget}</span>
              <span className="t-budget-lbl">per month</span>
            </div>
            {t.locked ? (
              <div className="t-lock-overlay">
                <div className="t-lock-msg">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>{' '}
                  Register to view &amp; bid on this tender
                </div>
              </div>
            ) : (
              <Link to={ROUTES.agencyRegister} className="btn-gold btn-sm t-bid-btn">
                Bid Now →
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="tenders-footer">
        <div className="tenders-footer-text">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>{' '}
          <strong>47 new tenders</strong> added in the last 24 hours — most closed within 3–5 days
          of going live.
        </div>
        <Link to={ROUTES.agencyRegister} className="btn-gold btn-sm">
          Unlock Full Feed →
        </Link>
      </div>
    </section>
  );
}

/* ── HEATMAP ── */
const SECTORS = [
  ['FMCG & Retail', 34, 'var(--indigo)', '1,420 tenders'],
  ['Real Estate', 22, 'var(--teal)', '917 tenders'],
  ['Automotive', 16, 'var(--gold)', '668 tenders'],
  ['Banking & Finance', 11, 'var(--purple)', '459 tenders'],
  ['Education & EdTech', 8, 'var(--amber)', '334 tenders'],
  ['Healthcare', 6, 'var(--rose)', '250 tenders'],
  ['D2C & Startups', 3, 'var(--ink-muted)', '125 tenders'],
];
const INSIGHTS = [
  [
    'var(--indigo-light)',
    'var(--indigo)',
    <>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </>,
    'FMCG dominates by volume',
    'Consumer goods brands run the most OOH campaigns in India — seasonal, product launches, and always-on. Ideal for full-service agencies.',
    '1,420 tenders',
  ],
  [
    'var(--teal-light)',
    'var(--teal)',
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>,
    'Real estate is highest value',
    "Average real estate tender runs 6–12 months with premium hoardings. Single deals that can anchor your agency's pipeline for the year.",
    'Avg. ₹8L/mo per tender',
  ],
  [
    'var(--gold-light)',
    'var(--gold-dark)',
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>,
    'D2C and startups are rising',
    "India's D2C brands are shifting to OOH aggressively. Smaller budgets but fast decisions — and they almost always rebrand yearly.",
    '+89% YoY growth',
  ],
];
function Heatmap() {
  return (
    <section className="heatmap-section" id="sectors">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Demand Heatmap
      </div>
      <h2 className="section-title">
        Where the <em>budgets are.</em>
      </h2>
      <p className="section-subtitle">
        Real-time breakdown of tender demand across sectors. Use this to position your agency where
        inbound is highest — or find the white space your competitors have missed.
      </p>
      <div className="heatmap-grid">
        <div>
          <div className="heatmap-bars">
            {SECTORS.map(([label, pct, color, count]) => (
              <div className="hbar-row" key={label}>
                <div className="hbar-label">{label}</div>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ background: color, width: `${pct}%` }}>
                    <span className="hbar-fill-label">{pct}%</span>
                  </div>
                </div>
                <div className="hbar-meta">{count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="heatmap-insights">
          {INSIGHTS.map(([bg, stroke, icon, title, desc, val]) => (
            <div className="insight-card" key={title}>
              <div className="insight-icon" style={{ background: bg }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={stroke}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon}
                </svg>
              </div>
              <div>
                <div className="insight-title">{title}</div>
                <div className="insight-desc">{desc}</div>
                <span className="insight-val">{val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROFILE PREVIEW ── */
function ProfilePreview() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('cases');
  const pci = [
    [
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>,
      'Get GST + PAN verified',
      'Verified agencies win 3.4× more tenders. Brands trust your financials before they trust your portfolio. The badge is the single biggest conversion signal on your profile.',
    ],
    [
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>,
      'Upload at least 2 case studies',
      "Agencies with case studies get 5× more direct inquiries than profiles without. Real campaign data, client sectors, and outcomes — that's what brands scan for first.",
    ],
    [
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>,
      'Bid within 12 hours',
      'Most tenders close in 3–5 days. Agencies that bid within 12 hours of posting win at 2.1× the rate. Set up tender alerts to never miss a match in your sector.',
    ],
  ];
  return (
    <section className="profile-preview-section" id="profile-preview">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Your Agency Profile
      </div>
      <h2 className="section-title">
        A profile that <em>works while you sleep.</em>
      </h2>
      <p className="section-subtitle">
        Your public agency profile is visible to every brand on The AdBasket — 24/7. Case studies,
        verified badge, sector tags, team size, city coverage. One page that does your pitching for
        you.
      </p>
      <div className="profile-preview-grid">
        <div className="profile-mock">
          <div className="pm-cover" />
          <div className="pm-avatar">PP</div>
          <div className="pm-body">
            <div className="pm-name-row">
              <div className="pm-name">Pixel &amp; Print Co.</div>
              <div className="pm-verified">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>{' '}
                GST + PAN Verified
              </div>
            </div>
            <div className="pm-type">Full-Service OOH Agency · Mumbai</div>
            <div className="pm-tags">
              {['FMCG', 'Real Estate', 'D2C', 'LED', 'Print'].map((t) => (
                <span className="pm-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="pm-stats-row">
              {[
                ['11yr', 'Experience'],
                ['340+', 'Campaigns'],
                ['28', 'Cities'],
                ['4.8★', 'Rating'],
              ].map(([v, l]) => (
                <div className="pm-stat" key={l}>
                  <span className="pm-stat-val">{v}</span>
                  <span className="pm-stat-lbl">{l}</span>
                </div>
              ))}
            </div>
            <div className="pm-bio">
              Full-service OOH agency specialising in FMCG, real estate, and D2C brand campaigns
              across Maharashtra and South India. Creative, production, and placement in-house.
            </div>
            <div className="pm-tabs">
              {[
                ['cases', 'Case Studies'],
                ['team', 'Team'],
                ['cities', 'Cities'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={cn('pm-tab', tab === key && 'active')}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={cn('pm-tab-content', tab === 'cases' && 'active')}>
              {[
                [
                  'Nestlé Munch Summer Push — Mumbai',
                  'FMCG · 2-month campaign · 14 hoardings',
                  '₹42L campaign · 18% brand recall lift',
                ],
                [
                  'Township Launch — Pune Expressway',
                  'Real Estate · 6-month campaign · 8 unipoles',
                  '₹96L campaign · Site visits up 3×',
                ],
              ].map(([title, meta, result]) => (
                <div className="pm-case" key={title}>
                  <div className="pm-case-title">{title}</div>
                  <div className="pm-case-meta">{meta}</div>
                  <div className="pm-case-result">
                    {check} {result}
                  </div>
                </div>
              ))}
            </div>
            <div className={cn('pm-tab-content', tab === 'team' && 'active')}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                22-person team · Creative (6) · Strategy (4) · Production (8) · Operations (4).
                In-house fabrication unit in Andheri, Mumbai.
              </div>
            </div>
            <div className={cn('pm-tab-content', tab === 'cities' && 'active')}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                Mumbai · Pune · Nagpur · Bengaluru · Chennai · Hyderabad · Goa — with vendor
                partnerships across 28 Tier 1 and Tier 2 cities.
              </div>
            </div>
            <div className="pm-actions">
              <Link to={ROUTES.agencyRegister} className="btn-gold btn-sm">
                Send Brief →
              </Link>
              <button
                className="btn-ghost btn-sm"
                onClick={() => showToast('Register to see full contact details.')}
              >
                Contact Agency
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.8px',
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Your profile does the pitching.
            <br />
            You do the <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>winning.</em>
          </h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--ink-muted)',
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Three things that separate agencies getting briefs from those who aren&apos;t.
          </p>
          <div className="preview-cta-list">
            {pci.map(([icon, title, desc]) => (
              <div className="preview-cta-item" key={title}>
                <div className="pci-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {icon}
                  </svg>
                </div>
                <div>
                  <div className="pci-title">{title}</div>
                  <div className="pci-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── VS TABLE ── */
const VS_ROWS = [
  [
    'Lead quality',
    ['check', '✓ Verified budget, real brief, named city'],
    ['cross', 'Unknown — needs discovery call first'],
    ['maybe', 'Variable — depends on who refers'],
  ],
  [
    'Time to first conversation',
    ['check', '✓ Avg. 7 days after profile goes live'],
    ['cross', 'Weeks of outreach before any response'],
    ['maybe', 'Unpredictable — months sometimes'],
  ],
  [
    'Commission / cost per deal',
    ['check', '✓ ₹0 commission — flat subscription only'],
    ['plain', 'Salesperson cost + travel + time'],
    ['plain', 'Referral fee 5–15% or reciprocal obligation'],
  ],
  [
    'Scalability',
    ['check', '✓ Unlimited — bid on as many as your plan allows'],
    ['cross', 'Linear — more calls = more headcount'],
    ['cross', 'Limited by your personal network size'],
  ],
  [
    'Discovery by brands',
    ['check', '✓ Public searchable profile — 24/7 inbound'],
    ['cross', 'No — you must always initiate first'],
    ['cross', 'Only if someone remembers to mention you'],
  ],
];
function vsCell([kind, text]) {
  if (kind === 'check') return <span className="vs-check">{text}</span>;
  if (kind === 'cross') return <span className="vs-cross">{text}</span>;
  if (kind === 'maybe') return <span className="vs-maybe">{text}</span>;
  return text;
}
function VsTable() {
  return (
    <section className="vs-section" id="compare">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        How It Compares
      </div>
      <h2 className="section-title">
        AdBasket vs <em>how agencies find clients today.</em>
      </h2>
      <p className="section-subtitle">
        The average Indian ad agency spends 30% of its time on business development. Here&apos;s
        what changes when inbound starts working for you.
      </p>
      <div className="vs-table-wrap">
        <table className="vs-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>The AdBasket</th>
              <th>Cold Outreach</th>
              <th>Referral / Network</th>
            </tr>
          </thead>
          <tbody>
            {VS_ROWS.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{vsCell(r[1])}</td>
                <td>{vsCell(r[2])}</td>
                <td>{vsCell(r[3])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── ROI CALCULATOR ── */
const VAL_MAP = {
  1: '₹1L',
  2: '₹2L',
  3: '₹5L',
  4: '₹7L',
  5: '₹10L',
  6: '₹15L',
  7: '₹20L',
  8: '₹35L',
  9: '₹50L',
  10: '₹75L',
};
const VAL_NUM = { 1: 1, 2: 2, 3: 5, 4: 7, 5: 10, 6: 15, 7: 20, 8: 35, 9: 50, 10: 75 };
const PROOF = [
  [
    'av-em',
    'PP',
    'Pixel & Print Co. · Mumbai',
    'Full-Service Agency · Joined March 2026 · Growth Plan',
    '3 tenders won · ₹34L revenue in first 60 days',
  ],
  [
    'av-indigo',
    'ME',
    'MediaEdge India · Delhi NCR',
    'Media Planning Agency · Joined January 2026 · Enterprise',
    '14 direct inquiries/month · 2 long-term retainers closed',
  ],
  [
    'av-teal',
    'SC',
    'SignCraft Solutions · Bengaluru',
    'Production House · Joined February 2026 · Growth Plan',
    'First tender won within 11 days of going live',
  ],
  [
    'av-purple',
    'OA',
    'OutdoorArts · Hyderabad',
    'OOH Specialist · Joined April 2026 · Starter Plan',
    '₹12L healthcare campaign won · upgraded to Growth',
  ],
];
function RoiCalculator() {
  const [bids, setBids] = useState(10);
  const [vIdx, setVIdx] = useState(3);
  const [winPct, setWinPct] = useState(20);
  const revenue = bids * (winPct / 100) * VAL_NUM[vIdx];
  const disp =
    revenue >= 100
      ? `₹${(revenue / 100).toFixed(1)}Cr`
      : revenue >= 1
        ? `₹${Math.round(revenue)}L`
        : `₹${Math.round(revenue * 100)}K`;
  const planPct =
    revenue > 0 ? Math.min(parseFloat(((2999 / (revenue * 1e5)) * 100).toFixed(2)), 99) : 0;
  return (
    <section className="roi-section" id="earnings">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Return on Investment
      </div>
      <h2 className="section-title">
        One tender win covers
        <br />
        your plan for <em>12 months.</em>
      </h2>
      <p className="section-subtitle">
        The subscription is a fraction of a single campaign brief. Use the estimator to see exactly
        what&apos;s possible for your agency.
      </p>
      <div className="roi-grid">
        <div>
          <div className="roi-calculator">
            <span className="roi-calc-label">ROI Estimator</span>
            <div className="roi-calc-title">
              Estimate your monthly revenue from AdBasket tenders
            </div>
            <div className="roi-input-row">
              <label>
                Tenders bid per month —{' '}
                <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{bids}</span>
              </label>
              <input
                type="range"
                min="2"
                max="50"
                value={bids}
                onChange={(e) => setBids(+e.target.value)}
              />
            </div>
            <div className="roi-input-row">
              <label>
                Average tender value —{' '}
                <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{VAL_MAP[vIdx]}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={vIdx}
                onChange={(e) => setVIdx(+e.target.value)}
              />
            </div>
            <div className="roi-input-row">
              <label>
                Your estimated win rate —{' '}
                <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{winPct}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={winPct}
                onChange={(e) => setWinPct(+e.target.value)}
              />
            </div>
            <div className="roi-result">
              <span className="roi-result-lbl">Estimated Monthly Revenue</span>
              <div className="roi-result-val">{disp}</div>
              <div className="roi-result-sub">
                {bids} bids · {winPct}% win rate · {VAL_MAP[vIdx]} avg.
              </div>
              <div className="roi-plan-note">
                Growth plan (₹2,999/mo) = {planPct}% of projected revenue.
              </div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 18 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.8px',
                marginBottom: 8,
              }}
            >
              Real wins from verified agencies
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--ink-muted)',
                fontWeight: 300,
                lineHeight: 1.7,
              }}
            >
              Agencies who joined The AdBasket in the last 90 days.
            </p>
          </div>
          <div className="roi-proof-list">
            {PROOF.map(([av, init, name, detail, win]) => (
              <div className="roi-proof-item" key={name}>
                <div className={cn('rp-avatar', av)}>{init}</div>
                <div>
                  <div className="rp-name">{name}</div>
                  <div className="rp-detail">{detail}</div>
                  <div className="rp-win">
                    {check} {win}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── JOURNEY ── */
const JOURNEY = [
  [
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>,
    '01',
    'Register & Get Verified',
    '7-step registration in under 15 minutes. Submit GST + PAN for the verified badge. Admin approval in 2–3 business days.',
    '~15 min to complete',
  ],
  [
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>,
    '02',
    'Build Your Public Profile',
    'Add services, case studies, sector expertise, and team details. Your profile is fully searchable by every brand on The AdBasket from day one.',
    'Profile live in 2–3 business days',
  ],
  [
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>,
    '03',
    'Browse & Bid on Tenders',
    '5,000+ active tenders — filter by city, format, budget, sector. Brand identity only revealed when they accept your proposal. Anonymous and fair.',
    'New tenders added every day',
  ],
  [
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    '04',
    'Receive Direct Briefs',
    'Brands discover your profile and send direct briefs. Manage all inquiries, bids, and client conversations from your agency dashboard in one place.',
    'Avg. first inquiry within 7 days',
  ],
];
function Journey() {
  return (
    <section className="journey-section" id="how">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        How It Works
      </div>
      <h2 className="section-title">
        From profile to <em>paid briefs</em>
        <br />— four steps.
      </h2>
      <p className="section-subtitle">
        Your agency profile goes live within 2–3 business days of registration. The inbound starts
        almost immediately after.
      </p>
      <div className="journey-grid">
        {JOURNEY.map(([icon, num, title, desc, time]) => (
          <div className="journey-card" key={num}>
            <span className="journey-num">{num}</span>
            <div className="journey-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="journey-title">{title}</div>
            <div className="journey-desc">{desc}</div>
            <div className="journey-time">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>{' '}
              {time}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FEATURES ── */
const FEATURES = [
  [
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
    'Public Verified Agency Profile',
    'A full profile page visible to all advertisers — services, bio, team, city coverage, sector specialisation, and your verified badge front and centre.',
    'tag-all',
    'All Plans',
  ],
  [
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    'Tender Feed & Bid Management',
    'Browse, filter, and bid on live tenders. Track active bids, accepted proposals, and your win rate — all in one clean dashboard view.',
    'tag-all',
    'All Plans',
  ],
  [
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    'Inquiry Inbox',
    'Direct briefs from brands land here with full conversation history, brief attachments, and budget details. Reply, negotiate, and close — all in one thread.',
    'tag-all',
    'All Plans',
  ],
  [
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </>,
    'Case Study Portfolio',
    'Upload campaign photos, client sectors, outcomes, and testimonials. Your portfolio is the single biggest driver of inbound inquiry conversion.',
    'tag-growth',
    'Growth & Enterprise',
  ],
  [
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>,
    'Profile & Pipeline Analytics',
    'Weekly profile views, inquiry sources, tender match rate, bid-to-win ratio, and sector demand heatmap — know exactly where to focus each week.',
    'tag-growth',
    'Growth & Enterprise',
  ],
  [
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    'Dedicated Account Manager',
    'Enterprise agencies get a dedicated AdBasket account manager for onboarding, profile optimisation, and access to co-branded campaign features.',
    'tag-enterprise',
    'Enterprise Only',
  ],
];
function Features() {
  return (
    <section className="features-section" id="features">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Platform Features
      </div>
      <h2 className="section-title">
        Everything inside your <em>agency dashboard.</em>
      </h2>
      <p className="section-subtitle">
        From the day you register to every campaign you win — one command centre for your entire OOH
        business pipeline.
      </p>
      <div className="features-grid">
        {FEATURES.map(([icon, title, desc, tagCls, tag]) => (
          <div className="feature-card" key={title}>
            <div className="feature-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="feature-title">{title}</div>
            <div className="feature-desc">{desc}</div>
            <span className={cn('feature-tag', tagCls)}>{tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── PRICING ── */
const PRICING = [
  {
    name: 'Starter',
    price: '999',
    access: 'Tenders up to ₹10L budget',
    roi: 'Win 1 small tender = 10× your plan cost back',
    features: [
      'Public agency profile (unlimited)',
      '5 tender views & bids per month',
      'Unlimited direct inquiry receiving',
      'Basic profile analytics',
      'GST + PAN verified badge',
    ],
    cta: 'Get Started',
    ctaCls: 'btn-ghost',
    popular: false,
    contact: false,
  },
  {
    name: 'Growth',
    price: '2,999',
    access: 'Tenders up to ₹1 Crore budget',
    roi: '1 mid-tier win = plan paid for 12 months',
    features: [
      'Profile + case study portfolio',
      '50 tender views & bids per month',
      'Unlimited direct inquiries',
      'Featured placement in search results',
      'Full analytics dashboard',
      'Priority admin support',
    ],
    cta: 'Choose Growth →',
    ctaCls: 'btn-gold',
    popular: true,
    contact: false,
  },
  {
    name: 'Enterprise',
    price: '7,999',
    access: 'Tenders up to ₹10 Crore+',
    roi: 'One ₹1Cr tender = plan covered 10 years',
    features: [
      'Premium profile (top placement)',
      'Unlimited tender views & bids',
      'Dedicated account manager',
      'Co-branded case study features',
      'Weekly performance reports',
      'Early access to new high-value tenders',
    ],
    cta: 'Contact Sales',
    ctaCls: 'btn-ghost',
    popular: false,
    contact: true,
  },
];
function Pricing() {
  const { showToast } = useToast();
  return (
    <section className="pricing-section" id="pricing">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Subscription Plans
      </div>
      <h2 className="section-title">
        Priced for the
        <br />
        <em>tenders you want to win.</em>
      </h2>
      <p className="section-subtitle">
        Each tier unlocks higher-value tenders. One campaign win typically covers your entire
        year&apos;s subscription cost — often in the first month.
      </p>
      <div className="pricing-grid">
        {PRICING.map((p) => (
          <div className={cn('pricing-card', p.popular && 'popular')} key={p.name}>
            {p.popular && <div className="popular-badge">Most Popular</div>}
            <div className="pricing-name">{p.name}</div>
            <div className="pricing-price">
              <sup>₹</sup>
              {p.price}
            </div>
            <div className="pricing-period">per month · no lock-in</div>
            <div className="pricing-access">{p.access}</div>
            <div className="pricing-roi">
              {check} {p.roi}
            </div>
            <div className="pricing-features">
              {p.features.map((f) => (
                <div className="pricing-feature" key={f}>
                  {f}
                </div>
              ))}
            </div>
            {p.contact ? (
              <a
                href="#"
                className={cn(p.ctaCls, 'btn-pricing')}
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Our team will reach out within 24 hours for Enterprise onboarding.');
                }}
              >
                {p.cta}
              </a>
            ) : (
              <Link to={ROUTES.agencyRegister} className={cn(p.ctaCls, 'btn-pricing')}>
                {p.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ── */
const FAQ = [
  [
    'Can my competitors see that I bid on a tender?',
    'No. Bids are completely blind — brands only see the total count (e.g. "6 bids received"), never who submitted them. Your identity is only revealed if the brand accepts your specific proposal and chooses to move forward with you.',
  ],
  [
    'Are the tenders real? Who actually posts them?',
    'All tenders are posted by KYC-verified advertisers. Our team manually reviews every tender before it goes live — fake or vague briefs are rejected. Brands who ghost agencies after accepting bids are flagged and risk losing platform access.',
  ],
  [
    'How quickly will I start getting inquiries after registering?',
    'Most agencies receive their first direct inquiry within 7 days of their profile going live — especially with at least one case study and a verified badge. For tender wins, the average is 3–4 weeks for agencies actively bidding.',
  ],
  [
    'What types of agencies can register on The AdBasket?',
    'Any advertising or marketing service provider operating in India — full-service agencies, OOH specialists, media planning firms, creative studios, PR companies, production houses, and digital-to-OOH integrated agencies.',
  ],
  [
    'Does The AdBasket take a commission on tenders I win?',
    "Zero commission — ever. We charge a flat monthly subscription and that's it. When you win a tender, the full contract value goes to your agency. Our incentives are fully aligned with yours.",
  ],
  [
    'Can I cancel or downgrade my plan at any time?',
    'Yes — all plans are month-to-month with no lock-in. Upgrade, downgrade, or cancel from your dashboard anytime. You never lose your profile or case studies.',
  ],
];
function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq-section" id="faq">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" />
        Common Questions
      </div>
      <h2 className="section-title">
        Everything agencies ask us
        <br />
        <em>before registering.</em>
      </h2>
      <p className="section-subtitle">
        Straight answers to the questions we hear most. Something else on your mind? We respond
        within 4 hours.
      </p>
      <div className="faq-grid">
        {FAQ.map(([q, a], i) => (
          <div
            className={cn('faq-item', open === i && 'open')}
            key={q}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="faq-q">
              <div className="faq-q-text">{q}</div>
              <div className="faq-icon">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <div className="faq-a" style={{ maxHeight: open === i ? 500 : 0 }}>
              {a}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ── */
function Cta() {
  return (
    <section className="cta-section">
      <div className="cta-eyebrow">Ready to grow your agency?</div>
      <h2 className="cta-headline">
        Stop chasing pitches.
        <br />
        <em>Let briefs find you.</em>
      </h2>
      <p className="cta-sub">
        840+ verified agencies are already on The AdBasket. Your next clients are posting briefs
        right now. Every day without a profile is revenue left on the table.
      </p>
      <div className="cta-actions">
        <Link to={ROUTES.agencyRegister} className="btn-gold btn-large">
          Register Free — 15 Minutes →
        </Link>
        <a href="#faq" className="btn-ghost-light btn-large">
          Read FAQs First
        </a>
      </div>
      <p className="cta-guarantee">
        No commission on won tenders &nbsp;·&nbsp; <strong>Cancel anytime</strong> &nbsp;·&nbsp; GST
        invoice provided
      </p>
    </section>
  );
}

/* ── NUDGE BAR ── */
function NudgeBar() {
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef(null);
  if (dismissed) return null;
  const submit = () => {
    const mobile = (inputRef.current?.value || '').trim();
    if (!mobile || mobile.length < 10) {
      showToast('Please enter a valid mobile number.');
      return;
    }
    setDismissed(true);
    showToast("You're on the list. We'll notify you when matching tenders go live in your sector.");
  };
  return (
    <div className="nudge-bar">
      <div className="nudge-text">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>{' '}
        Get notified when a tender matches <strong>your agency&apos;s specialty</strong> — before
        your competitors see it.
      </div>
      <div className="nudge-form">
        <input
          className="nudge-input"
          type="tel"
          placeholder="+91 your mobile number"
          ref={inputRef}
        />
        <button className="btn-gold btn-sm" onClick={submit}>
          Notify Me
        </button>
        <button className="nudge-close" onClick={() => setDismissed(true)}>
          ×
        </button>
      </div>
    </div>
  );
}

export function AgencyHome() {
  const nav = useAgencyNav();
  return (
    <HomeLayout
      pageClassName="agency-home-page"
      nav={nav}
      footer={AGENCY_FOOTER}
      withModal={false}
      floatBar={
        <>
          <StickyCta />
          <NudgeBar />
        </>
      }
    >
      <Hero />
      <Ticker />
      <TrustWall />
      <Why />
      <LiveTenders />
      <Heatmap />
      <ProfilePreview />
      <VsTable />
      <RoiCalculator />
      <Journey />
      <Features />
      <Pricing />
      <Faq />
      <Cta />
    </HomeLayout>
  );
}

export default AgencyHome;
