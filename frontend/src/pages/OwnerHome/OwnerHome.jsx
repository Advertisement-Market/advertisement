import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { HomeLayout } from '@/components/home';
import { OWNER_FOOTER } from './ownerFooter';
import './OwnerHome.css';

const NAV = {
  activeRole: 'owner',
  accentBtn: 'btn-teal',
  dashboardTo: ROUTES.ownerDashboard,
  ctaLabel: 'List Your Billboard',
  ctaTo: ROUTES.ownerRegister,
  onSignIn: () => {},
  links: [
    { label: 'How It Works', href: '#journey' },
    { label: 'Calculator', href: '#earnings' },
    { label: 'Live Tenders', href: '#tenders' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  mobileLinks: [
    { label: 'How It Works', href: '#journey' },
    { label: 'Earnings Calculator', href: '#earnings' },
    { label: 'Live Tenders', href: '#tenders' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
};

const arrowR = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const pinI = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const screenI = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const chipI = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="6" />
    <rect x="9" y="16" width="6" height="6" />
    <rect x="2" y="9" width="6" height="6" />
    <rect x="16" y="9" width="6" height="6" />
    <path d="M9 5H8a2 2 0 0 0-2 2v2M9 19H8a2 2 0 0 1-2-2v-2M15 5h1a2 2 0 0 1 2 2v2M15 19h1a2 2 0 0 1 2-2v-2" />
  </svg>
);

const RATES = {
  static: { metro1: 180000, metro2: 100000, tier2: 55000, tier3: 25000 },
  led: { metro1: 380000, metro2: 230000, tier2: 120000, tier3: 60000 },
  unipole: { metro1: 220000, metro2: 130000, tier2: 70000, tier3: 40000 },
  gantry: { metro1: 450000, metro2: 260000, tier2: 140000, tier3: 70000 },
  busshelter: { metro1: 80000, metro2: 50000, tier2: 28000, tier3: 15000 },
};
const fmtMoney = (n) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(1)}Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${(n / 1000).toFixed(0)}K`;

function useCountdown(startSeconds) {
  const [s, setS] = useState(startSeconds);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/* ── HERO ── */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" /> India&apos;s OOH Marketplace — For Owners
        </div>
        <h1 className="hero-headline">
          Your billboards.
          <br />
          <em>Fully booked.</em>
        </h1>
        <p className="hero-sub">
          Stop depending on brokers and cold calls. The AdBasket connects your inventory directly to
          5,000+ verified business campaigns every month — no commission, no middlemen, no wasted
          time.
        </p>
        <div className="hero-actions">
          <Link to={ROUTES.ownerRegister} className="btn-teal btn-large">
            List Your Billboard Free{' '}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="hero-trust">
          {[
            ['3,400+', 'Active Owners'],
            ['180+', 'Cities Covered'],
            ['0%', 'Commission Taken'],
            ['4 days', 'Avg. First Lead'],
          ].map(([n, l], i) => (
            <span key={l} style={{ display: 'contents' }}>
              {i > 0 && <div className="hero-trust-divider" />}
              <div className="hero-trust-stat">
                <span className="hero-trust-num">{n}</span>
                <span className="hero-trust-label">{l}</span>
              </div>
            </span>
          ))}
        </div>
      </div>
      <div className="hero-visual">
        <div className="billboard-card">
          <div className="billboard-card-inner">
            <div className="billboard-card-header">
              <div className="billboard-card-header-left">
                <div className="bc-dot bc-dot-r" />
                <div className="bc-dot bc-dot-y" />
                <div className="bc-dot bc-dot-g" />
              </div>
              <span className="billboard-card-title">OWNER DASHBOARD</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>
            <div className="bc-billboard-visual">
              <div className="bc-bb-frame">
                <div className="bc-bb-inner-text">
                  YOUR AD
                  <br />
                  <span>LIVE HERE</span>
                </div>
              </div>
              <div className="bc-bb-pole" />
              <div className="bc-bb-tag">
                <span className="bc-bb-tag-dot" /> BROADCASTING
              </div>
            </div>
            <div className="billboard-card-body">
              <div className="bc-meta-row">
                <div className="bc-location">{pinI} Andheri Flyover, Mumbai</div>
                <span className="bc-badge bc-badge-live">
                  <svg width="6" height="6" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="4" fill="#059669" />
                  </svg>{' '}
                  Live
                </span>
              </div>
              <div className="bc-stats">
                {[
                  ['7', 'Bids In'],
                  ['94%', 'Occupancy'],
                  ['2.4L', 'Views/mo'],
                ].map(([v, l]) => (
                  <div className="bc-stat" key={l}>
                    <span className="bc-stat-val">{v}</span>
                    <span className="bc-stat-label">{l}</span>
                  </div>
                ))}
              </div>
              <div className="bc-revenue-bar">
                <div className="bc-revenue-left">
                  <div className="bc-revenue-label">THIS MONTH&apos;S REVENUE</div>
                  <div className="bc-revenue-amount">₹1.8L</div>
                  <div className="bc-revenue-trend">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>{' '}
                    +22% vs last month
                  </div>
                </div>
                <div className="bc-sparkline">
                  {[40, 60, 45, 75, 55, 100].map((h, i) => (
                    <div
                      key={i}
                      className={cn('bc-spark-bar', i === 5 && 'active')}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bc-upcoming">
                <div className="bc-upcoming-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0891B2"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="bc-upcoming-body">
                  <div className="bc-upcoming-label">NEXT BOOKING STARTS</div>
                  <div className="bc-upcoming-val">Zomato Campaign — 15 Jul</div>
                </div>
                <div className="bc-upcoming-badge">In 12d</div>
              </div>
            </div>
          </div>
          <div className="bc-notification">
            <div className="bc-notif-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="bc-notif-text">New bid received</div>
              <div className="bc-notif-sub">FMCG Brand — ₹1.2L/mo</div>
            </div>
          </div>
          <div className="bc-bid-tag">
            <div className="bc-bid-label">ACTIVE BIDS</div>
            <div className="bc-bid-val">₹8.6L</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── URGENCY STRIP ── */
function UrgencyStrip() {
  const timer = useCountdown(19 * 3600 + 44 * 60 + 32);
  return (
    <div className="urgency-strip">
      <div className="urgency-inner">
        <div className="urgency-left">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="urgency-label">Closes</span>
          <span className="urgency-timer">{timer}</span>
        </div>
        <div className="urgency-right">
          <span className="urgency-text">
            <strong>FMCG brand</strong> — Mumbai, Pune, Bengaluru · Static or LED · ₹8–12L / month ·
            3 months
          </span>
          <a href="#tenders" className="urgency-cta">
            View Tender{' '}
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

const TICKER = [
  [
    'NEW',
    <>
      FMCG Brand · Mumbai · <strong>₹8–12L/mo</strong> · 3 months · Static or LED
    </>,
  ],
  [
    'BOOKED',
    <>
      Andheri Flyover · <strong>6-month</strong> campaign · ₹1.8L/mo · Confirmed
    </>,
  ],
  [
    'NEW',
    <>
      EdTech · Tier 2 cities · <strong>₹3–5L/mo</strong> · Preferred: Unipoles
    </>,
  ],
  [
    'ACTIVE',
    <>
      Banking sector · Pan-India · <strong>₹22L budget</strong> · LED preferred
    </>,
  ],
  [
    'BOOKED',
    <>
      Koregaon Park, Pune · <strong>12 months</strong> signed · FMCG brand
    </>,
  ],
  [
    'NEW',
    <>
      D2C Brand · Jaipur, Nagpur · <strong>₹2–4L/mo</strong> · Static boards
    </>,
  ],
];
function Ticker() {
  return (
    <div className="ticker-section">
      <div className="ticker-track">
        {[...TICKER, ...TICKER].map(([label, body], i) => (
          <div className="ticker-item" key={i}>
            <span className="ticker-label">{label}</span> <span>{body}</span>
            <span className="ticker-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── JOURNEY ── */
const JOURNEY = [
  [
    '01',
    'Register and Verify',
    'Fill your business profile. Submit your GST number and company registration. Admin verifies within 2–3 business days — no paperwork, fully digital.',
  ],
  [
    '02',
    'List Your Billboards',
    'List each billboard separately. Upload day and night photos, enter dimensions, pincode-based auto city fill, traffic footfall data, and set your monthly pricing.',
  ],
  [
    '03',
    'Browse and Bid on Tenders',
    'Businesses post anonymous campaign budgets daily. Browse tenders that match your locations and formats. Submit tailored proposals — no cold calling, ever.',
  ],
  [
    '04',
    'Respond to Quote Requests',
    'Businesses directly request quotes on your listings. Respond with your best pricing and availability — the client sees only your proposal, not your identity.',
  ],
  [
    '05',
    'Close the Deal and Get Paid',
    'When a business selects your bid, their contact is revealed. Finalise pricing, sign your agreement, and mark it live on your dashboard. Revenue tracked automatically.',
  ],
];
function Journey() {
  return (
    <section className="journey-section" id="journey">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> How It Works
      </div>
      <h2 className="section-title">
        From sign-up to
        <br />
        <em>first booking.</em>
      </h2>
      <p className="section-subtitle">
        Every owner follows the same verified onboarding. Once approved, your listings reach
        thousands of active businesses instantly.
      </p>
      <div className="journey-layout">
        <div className="journey-steps">
          {JOURNEY.map(([num, title, desc]) => (
            <div className="journey-step" key={num}>
              <div className="journey-step-num">{num}</div>
              <div className="journey-step-body">
                <div className="journey-step-title">{title}</div>
                <div className="journey-step-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="journey-aside">
          <div className="journey-aside-title">Platform at a Glance</div>
          <div className="journey-aside-stat">
            {[
              ['Active tenders / month', '5,000+', 'teal'],
              ['Avg. bid response time', '48 hrs', ''],
              ['Avg. tender budget', '₹6.2L', ''],
              ['Cities covered', '180+', 'teal'],
              ['Avg. days to first lead', '4', ''],
            ].map(([l, v, tone]) => (
              <div className="jas-item" key={l}>
                <span className="jas-label">{l}</span>
                <span className={cn('jas-val', tone)}>{v}</span>
              </div>
            ))}
          </div>
          <div className="journey-cta-wrap" style={{ marginTop: 24 }}>
            <Link
              to={ROUTES.ownerRegister}
              className="btn-teal"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: 13,
                fontSize: 14,
                borderRadius: 14,
              }}
            >
              Start Registration {arrowR}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── TIMELINE ── */
const TIMELINE = [
  [
    'done',
    'Day 1',
    'Registration Submitted',
    'Profile created, documents uploaded, verification pending',
    'Account Active',
    '',
  ],
  [
    'done',
    'Day 2–3',
    'Verified and Live',
    'Documents reviewed, billboards listed, inventory visible to buyers',
    'Listings Live',
    '',
  ],
  [
    'done',
    'Day 4–7',
    'First Leads Arrive',
    'Quote requests and tender matches start appearing in your dashboard',
    'Avg. 3 Leads',
    '',
  ],
  [
    'future',
    'Day 30',
    'First Deal Closed',
    'Most owners close their first booking within the first month',
    'Your Goal',
    'pending',
  ],
];
function Timeline() {
  return (
    <section className="timeline-section">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> First 30 Days
      </div>
      <h2 className="section-title">
        Day 1 to your
        <br />
        <em>first revenue.</em>
      </h2>
      <p className="section-subtitle">
        Exactly what happens after you hit submit — no guessing, no waiting in the dark.
      </p>
      <div className="timeline-track">
        <div className="timeline-line" />
        <div className="timeline-progress" />
        <div className="timeline-nodes">
          {TIMELINE.map(([dotState, day, event, desc, outcome, outClass]) => (
            <div className="timeline-node" key={day}>
              <div className={cn('timeline-dot', dotState)}>
                {dotState === 'done' ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  '30'
                )}
              </div>
              <div>
                <div className={cn('timeline-day', dotState === 'future' && 'future')}>{day}</div>
                <div className="timeline-event">{event}</div>
                <div className="timeline-desc">{desc}</div>
                <div className={cn('timeline-outcome', outClass)}>{outcome}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── EARNINGS CALC ── */
const SC_BARS = [
  [45, ''],
  [50, ''],
  [55, ''],
  [70, 'high'],
  [75, 'high'],
  [55, ''],
  [50, ''],
  [60, ''],
  [80, 'high'],
  [100, 'peak'],
  [95, 'peak'],
  [85, 'high'],
];
const SC_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
function EarningsCalc() {
  const [type, setType] = useState('static');
  const [city, setCity] = useState('metro1');
  const [boards, setBoards] = useState(3);
  const [occ, setOcc] = useState(70);
  const rate = RATES[type][city];
  const monthly = rate * boards * (occ / 100);
  return (
    <section className="calc-section" id="earnings">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Earnings Calculator
      </div>
      <h2 className="section-title">
        See what your billboard
        <br />
        could <em>earn you.</em>
      </h2>
      <p className="section-subtitle">
        Enter your inventory details. We estimate your monthly revenue potential based on real
        bookings on our platform.
      </p>
      <div className="calc-layout">
        <div className="calc-controls">
          <div className="calc-row">
            <div className="calc-field">
              <label>Billboard Type</label>
              <select
                className="calc-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="static">Static Hoarding</option>
                <option value="led">LED / Digital</option>
                <option value="unipole">Unipole / Monopole</option>
                <option value="gantry">Gantry / Bridge Panel</option>
                <option value="busshelter">Bus Shelter</option>
              </select>
            </div>
            <div className="calc-field">
              <label>City Tier</label>
              <select
                className="calc-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="metro1">Metro 1 — Mumbai / Delhi</option>
                <option value="metro2">Metro 2 — Bengaluru / Hyderabad</option>
                <option value="tier2">Tier 2 — Pune / Jaipur / Nagpur</option>
                <option value="tier3">Tier 3 — Smaller Cities</option>
              </select>
            </div>
          </div>
          <div className="calc-field">
            <div className="calc-slider-wrap">
              <div className="calc-slider-top">
                <label>Number of Boards</label>
                <span className="calc-slider-val">{boards}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={boards}
                onChange={(e) => setBoards(+e.target.value)}
              />
            </div>
          </div>
          <div className="calc-field">
            <div className="calc-slider-wrap">
              <div className="calc-slider-top">
                <label>Expected Occupancy</label>
                <span className="calc-slider-val">{occ}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={occ}
                onChange={(e) => setOcc(+e.target.value)}
              />
            </div>
          </div>
          <div className="seasonal-chart">
            <div className="sc-title">Seasonal Demand Index — When to Raise Rates</div>
            <div className="sc-bars">
              {SC_BARS.map(([h, c], i) => (
                <div key={i} className={cn('sc-bar', c)} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="sc-labels">
              {SC_MONTHS.map((m) => (
                <div className="sc-label" key={m}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="calc-result">
          <div className="calc-result-label">ESTIMATED MONTHLY REVENUE</div>
          <div className="calc-result-amount">{fmtMoney(monthly)}</div>
          <div className="calc-result-period">per month, based on your inputs</div>
          <div className="calc-result-divider" />
          <div className="calc-result-lines">
            <div className="calc-result-line">
              <span className="calc-result-line-label">Occupancy rate</span>
              <span className="calc-result-line-val">{occ}%</span>
            </div>
            <div className="calc-result-line">
              <span className="calc-result-line-label">Rate per board</span>
              <span className="calc-result-line-val">{fmtMoney(rate)}</span>
            </div>
            <div className="calc-result-line">
              <span className="calc-result-line-label">Boards counted</span>
              <span className="calc-result-line-val">{boards}</span>
            </div>
            <div className="calc-result-line">
              <span className="calc-result-line-label">Platform fee</span>
              <span className="calc-result-line-val green">₹0 — you keep it all</span>
            </div>
            <div
              className="calc-result-line"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              <span
                className="calc-result-line-label"
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}
              >
                Net to you
              </span>
              <span
                className="calc-result-line-val"
                style={{
                  fontSize: 15,
                  color: 'white',
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                }}
              >
                {fmtMoney(monthly)} / mo
              </span>
            </div>
          </div>
          <div className="calc-cta">
            <Link
              to={ROUTES.ownerRegister}
              className="btn-teal"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: 14,
                fontSize: 14,
                borderRadius: 14,
              }}
            >
              Start Earning This {arrowR}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── LIVE TENDERS ── */
const TENDER_FILTERS = [
  ['all', 'All Cities'],
  ['mumbai', 'Mumbai'],
  ['delhi', 'Delhi NCR'],
  ['bengaluru', 'Bengaluru'],
  ['pune', 'Pune'],
  ['tier2', 'Tier 2 Cities'],
];
const TENDERS = [
  {
    city: 'mumbai',
    budget: '₹8–12L',
    period: '3-month campaign',
    badge: ['tender-badge-urgent', 'Closing Soon', true],
    loc: 'Mumbai, Pune, Bengaluru',
    format: 'Static or LED',
    industry: 'FMCG',
    timer: true,
  },
  {
    city: 'bengaluru',
    budget: '₹3–5L',
    period: '6-month campaign',
    badge: ['tender-badge-new', 'New Today', false],
    loc: 'Bengaluru, Chennai',
    format: 'Unipole preferred',
    industry: 'EdTech',
    closes: 'Closes in 38:12:05',
  },
  {
    city: 'tier2',
    budget: '₹2–4L',
    period: '3-month campaign',
    badge: ['tender-badge-new', 'New Today', false],
    loc: 'Jaipur, Nagpur, Indore',
    format: 'Static boards',
    industry: 'D2C Brand',
    closes: 'Closes in 52:00:18',
  },
  {
    city: 'delhi',
    budget: '₹15–22L',
    period: '12-month campaign',
    badge: ['tender-badge-urgent', 'High Value', true],
    loc: 'Pan-India',
    format: 'LED preferred',
    industry: 'Banking',
    closes: 'Closes in 71:30:00',
  },
];
function LiveTenders() {
  const [filter, setFilter] = useState('all');
  const timer2 = useCountdown(19 * 3600 + 44 * 60 + 32);
  return (
    <section className="tender-section" id="tenders">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Live Tenders
      </div>
      <h2 className="section-title">
        Businesses are
        <br />
        <em>waiting for your bid.</em>
      </h2>
      <p className="section-subtitle">
        Verified businesses post campaign budgets anonymously. You see the budget, location, and
        format needed — company identity is revealed only after you win.
      </p>
      <div className="tender-filter-bar">
        {TENDER_FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={cn('filter-pill', filter === key && 'active')}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="tender-grid">
        {TENDERS.map((t) => (
          <div
            className="tender-card"
            key={t.loc}
            style={{ display: filter === 'all' || t.city === filter ? undefined : 'none' }}
          >
            <div className="tender-card-header">
              <div>
                <div className="tender-budget">
                  {t.budget}{' '}
                  <span style={{ fontSize: 14, color: 'var(--ink-faint)', fontWeight: 300 }}>
                    /month
                  </span>
                </div>
                <div className="tender-period">{t.period}</div>
              </div>
              <span className={cn('tender-badge', t.badge[0])}>
                {t.badge[2] ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="4" fill="#059669" />
                  </svg>
                )}{' '}
                {t.badge[1]}
              </span>
            </div>
            <div className="tender-meta">
              <div className="tender-meta-row">
                {pinI}
                <span>
                  <strong>{t.loc}</strong>
                </span>
              </div>
              <div className="tender-meta-row">
                {screenI}
                <span>
                  Format: <strong>{t.format}</strong>
                </span>
              </div>
              <div className="tender-meta-row">
                {chipI}
                <span>
                  Industry: <strong>{t.industry}</strong> · Budget verified
                </span>
              </div>
            </div>
            <div className="tender-footer">
              <span className="tender-timer">{t.timer ? `Closes in: ${timer2}` : t.closes}</span>
              <a href="#" className="tender-bid-btn">
                Bid on This{' '}
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="#" className="btn-ghost btn-large" style={{ borderRadius: 50 }}>
          Browse All Tenders {arrowR}
        </a>
      </div>
    </section>
  );
}

/* ── DASHBOARD PREVIEW ── */
const TABS = [
  ['overview', 'Overview'],
  ['listings', 'My Listings'],
  ['calendar', 'Calendar'],
  ['analytics', 'Analytics'],
];
const SIDEBAR = [
  ['overview', 'Overview'],
  ['listings', 'My Listings'],
  ['calendar', 'Availability'],
  ['analytics', 'Analytics'],
];
const TITLES = {
  overview: 'Overview',
  listings: 'My Listings',
  calendar: 'Availability Calendar',
  analytics: 'Analytics',
};
function DashboardPreview() {
  const [tab, setTab] = useState('overview');
  return (
    <section className="dashboard-preview">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Owner Dashboard
      </div>
      <h2 className="section-title">
        Your inventory.
        <br />
        <em>One control centre.</em>
      </h2>
      <p className="section-subtitle">
        Bookings, availability, bids, revenue — all live, all in one place. No Excel. No WhatsApp
        threads.
      </p>
      <div className="preview-wrapper">
        <div className="preview-chrome">
          <div className="preview-chrome-dots">
            <div className="preview-chrome-dot" />
            <div className="preview-chrome-dot" />
            <div className="preview-chrome-dot" />
          </div>
          <div className="preview-chrome-url">The AdBasket — Owner Dashboard · {TITLES[tab]}</div>
        </div>
        <div className="preview-layout">
          <div className="preview-sidebar">
            <span className="preview-sidebar-logo">
              Ad<span>Basket</span>
            </span>
            {SIDEBAR.map(([key, label], i) => (
              <div
                key={key}
                className={cn('preview-sidebar-item', tab === key && 'active')}
                onClick={() => setTab(key)}
              >
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
                  {
                    [
                      <>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </>,
                      <>
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </>,
                      <>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </>,
                      <>
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </>,
                    ][i]
                  }
                </svg>
                {label}
              </div>
            ))}
          </div>
          <div className="preview-main">
            <div className="preview-topbar">
              <span className="preview-topbar-title">Good afternoon, Rajesh</span>
              <div className="preview-topbar-right">
                <span className="preview-topbar-badge">3 New Bids</span>
              </div>
            </div>
            <div className="preview-tabs">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  className={cn('preview-tab', tab === key && 'active')}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={cn('preview-panel', tab === 'overview' && 'active')}>
              <div className="preview-stats-row">
                {[
                  ['7', 'Active Listings', '+2 this month'],
                  ['₹4.2L', 'Revenue This Month', '+18% vs last month'],
                  ['12', 'Open Bids', 'Respond before 48 hrs'],
                  ['87%', 'Occupancy Rate', '+12% vs last month'],
                ].map(([v, l, d]) => (
                  <div className="preview-stat-card" key={l}>
                    <div className="preview-stat-val">{v}</div>
                    <div className="preview-stat-label">{l}</div>
                    <div className="preview-stat-delta">{d}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--ink-faint)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Recent Activity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['var(--green)', 'New bid on Andheri Flyover — FMCG Brand · ₹1.2L/mo'],
                    ['var(--teal)', 'Quote request on Koregaon Park, Pune — Banking sector'],
                    ['var(--gold)', '3 tender matches in Nagpur — Respond by tomorrow'],
                  ].map(([c, t]) => (
                    <div
                      key={t}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 12.5,
                        color: 'var(--ink-muted)',
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: c,
                          flexShrink: 0,
                        }}
                      />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn('preview-panel', tab === 'listings' && 'active')}>
              <table className="preview-listings-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Bids</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Andheri Flyover, Mumbai', 'LED', '₹1.8L/mo', 'live', 'Live', '7'],
                    ['Koregaon Park, Pune', 'Static', '₹55K/mo', 'live', 'Live', '3'],
                    ['MG Road, Bengaluru', 'Unipole', '₹1.1L/mo', 'live', 'Live', '2'],
                    ['Sitabuldi, Nagpur', 'Static', '₹28K/mo', 'pending', 'Pending', '0'],
                  ].map(([loc, ty, rate, st, stL, bids]) => (
                    <tr key={loc}>
                      <td className="name">{loc}</td>
                      <td>{ty}</td>
                      <td>{rate}</td>
                      <td>
                        <span className={cn('status-dot', st)} />
                        {stL}
                      </td>
                      <td>{bids}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={cn('preview-panel', tab === 'calendar' && 'active')}>
              <div
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-rich)' }}>
                  June 2026
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-faint)' }}>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: 'rgba(8,145,178,0.12)',
                        marginRight: 4,
                        verticalAlign: 'middle',
                      }}
                    />
                    Booked
                  </span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: 'rgba(217,119,6,0.1)',
                        marginRight: 4,
                        verticalAlign: 'middle',
                      }}
                    />
                    Partial
                  </span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: 'var(--teal)',
                        marginRight: 4,
                        verticalAlign: 'middle',
                      }}
                    />
                    Today
                  </span>
                </div>
              </div>
              <div className="cal-grid">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div className="cal-day-head" key={i}>
                    {d}
                  </div>
                ))}
                {[
                  'e',
                  'e',
                  'e',
                  'e',
                  'e',
                  'b1',
                  'b2',
                  'b3',
                  'b4',
                  'b5',
                  'b6',
                  'b7',
                  'b8',
                  'b9',
                  'b10',
                  'b11',
                  't12',
                  'b13',
                  'b14',
                  'p15',
                  'p16',
                  'p17',
                  'p18',
                  '19',
                  '20',
                  '21',
                  'b22',
                  'b23',
                  'b24',
                  'b25',
                  'b26',
                  'b27',
                  'b28',
                  'b29',
                  'b30',
                ].map((c, i) => {
                  if (c === 'e') return <div className="cal-day empty" key={i} />;
                  const num = c.replace(/[a-z]/g, '');
                  const cls = c.startsWith('b')
                    ? 'booked'
                    : c.startsWith('t')
                      ? 'today'
                      : c.startsWith('p')
                        ? 'partial'
                        : '';
                  return (
                    <div className={cn('cal-day', cls)} key={i}>
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn('preview-panel', tab === 'analytics' && 'active')}>
              <div className="analytics-row">
                <div className="analytics-card">
                  <div className="analytics-card-title">Revenue — Last 6 Months</div>
                  <div className="bar-chart">
                    {[55, 68, 60, 75, 82, 100].map((h, i) => (
                      <div
                        key={i}
                        className={cn('bar-item', i === 5 && 'active')}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                      <span
                        key={m}
                        style={{
                          fontSize: 9,
                          color: i === 5 ? 'var(--teal)' : 'var(--ink-faint)',
                          fontWeight: i === 5 ? 600 : 400,
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-card-title">Bids by Format</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {[
                      ['LED', 42, 'var(--teal)', 1],
                      ['Static', 35, 'var(--ink-muted)', 0.4],
                      ['Unipole', 23, 'var(--ink-muted)', 0.25],
                    ].map(([label, pct, color, op]) => (
                      <div key={label}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11,
                            color: 'var(--ink-muted)',
                            marginBottom: 4,
                          }}
                        >
                          <span>{label}</span>
                          <span
                            style={{
                              color: op === 1 ? 'var(--teal)' : 'var(--ink-rich)',
                              fontWeight: 600,
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div
                          style={{ height: 5, background: 'var(--cream-deep)', borderRadius: 4 }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: color,
                              borderRadius: 4,
                              opacity: op,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── SOCIAL PROOF ── */
const OWNER_TESTIMONIALS = [
  [
    'R',
    <>
      Within the first week I had three quote requests sitting in my dashboard. Before AdBasket I
      hadn&apos;t had a new client in 4 months. The tender system is a game-changer —{' '}
      <em>clients come with their budgets already set.</em>
    </>,
    'Rahul Deshmukh',
    '12 billboards · Nagpur',
  ],
  [
    'S',
    <>
      I used to spend ₹40,000/month on a sales person. Now I get better-quality leads from AdBasket
      for ₹2,999/month. My Andheri hoarding went from <em>60% to 95% occupancy</em> in two months.
    </>,
    'Suresh Patil',
    '8 billboards · Mumbai',
  ],
  [
    'P',
    <>
      The availability calendar alone is worth it. My team used to maintain five Excel sheets. Now
      everything is in <em>one dashboard — bookings, bids, revenue,</em> all synced in real time.
    </>,
    'Priya Menon',
    '24 billboards · Bengaluru',
  ],
];
const LEADERBOARD = [
  ['#01', 'top', 'S.K. Outdoor Media', '34 boards · Mumbai', '₹18.4L', '+22%'],
  ['#02', 'top', 'Horizon Hoardings', '19 boards · Delhi NCR', '₹12.1L', '+18%'],
  ['#03', 'top', 'Pinnacle OOH', '27 boards · Bengaluru', '₹10.7L', '+31%'],
  ['#04', '', 'Rajesh Advertising', '12 boards · Pune', '₹7.8L', '+14%'],
  ['#05', '', 'Citylink Media', '9 boards · Chennai', '₹5.2L', '+9%'],
];
function SocialProof() {
  return (
    <section className="social-section">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Owner Stories
      </div>
      <h2 className="section-title">
        3,400+ owners.
        <br />
        <em>Real revenue.</em>
      </h2>
      <div className="testimonials-grid">
        {OWNER_TESTIMONIALS.map(([av, text, name, meta]) => (
          <div className="testimonial-card" key={name}>
            <div className="testimonial-quote-mark">&quot;</div>
            <p className="testimonial-text">{text}</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{av}</div>
              <div>
                <div className="testimonial-name">{name}</div>
                <div className="testimonial-meta">{meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="leaderboard-wrap">
        <div className="lb-header">
          <div className="lb-title-group">
            <div className="lb-live-dot" />
            <span className="lb-title">Top Earning Owners — June 2026</span>
          </div>
          <span className="lb-period">Updated live</span>
        </div>
        <div className="lb-rows">
          {LEADERBOARD.map(([rank, top, name, boards, rev, growth]) => (
            <div className="lb-row" key={rank}>
              <span className={cn('lb-rank', top)}>{rank}</span>
              <div>
                <div className="lb-name">{name}</div>
                <div className="lb-boards">{boards}</div>
              </div>
              <span className="lb-revenue">{rev}</span>
              <span className="lb-growth">{growth}</span>
            </div>
          ))}
        </div>
        <div className="lb-footer">
          <span className="lb-footer-text">
            Your rank appears here after your first closed deal
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── COMPARE ── */
const CMP_ROWS = [
  [
    ['Inbound lead quality', 'Verified business budget'],
    ['yes', 'Verified budgets, real campaigns'],
    ['no', 'Low', ' — no budget verification'],
    ['no', 'Mixed', ' — many unqualified'],
  ],
  [
    ['Commission on bookings', 'What % do you pay?'],
    ['yes', '0% — flat subscription only'],
    ['no', '10–20%', ' broker cut per deal'],
    [null, 'Lead charges + no protection'],
  ],
  [
    ['Inventory management', 'Bookings, calendar, revenue'],
    ['yes', 'Full dashboard + calendar'],
    [null, 'Excel + WhatsApp'],
    ['no', 'No tools', ' provided'],
  ],
  [
    ['Time to first lead', 'After listing goes live'],
    ['yes', 'Avg. 4 days'],
    [null, 'Weeks of outreach effort'],
    [null, 'Unpredictable — days to months'],
  ],
  [
    ['Tender access', 'Pre-budgeted campaigns'],
    ['yes', '5,000+ tenders/month'],
    ['no', 'None', ' — you hunt manually'],
    ['no', 'None'],
  ],
  [
    ['Analytics and pricing data', 'Demand by city, industry, season'],
    ['yes', 'Full analytics dashboard'],
    ['no', 'None'],
    ['no', 'None'],
  ],
];
function ownerCell(cell) {
  if (!cell) return null;
  const [kind, label, rest] = cell;
  if (kind === 'yes')
    return (
      <>
        <span className="cmp-yes">✓</span> {label}
      </>
    );
  if (kind === 'no')
    return (
      <>
        <span className="cmp-no">{label}</span>
        {rest}
      </>
    );
  return (
    <>
      {label}
      {rest}
    </>
  );
}
function CompareTable() {
  return (
    <section className="compare-section">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Why Switch
      </div>
      <h2 className="section-title">
        AdBasket vs <em>how it&apos;s done today.</em>
      </h2>
      <p className="section-subtitle">
        Most Indian billboard owners still rely on cold calls, brokers, and WhatsApp groups.
        Here&apos;s the difference.
      </p>
      <table className="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>The AdBasket</th>
            <th>Cold Calling / Brokers</th>
            <th>JustDial / Classifieds</th>
          </tr>
        </thead>
        <tbody>
          {CMP_ROWS.map((row, i) => (
            <tr key={i}>
              <td>
                <div className="cmp-feat">{row[0][0]}</div>
                <div className="cmp-feat-sub">{row[0][1]}</div>
              </td>
              <td>{ownerCell(row[1])}</td>
              <td>{ownerCell(row[2])}</td>
              <td>{ownerCell(row[3])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ── PRICING ── */
const PRICING = [
  {
    name: 'Starter',
    price: '999',
    access: 'Tenders up to ₹2L/month',
    features: [
      '5 free tender views/month, then ₹49/view',
      'Unlimited billboard listings',
      'Availability calendar',
      'Basic analytics',
    ],
    cta: 'Get Started',
    ctaCls: 'btn-ghost',
    to: ROUTES.ownerRegister,
    popular: false,
  },
  {
    name: 'Growth',
    price: '2,999',
    access: 'Tenders up to ₹10L/month',
    features: [
      'Unlimited tender views',
      'Full analytics and seasonal data',
      'Sponsored listing — appear first',
      'Priority support',
    ],
    cta: 'Choose Growth',
    ctaCls: 'btn-teal',
    to: ROUTES.ownerRegister,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '7,999',
    access: 'Unlimited tender budgets',
    features: [
      'Everything in Growth',
      'Early access to high-value tenders',
      'Dedicated account manager',
      'Multi-user dashboard access',
    ],
    cta: 'Contact Us',
    ctaCls: 'btn-ghost',
    to: null,
    popular: false,
  },
];
function Pricing() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Pricing
      </div>
      <h2 className="section-title">
        Pay for the tenders
        <br />
        you actually <em>want.</em>
      </h2>
      <p className="section-subtitle">
        Plans are priced by the budget range of tenders you can bid on. Small operators pay small.
        Large portfolios unlock large campaigns.
      </p>
      <div className="pricing-grid">
        {PRICING.map((p) => (
          <div className={cn('pricing-card', p.popular && 'popular')} key={p.name}>
            {p.popular && (
              <div className="popular-badge">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>{' '}
                Most Popular
              </div>
            )}
            <div className="pricing-name">{p.name}</div>
            <div className="pricing-price">
              <sup>₹</sup>
              {p.price}
            </div>
            <div className="pricing-period">per month</div>
            <div className="pricing-access">{p.access}</div>
            <div className="pricing-features">
              {p.features.map((f) => (
                <div className="pricing-feature" key={f}>
                  <div className="pricing-check">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            {p.to ? (
              <Link to={p.to} className={cn(p.ctaCls, 'btn-pricing')}>
                {p.cta}
              </Link>
            ) : (
              <a href="#" className={cn(p.ctaCls, 'btn-pricing')}>
                {p.cta}
              </a>
            )}
          </div>
        ))}
      </div>
      <p className="pricing-note">
        All plans include unlimited billboard listings and zero commission on bookings. Cancel
        anytime.
      </p>
    </section>
  );
}

/* ── WHY ── */
const OWNER_WHY = [
  [
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 2 3.18 2 2 0 0 1 3.98 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
    'Inbound leads, not cold calls',
    'Businesses come to you with budgets set. No more chasing unresponsive brand managers. Tender leads arrive directly in your dashboard every day.',
  ],
  [
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>,
    'Zero time-wasters',
    'Every business is email-verified. Every tender has a real, approved budget. No ghost inquiries — every conversation is a genuine revenue opportunity.',
  ],
  [
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>,
    'Replace your spreadsheets',
    'Your dashboard tracks every listing, booking, availability, quote request and revenue — all live, all in one place. No Excel. No WhatsApp threads.',
  ],
  [
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>,
    '0% commission forever',
    'We charge a flat subscription — never a cut of your revenue. You keep 100% of every booking. The subscription pays for itself on the first won bid.',
  ],
  [
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    'Seasonal demand data',
    'See peak months, high-demand industries, and which formats are getting the most tenders in your city. Raise rates when demand spikes.',
  ],
  [
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    'Boosted visibility',
    'Growth and Enterprise owners can sponsor their listings for top placement — get seen first by every business searching your city.',
  ],
];
function WhySection() {
  return (
    <section className="why-section">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> Built for Owners
      </div>
      <h2 className="section-title">
        Built for <em>Indian operators.</em>
      </h2>
      <p className="section-subtitle">Every feature exists because an owner asked for it.</p>
      <div className="why-grid">
        {OWNER_WHY.map(([icon, title, desc]) => (
          <div className="why-card" key={title}>
            <div className="why-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <div className="why-title">{title}</div>
            <div className="why-desc">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ── */
const OWNER_FAQ = [
  [
    "What if I don't get any bids or quote requests?",
    <>
      The most common reason for low leads is incomplete or low-quality listings — missing photos,
      no traffic data, or vague location. Our team reviews every new listing and sends you specific
      suggestions to improve visibility.{' '}
      <strong>
        Over 90% of owners who complete their listing fully receive a quote request within their
        first week.
      </strong>
    </>,
  ],
  [
    'What documents do I need to register?',
    <>
      You need: <strong>GST registration certificate</strong> (mandatory), company registration or
      sole proprietorship certificate, day and night photographs of each billboard, and your bank
      account details for future payouts. Everything is uploaded digitally — no physical documents
      required.
    </>,
  ],
  [
    'How does the tender anonymity work — both ways?',
    <>
      When a business posts a tender, their company name is hidden from you — you only see the
      industry, budget, location, and format. When you submit a bid, the business sees your
      portfolio and pricing but not your name.{' '}
      <strong>Contact details are exchanged only after a deal is confirmed by both sides.</strong>
    </>,
  ],
  [
    'Can I cancel my subscription anytime?',
    "Yes. Cancel anytime from your dashboard settings. Your listings remain live until the end of your current billing cycle — we don't remove them immediately. If you cancel, you lose access to new tender bids, but existing client relationships continue unaffected.",
  ],
  [
    'Does AdBasket take a cut when I close a deal?',
    <>
      <strong>No commission whatsoever.</strong> Our entire business model is subscription-based.
      When you close a deal — whether it&apos;s ₹50,000 or ₹50 Lakhs — 100% of that money goes to
      you. We make money from monthly subscriptions, not from your success.
    </>,
  ],
  [
    "I'm in a Tier 2 city — are there tenders for me?",
    <>
      Absolutely. Our fastest-growing cities in 2026 are{' '}
      <strong>Jaipur, Nagpur, Coimbatore, Kochi, and Indore.</strong> Many pan-India brands — FMCG,
      EdTech, Banking — specifically look for Tier 2 inventory because competition is lower and
      recall is higher. Tier 2 owners often win faster than metro owners.
    </>,
  ],
  [
    "What happens if a business doesn't pay after the deal is closed?",
    <>
      AdBasket facilitates the introduction — the payment agreement is between you and the business
      directly. We strongly recommend using a standard OOH booking agreement (we provide a template)
      and collecting an advance before campaign launch.{' '}
      <strong>Every business on the platform has a verified company identity.</strong>
    </>,
  ],
  [
    'How long does verification actually take?',
    <>
      We promise 2–3 business days, and in practice it&apos;s usually done within{' '}
      <strong>24 hours on weekdays.</strong> You&apos;ll get an email the moment your account is
      approved. If there&apos;s an issue with any document, our team contacts you directly with
      specific instructions — no vague rejection notices.
    </>,
  ],
];
function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq-section" id="faq">
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" /> FAQ
      </div>
      <h2 className="section-title">
        Real questions.
        <br />
        <em>Straight answers.</em>
      </h2>
      <div className="faq-grid">
        {OWNER_FAQ.map(([q, a], i) => (
          <div
            className={cn('faq-item', open === i && 'open')}
            key={q}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="faq-question">
              <span className="faq-q-text">{q}</span>
              <div className="faq-chevron">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div className="faq-answer" style={{ maxHeight: open === i ? 500 : 0 }}>
              <div className="faq-answer-inner">{a}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ── */
function CtaTeal() {
  return (
    <section className="cta-teal">
      <div className="cta-billboard-bg">
        <svg width="500" height="600" viewBox="0 0 500 600" fill="white">
          <rect x="20" y="80" width="460" height="260" rx="8" />
          <rect x="230" y="340" width="20" height="180" />
          <rect x="160" y="500" width="180" height="16" rx="4" />
          <rect x="210" y="340" width="8" height="180" />
          <rect x="282" y="340" width="8" height="180" />
        </svg>
      </div>
      <div className="cta-eyebrow">180+ Cities · 0% Commission · First Lead in 4 Days</div>
      <h2 className="cta-headline">
        Stop chasing clients.
        <br />
        Let them come to <em>you.</em>
      </h2>
      <p className="cta-sub">
        Join 3,400+ billboard owners across India who replaced cold calls with a steady stream of
        verified, pre-budgeted campaign leads.
      </p>
      <div className="cta-actions">
        <Link to={ROUTES.ownerRegister} className="btn-teal btn-large">
          List Your Billboard Free{' '}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <a href="#tenders" className="btn-ghost-light btn-large">
          Browse Live Tenders
        </a>
      </div>
      <div className="cta-guarantee">
        <strong>No credit card required.</strong> Free to list. Subscription only when you bid on
        tenders.
      </div>
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
    showToast("You're on the list. We'll notify you when matching tenders go live in your city.");
  };
  return (
    <div className="nudge-bar">
      <div className="nudge-text">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Get notified when a tender matches <strong>your city</strong> — before anyone else sees it.
      </div>
      <div className="nudge-form">
        <input
          className="nudge-input"
          type="tel"
          placeholder="+91 your mobile number"
          ref={inputRef}
        />
        <button className="btn-teal btn-sm" onClick={submit}>
          Notify Me
        </button>
        <button className="nudge-close" onClick={() => setDismissed(true)} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}

export function OwnerHome() {
  return (
    <HomeLayout
      pageClassName="owner-home-page"
      nav={NAV}
      footer={OWNER_FOOTER}
      withModal={false}
      floatBar={<NudgeBar />}
    >
      <Hero />
      <UrgencyStrip />
      <Ticker />
      <Journey />
      <Timeline />
      <EarningsCalc />
      <LiveTenders />
      <DashboardPreview />
      <SocialProof />
      <CompareTable />
      <Pricing />
      <WhySection />
      <Faq />
      <CtaTeal />
    </HomeLayout>
  );
}

export default OwnerHome;
