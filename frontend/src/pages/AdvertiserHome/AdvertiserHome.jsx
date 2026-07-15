import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES, withQuery } from '@/lib/routes';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { HomeLayout, HomeSelect, Reveal, FloatBar } from '@/components/home';
import { Button } from '@/components/ui/Button';
import { Counter } from '@/components/ui/Counter';
import { SITE_FOOTER } from '@/data/navigation';
import {
  HERO_TYPE_OPTIONS,
  HERO_CITY_OPTIONS,
  HERO_BUDGET_OPTIONS,
  FEED_ITEMS,
  TICKER_ITEMS,
  TRUST_LOGOS,
  FEATURED,
  CITY_LIST,
  CITY_DATA,
  STEPS,
  COMPARE_METRICS,
  COMPARE_TABS,
  COMPARE_DATA,
  INSPIRATION,
  INS_FILTERS,
  SPOTLIGHT,
  WHY,
  TESTIMONIALS,
  FAQ,
} from './data';
import './AdvertiserHome.css';

const NAV = {
  activeRole: 'advertiser',
  dashboardTo: ROUTES.advertiserDashboard,
  ctaLabel: 'Get Started Free',
  links: [
    { label: 'Browse Spaces', to: ROUTES.browse },
    { label: 'Find Agencies', to: ROUTES.browseAgencies },
    { label: 'ROI Calculator', href: '#roi' },
    { label: 'Post Campaign', href: '#campaign' },
  ],
  mobileLinks: [
    { label: 'Browse Spaces', to: ROUTES.browse },
    { label: 'Find Agencies', to: ROUTES.browseAgencies },
    { label: 'ROI Calculator', href: '#roi' },
    { label: 'Post Campaign', href: '#campaign' },
  ],
};

