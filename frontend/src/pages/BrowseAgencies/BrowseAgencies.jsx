import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import {
  AGENCIES,
  AGENCY_TYPES,
  CITIES,
  COVERAGES,
  SORTS,
  SERVICE_PILLS,
  INDUSTRY_PILLS,
  EXPERIENCE,
  BUDGETS,
  TYPE_GRADIENT,
  TYPE_BADGE_CLASS,
} from './agenciesData';
import './BrowseAgencies.css';

const Caret = () => (
  <span className="dropdown-caret">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </span>
);
const SelectArrow = () => (
  <span className="filter-select-arrow">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </span>
);

function Dropdown({ id, openId, setOpenId, trigger, className, children }) {
  const open = openId === id;
  return (
    <div className={cn('custom-dropdown', className)}>
      <button
        className={cn('dropdown-trigger', trigger.hasValue && 'has-value', open && 'open')}
        onClick={() => setOpenId(open ? null : id)}
      >
        {trigger.icon}
        <span>{trigger.label}</span>
        <Caret />
      </button>
      <div className={cn('dropdown-panel', open && 'open')}>{children}</div>
    </div>
  );
}
function DItem({ selected, onClick, children }) {
  return (
    <div className={cn('dropdown-item', selected && 'selected')} onClick={onClick}>
      {children}
    </div>
  );
}
const monogramOf = (name) => name.split(' ').slice(0, 2).map((w) => w[0]).join('');

/* ── Nav ── */
function BrowseNav({ onSignIn }) {
  const switcherRef = useRef(null);
  const activeRef = useRef(null);
  const [pill, setPill] = useState({ width: 0, x: 0 });
  useLayoutEffect(() => {
    if (!switcherRef.current || !activeRef.current) return;
    const sr = switcherRef.current.getBoundingClientRect();
    const br = activeRef.current.getBoundingClientRect();
    setPill({ width: br.width, x: br.left - sr.left - 3 });
  }, []);
  return (
    <nav className="site-nav">
      <div className="nav-left">
        <Link to={ROUTES.home} className="nav-logo">
          <span className="logo-the">The</span><span className="logo-ad">Ad</span><span className="logo-bsk">Basket</span>
        </Link>
        <Link to={ROUTES.home} className="nav-back">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Home
        </Link>
        <div className="nav-switcher" ref={switcherRef}>
          <div className="nav-switcher-pill" style={{ width: pill.width, transform: `translateX(${pill.x}px)` }} />
          <Link to={ROUTES.browse} className="nav-switch-btn">Billboards</Link>
          <span className="nav-switch-btn active" ref={activeRef}>Agencies</span>
        </div>
      </div>
      <div className="nav-cta">
        <button className="btn-nav-ghost" onClick={onSignIn}>Sign In</button>
        <button className="btn-nav-primary" onClick={onSignIn}>Get Started Free</button>
      </div>
    </nav>
  );
}

