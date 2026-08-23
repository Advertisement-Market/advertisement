import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES, DASHBOARD_BY_ROLE } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/features/auth/AuthModal';
import { LogoMark } from '@/components/layout/Logo';
import {
  BILLBOARDS,
  CITIES,
  TRAFFIC_ZONES,
  QUICK_TAGS,
  SORTS,
  ICON_SVG,
  BOOKED_DAYS,
} from './browseData';
import './Browse.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TYPE_PILLS = [
  { v: '', l: 'All' },
  { v: 'Static Hoarding', l: 'Static' },
  { v: 'LED Digital', l: 'LED Digital' },
  { v: 'Unipole', l: 'Unipole' },
  { v: 'Gantry', l: 'Gantry' },
  { v: 'Bus Shelter', l: 'Bus Shelter' },
  { v: 'Building Wrap', l: 'Wrap' },
];
const TRAFFIC_PILLS = [
  { v: '', l: 'All' },
  { v: 'City / Urban', l: 'City' },
  { v: 'Highway', l: 'Highway' },
  { v: 'Commercial Zone', l: 'Commercial' },
  { v: 'Residential Area', l: 'Residential' },
];

const Caret = () => (
  <span className="dropdown-caret">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </span>
);

function Dropdown({ id, openId, setOpenId, trigger, className, panelStyle, children }) {
  const open = openId === id;
  return (
    <div className={cn('custom-dropdown', className)} data-dd={id}>
      <button
        className={cn('dropdown-trigger', trigger.hasValue && 'has-value', open && 'open')}
        onClick={() => setOpenId(open ? null : id)}
      >
        {trigger.icon}
        <span>{trigger.label}</span>
        <Caret />
      </button>
      <div className={cn('dropdown-panel', open && 'open')} style={panelStyle}>
        {children}
      </div>
    </div>
  );
}

function DropdownItem({ selected, onClick, icon, children }) {
  return (
    <div className={cn('dropdown-item', selected && 'selected')} onClick={onClick}>
      {icon && <span className="dropdown-item-icon">{icon}</span>}
      {children}
    </div>
  );
}