const arrow = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const starSm = (fill) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={fill} stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const featuredArt = {
  city: (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="9" width="5" height="12" />
      <rect x="9" y="5" width="6" height="16" />
      <rect x="17" y="11" width="4" height="10" />
      <line x1="1" y1="21" x2="23" y2="21" />
    </svg>
  ),
  led: (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  highway: (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l3-10 3 5 3-8 3 8 3-5 3 10" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  ),
};
const whyIcon = {
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  trend: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  rupee: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
};
const whyStroke = {
  'wi-indigo': 'var(--indigo)',
  'wi-teal': 'var(--teal)',
  'wi-gold': 'var(--gold)',
  'wi-green': '#059669',
};

/* ── HERO ── */
function Hero() {
  const navigate = useNavigate();
  const { openRegister } = useAuthModal();
  const [type, setType] = useState('billboards');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const search = () =>
    navigate(
      type === 'agencies' ? ROUTES.browseAgencies : withQuery(ROUTES.browse, { city, budget }),
    );

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow" />
        <div className="hero-bg-spin" />
      </div>
      <div className="hero-bg-text">OOH</div>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" /> India&apos;s #1 Outdoor Advertising Platform
        </div>
        <h1 className="hero-headline">
          Your campaign.
          <br />
          <em>Every surface.</em>
          <br />
          Across India.
        </h1>
        <p className="hero-sub">
          Search 12,000+ verified billboard spaces. Browse 400+ specialist agencies. Post one brief
          — and let the best come to you.
        </p>

        <div className="hero-search">
          <div
            className={cn('hs-field', type && type !== 'billboards' && 'has-value')}
            id="hsTypeField"
          >
            <span className="hs-label">Looking For</span>
            <HomeSelect
              name="hs-type"
              options={HERO_TYPE_OPTIONS}
              value={type}
              onChange={setType}
              dividerAfter={-1}
            />
          </div>
          <div className={cn('hs-field', city && 'has-value')} id="hsCityField">
            <span className="hs-label">City</span>
            <HomeSelect
              name="hs-city"
              options={HERO_CITY_OPTIONS}
              value={city}
              onChange={setCity}
            />
          </div>
          <div className={cn('hs-field', budget && 'has-value')} id="hsBudgetField">
            <span className="hs-label">Monthly Budget</span>
            <HomeSelect
              name="hs-budget"
              options={HERO_BUDGET_OPTIONS}
              value={budget}
              onChange={setBudget}
            />
          </div>
          <button className="hs-btn" onClick={search}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>

        <div className="hero-actions">
          <Button variant="primary" size="large" to={ROUTES.browse} className="btn-large">
            Browse Billboards →
          </Button>
          <Button variant="ghost" size="large" to={ROUTES.browseAgencies} className="btn-large">
            Find an Agency
          </Button>
          <a href="#campaign" className="btn-ghost btn-large">
            Post a Campaign
          </a>
        </div>
        <div className="hero-note">Free to browse. Identity stays private until you engage.</div>

        <div className="hero-stats">
          <div className="hero-stat">
            <Counter className="stat-num" target={12000} />
            <span className="stat-label">Billboard listings</span>
          </div>
          <div className="hero-stat">
            <Counter className="stat-num" target={400} />
            <span className="stat-label">Verified agencies</span>
          </div>
          <div className="hero-stat">
            <Counter className="stat-num" target={180} />
            <span className="stat-label">Cities covered</span>
          </div>
          <div className="hero-stat">
            <span className="stat-num">₹0</span>
            <span className="stat-label">To browse &amp; compare</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-floating-tag">
          <div className="hft-label">LIVE NOW</div>
          <div className="hft-val">3,840 spaces</div>
        </div>
        <div className="live-feed-card">
          <div className="lfc-header">
            <span className="lfc-title">
              <span className="live-dot" /> Platform Activity
            </span>
            <span className="lfc-count">Live updates</span>
          </div>
          <div className="lfc-feed">
            <div className="lfc-feed-inner">
              {[...FEED_ITEMS, ...FEED_ITEMS].map((f, i) => (
                <div className="feed-item" key={i}>
                  <div className={cn('feed-icon', `fi-${f.icon}`)}>{f.node}</div>
                  <div className="feed-body">
                    <div className="feed-text">{f.text}</div>
                    <div className="feed-time">{f.time}</div>
                  </div>
                  <span className={cn('feed-badge', f.badgeCls)}>{f.badge}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lfc-footer">
            <span className="lfc-footer-txt">Updated in real-time</span>
            <button className="btn-ghost btn-sm" onClick={openRegister}>
              See all activity →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── LIVE TICKER ── */
function LiveTicker() {
  return (
    <div className="live-ticker">
      <div className="ticker-track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
          <span className="ticker-item" key={i}>
            <span className="ticker-dot" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── TRUST BAR ── */
function TrustBar() {
  return (
    <div className="trust-bar">
      <span className="trust-label">Trusted by India&apos;s leading brands</span>
      <div className="trust-logos">
        {TRUST_LOGOS.map((l) => (
          <span className="trust-logo" key={l}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── FEATURED ── */
function Featured() {
  const { openRegister } = useAuthModal();
  return (
    <section className="featured-section">
      <Reveal className="featured-header">
        <div>
          <span className="section-label">Featured Spaces</span>
          <h2 className="section-title">
            This week&apos;s <em>top picks.</em>
          </h2>
        </div>
        <Button variant="ghost" to={ROUTES.browse}>
          View all 12,000+ →
        </Button>
      </Reveal>
      <div className="featured-cards">
        {FEATURED.map((f, i) => (
          <Reveal as={Link} to={ROUTES.browse} className="f-card" delay={i + 1} key={f.title}>
            <div className="f-card-img">
              <div className={cn('f-card-img-inner', f.bg)}>{featuredArt[f.bg]}</div>
              <div className="f-card-badges">
                {f.badges.map(([label, clsB]) => (
                  <span className={cn('f-badge', clsB)} key={label}>
                    {label}
                  </span>
                ))}
              </div>
              <span className="f-status f-status-avail">Available</span>
            </div>
            <div className="f-card-body">
              <div className="f-location">{f.loc}</div>
              <div className="f-title">{f.title}</div>
              <div className="f-specs">
                {f.specs.map((s, j) => (
                  <span key={s}>
                    {j > 0 && <span className="f-spec-sep">·</span>}
                    <span className="f-spec">{s}</span>
                  </span>
                ))}
              </div>
              <div className="f-footer">
                <div>
                  <div className="f-price">{f.price}</div>
                  <div className="f-price-sub">per month</div>
                </div>
                <button
                  className="btn-primary btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    openRegister();
                  }}
                >
                  Get Quote
                </button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── CITY EXPLORER ── */
function CityExplorer({ city, setCity }) {
  const d = CITY_DATA[city];
  const state = CITY_LIST.find((c) => c[0] === city)?.[1] ?? '';
  return (
    <section className="city-explorer-section">
      <Reveal>
        <span className="section-label">Market Explorer</span>
        <h2 className="section-title">
          Pick a city.
          <br />
          See what&apos;s <em>available now.</em>
        </h2>
        <p className="section-sub">
          Live inventory counts, average CPM, top formats, and agency coverage — updated daily for
          every major market.
        </p>
      </Reveal>
      <div className="city-grid-wrap">
        <div>
          <div className="city-pills">
            {CITY_LIST.map(([name, , count]) => (
              <button
                key={name}
                className={cn('city-pill', city === name && 'active')}
                onClick={() => setCity(name)}
              >
                {name} <span className="city-pill-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="city-data-card">
          <div className="city-data-header">
            <div>
              <div className="city-name-big">{city}</div>
              <div className="city-state">{state}</div>
            </div>
            <div className="city-live-badge">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--teal)',
                  display: 'inline-block',
                }}
              />{' '}
              Live data
            </div>
          </div>
          <div className="city-stats-grid">
            <div className="city-stat">
              <span className="city-stat-num">{d.listings}</span>
              <span className="city-stat-lbl">Listings live</span>
            </div>
            <div className="city-stat">
              <span className="city-stat-num">{d.agencies}</span>
              <span className="city-stat-lbl">Agencies here</span>
            </div>
            <div className="city-stat">
              <span className="city-stat-num">{d.cpm}</span>
              <span className="city-stat-lbl">Avg CPM</span>
            </div>
          </div>
          <div className="city-formats">
            <div className="city-formats-title">Format breakdown</div>
            <div className="city-format-bars">
              {d.formats.map(([label, pct]) => (
                <div className="format-bar-row" key={label}>
                  <span className="format-bar-label">{label}</span>
                  <div className="format-bar-track">
                    <div className="format-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="format-bar-val">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="city-cta-row">
            <Link to={ROUTES.browse} className="btn-primary btn-sm">
              Browse {city} Spaces →
            </Link>
            <Link to={ROUTES.browseAgencies} className="btn-ghost btn-sm">
              Agencies in {city}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── DUAL PATH ── */
function DualPath() {
  const minis = [
    [
      'BW',
      'linear-gradient(135deg,#D97706,#F59E0B)',
      'Brandworks Mumbai',
      'OOH Strategy · Creative · Buying',
      '4.9',
    ],
    [
      'OH',
      'linear-gradient(135deg,#4F46E5,#818CF8)',
      'OOHive Delhi',
      'Media Planning · Pan India',
      '4.8',
    ],
    [
      'SC',
      'linear-gradient(135deg,#059669,#34D399)',
      'Signify Creative',
      'Full-service · South India',
      '4.7',
    ],
  ];
  const feats = [
    'Filter by format: LED, Unipole, Gantry, Bus Shelter, Mall Facade',
    'Real footfall data verified against NHAI & municipal records',
    'Multi-city media plan builder — one PDF, one total budget',
    'Direct owner contact — zero middlemen, best market rates',
  ];
  return (
    <section className="dual-path-section">
      <Reveal className="dual-path-intro">
        <span className="section-label">Two Ways to Launch</span>
        <h2 className="section-title">
          Find a <em>space.</em>
          <br />
          Or find the <em>team.</em>
        </h2>
        <p className="section-sub">
          Book directly from verified owners, or hand the entire campaign to a specialist agency —
          both paths live on one platform.
        </p>
      </Reveal>
      <div className="dual-path-grid">
        <Reveal className="path-card" delay={1}>
          <div className="path-card-header">
            <span className="path-card-tag pct-billboard">Billboard Spaces — 12,000+ listings</span>
            <h3>
              Search, shortlist &amp; book
              <br />
              verified outdoor inventory.
            </h3>
            <p>
              Filter by city, format, footfall, and budget. Compare side-by-side. Build a multi-city
              media plan and get direct quotes from verified owners.
            </p>
          </div>
          <div className="path-card-body">
            <div className="path-stat-row">
              <div className="path-stat">
                <span className="path-stat-num">12,000+</span>
                <span className="path-stat-lbl">Listings</span>
              </div>
              <div className="path-stat">
                <span className="path-stat-num">180</span>
                <span className="path-stat-lbl">Cities</span>
              </div>
              <div className="path-stat">
                <span className="path-stat-num">48hr</span>
                <span className="path-stat-lbl">Quote turnaround</span>
              </div>
            </div>
            <div className="path-features">
              {feats.map((f) => (
                <div className="path-feat" key={f}>
                  <span className="path-feat-dot pfd-indigo" />
                  {f}
                </div>
              ))}
            </div>
            <Link to={ROUTES.browse} className="btn-primary">
              Browse Billboard Spaces →
            </Link>
          </div>
        </Reveal>
        <Reveal className="path-card" delay={2}>
          <div className="path-card-header">
            <span className="path-card-tag pct-agency">Ad Agencies — 400+ verified</span>
            <h3>
              Brief a specialist
              <br />
              agency instead.
            </h3>
            <p>
              Share your brief once. Verified OOH agencies handle strategy, creative, buying, and
              installation — end to end.
            </p>
          </div>
          <div className="path-card-body">
            {minis.map(([init, grad, name, sub, rating]) => (
              <div className="agency-mini-card" key={name}>
                <div className="agency-mini-avatar" style={{ background: grad }}>
                  {init}
                </div>
                <div>
                  <div className="agency-mini-name">{name}</div>
                  <div className="agency-mini-sub">{sub}</div>
                </div>
                <div className="agency-mini-rating">
                  {rating} {arrow}
                </div>
              </div>
            ))}
            <Link
              to={ROUTES.browseAgencies}
              className="btn-gold"
              style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              Browse 400+ Agencies →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ── */
function HowItWorks() {
  return (
    <section className="how-section">
      <Reveal>
        <span className="section-label">Your Journey</span>
        <h2 className="section-title">
          From brief to booked
          <br />
          in <em>four steps.</em>
        </h2>
        <p className="section-sub">Most advertisers go live within 5 business days.</p>
      </Reveal>
      <div className="steps-grid">
        {STEPS.map(([num, title, desc], i) => (
          <Reveal className="step-card" delay={i + 1} key={num}>
            <span className="step-num">{num}</span>
            <div className="step-title">{title}</div>
            <div className="step-desc">{desc}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── ROI CALCULATOR ── */
const TIER_NAMES = ['Metro', 'Tier 1', 'Tier 2'];
function RoiCalculator() {
  const [budget, setBudget] = useState(200000);
  const [duration, setDuration] = useState(3);
  const [tier, setTier] = useState(1);
  const cpm = tier === 1 ? 14 : tier === 2 ? 18 : 22;
  const total = budget * duration;
  const imp = Math.round((total / cpm) * 1000);
  const impStr =
    imp >= 10000000 ? `${(imp / 10000000).toFixed(1)} Cr` : `${(imp / 100000).toFixed(1)} L`;
  const boards = Math.max(1, Math.round(budget / 150000));
  const dc = Math.round((imp / 1000) * 60);
  const sv = Math.max(0, dc - total);
  const points = [
    [
      'blue',
      'var(--indigo)',
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>,
      'Verified traffic data',
      'Footfall cross-checked against NHAI and municipal counts across 180 cities.',
    ],
    [
      'teal',
      'var(--teal)',
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>,
      'CPM 60–80% below digital',
      'India OOH delivers impressions at ₹8–18 CPM vs ₹40–80 CPM for premium digital.',
    ],
    [
      'gold',
      'var(--gold)',
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>,
      'Digital equivalent shown',
      'See what the same reach would cost on Google/Meta — to justify OOH spend to your CFO.',
    ],
  ];
  return (
    <section className="roi-section" id="roi">
      <div className="roi-grid">
        <Reveal>
          <span className="section-label">ROI Estimator</span>
          <h2 className="section-title">
            Know your <em>return</em>
            <br />
            before you spend.
          </h2>
          <p className="section-sub" style={{ marginBottom: 32 }}>
            Built for Indian markets — using real footfall and CPM benchmarks from 180 cities.
          </p>
          {points.map(([tone, stroke, path, title, desc]) => (
            <div className="roi-info-point" key={title}>
              <div className={cn('roi-info-icon', tone)}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={stroke}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {path}
                </svg>
              </div>
              <div className="roi-info-text">
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            </div>
          ))}
        </Reveal>
        <Reveal className="roi-card" delay={2}>
          <h3>Calculate Your Reach</h3>
          <p className="sub">Adjust to see projected campaign impact.</p>
          <div className="roi-slider-wrap">
            <div className="roi-slider-label">
              <span>Monthly Budget</span>
              <span className="roi-slider-val">₹{budget.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              className="roi-slider"
              min="50000"
              max="1000000"
              step="10000"
              value={budget}
              onChange={(e) => setBudget(+e.target.value)}
            />
          </div>
          <div className="roi-slider-wrap">
            <div className="roi-slider-label">
              <span>Campaign Duration</span>
              <span className="roi-slider-val">
                {duration} {duration === 1 ? 'month' : 'months'}
              </span>
            </div>
            <input
              type="range"
              className="roi-slider"
              min="1"
              max="12"
              step="1"
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
            />
          </div>
          <div className="roi-slider-wrap">
            <div className="roi-slider-label">
              <span>City Tier</span>
              <span className="roi-slider-val">{TIER_NAMES[tier - 1]}</span>
            </div>
            <input
              type="range"
              className="roi-slider"
              min="1"
              max="3"
              step="1"
              value={tier}
              onChange={(e) => setTier(+e.target.value)}
            />
          </div>
          <div className="roi-results">
            <div className="roi-result">
              <div className="roi-result-label">Est. Impressions</div>
              <div className="roi-result-val highlight">{impStr}</div>
            </div>
            <div className="roi-result">
              <div className="roi-result-label">CPM</div>
              <div className="roi-result-val">₹{cpm}</div>
            </div>
            <div className="roi-result">
              <div className="roi-result-label">Billboards in Budget</div>
              <div className="roi-result-val">
                ~{boards}-{boards + 2}
              </div>
            </div>
            <div className="roi-result">
              <div className="roi-result-label">Digital Equivalent</div>
              <div className="roi-result-val highlight">₹{(dc / 100000).toFixed(1)}L</div>
            </div>
          </div>
          <div className="roi-savings-note">
            You save <strong>₹{(sv / 100000).toFixed(1)}L</strong> vs an equivalent reach campaign
            on Google Display.
          </div>
          <Link
            to={ROUTES.browse}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, display: 'flex' }}
          >
            Find Billboards in My Budget →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ── COMPARE TABLE ── */
function CompareTable() {
  const [tab, setTab] = useState('ooh');
  const d = COMPARE_DATA[tab];
  return (
    <section className="compare-section">
      <Reveal>
        <span className="section-label">The Numbers</span>
        <h2 className="section-title">
          OOH vs every other
          <br />
          channel. <em>Side by side.</em>
        </h2>
        <p className="section-sub">
          Share this with your CFO. These are real Indian market benchmarks — not estimates.
        </p>
      </Reveal>
      <Reveal className="compare-tabs">
        {COMPARE_TABS.map(([key, label]) => (
          <button
            key={key}
            className={cn('compare-tab', tab === key && 'active')}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </Reveal>
      <Reveal className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="highlighted">OOH (India)</th>
              <th>{d.header}</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => {
              const [other, ooh, winner, otherWins] = r;
              return (
                <tr key={COMPARE_METRICS[i]}>
                  <td className="compare-metric">{COMPARE_METRICS[i]}</td>
                  <td className="highlighted">
                    {ooh}
                    {winner && !otherWins && <span className="compare-winner">Best</span>}
                  </td>
                  <td>
                    {other}
                    {(!winner || otherWins) && (
                      <span className="compare-winner compare-winner-gold">Best</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Reveal>
    </section>
  );
}

/* ── INSPIRATION ── */
function Inspiration() {
  const { openRegister } = useAuthModal();
  const [filter, setFilter] = useState('all');
  return (
    <section className="inspiration-section">
      <Reveal>
        <span className="section-label">Campaign Inspiration</span>
        <h2 className="section-title">
          Brands like yours
          <br />
          ran <em>these campaigns.</em>
        </h2>
        <p className="section-sub">
          Real OOH campaigns run through The AdBasket. Filter by your industry.
        </p>
      </Reveal>
      <Reveal className="inspiration-filter">
        {INS_FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={cn('ins-filter-btn', filter === key && 'active')}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </Reveal>
      <div className="inspiration-grid">
        {INSPIRATION.map((c, i) => (
          <Reveal
            className="ins-card"
            delay={(i % 3) + 1}
            key={c.tag}
            style={{ display: filter === 'all' || c.industry === filter ? undefined : 'none' }}
          >
            <div className={cn('ins-card-header', c.header)}>
              <span className="ins-industry">{c.tag}</span>
              <span className="ins-brand-init">{c.init}</span>
            </div>
            <div className="ins-card-body">
              <div className="ins-campaign">{c.campaign}</div>
              <div className="ins-meta-grid">
                {c.meta.map(([v, l]) => (
                  <div className="ins-meta" key={l}>
                    <div className="ins-meta-val">{v}</div>
                    <div className="ins-meta-lbl">{l}</div>
                  </div>
                ))}
              </div>
              <div className="ins-result">
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
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>{' '}
                {c.result}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40 }} className="reveal visible">
        <button className="btn-ghost btn-large" onClick={openRegister}>
          See Full Case Studies in Dashboard →
        </button>
      </div>
    </section>
  );
}

/* ── TENDER ── */
function TenderSection() {
  const { openGate } = useAuthModal();
  const { showToast } = useToast();
  const [scope, setScope] = useState('bb');
  const submit = () => {
    showToast("You'll need to register as an advertiser before you can post a campaign.");
    openGate();
  };
  const feats = [
    [
      'tf-blue',
      'var(--indigo)',
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>,
      'Identity stays private',
      'Owners and agencies only see your budget and category — never your company name until you accept a bid.',
    ],
    [
      'tf-gold',
      'var(--gold)',
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>,
      'Both owners & agencies bid',
      'Choose to receive bids from billboard owners, agencies, or both. One brief — maximum options.',
    ],
    [
      'tf-teal',
      'var(--teal)',
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
      'Proposals in 48 hours',
      '3,400+ owners and 400+ agencies. Packaged proposals arrive with availability calendars and cost breakdowns.',
    ],
  ];
  return (
    <section id="campaign" className="tender-section">
      <div className="tender-grid">
        <Reveal>
          <span className="section-label">The Campaign Way</span>
          <h2 className="section-title">
            Post your brief.
            <br />
            <em>Let the best bid.</em>
          </h2>
          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              color: 'var(--ink-muted)',
              lineHeight: 1.78,
              maxWidth: 480,
            }}
          >
            Post your campaign requirements once — anonymously. Verified billboard owners AND
            agencies send packaged proposals within 48 hours. You compare and pick.
          </p>
          <div className="tender-features">
            {feats.map(([tone, stroke, path, title, desc]) => (
              <div className="tender-feature" key={title}>
                <div className={cn('tender-feature-icon', tone)}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={stroke}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {path}
                  </svg>
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="tender-form-card" delay={2}>
          <h3>Post a Campaign</h3>
          <p className="sub">
            One campaign brief. Bids from owners and agencies. You stay anonymous.
          </p>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-muted)',
                letterSpacing: 1,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 10,
              }}
            >
              Who should bid?
            </label>
            <div className="tender-scope-toggle">
              <button
                className={cn('scope-btn', scope === 'bb' && 'active-scope-bb')}
                onClick={() => setScope('bb')}
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
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4 8 4v14" />
                  <path d="M9 9h1" />
                  <path d="M14 9h1" />
                  <path d="M9 13h1" />
                  <path d="M14 13h1" />
                  <path d="M9 17h1" />
                  <path d="M14 17h1" />
                </svg>{' '}
                Billboard Owners
              </button>
              <button
                className={cn('scope-btn', scope === 'ag' && 'active-scope-ag')}
                onClick={() => setScope('ag')}
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
                  <path d="M3 21h18" />
                  <path d="M5 21V11l6-4 6 4v10" />
                  <path d="M9 21v-4h4v4" />
                  <path d="M19 21V9l-6-4" />
                </svg>{' '}
                Agencies
              </button>
              <button
                className={cn('scope-btn', scope === 'both' && 'active-scope-both')}
                onClick={() => setScope('both')}
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
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>{' '}
                Both
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Industry</label>
            <select className="form-control" defaultValue="">
              <option value="">Select industry</option>
              <option>FMCG / Consumer Goods</option>
              <option>Real Estate</option>
              <option>Education</option>
              <option>Healthcare</option>
              <option>Retail / Fashion</option>
              <option>Technology / IT</option>
              <option>Automotive</option>
              <option>Banking / Finance</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target City</label>
            <select className="form-control" defaultValue="">
              <option value="">Select city</option>
              <option>Mumbai</option>
              <option>Delhi NCR</option>
              <option>Bengaluru</option>
              <option>Pune</option>
              <option>Hyderabad</option>
              <option>Chennai</option>
              <option>Ahmedabad</option>
              <option>Pan India</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Budget</label>
              <select className="form-control" defaultValue="">
                <option value="">Select range</option>
                <option>Under ₹50,000</option>
                <option>₹50K – ₹2 Lakh</option>
                <option>₹2L – ₹10 Lakh</option>
                <option>₹10L – ₹50 Lakh</option>
                <option>₹1 Crore+</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <select className="form-control" defaultValue="3 Months">
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Campaign Brief (optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="What are you promoting? Any specific requirements?"
            />
          </div>
          <button className="btn-primary form-submit" onClick={submit}>
            Post Campaign Anonymously →
          </button>
          <div className="form-note">
            Company name &amp; contact never shared until you accept a bid
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── AGENCY SPOTLIGHT ── */
function AgencySpotlight() {
  const { openRegister } = useAuthModal();
  return (
    <section className="agency-spotlight-section">
      <Reveal>
        <span className="section-label">Agency Spotlight</span>
        <h2 className="section-title">
          Prefer a specialist to
          <br />
          handle it <em>end-to-end?</em>
        </h2>
        <p className="section-sub">
          Brief a verified OOH agency — they handle strategy, creative, buying, and on-ground
          installation. You just approve the plan.
        </p>
      </Reveal>
      <div className="agency-grid">
        {SPOTLIGHT.map((a, i) => (
          <Reveal className="agency-card" delay={i + 1} key={a.name} onClick={openRegister}>
            <div className="agency-card-top">
              <div className="agency-avatar" style={{ background: a.grad }}>
                {a.init}
              </div>
              <span className="agency-verified">GST Verified</span>
            </div>
            <div className="agency-name">{a.name}</div>
            <div className="agency-city">{a.city}</div>
            <div className="agency-tags">
              {a.tags.map((t) => (
                <span className="agency-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="agency-footer">
              <div className="agency-rating">
                {starSm('var(--gold)')}
                <span className="agency-rating-num">{a.rating}</span>
                <span className="agency-rating-count">{a.count}</span>
              </div>
              <span className="agency-campaigns">{a.campaigns}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40 }} className="reveal visible">
        <Link to={ROUTES.browseAgencies} className="btn-gold btn-large">
          Browse All 400+ Agencies →
        </Link>
      </div>
    </section>
  );
}

/* ── SHORTLIST / PLANNER ── */
function Shortlist() {
  const { openRegister } = useAuthModal();
  const items = [
    [
      'linear-gradient(135deg,#1e2d5a,#3b5ea8)',
      'BKC LED, Mumbai',
      '1.2L impressions/day',
      'sl-type-bb',
      'Billboard',
      '₹5.8L/mo',
    ],
    [
      'linear-gradient(135deg,#D97706,#F59E0B)',
      'Brandworks Mumbai',
      'Full-service · 124 campaigns',
      'sl-type-ag',
      'Agency',
      'Get quote',
    ],
    [
      'linear-gradient(135deg,#0c2340,#0a82c0)',
      'MG Road LED, Bengaluru',
      '1.1L impressions/day',
      'sl-type-bb',
      'Billboard',
      '₹2.8L/mo',
    ],
    [
      'linear-gradient(135deg,#1a2e1a,#3d6b3d)',
      'CP Gantry, Delhi NCR',
      '90K impressions/day',
      'sl-type-bb',
      'Billboard',
      '₹4.2L/mo',
    ],
  ];
  return (
    <section className="shortlist-section">
      <div className="shortlist-grid">
        <Reveal>
          <span className="section-label">Campaign Planner</span>
          <h2 className="section-title">
            Mix spaces &amp; agencies.
            <br />
            <em>One plan.</em>
          </h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            Shortlist billboard spaces and agencies side by side. The Campaign Planner calculates
            combined reach and exports a shareable PDF — formatted for leadership presentations.
          </p>
          <div className="shortlist-info-points">
            <div className="roi-info-point">
              <div className="roi-info-icon blue">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--indigo)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="roi-info-text">
                <strong>Mix &amp; match freely</strong>
                <span>
                  Add billboards from Mumbai, an agency from Delhi, and transit ads from Bengaluru —
                  all in one plan.
                </span>
              </div>
            </div>
            <div className="roi-info-point">
              <div className="roi-info-icon gold">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="roi-info-text">
                <strong>Export as PDF</strong>
                <span>
                  One-click PDF — formatted for board presentations with combined reach, spend, and
                  timeline.
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn-primary btn-large" onClick={openRegister}>
              Start Your Media Plan →
            </button>
          </div>
        </Reveal>
        <Reveal delay={2}>
          <div className="shortlist-card">
            <div className="shortlist-card-header">
              <span className="shortlist-card-title">My Campaign Shortlist</span>
              <span className="shortlist-count">4 items</span>
            </div>
            <div className="shortlist-items">
              {items.map(([grad, name, loc, typeCls, typeLabel, price]) => (
                <div className="sl-item" key={name}>
                  <div className="sl-item-icon" style={{ background: grad }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="1.5"
                    >
                      {typeLabel === 'Agency' ? (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </>
                      ) : (
                        <>
                          <rect x="3" y="9" width="5" height="12" />
                          <rect x="9" y="5" width="6" height="16" />
                          <rect x="17" y="11" width="4" height="10" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div className="sl-item-info">
                    <div className="sl-item-name">{name}</div>
                    <div className="sl-item-loc">{loc}</div>
                  </div>
                  <span className={cn('sl-item-type', typeCls)}>{typeLabel}</span>
                  <div className="sl-item-price">{price}</div>
                </div>
              ))}
            </div>
            <div className="shortlist-footer">
              <div>
                <span className="shortlist-total-label">Combined monthly spend</span>
                <span className="shortlist-total">₹12.8L / month</span>
              </div>
              <button className="btn-primary btn-sm" onClick={openRegister}>
                Export PDF
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── WHY ── */
function WhySection() {
  return (
    <section className="why-section">
      <Reveal>
        <span className="section-label">Why The AdBasket</span>
        <h2 className="section-title">
          Built for <em>India&apos;s advertisers.</em>
        </h2>
        <p className="section-sub">
          We spoke to CMOs, brand managers, and media planners across 18 cities. Here&apos;s what we
          built.
        </p>
      </Reveal>
      <div className="why-grid">
        {WHY.map(([tone, icon, title, desc], i) => (
          <Reveal className="why-card" delay={(i % 3) + 1} key={title}>
            <div className={cn('why-icon', tone)}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={whyStroke[tone]}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {whyIcon[icon]}
              </svg>
            </div>
            <div className="why-title">{title}</div>
            <div className="why-desc">{desc}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ── */
function Testimonials() {
  return (
    <section className="testimonials-section">
      <Reveal>
        <span className="section-label">Advertiser Stories</span>
        <h2 className="section-title">
          Campaigns that <em>worked.</em>
        </h2>
      </Reveal>
      <div className="testimonials-track">
        {TESTIMONIALS.map((t, i) => (
          <Reveal className="testi-card" delay={i + 1} key={t.name}>
            <span className="testi-industry-tag" style={t.tagStyle}>
              {t.tag}
            </span>
            <div className="testi-text">{t.text}</div>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: t.grad }}>
                {t.avatar}
              </div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-company">{t.company}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ── */
function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq-section">
      <div className="faq-grid">
        <Reveal className="faq-intro">
          <span className="section-label">Real Questions</span>
          <h2 className="section-title">
            The things CMOs
            <br />
            actually <em>ask us.</em>
          </h2>
          <p>
            These aren&apos;t FAQ-page filler. These are the exact doubts that come up before
            someone posts their first campaign or books their first space.
          </p>
          <div className="faq-intro-note">
            <div className="faq-intro-note-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--indigo)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p>
              Every booking on The AdBasket is backed by our verified inventory guarantee. If a
              confirmed space goes unavailable after booking, we find an equivalent replacement at
              no extra cost.
            </p>
          </div>
        </Reveal>
        <Reveal className="faq-items" delay={2}>
          {FAQ.map(([q, a], i) => (
            <div className={cn('faq-item', open === i && 'open')} key={q}>
              <div className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span className="faq-q-text">{q}</span>
                <span className="faq-chevron">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
              <div className="faq-a" style={{ maxHeight: open === i ? 400 : undefined }}>
                <div className="faq-a-inner">{a}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CtaDark() {
  const { openRegister } = useAuthModal();
  return (
    <section className="cta-dark">
      <span className="section-label">Get Started</span>
      <h2 className="section-title">
        Your next campaign
        <br />
        starts <em>right here.</em>
      </h2>
      <p className="section-sub">
        Join 5,000+ businesses browsing billboard spaces and briefing agencies through The AdBasket
        — completely free.
      </p>
      <div className="cta-actions">
        <button className="btn-primary btn-large" onClick={openRegister}>
          Create Free Account
        </button>
        <Link to={ROUTES.browse} className="btn-ghost-light btn-large">
          Browse Billboards →
        </Link>
        <Link to={ROUTES.browseAgencies} className="btn-ghost-light btn-large">
          Find an Agency →
        </Link>
      </div>
      <div className="cta-guarantee">
        Backed by our <strong>verified inventory guarantee</strong> — free replacement if a
        confirmed space falls through.
      </div>
    </section>
  );
}

export function AdvertiserHome() {
  const [city, setCity] = useState('Mumbai');
  const floatBar = (
    <FloatBar
      text={
        <>
          <strong>{city}</strong> has <strong>{CITY_DATA[city].listings} spaces</strong> available
          now
        </>
      }
      actions={
        <>
          <Link to={ROUTES.browse} className="float-bar-btn fbb-primary">
            Browse Spaces
          </Link>
          <FloatPost />
        </>
      }
    />
  );
  return (
    <HomeLayout
      pageClassName="advertiser-home-page"
      nav={NAV}
      footer={SITE_FOOTER}
      floatBar={floatBar}
    >
      <Hero />
      <LiveTicker />
      <TrustBar />
      <Featured />
      <CityExplorer city={city} setCity={setCity} />
      <DualPath />
      <HowItWorks />
      <RoiCalculator />
      <CompareTable />
      <Inspiration />
      <TenderSection />
      <AgencySpotlight />
      <Shortlist />
      <WhySection />
      <Testimonials />
      <Faq />
      <CtaDark />
    </HomeLayout>
  );
}

function FloatPost() {
  const { openRegister } = useAuthModal();
  return (
    <button className="float-bar-btn fbb-ghost" onClick={openRegister}>
      Post Campaign
    </button>
  );
}

export default AdvertiserHome;