/* ── Agency card ── */
function AgencyCard({ a, index, onOpen }) {
  const serviceTags = a.services.slice(0, 4).map((s) => (
    <span key={s} className="card-service-tag">{s}</span>
  ));
  return (
    <div
      className="listing-card"
      onClick={() => onOpen(a.id)}
      style={{ animation: 'fadeUp 0.42s ease both', animationDelay: `${(index % 4) * 0.06}s` }}
    >
      <div className="card-img">
        <div className={cn('card-img-inner', TYPE_GRADIENT[a.type] || 'ci-fullservice')}>
          <span className="agency-monogram">{monogramOf(a.name)}</span>
        </div>
        <span className={cn('card-type-badge', TYPE_BADGE_CLASS[a.type] || 'tb-full')}>{a.type}</span>
        {a.verified && <span className="card-verified">Verified</span>}
      </div>
      <div className="card-body">
        <div className="card-location">{a.city} · {a.hq.split(',')[0]}</div>
        <div className="card-title">{a.name}</div>
        <div className="card-tagline">{a.tagline}</div>
        <div className="card-service-tags">
          {serviceTags}
          {a.services.length > 4 && <span className="card-service-tag overflow">+{a.services.length - 4} more</span>}
        </div>
        <div className="card-stats">
          <div className="card-stat"><div className="stat-num">{a.expYears}yr</div><div className="stat-label">Experience</div></div>
          <div className="card-stat"><div className="stat-num">{a.campaigns}</div><div className="stat-label">Campaigns</div></div>
          <div className="card-stat"><div className="stat-num">{a.industries.length}</div><div className="stat-label">Industries</div></div>
        </div>
        <div className="card-divider" />
        <div className="card-footer">
          <div className="card-budget-group">
            <div className="card-budget">{a.minBudget}</div>
            <div className="card-budget-sub">min. campaign budget</div>
          </div>
          <div className="card-meta">
            <div className="card-coverage">{a.coverage}</div>
            <button className="card-cta-btn">View Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Detail panel ── */
function DetailPanel({ a, onClose, onSubmit }) {
  return (
    <div className="detail-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel">
        <div className="dp-header">
          <span className="dp-breadcrumb">Agencies / {a.city}</span>
          <button className="dp-close" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className={cn('dp-img', TYPE_GRADIENT[a.type] || 'ci-fullservice')}>
          <div className="dp-img-monogram">{monogramOf(a.name)}</div>
          <span className="dp-img-badge">{a.type}</span>
          {a.verified && <span className="dp-img-verified">Verified Agency</span>}
        </div>
        <div className="dp-body">
          <div className="dp-tags">
            {a.services.slice(0, 3).map((s) => (
              <span key={s} className="dp-tag service-tag">{s}</span>
            ))}
          </div>
          <div className="dp-title">{a.name}</div>
          <div className="dp-tagline">{a.tagline}</div>
          <div className="dp-specs-grid">
            {[
              ['HQ', a.hq], ['Established', `${a.yearEst} (${a.expYears} yrs)`], ['Campaigns', a.campaigns],
              ['Min Budget', a.minBudget], ['Coverage', a.coverage], ['Pricing Model', a.pricing],
            ].map(([label, value]) => (
              <div className="dp-spec" key={label}>
                <div className="dp-spec-label">{label}</div>
                <div className="dp-spec-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="dp-section-title">Services Offered</div>
          <div className="dp-tags">
            {a.services.map((s) => (<span key={s} className="dp-tag service-tag">{s}</span>))}
          </div>
          <div className="dp-section-title">Industry Expertise</div>
          <div className="dp-tags">
            {a.industries.map((i) => (<span key={i} className="dp-tag industry-tag">{i}</span>))}
          </div>
          <div className="dp-section-title">Operating Cities</div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 300, marginBottom: 6 }}>{a.cities}</p>
          <div className="dp-section-title">Key Clients</div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 300, marginBottom: 6 }}>{a.clients}</p>
          <div className="dp-section-title">Portfolio Highlights</div>
          {a.portfolio.map((p) => (
            <div className="dp-portfolio-item" key={p.title}>
              <div className="dp-portfolio-title">{p.title}</div>
              <div className="dp-portfolio-meta">{p.meta}</div>
            </div>
          ))}
          <form className="inquiry-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <h4>Send an Inquiry</h4>
            <div className="form-group">
              <label>Your Industry</label>
              <select className="form-control">
                <option>FMCG / Consumer Goods</option><option>Real Estate</option><option>Education</option>
                <option>Healthcare</option><option>Retail / Fashion</option><option>Technology / IT</option>
                <option>Automotive</option><option>Banking / Finance</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Campaign Budget</label>
              <select className="form-control">
                <option>₹50K – ₹2L</option><option>₹2L – ₹10L</option><option>₹10L – ₹50L</option>
                <option>₹50L – ₹1 Crore</option><option>₹1 Crore+</option>
              </select>
            </div>
            <div className="form-group">
              <label>Brief (optional)</label>
              <textarea className="form-control" rows="3" placeholder="Describe your campaign requirements…" style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="form-submit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Send Inquiry to {a.name.split(' ')[0]}
            </button>
            <div className="form-note">Agency will respond within 24–48 hours</div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Auth modal (teal variant) ── */
function AuthModal({ onClose }) {
  const { showToast } = useToast();
  const [view, setView] = useState('login');
  const submit = (e) => {
    e.preventDefault();
    if (view === 'register') { setView('success'); return; }
    showToast('Welcome back — redirecting…');
    setTimeout(onClose, 1200);
  };
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {view === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h3 style={{ marginBottom: 8 }}>You&apos;re in!</h3>
            <p className="sub" style={{ marginBottom: 28 }}>Check your email to verify your account. Start exploring agencies.</p>
            <button className="auth-submit" onClick={onClose} style={{ maxWidth: 220, margin: '0 auto' }}>Start Browsing</button>
          </div>
        ) : (
          <>
            <h3>{view === 'login' ? 'Welcome back' : 'Create your account'}</h3>
            <p className="sub">{view === 'login' ? 'Sign in to your AdBasket account.' : 'Free to join. Find your OOH agency partner.'}</p>
            <div className="tab-bar">
              <button className={cn('tab-btn', view === 'login' && 'active')} onClick={() => setView('login')}>Sign In</button>
              <button className={cn('tab-btn', view === 'register' && 'active')} onClick={() => setView('register')}>Create Account</button>
            </div>
            <form onSubmit={submit}>
              {view === 'register' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group"><label>First Name</label><input type="text" className="form-control" placeholder="Rahul" required /></div>
                  <div className="form-group"><label>Last Name</label><input type="text" className="form-control" placeholder="Sharma" required /></div>
                </div>
              )}
              <div className="form-group"><label>Email Address</label><input type="email" className="form-control" placeholder="you@company.com" required /></div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder={view === 'login' ? 'Your password' : 'Min 8 characters'} required minLength={view === 'register' ? 8 : undefined} />
              </div>
              {view === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-mid)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--teal)' }} /> Remember me
                  </label>
                  <a href="#" style={{ fontSize: 13, color: 'var(--teal)' }} onClick={(e) => e.preventDefault()}>Forgot password?</a>
                </div>
              )}
              <button type="submit" className="auth-submit">{view === 'login' ? 'Sign In' : 'Create Free Account'}</button>
            </form>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', marginTop: 14 }}>
              {view === 'login' ? 'No account? ' : 'Already registered? '}
              <a href="#" onClick={(e) => { e.preventDefault(); setView(view === 'login' ? 'register' : 'login'); }} style={{ color: 'var(--teal)', fontWeight: 500 }}>
                {view === 'login' ? 'Register free' : 'Sign in'}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function BrowseAgencies() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [coverage, setCoverage] = useState('');
  const [exp, setExp] = useState('');
  const [budget, setBudget] = useState('');
  const [services, setServices] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [view, setView] = useState('grid');
  const [openDD, setOpenDD] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onClick = (e) => { if (!e.target.closest('.custom-dropdown')) setOpenDD(null); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  useEffect(() => {
    document.body.style.overflow = detailId != null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [detailId]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    let list = AGENCIES.filter((a) => {
      if (type && a.type !== type) return false;
      if (city && a.city !== city) return false;
      if (exp && a.expYears < parseInt(exp, 10)) return false;
      if (budget && a.minBudgetNum > parseInt(budget, 10)) return false;
      if (coverage && a.coverage !== coverage) return false;
      if (verifiedOnly && !a.verified) return false;
      if (services.length && !services.every((sv) => a.services.some((as) => as.includes(sv.split(' ')[0])))) return false;
      if (industries.length && !industries.every((i) => a.industries.some((ai) => ai.includes(i)))) return false;
      if (s) {
        const h = [a.name, a.tagline, a.type, a.city, ...a.services, ...a.industries, a.clients].join(' ').toLowerCase();
        if (!h.includes(s)) return false;
      }
      return true;
    });
    if (sort === 'exp_desc') list = [...list].sort((a, b) => b.expYears - a.expYears);
    else if (sort === 'campaigns_desc') list = [...list].sort((a, b) => b.campaignsNum - a.campaignsNum);
    else if (sort === 'budget_asc') list = [...list].sort((a, b) => a.minBudgetNum - b.minBudgetNum);
    return list;
  }, [search, type, city, coverage, exp, budget, services, industries, verifiedOnly, sort]);

  const toggleIn = (setter) => (v) => setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleService = toggleIn(setServices);
  const toggleIndustry = toggleIn(setIndustries);

  const resetFilters = () => {
    setSearch(''); setType(''); setCity(''); setCoverage(''); setExp(''); setBudget('');
    setServices([]); setIndustries([]); setVerifiedOnly(false); setSort('relevance');
    showToast('All filters reset');
  };

  const chips = [];
  if (search) chips.push({ label: `"${search}"`, clear: () => setSearch('') });
  if (type) chips.push({ label: type, clear: () => setType('') });
  if (city) chips.push({ label: city, clear: () => setCity('') });
  if (exp) chips.push({ label: `${exp}+ yrs`, clear: () => setExp('') });
  if (budget) chips.push({ label: 'Budget filter', clear: () => setBudget('') });
  if (coverage) chips.push({ label: coverage, clear: () => setCoverage('') });
  if (verifiedOnly) chips.push({ label: 'Verified only', clear: () => setVerifiedOnly(false) });
  services.forEach((s) => chips.push({ label: s, clear: () => toggleService(s) }));
  industries.forEach((i) => chips.push({ label: i, clear: () => toggleIndustry(i) }));

  const detail = detailId != null ? AGENCIES.find((a) => a.id === detailId) : null;
  const typeShort = AGENCY_TYPES.find((t) => t.v === type)?.short;

  return (
    <div className="browse-agencies-page">
      <BrowseNav onSignIn={() => setAuthOpen(true)} />

      {/* Command bar */}
      <div className="browse-bar">
        <div className="browse-search-wrap">
          <span className="browse-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </span>
          <input type="text" className="browse-search-input" placeholder="Agency name, service, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="bar-divider" />

        <Dropdown id="type" openId={openDD} setOpenId={setOpenDD}
          trigger={{ hasValue: !!type, label: typeShort || 'Agency Type', icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          ) }}>
          <div className="dropdown-label">Agency Type</div>
          <DItem selected={!type} onClick={() => { setType(''); setOpenDD(null); }}>All Types</DItem>
          <div className="dropdown-divider" />
          {AGENCY_TYPES.map((t) => (
            <DItem key={t.v} selected={type === t.v} onClick={() => { setType(t.v); setOpenDD(null); }}>{t.v}</DItem>
          ))}
        </Dropdown>

        <Dropdown id="city" openId={openDD} setOpenId={setOpenDD}
          trigger={{ hasValue: !!city, label: city || 'City / HQ', icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          ) }}>
          <div className="dropdown-label">City / HQ</div>
          <DItem selected={!city} onClick={() => { setCity(''); setOpenDD(null); }}>All Cities</DItem>
          <div className="dropdown-divider" />
          {CITIES.map((c) => (
            <DItem key={c} selected={city === c} onClick={() => { setCity(c); setOpenDD(null); }}>{c}</DItem>
          ))}
        </Dropdown>

        <Dropdown id="coverage" openId={openDD} setOpenId={setOpenDD}
          trigger={{ hasValue: !!coverage, label: coverage || 'Coverage', icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          ) }}>
          <div className="dropdown-label">Coverage</div>
          <DItem selected={!coverage} onClick={() => { setCoverage(''); setOpenDD(null); }}>Any Coverage</DItem>
          <div className="dropdown-divider" />
          {COVERAGES.map((c) => (
            <DItem key={c} selected={coverage === c} onClick={() => { setCoverage(c); setOpenDD(null); }}>{c}</DItem>
          ))}
        </Dropdown>

        <div className="bar-divider" />

        <div className="browse-bar-right">
          <Dropdown id="sort" openId={openDD} setOpenId={setOpenDD} className="align-right"
            trigger={{ hasValue: false, label: SORTS.find((s) => s.value === sort)?.label || 'Relevance', icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            ) }}>
            <div className="dropdown-label">Sort by</div>
            {SORTS.map((s) => (
              <DItem key={s.value} selected={sort === s.value} onClick={() => { setSort(s.value); setOpenDD(null); }}>{s.label}</DItem>
            ))}
          </Dropdown>
          <div className="view-toggle">
            <button className={cn('view-btn', view === 'grid' && 'active')} onClick={() => setView('grid')} title="Grid view">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
            <button className={cn('view-btn', view === 'list' && 'active')} onClick={() => setView('list')} title="List view">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="browse-layout">
        <aside className="filter-sidebar">
          <div className="filter-header">
            <div className="filter-header-left">
              <div className="filter-header-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              </div>
              <span className="filter-header-title">Filters</span>
            </div>
            <button className="filter-reset-btn" onClick={resetFilters}>Reset all</button>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Search</span>
            <div className="sidebar-search-wrap">
              <span className="sidebar-search-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg></span>
              <input type="text" className="sidebar-search-input" placeholder="Agency, service, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Agency Type</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types</option>
                {AGENCY_TYPES.map((t) => (<option key={t.v} value={t.v}>{t.v}</option>))}
              </select>
              <SelectArrow />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">City / HQ</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <SelectArrow />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Services Offered</span>
            <div className="filter-pills">
              {SERVICE_PILLS.map((p) => (
                <button key={p.v} className={cn('filter-pill', services.includes(p.v) && 'active')} onClick={() => toggleService(p.v)}>{p.l}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Industry Expertise</span>
            <div className="filter-pills">
              {INDUSTRY_PILLS.map((p) => (
                <button key={p.v} className={cn('filter-pill', industries.includes(p.v) && 'active')} onClick={() => toggleIndustry(p.v)}>{p.l}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Experience</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={exp} onChange={(e) => setExp(e.target.value)}>
                <option value="">Any Experience</option>
                {EXPERIENCE.map((x) => (<option key={x.v} value={x.v}>{x.l}</option>))}
              </select>
              <SelectArrow />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Min Campaign Budget</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">Any Budget</option>
                {BUDGETS.map((x) => (<option key={x.v} value={x.v}>{x.l}</option>))}
              </select>
              <SelectArrow />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Coverage</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={coverage} onChange={(e) => setCoverage(e.target.value)}>
                <option value="">Any Coverage</option>
                {COVERAGES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <SelectArrow />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Verified Status</span>
            <div className="filter-toggle-row">
              <span className="filter-toggle-label">Verified only</span>
              <div className={cn('toggle-switch', verifiedOnly && 'on')} onClick={() => setVerifiedOnly((v) => !v)} />
            </div>
          </div>

          <div className="sidebar-cta">
            <Link to={ROUTES.agencyRegister} className="sidebar-cta-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              Register Your Agency
            </Link>
          </div>
        </aside>

        <div className="browse-main">
          <div className="results-topbar">
            <div className="results-count">
              Showing <strong>{filtered.length ? `1–${filtered.length}` : '0'}</strong> of <strong>{filtered.length}</strong> agencies
            </div>
          </div>

          {chips.length > 0 && (
            <div className="active-filters-row" style={{ display: 'flex' }}>
              {chips.map((c, i) => (
                <span className="active-tag" key={`${c.label}-${i}`}>
                  {c.label}
                  <button className="active-tag-x" onClick={c.clear}>×</button>
                </span>
              ))}
              <button className="filter-reset-btn" style={{ marginLeft: 4 }} onClick={resetFilters}>Clear all</button>
            </div>
          )}

          <div className="listings-area">
            {filtered.length === 0 ? (
              <div className="no-results" style={{ display: 'block' }}>
                <h3>No agencies found</h3>
                <p>
                  Try adjusting your filters or{' '}
                  <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13.5, fontFamily: 'var(--font-body)', fontWeight: 500 }}>reset all filters</button>
                </p>
              </div>
            ) : (
              <div className={cn('listings-grid', view === 'list' && 'list-view')}>
                {filtered.map((a, i) => (
                  <AgencyCard key={a.id} a={a} index={i} onOpen={setDetailId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <DetailPanel
          a={detail}
          onClose={() => setDetailId(null)}
          onSubmit={() => { showToast('Inquiry sent — the agency will respond within 48 hours.'); setDetailId(null); }}
        />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