/* ── Nav ── */
function BrowseNav() {
  const switcherRef = useRef(null);
  const activeRef = useRef(null);
  const [pill, setPill] = useState({ width: 0, x: 0 });
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const dashTo = (user && DASHBOARD_BY_ROLE[user.role]) || ROUTES.browse;
  const onboarded = !!(user && DASHBOARD_BY_ROLE[user.role]);
  const handleLogout = () => {
    logout();
    showToast('You have been signed out.');
    navigate(ROUTES.home);
  };
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
          <LogoMark size={26} style={{ marginRight: 9 }} />
          <span className="logo-the">The</span>
          <span className="logo-ad">Ad</span>
          <span className="logo-bsk">Basket</span>
        </Link>
        <Link to={ROUTES.home} className="nav-back">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Home
        </Link>
        <div className="nav-switcher" ref={switcherRef}>
          <div
            className="nav-switcher-pill"
            style={{ width: pill.width, transform: `translateX(${pill.x}px)` }}
          />
          <span className="nav-switch-btn active" ref={activeRef}>
            Billboards
          </span>
          <Link to={ROUTES.browseAgencies} className="nav-switch-btn">
            Agencies
          </Link>
        </div>
      </div>
      <div className="nav-cta">
        {isAuthenticated ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>Hi, {user.firstName}</span>
            {onboarded && (
              <Link
                to={dashTo}
                className="btn-nav-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Dashboard
              </Link>
            )}
            <button className="btn-nav-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="btn-nav-ghost" onClick={openLogin}>
              Sign In
            </button>
            <button className="btn-nav-primary" onClick={openRegister}>
              Get Started Free
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

/* ── Listing card ── */
function ListingCard({ b, inCompare, inShortlist, onOpen, onToggleCompare, onToggleSave, index }) {
  const tagBadges = b.tags.map((t) => {
    const cls =
      t === 'Premium' ? 'ct-premium' : t === 'Digital' ? 'ct-digital' : t.includes('Traffic') ? 'ct-traffic' : 'ct-highway';
    return (
      <span key={t} className={cn('card-tag', cls)}>
        {t}
      </span>
    );
  });
  return (
    <div
      className={cn('listing-card', inCompare && 'in-compare')}
      onClick={() => onOpen(b.id)}
      style={{ animation: 'fadeUp 0.42s ease both', animationDelay: `${(index % 4) * 0.06}s` }}
    >
      <div className="card-img">
        <div className={cn('card-img-inner', `ci-${b.icon}`)}>
          <span className="card-icon" dangerouslySetInnerHTML={{ __html: ICON_SVG[b.icon] || ICON_SVG.city }} />
        </div>
        <div className="card-tags">{tagBadges}</div>
        <span className={cn('card-status', b.available ? 'cs-avail' : 'cs-booked')}>
          {b.available ? 'Available' : 'Booked'}
        </span>
        <div
          className={cn('compare-checkbox', inCompare && 'active')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(b.id);
          }}
          title="Compare"
        />
        <button
          className={cn('save-btn', inShortlist && 'saved')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(b.id);
          }}
          title="Save"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={inShortlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="card-body">
        <div className="card-location">
          {b.city} · {b.area}
        </div>
        <div className="card-title">{b.title}</div>
        <div className="card-specs">
          <span className="card-spec">{b.size}</span>
          <span className="card-spec-sep">·</span>
          <span className="card-spec">{b.type}</span>
          <span className="card-spec-sep">·</span>
          <span className="card-spec">{b.footfall}</span>
        </div>
        <div className="card-divider" />
        <div className="card-footer">
          <div className="card-price-group">
            <div className="card-price">{b.price}</div>
            <div className="card-price-sub">per month</div>
          </div>
          <div className="card-meta">
            <div className="card-rating">
              <span className="card-star">★</span> {b.rating}{' '}
              <span style={{ color: 'var(--ink-faint)' }}>({b.reviews})</span>
            </div>
            <button className="card-cta-btn">View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Availability calendar (inside detail panel) ── */
function Calendar({ available }) {
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(2026);
  const [selected, setSelected] = useState(null);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prev = () => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const next = () => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };
  return (
    <div className="avail-cal">
      <div className="cal-head">
        <button className="cal-nav-btn" onClick={prev}>←</button>
        <span className="cal-month-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav-btn" onClick={next}>→</button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="cal-day empty" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const booked = BOOKED_DAYS.includes(d) && !available;
          return (
            <div
              key={d}
              className={cn('cal-day', booked ? 'booked' : 'available', selected === d && 'selected')}
              onClick={() => !booked && setSelected(d)}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <div className="cal-leg-item"><div className="cal-leg-dot" style={{ background: 'var(--green)' }} />Available</div>
        <div className="cal-leg-item"><div className="cal-leg-dot" style={{ background: 'var(--rose)' }} />Booked</div>
        <div className="cal-leg-item"><div className="cal-leg-dot" style={{ background: 'var(--indigo)' }} />Selected</div>
      </div>
    </div>
  );
}

/* ── Detail panel ── */
function DetailPanel({ b, onClose, onSubmitQuote }) {
  const [pkg, setPkg] = useState('m3');
  const pkgs = [
    { k: 'm1', label: '1 month' },
    { k: 'm3', label: '3 months' },
    { k: 'm6', label: '6 months' },
    { k: 'm12', label: '12 months' },
  ];
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="detail-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel">
        <div className="dp-header">
          <span className="dp-breadcrumb">{b.city} / {b.area}</span>
          <button className="dp-close" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={cn('dp-img', `ci-${b.icon}`)}>
          <span style={{ opacity: 0.22, color: '#fff' }} dangerouslySetInnerHTML={{ __html: ICON_SVG[b.icon] || ICON_SVG.city }} />
        </div>
        <div className="dp-body">
          <div className="dp-tags">
            {b.tags.map((t) => (
              <span key={t} className="dp-tag">{t}</span>
            ))}
            <span
              className="dp-tag"
              style={
                b.available
                  ? { background: 'var(--green-light)', color: '#047857', borderColor: 'rgba(5,150,105,0.15)' }
                  : { background: 'var(--gold-light)', color: 'var(--gold-dark)', borderColor: 'rgba(217,119,6,0.15)' }
              }
            >
              {b.available ? 'Available' : 'Booked'}
            </span>
          </div>
          <div className="dp-title">{b.title}</div>
          <div className="dp-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {b.area}, {b.city}
          </div>
          <div className="dp-specs-grid">
            {[
              ['Size', b.size], ['Type', b.type], ['Facing', b.facing],
              ['Daily Footfall', b.footfall], ['Traffic Zone', b.traffic], ['Audience', b.audience],
            ].map(([label, value]) => (
              <div className="dp-spec" key={label}>
                <div className="dp-spec-label">{label}</div>
                <div className="dp-spec-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="dp-section-title">Pricing Packages</div>
          <div className="pkg-grid">
            {pkgs.map((p) => (
              <div key={p.k} className={cn('pkg-item', pkg === p.k && 'selected')} onClick={() => setPkg(p.k)}>
                <div className="pkg-dur">{p.label}</div>
                <div className="pkg-price">{b.packages[p.k]}</div>
              </div>
            ))}
          </div>
          <div className="dp-section-title">Availability — June 2026</div>
          <Calendar available={b.available} />
          <div className="dp-section-title">Advertiser Reviews</div>
          <div className="reviews-section">
            <div className="rating-summary">
              <div>
                <div className="rating-big">{b.rating}</div>
                <div className="rating-stars">{'★'.repeat(Math.floor(b.rating))}{'☆'.repeat(5 - Math.floor(b.rating))}</div>
                <div className="rating-count">{b.reviews} reviews</div>
              </div>
              <div style={{ flex: 1, paddingLeft: 16 }}>
                {[[5, 72], [4, 20], [3, 8]].map(([s, w]) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--ink-faint)', width: 8 }}>{s}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--cream-deep)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 3, width: `${w}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="review-item">
              <div className="review-header"><span className="review-author">Nisha P. · FMCG Brand</span><span className="review-date">Mar 2026</span></div>
              <div className="review-stars">★★★★★</div>
              <div className="review-text">Exceptional visibility and the owner was incredibly responsive. Traffic counts matched exactly what was advertised. Will rebook.</div>
            </div>
            <div className="review-item">
              <div className="review-header"><span className="review-author">Rahul S. · Real Estate</span><span className="review-date">Jan 2026</span></div>
              <div className="review-stars">★★★★☆</div>
              <div className="review-text">Great location for our township launch. Booking was smooth and we saw measurable walk-in increase during the campaign.</div>
            </div>
          </div>
          <div className="dp-section-title">Request a Quote</div>
          <div className="quote-form">
            <div className="form-group"><label>Campaign Start Date</label><input type="date" className="form-control" min={today} /></div>
            <div className="form-group">
              <label>Duration</label>
              <select className="form-control" defaultValue="3 Months">
                <option>1 Month</option><option>3 Months</option><option>6 Months</option><option>12 Months</option>
              </select>
            </div>
            <div className="form-group">
              <label>Message to Owner (optional)</label>
              <textarea className="form-control" rows="2" placeholder="Describe your campaign briefly…" style={{ resize: 'vertical' }} />
            </div>
            <button className="quote-submit" onClick={onSubmitQuote}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send Quote Request
            </button>
            <div className="quote-note">Your contact details stay private until the owner responds.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Compare modal ── */
function CompareModal({ items, onClose }) {
  const rows = [
    ['Size', 'size'], ['Type', 'type'], ['Facing', 'facing'], ['Footfall/day', 'footfall'],
    ['Traffic', 'traffic'], ['Monthly from', 'price'], ['Rating', 'rating'],
  ];
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3>Side-by-Side Comparison</h3>
        <p className="sub">Compare your saved billboards across key metrics.</p>
        <div className={cn('compare-grid', items.length === 2 ? 'cols-2' : 'cols-3')}>
          <div className="cg-cell cg-label" />
          {items.map((b) => (
            <div key={b.id} className="cg-cell cg-head">{b.title}</div>
          ))}
          {rows.map(([label, key]) => (
            <div key={label} style={{ display: 'contents' }}>
              <div className="cg-cell cg-label">{label}</div>
              {items.map((b) => (
                <div key={b.id} className="cg-cell cg-val">
                  {key === 'rating' ? `${b.rating} ★` : b[key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function Browse() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [traffic, setTraffic] = useState('');
  const [tags, setTags] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [availOnly, setAvailOnly] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [view, setView] = useState('grid');
  const [openDD, setOpenDD] = useState(null);
  const [saved, setSaved] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.custom-dropdown')) setOpenDD(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // lock scroll while the detail panel is open
  useEffect(() => {
    document.body.style.overflow = detailId != null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [detailId]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const minP = parseInt(priceMin, 10) || 0;
    const maxP = parseInt(priceMax, 10) || Infinity;
    let list = BILLBOARDS.filter((b) => {
      if (s && !b.title.toLowerCase().includes(s) && !b.city.toLowerCase().includes(s) && !b.area.toLowerCase().includes(s)) return false;
      if (city && b.city !== city) return false;
      if (type && b.type !== type) return false;
      if (traffic && b.traffic !== traffic) return false;
      if (tags.length && !tags.every((t) => b.tags.includes(t))) return false;
      if (b.priceNum < minP || b.priceNum > maxP) return false;
      if (availOnly && !b.available) return false;
      return true;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceNum - b.priceNum);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceNum - a.priceNum);
    else if (sort === 'footfall') list = [...list].sort((a, b) => b.footfallNum - a.footfallNum);
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [search, city, type, traffic, tags, priceMin, priceMax, availOnly, sort]);

  const toggleTag = (t) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleSave = (id) => setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleCompare = (id) =>
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) { showToast('You can compare up to 3 billboards at a time.'); return prev; }
      return [...prev, id];
    });

  const resetFilters = () => {
    setSearch(''); setCity(''); setType(''); setTraffic(''); setTags([]);
    setPriceMin(''); setPriceMax(''); setAvailOnly(false);
  };

  const openCompareModal = () => {
    if (!compareList.length) { showToast('Save some billboards first to compare.'); return; }
    setCompareOpen(true);
  };

  const setBudget = (min, max) => { setPriceMin(min ? String(min) : ''); setPriceMax(max === 9999999 ? '' : String(max)); };
  const budgetLabel = () => {
    if (!priceMin && !priceMax) return 'Budget';
    const fmt = (n) => '₹' + parseInt(n, 10).toLocaleString('en-IN');
    return `${priceMin ? fmt(priceMin) : '–'} → ${priceMax ? fmt(priceMax) : '+'}`;
  };

  // active filter chips
  const chips = [];
  if (city) chips.push({ label: city, clear: () => setCity('') });
  if (type) chips.push({ label: type, clear: () => setType('') });
  if (traffic) chips.push({ label: traffic, clear: () => setTraffic('') });
  tags.forEach((t) => chips.push({ label: t, clear: () => toggleTag(t) }));
  if (priceMin || priceMax) chips.push({ label: 'Budget filter', clear: () => setBudget('', 9999999) });
  if (availOnly) chips.push({ label: 'Available only', clear: () => setAvailOnly(false) });

  const detail = detailId != null ? BILLBOARDS.find((b) => b.id === detailId) : null;
  const compareItems = compareList.map((id) => BILLBOARDS.find((b) => b.id === id));
  const pinColors = ['', 'teal', 'gold', '', 'teal', '', 'gold', ''];

  return (
    <div className="browse-page">
      <BrowseNav />

      {/* ── Search / controls bar ── */}
      <div className="browse-bar">
        <div className="browse-search-wrap">
          <span className="browse-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className="browse-search-input"
            placeholder="City, area, landmark…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bar-divider" />

        <Dropdown
          id="city"
          openId={openDD}
          setOpenId={setOpenDD}
          trigger={{
            hasValue: !!city,
            label: city || 'All Cities',
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            ),
          }}
        >
          <div className="dropdown-label">Select City</div>
          <DropdownItem selected={!city} onClick={() => { setCity(''); setOpenDD(null); }}>All Cities</DropdownItem>
          <div className="dropdown-divider" />
          {CITIES.map((c) => (
            <DropdownItem key={c} selected={city === c} onClick={() => { setCity(c); setOpenDD(null); }}>
              {c}
            </DropdownItem>
          ))}
        </Dropdown>

        <Dropdown
          id="type"
          openId={openDD}
          setOpenId={setOpenDD}
          trigger={{
            hasValue: !!type,
            label: type || 'Billboard Type',
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
            ),
          }}
        >
          <div className="dropdown-label">Format</div>
          <DropdownItem selected={!type} onClick={() => { setType(''); setOpenDD(null); }}>All Types</DropdownItem>
          <div className="dropdown-divider" />
          {TYPE_PILLS.slice(1).map((t) => (
            <DropdownItem key={t.v} selected={type === t.v} onClick={() => { setType(t.v); setOpenDD(null); }}>
              {t.v}
            </DropdownItem>
          ))}
        </Dropdown>

        <Dropdown
          id="budget"
          openId={openDD}
          setOpenId={setOpenDD}
          panelStyle={{ minWidth: 240 }}
          trigger={{
            hasValue: !!(priceMin || priceMax),
            label: budgetLabel(),
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          }}
        >
          <div className="dropdown-label">Monthly Budget (₹)</div>
          <div style={{ padding: '8px 11px 4px' }}>
            <div className="price-inputs" style={{ marginBottom: 8 }}>
              <input type="number" className="price-input" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
              <span className="price-sep">—</span>
              <input type="number" className="price-input" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            </div>
            <div className="price-presets">
              <button className="price-preset" onClick={() => setBudget(0, 100000)}>Under ₹1L</button>
              <button className="price-preset" onClick={() => setBudget(100000, 300000)}>₹1L–3L</button>
              <button className="price-preset" onClick={() => setBudget(300000, 500000)}>₹3L–5L</button>
              <button className="price-preset" onClick={() => setBudget(500000, 9999999)}>₹5L+</button>
            </div>
          </div>
          <div className="dropdown-divider" />
          <DropdownItem onClick={() => { setBudget('', 9999999); setOpenDD(null); }}>Clear budget</DropdownItem>
        </Dropdown>

        <div className="browse-bar-right">
          {saved.length > 0 && (
            <div id="savedCount" style={{ display: 'flex' }} onClick={openCompareModal}>
              <span id="savedNum">{saved.length}</span> saved
            </div>
          )}
          <div className="view-toggle">
            <button className={cn('view-btn', view === 'grid' && 'active')} onClick={() => setView('grid')} title="Grid">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </button>
            <button className={cn('view-btn', view === 'list' && 'active')} onClick={() => setView('list')} title="List">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
            <button className={cn('view-btn', view === 'map' && 'active')} onClick={() => setView('map')} title="Map">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>
            </button>
          </div>

          <Dropdown
            id="sort"
            openId={openDD}
            setOpenId={setOpenDD}
            className="align-right"
            trigger={{
              hasValue: false,
              label: SORTS.find((s) => s.value === sort)?.label.replace('Price: Low to High', 'Price: Low–High').replace('Price: High to Low', 'Price: High–Low') || 'Relevance',
              icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="10" y1="18" x2="14" y2="18" /></svg>
              ),
            }}
          >
            <div className="dropdown-label">Sort By</div>
            {SORTS.map((s) => (
              <DropdownItem key={s.value} selected={sort === s.value} onClick={() => { setSort(s.value); setOpenDD(null); }}>
                {s.label}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* ── Compare bar ── */}
      <div className={cn('compare-bar', compareList.length && 'visible')}>
        <span className="compare-bar-label">Comparing</span>
        <div className="compare-chips">
          {compareItems.map((b) => (
            <div key={b.id} className="compare-chip">
              {b.title.split(' ').slice(0, 2).join(' ')}
              <button className="compare-chip-x" onClick={() => toggleCompare(b.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="compare-actions">
          <button className="btn-compare-clear" onClick={() => setCompareList([])}>Clear</button>
          <button className="btn-compare-now" onClick={openCompareModal}>Compare Now</button>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="browse-layout">
        {/* Filter sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-header">
            <div className="filter-header-left">
              <div className="filter-header-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              </div>
              <span className="filter-header-title">Filters</span>
            </div>
            <button className="filter-reset-btn" onClick={resetFilters}>Reset all</button>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">City</span>
            <div className="filter-select-wrap">
              <select className="filter-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="filter-select-arrow">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Billboard Type</span>
            <div className="filter-pills">
              {TYPE_PILLS.map((t) => (
                <button key={t.l} className={cn('filter-pill', type === t.v && 'active')} onClick={() => setType(t.v)}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Monthly Budget (₹)</span>
            <div className="price-inputs">
              <input type="number" className="price-input" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
              <span className="price-sep">—</span>
              <input type="number" className="price-input" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Traffic Zone</span>
            <div className="filter-pills">
              {TRAFFIC_PILLS.map((t) => (
                <button key={t.l} className={cn('filter-pill', traffic === t.v && 'active')} onClick={() => setTraffic(t.v)}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Quick Tags</span>
            <div className="filter-pills">
              {QUICK_TAGS.map((t) => (
                <button key={t} className={cn('filter-pill', tags.includes(t) && 'active')} onClick={() => toggleTag(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-section-label">Availability</span>
            <div className="filter-toggle-row">
              <span className="filter-toggle-label">Available only</span>
              <div className={cn('filter-toggle', availOnly && 'on')} onClick={() => setAvailOnly((v) => !v)} />
            </div>
          </div>

          <div className="sidebar-cta">
            <Link to={ROUTES.advertiserRegister} className="sidebar-cta-btn">
              Post a Campaign Brief
            </Link>
          </div>
        </aside>

        {/* Results */}
        <div className="listings-area">
          <div className="results-topbar">
            <div className="results-count">
              Showing <strong>{filtered.length ? `1–${Math.min(filtered.length, 12)}` : '0'}</strong> of{' '}
              <strong>{filtered.length}</strong> listings
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
              <button className="filter-reset-btn" style={{ marginLeft: 6 }} onClick={resetFilters}>Clear all</button>
            </div>
          )}

          {view === 'map' ? (
            <div className="map-view active">
              <div className="map-pins">
                {filtered.map((b, i) => {
                  const color = pinColors[i % pinColors.length];
                  const arrowColor = color === 'teal' ? 'var(--teal)' : color === 'gold' ? 'var(--gold)' : 'var(--indigo)';
                  return (
                    <div key={b.id} className="map-pin" style={{ left: b.mapX, top: b.mapY }} onClick={() => setDetailId(b.id)}>
                      <div className={cn('pin-label', color)}>{b.price}</div>
                      <div className="pin-arrow" style={{ borderTopColor: arrowColor }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </div>
              <h4>No listings found</h4>
              <p>Try adjusting your filters or search term.</p>
              <button className="btn-nav-ghost" onClick={resetFilters}>Reset all filters</button>
            </div>
          ) : (
            <div className={cn('listings-grid', view === 'list' && 'list-view')}>
              {filtered.map((b, i) => (
                <ListingCard
                  key={b.id}
                  b={b}
                  index={i}
                  inCompare={compareList.includes(b.id)}
                  inShortlist={saved.includes(b.id)}
                  onOpen={setDetailId}
                  onToggleCompare={toggleCompare}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <DetailPanel
          b={detail}
          onClose={() => setDetailId(null)}
          onSubmitQuote={() => {
            showToast('Quote request sent — the owner will respond within 24 hours.');
            setDetailId(null);
          }}
        />
      )}
      {compareOpen && <CompareModal items={compareItems} onClose={() => setCompareOpen(false)} />}
      <AuthModal submitVariant="primary" />
    </div>
  );
}
