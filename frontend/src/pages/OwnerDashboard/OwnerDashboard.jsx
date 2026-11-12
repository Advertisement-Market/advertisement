import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/layout/Logo';
import { notificationApi } from '@/features/notification/notificationApi';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { apiErrorMessage } from '@/lib/apiClient';
import { Toast } from '@/components/ui/Toast/Toast';
import {
  NAV,
  TITLES,
  NOTIFICATIONS,
  ONBOARD_STEPS,
  LISTINGS,
  LISTING_NAMES,
  QUOTES,
  TENDERS,
  BOOKINGS,
  CHART_MONTHS_12,
  CHART_REVENUE_12,
  CHART_VIEWS_12,
  REVENUE_BY_LISTING,
  VIEWS_BY_LISTING,
  VIEWS_DATA,
  OCCUPANCY_DATA,
  MONTHS,
  DAY_NAMES,
  initCalData,
  dayKey,
  formatBillboardType,
  VALID_TABS,
} from './data';
import { availabilityApi } from '@/features/availability/availabilityApi';
import {
  isValidDateKey,
  formatDateKey,
  parseDateParts,
  addDays,
  isBefore,
  daysBetweenInclusive,
  blocksToDayStatusMap,
  dayStatusMapToRanges,
  extractRetryAfterSeconds,
} from '@/features/availability/availabilityUtils';
import './OwnerDashboard.css';

function BillboardIcon({ type = '', name = '', meta = '', size = 24 }) {
  const combined = `${type} ${name} ${meta}`.toLowerCase();
  if (combined.includes('led')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="13" rx="2" />
        <path d="M12 16v5M8 21h8" />
      </svg>
    );
  }
  if (combined.includes('static')) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <path d="M3 17l3-10h12l3 10" />
        <line x1="12" y1="7" x2="12" y2="17" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Owner';
const initialsOf = (user) =>
  ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'A';

/* ── Sidebar ── */
function Sidebar({ active, onNav, userName, listingsCount }) {
  const { user } = useAuth();
  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-logo-mark">
          <LogoMark size={34} />
          <div className="sb-logo-text">
            The<span>AdBasket</span>
          </div>
        </div>
        <div className="sb-logo-role">Billboard Owner Portal</div>
      </div>
      <div className="sb-user">
        <div className="sb-avatar">{initialsOf(user)}</div>
        <div>
          <div className="sb-user-name">{userName}</div>
          <div className="sb-user-plan">Growth Plan · ₹2,999/mo</div>
        </div>
      </div>
      <nav className="sb-nav">
        {NAV.map((g) => (
          <div key={g.section}>
            <div className="sb-section">{g.section}</div>
            {g.items.map((it) => {
              const badge =
                it.page === 'listings'
                  ? listingsCount != null
                    ? String(listingsCount)
                    : it.badge
                  : it.badge;
              return (
                <button
                  key={it.page}
                  className={cn('sb-item', active === it.page && 'active')}
                  onClick={() => onNav(it.page)}
                >
                  {it.icon}
                  {it.label}
                  {badge && <span className="sb-badge">{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sb-bottom">
        <Link to={ROUTES.home} className="sb-item" style={{ display: 'flex' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
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

function formatTimeAgo(dateInput) {
  if (!dateInput) return '';
  const date =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const getMockNotifs = () =>
  import.meta.env.DEV
    ? NOTIFICATIONS.map((n, i) => ({
        id: i + 1,
        title: '',
        message: n.text,
        tone: n.dot || 'teal',
        read: !n.unread,
        createdAt: null,
        timeText: n.time,
      }))
    : [];

const getMockUnreadCount = () =>
  import.meta.env.DEV ? NOTIFICATIONS.filter((n) => n.unread).length : 0;

function Topbar({ title, onAddListing, onNav }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => (user ? [] : getMockNotifs()));
  const [unreadCount, setUnreadCount] = useState(() => (user ? 0 : getMockUnreadCount()));
  const [loading, setLoading] = useState(() => Boolean(user));
  const ref = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    showToast('You have been signed out.');
    navigate(ROUTES.home);
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;
    notificationApi
      .getNotifications()
      .then((data) => {
        if (isMounted) {
          setNotifs(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (import.meta.env.DEV) {
            setNotifs(getMockNotifs());
            setUnreadCount(getMockUnreadCount());
          } else {
            showToast('Failed to load notifications.', 'error');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, showToast]);

  const handleItemClick = (n) => {
    if (!n.read && user) {
      setNotifs((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationApi.markAsRead(n.id).catch(() => {});
    }
    if (n.targetUrl) {
      setOpen(false);
      if (n.targetUrl.includes('quotes')) onNav('quotes');
      else if (n.targetUrl.includes('listings')) onNav('listings');
      else if (n.targetUrl.includes('tenders')) onNav('tenders');
      else if (n.targetUrl.includes('calendar')) onNav('calendar');
      else if (n.targetUrl.includes('analytics')) onNav('analytics');
      else if (n.targetUrl.includes('settings')) onNav('settings');
    }
  };

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    if (user) {
      notificationApi.markAllAsRead().catch(() => {});
    }
    showToast('All notifications marked as read.');
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <button className="btn-teal btn-sm" onClick={onAddListing}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Listing
        </button>
        <div className="notif-wrap" ref={ref}>
          <button
            className="notif-btn"
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications"
            aria-expanded={open}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasUnread && <span className="notif-badge-dot" />}
          </button>
          <div
            className={cn('notif-dropdown', open && 'open')}
            role="region"
            aria-label="Notifications panel"
          >
            <div className="nd-header">
              <h4>Notifications {unreadCount > 0 && `(${unreadCount})`}</h4>
              {notifs.length > 0 && <button onClick={handleMarkAllRead}>Mark all read</button>}
            </div>
            {loading && notifs.length === 0 ? (
              <div
                style={{
                  padding: '20px 18px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                }}
              >
                Loading notifications...
              </div>
            ) : notifs.length === 0 ? (
              <div
                style={{
                  padding: '24px 18px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                }}
              >
                No notifications yet.
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={cn('nd-item', !n.read && 'unread')}
                  onClick={() => handleItemClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(n);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={cn('nd-dot', n.tone || 'teal')} />
                  <div>
                    {n.title && (
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12.5,
                          color: 'var(--ink-rich)',
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </div>
                    )}
                    <div className="nd-text">{n.message}</div>
                    <div className="nd-time">{n.timeText || formatTimeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="sb-avatar"
            style={{ cursor: 'pointer' }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {initialsOf(user)}
          </button>
          <div className={cn('profile-menu', menuOpen && 'open')} role="menu">
            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onNav('settings');
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </button>
            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={handleLogout}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SVG combo (bar + line) chart ── */
function ComboChart({ labels, bars, line, opts }) {
  const {
    width: W,
    height: H,
    barColor,
    lineColor,
    barLabel,
    barPrefix = '',
    barSuffix = '',
    lineLabel,
    lineSuffix = '',
  } = opts;
  const [hover, setHover] = useState(null);
  const padL = 34,
    padR = 10,
    padT = 14,
    padB = 24;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const maxBar = Math.max(...bars) * 1.15 || 1;
  const maxLine = Math.max(...line) * 1.15 || 1;
  const n = labels.length,
    slot = plotW / n;
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
  const areaPath = `M${padL},${(padT + plotH).toFixed(1)} L${linePts.join(' L')} L${W - padR},${(padT + plotH).toFixed(1)} Z`;
  const linePath = `M${linePts.join(' L')}`;
  const gradId = `grad-${barLabel}-${W}`;
  const h = hover != null ? cols[hover] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg className="combo-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((g, i) => (
          <line
            key={i}
            className="combo-grid-line"
            x1={padL}
            y1={g.y.toFixed(1)}
            x2={W - padR}
            y2={g.y.toFixed(1)}
          />
        ))}
        {grid.map((g, i) => (
          <text
            key={`a${i}`}
            className="combo-axis-label"
            x={padL - 6}
            y={(g.y + 3).toFixed(1)}
            textAnchor="end"
          >
            {g.label}
          </text>
        ))}
        <path className="combo-area" d={areaPath} fill={`url(#${gradId})`} />
        {cols.map((c) => (
          <rect
            key={c.i}
            className="combo-bar"
            x={(c.cx - c.bw / 2).toFixed(1)}
            y={c.by.toFixed(1)}
            width={c.bw.toFixed(1)}
            height={c.bh.toFixed(1)}
            rx="3"
            fill={barColor}
          />
        ))}
        <path className="combo-line" d={linePath} stroke={lineColor} />
        {cols.map((c) => (
          <circle
            key={c.i}
            className="combo-dot"
            cx={c.cx.toFixed(1)}
            cy={c.ly.toFixed(1)}
            r="3.5"
          />
        ))}
        {cols.map((c) => (
          <text
            key={c.i}
            className="combo-axis-label"
            x={c.cx.toFixed(1)}
            y={H - 6}
            textAnchor="middle"
          >
            {c.lbl}
          </text>
        ))}
        {cols.map((c) => (
          <rect
            key={c.i}
            x={(padL + slot * c.i).toFixed(1)}
            y={padT}
            width={slot.toFixed(1)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(c.i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {h && (
        <div
          className="chart-tooltip"
          style={{
            opacity: 1,
            left: `${(h.cx / W) * 100}%`,
            top: `${(h.ly / H) * 100}%`,
            transform: 'translate(-50%,-115%)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.lbl}</div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: barColor }} />
            {barLabel}: {barPrefix}
            {bars[hover]}
            {barSuffix}
          </div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: lineColor }} />
            {lineLabel}: {line[hover]}
            {lineSuffix}
          </div>
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
  const cx = 100,
    cy = 100,
    r = 72,
    sw = 28,
    circ = 2 * Math.PI * r;
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
          <circle
            key={d.name}
            className="donut-seg"
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={sw}
            strokeDasharray={`${d.len.toFixed(2)} ${(circ - d.len).toFixed(2)}`}
            strokeDashoffset={(-d.offset).toFixed(2)}
            transform={`rotate(-90 ${cx} ${cy})`}
          >
            <title>
              {d.name}: ₹{d.val.toFixed(2)}L
            </title>
          </circle>
        ))}
        <text className="donut-center-label" x={cx} y={cy - 2} textAnchor="middle" fontSize="22">
          ₹{total.toFixed(1)}L
        </text>
        <text className="donut-center-sub" x={cx} y={cy + 16} textAnchor="middle" fontSize="10">
          Total this month
        </text>
      </svg>
      <div className="donut-legend">
        {data.map((d) => (
          <div className="donut-legend-item" key={d.name}>
            <span className="donut-legend-swatch" style={{ background: d.color }} />
            {d.name}{' '}
            <span style={{ color: 'var(--ink-faint)' }}>
              ({((d.val / total) * 100).toFixed(0)}%)
            </span>
            <span className="donut-legend-val">₹{d.val.toFixed(2)}L</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Calendar grid (shared) ── */
function CalGrid({ month, year, statusFor, dayProps, extra, serverToday }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];
  DAY_NAMES.forEach((d) =>
    cells.push(
      <div key={`n${d}`} className="cal-day-name">
        {d}
      </div>,
    ),
  );
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />);
  for (let d = 1; d <= daysIn; d++) {
    const status = statusFor(d);
    const dateKey = formatDateKey(year, month, d);
    const isToday = serverToday
      ? dateKey === serverToday
      : d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isBooked = status === 'booked';
    const isBlocked = status === 'blocked' || status === 'block';
    const isHold = status === 'hold';
    const statusClass = isBooked ? 'booked' : isBlocked ? 'blocked' : isHold ? 'hold' : 'available';
    const cls = cn('cal-day', statusClass, isToday && 'today', extra ? extra(d) : '');
    cells.push(
      <div key={d} className={cls} data-date={dateKey} {...(dayProps ? dayProps(d) : {})}>
        {d}
      </div>,
    );
  }
  return <div className="cal-grid">{cells}</div>;
}

function MiniCalendar({ calData }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  return (
    <div className="section-card">
      <div className="sc-header">
        <h3>{MONTHS[month]} Calendar</h3>
      </div>
      <div className="avail-calendar">
        <div className="cal-header">
          <button className="cal-nav" onClick={prev}>
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="cal-month">
            {MONTHS[month]} {year}
          </span>
          <button className="cal-nav" onClick={next}>
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <CalGrid
          month={month}
          year={year}
          statusFor={(d) => calData?.[0]?.[dayKey(year, month, d)] || 'available'}
        />
        <div className="cal-legend">
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: 'var(--green)' }} />
            Available
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: '#b45309' }} />
            Blocked
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: 'var(--rose)' }} />
            Booked
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: 'var(--indigo)' }} />
            Today
          </div>
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
          <div className={cn('card-icon', s.tone)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {s.inner}
            </svg>
          </div>
          <div className="card-label">{s.label}</div>
          <div className="card-val">{s.val}</div>
          <div className="card-sub">{s.sub}</div>
        </div>
      ))}
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

/* ── Overview ── */
function Overview({ onNav, calData, listingsCount }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [onboard, setOnboard] = useState(true);
  const [steps, setSteps] = useState(ONBOARD_STEPS);
  const done = steps.filter((s) => s.done).length;
  const complete = (i) =>
    setSteps((prev) => {
      if (prev[i].done) return prev;
      const next = prev.map((s, idx) => (idx === i ? { ...s, done: true } : s));
      if (next.every((s) => s.done))
        showToast('All steps complete! Listings fully optimised.', 'success');
      return next;
    });
  const check = (
    <div className="onboard-step-check">
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="1.5,6 4.5,9 10.5,3" />
      </svg>
    </div>
  );
  return (
    <div className="page active">
      {onboard && (
        <div className="onboard-card">
          <div className="onboard-header">
            <div>
              <h3>Welcome back, {user?.firstName || 'there'}. Let&apos;s get you earning.</h3>
              <p>Complete these steps to start receiving inbound leads.</p>
            </div>
            <button className="onboard-dismiss" onClick={() => setOnboard(false)}>
              Dismiss
            </button>
          </div>
          <div className="onboard-progress-bar">
            <div
              className="onboard-progress-fill"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
          <div className="onboard-steps">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className={cn('onboard-step', s.done && 'done')}
                onClick={() => complete(i)}
              >
                {check}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
      <StatCards
        items={[
          STAT(
            'blue',
            <>
              <rect x="2" y="3" width="20" height="13" rx="2" />
              <path d="M12 16v5M8 21h8" />
            </>,
            'Active Listings',
            listingsCount != null ? String(listingsCount) : '3',
            <span className="card-trend neutral">All verified</span>,
          ),
          STAT(
            'teal',
            <>
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </>,
            'Quote Requests',
            '4',
            <>
              <span className="card-trend up">+3</span> this week
            </>,
          ),
          STAT(
            'gold',
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>,
            'Profile Views',
            '247',
            <>
              <span className="card-trend up">↑34%</span> this week
            </>,
          ),
          STAT(
            'green',
            <>
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </>,
            'Est. Monthly Revenue',
            '₹9.8L',
            'across 3 booked campaigns',
          ),
        ]}
      />
      <div className="content-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header">
              <h3>My Listings</h3>
              <button className="link" onClick={() => onNav('listings')}>
                Manage all →
              </button>
            </div>
            {LISTINGS.map((l) => (
              <div className="listing-row" key={l.name} onClick={() => onNav('listings')}>
                <div className="lr-icon" style={{ background: l.color }}>
                  <BillboardIcon type={l.type} name={l.name} meta={l.meta} size={22} />
                </div>
                <div className="lr-info">
                  <div className="lr-name">{l.name}</div>
                  <div className="lr-meta">{l.meta}</div>
                </div>
                <div className="lr-stats">
                  <div className="lr-stat">
                    <div className="lr-stat-val">{l.views}</div>
                    <div className="lr-stat-label">views</div>
                  </div>
                  <div className="lr-stat">
                    <div className="lr-stat-val">{l.price}</div>
                    <div className="lr-stat-label">/month</div>
                  </div>
                </div>
                <span className={cn('chip', l.sc)}>{l.status}</span>
              </div>
            ))}
          </div>
          <div className="section-card">
            <div className="sc-header">
              <h3>Revenue — Last 6 Months</h3>
              <button className="link" onClick={() => onNav('analytics')}>
                Full analytics →
              </button>
            </div>
            <div className="chart-wrap">
              <div className="chart-toolbar">
                <div className="chart-kpi">
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Revenue (6mo)</span>
                    <span className="chart-kpi-val up">₹9.8L</span>
                  </div>
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Views (6mo)</span>
                    <span className="chart-kpi-val up">247</span>
                  </div>
                </div>
              </div>
              <ComboChart
                labels={CHART_MONTHS_12.slice(6)}
                bars={CHART_REVENUE_12.slice(6)}
                line={CHART_VIEWS_12.slice(6)}
                opts={{
                  width: 600,
                  height: 200,
                  barColor: 'var(--teal)',
                  lineColor: 'var(--amber)',
                  barLabel: 'Revenue',
                  barPrefix: '₹',
                  barSuffix: 'L',
                  lineLabel: 'Views',
                  lineSuffix: ' views',
                }}
              />
              <div className="chart-legend">
                <div className="chart-legend-item">
                  <div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />
                  Revenue (₹L)
                </div>
                <div className="chart-legend-item">
                  <div className="chart-legend-dot line" style={{ background: 'var(--amber)' }} />
                  Profile Views
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card">
            <div className="sc-header">
              <h3>Quote Requests</h3>
              <button className="link" onClick={() => onNav('quotes')}>
                View all →
              </button>
            </div>
            {QUOTES.slice(0, 2).map((q) => (
              <div className="quote-item" key={q.init}>
                <div
                  className="qi-avatar"
                  style={{ background: `linear-gradient(135deg,${q.c1},${q.c2})` }}
                >
                  {q.init}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="qi-title">
                    {q.name} · {q.listing}
                  </div>
                  <div className="qi-meta">{q.meta}</div>
                  <div className="qi-actions">
                    <button
                      className="btn-teal btn-sm"
                      onClick={() => showToast('Opening response form…')}
                    >
                      Respond
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => showToast('Quote declined.')}
                    >
                      Decline
                    </button>
                  </div>
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

function Listings({
  listings = [],
  loading = false,
  onAddListing,
  onEditListing,
  onDeleteListing,
  onSubmitForReview,
  submittingId = null,
}) {
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = listings.filter((l) => {
    const nameMatch = (l.name || '').toLowerCase().includes(q.toLowerCase());
    const metaText =
      `${l.addressLine1 || ''} ${l.city || ''} ${l.type || ''} ${formatBillboardType(l.type, l.typeOther)} ${l.meta || ''}`.toLowerCase();
    const queryMatch = !q || nameMatch || metaText.includes(q.toLowerCase());
    const currentStatus = (l.status || 'Available').toLowerCase();
    const statusMatch = status === 'all' || currentStatus === status;
    return queryMatch && statusMatch;
  });

  return (
    <div className="page active">
      <PageHeader
        title="My Listings"
        sub="Manage your billboard inventory, pricing, and visibility."
      />
      <div className="filter-bar">
        <div className="search-input">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search listings..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', fontSize: 12.5, padding: '7px 12px', borderRadius: 9 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
        </select>
      </div>
      <div style={{ padding: '4px 0' }}>
        {loading ? (
          <div className="empty-state">
            <p>Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="2" y="3" width="20" height="13" rx="2" />
              <path d="M12 16v5M8 21h8" />
            </svg>
            <p>
              {listings.length === 0
                ? 'No billboard listings yet.'
                : 'No listings match your search.'}
            </p>
            {listings.length === 0 && (
              <button
                className="btn-teal btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => onAddListing()}
              >
                Add Your First Listing
              </button>
            )}
          </div>
        ) : (
          filtered.map((l) => {
            const isLed = (l.type || '').toLowerCase().includes('led');
            const isStatic = (l.type || '').toLowerCase().includes('static');
            const cardColor =
              l.color ||
              (isLed
                ? 'linear-gradient(135deg,#1e3a5f,#1d6fa4)'
                : isStatic
                  ? 'linear-gradient(135deg,#1a3320,#2e5e32)'
                  : 'linear-gradient(135deg,#0c2340,#0a70c0)');

            const meta =
              l.meta ||
              [
                l.addressLine1,
                l.city,
                l.widthFt && l.heightFt ? `${l.widthFt}×${l.heightFt} ft` : null,
                formatBillboardType(l.type, l.typeOther),
              ]
                .filter(Boolean)
                .join(' · ');

            const priceText =
              l.price ||
              (l.startPrice != null
                ? l.startPrice >= 100000
                  ? `₹${(l.startPrice / 100000).toFixed(1)}L`
                  : `₹${Number(l.startPrice).toLocaleString('en-IN')}`
                : '₹0');

            const statusUpper = (l.status || '').toUpperCase();
            let statusBadge = {
              text: l.status || 'Active',
              bg: '#ccfbf1',
              color: '#0f766e',
            };
            if (statusUpper === 'DRAFT') {
              statusBadge = { text: 'Draft', bg: '#f1f5f9', color: '#475569' };
            } else if (statusUpper === 'PENDING_APPROVAL') {
              statusBadge = { text: 'Pending Review', bg: '#fef3c7', color: '#b45309' };
            } else if (statusUpper === 'REJECTED') {
              statusBadge = { text: 'Rejected', bg: '#fee2e2', color: '#b91c1c' };
            } else if (statusUpper === 'SUSPENDED') {
              statusBadge = { text: 'Suspended', bg: '#ffe4e6', color: '#be123c' };
            } else if (statusUpper === 'ACTIVE') {
              statusBadge = { text: 'Active', bg: '#ccfbf1', color: '#0f766e' };
            }

            return (
              <div className="listing-card-full" key={l.id || l.name}>
                <div className="lcf-header">
                  <div className="lcf-img" style={{ background: cardColor, overflow: 'hidden' }}>
                    {/* BillboardListingDto.coverPhotoUrl is the authoritative backend contract for cover photo */}
                    {l.coverPhotoUrl ? (
                      <img
                        src={l.coverPhotoUrl}
                        alt={l.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <BillboardIcon type={l.type} name={l.name} meta={meta} size={24} />
                    )}
                  </div>
                  <div className="lcf-info">
                    <div className="lcf-name">{l.name}</div>
                    <div className="lcf-meta">{meta}</div>
                    {statusUpper === 'REJECTED' && l.rejectionReason && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#b91c1c',
                          marginTop: 4,
                          fontWeight: 500,
                        }}
                      >
                        ⚠️ Rejection note: {l.rejectionReason}
                      </div>
                    )}
                    {statusUpper === 'SUSPENDED' && l.suspensionReason && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#be123c',
                          marginTop: 4,
                          fontWeight: 500,
                        }}
                      >
                        🚫 Suspended: {l.suspensionReason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: statusBadge.bg,
                        color: statusBadge.color,
                      }}
                    >
                      {statusBadge.text}
                    </span>
                    <button className="btn-ghost btn-sm" onClick={() => onEditListing(l)}>
                      Edit
                    </button>
                    {statusUpper === 'DRAFT' && (
                      <button
                        className="btn-teal btn-sm"
                        onClick={() => onSubmitForReview && onSubmitForReview(l)}
                        disabled={submittingId === l.id}
                      >
                        {submittingId === l.id ? 'Submitting...' : 'Submit for Review'}
                      </button>
                    )}
                    <button
                      className="btn-teal btn-sm"
                      onClick={() => showToast(`"${l.name}" boosted for 7 days!`, 'success')}
                    >
                      Boost
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => onDeleteListing && onDeleteListing(l)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="lcf-stats">
                  <div className="lcf-stat">
                    <div className="lcf-stat-val">{l.views ?? 0}</div>
                    <div className="lcf-stat-label">Profile views</div>
                  </div>
                  <div className="lcf-stat">
                    <div className="lcf-stat-val">{l.quotes ?? 0}</div>
                    <div className="lcf-stat-label">Quote requests</div>
                  </div>
                  <div className="lcf-stat">
                    <div className="lcf-stat-val">{priceText}</div>
                    <div className="lcf-stat-label">Monthly rate</div>
                  </div>
                  <div className="lcf-stat">
                    <div className="lcf-stat-val">4.8 ★</div>
                    <div className="lcf-stat-label">Owner rating</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function BookingRulesCard({ activeListingId, selectedListing, onListingUpdated }) {
  const { showToast } = useToast();
  const [minBookingVal, setMinBookingVal] = useState(() => selectedListing?.minBookingValue ?? 1);
  const [minBookingUnit, setMinBookingUnit] = useState(
    () => selectedListing?.minBookingUnit || 'MONTHS',
  );
  const [savingRule, setSavingRule] = useState(false);
  const [prevTracked, setPrevTracked] = useState({
    id: activeListingId,
    val: selectedListing?.minBookingValue,
    unit: selectedListing?.minBookingUnit,
  });

  if (
    activeListingId !== prevTracked.id ||
    selectedListing?.minBookingValue !== prevTracked.val ||
    selectedListing?.minBookingUnit !== prevTracked.unit
  ) {
    setPrevTracked({
      id: activeListingId,
      val: selectedListing?.minBookingValue,
      unit: selectedListing?.minBookingUnit,
    });
    setMinBookingVal(selectedListing?.minBookingValue ?? 1);
    setMinBookingUnit(selectedListing?.minBookingUnit || 'MONTHS');
  }

  const handleSaveBookingRule = async () => {
    if (!activeListingId) return;
    const val = Math.max(1, Math.min(1000, Math.round(Number(minBookingVal)) || 1));
    const unit = minBookingUnit || 'MONTHS';

    setSavingRule(true);
    try {
      const updated = await ownerListingApi.updateListing(activeListingId, {
        minBookingValue: val,
        minBookingUnit: unit,
      });

      const updatedVal = updated?.minBookingValue ?? val;
      const updatedUnit = updated?.minBookingUnit ?? unit;
      setMinBookingVal(updatedVal);
      setMinBookingUnit(updatedUnit);
      if (onListingUpdated) {
        onListingUpdated(activeListingId, {
          minBookingValue: updatedVal,
          minBookingUnit: updatedUnit,
        });
      }
      showToast(
        `Minimum booking duration saved: ${updatedVal} ${updatedUnit.toLowerCase()}.`,
        'success',
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || 'Failed to update minimum booking duration.',
        'error',
      );
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div className="section-card" style={{ padding: '16px 20px', marginTop: 16 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: 'var(--ink-faint)',
          marginBottom: 14,
        }}
      >
        Booking Rules
      </div>
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Minimum Duration
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            className="form-control"
            style={{ flex: 1, minWidth: 60 }}
            placeholder="1"
            value={minBookingVal}
            onChange={(e) => setMinBookingVal(e.target.value)}
            disabled={savingRule || !activeListingId}
            aria-label="Minimum Duration Value"
          />
          <select
            className="form-control"
            style={{ flex: 1.3, minWidth: 95 }}
            value={minBookingUnit}
            onChange={(e) => setMinBookingUnit(e.target.value)}
            disabled={savingRule || !activeListingId}
            aria-label="Minimum Duration Unit"
          >
            <option value="DAYS">Days</option>
            <option value="WEEKS">Weeks</option>
            <option value="MONTHS">Months</option>
          </select>
          <button
            type="button"
            className="btn-teal btn-sm"
            disabled={savingRule || !activeListingId}
            style={{ whiteSpace: 'nowrap', padding: '7px 14px' }}
            onClick={handleSaveBookingRule}
          >
            {savingRule ? 'Saving...' : 'Save'}
          </button>
        </div>
        <small
          style={{
            color: 'var(--ink-muted)',
            marginTop: 4,
            display: 'block',
            fontSize: 11,
          }}
        >
          Advertisers must book at least this duration on this billboard.
        </small>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <label style={{ margin: 0, fontWeight: 500 }}>Advance Notice</label>
          <span className="chip chip-gray" style={{ fontSize: 10, padding: '2px 6px' }}>
            Standard
          </span>
        </div>
        <select
          className="form-control"
          defaultValue="7 days"
          disabled
          style={{ opacity: 0.8, cursor: 'not-allowed' }}
        >
          <option>7 days</option>
        </select>
        <small
          style={{
            color: 'var(--ink-muted)',
            marginTop: 4,
            display: 'block',
            fontSize: 11,
          }}
        >
          Standard advance notice required before campaign start date.
        </small>
      </div>
    </div>
  );
}

function CalendarPage({
  listings = [],
  loadingListings = false,
  calData,
  setCalData,
  onListingUpdated,
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Selected listing (derived fallback to primary listing)
  const [selectedListingId, setSelectedListingId] = useState(null);
  const activeListingId = selectedListingId ?? listings[0]?.id ?? null;
  const listingIndex = Math.max(
    0,
    listings.findIndex((l) => l.id === activeListingId),
  );
  const selectedListing = listings.find((l) => l.id === activeListingId) || listings[0];

  // Mode and view state
  const [mode, setMode] = useState('block'); // 'block' | 'available'
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [range, setRange] = useState({ start: null, end: null });
  const [hoverDay, setHoverDay] = useState(null);
  const drag = useRef(false);
  const dragStart = useRef(null);
  const didDrag = useRef(false);
  const justFinishedDrag = useRef(false);

  // Availability data from backend / local calData
  const [blocks, setBlocks] = useState([]);
  const [dayStatusMap, setDayStatusMap] = useState(() => {
    const raw = calData?.[listingIndex] || calData?.[0] || {};
    const res = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === 'booked' || v === 'blocked' || v === 'block') {
        res[k] = 'blocked';
      } else {
        res[k] = v;
      }
    }
    return res;
  });
  const [confirmedDates, setConfirmedDates] = useState(() => new Set());
  const [holdDates, setHoldDates] = useState(() => new Set());
  const [etag, setEtag] = useState(null);
  const [serverToday, setServerToday] = useState(null);
  const [loadedListingId, setLoadedListingId] = useState(null);
  const isLoading = Boolean(activeListingId) && loadedListingId !== activeListingId;
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Resilience & Concurrency state
  const [retryState, setRetryState] = useState({
    active: false,
    attempt: 0,
    maxAttempts: 3,
    countdown: 0,
  });
  const retryTimerRef = useRef(null);
  const [staleModal, setStaleModal] = useState({
    open: false,
    serverBlocks: [],
    newEtag: null,
    newToday: null,
  });
  const [conflictHoldRanges, setConflictHoldRanges] = useState([]);

  // Quick block inputs
  const [qb, setQb] = useState({ from: '', to: '', type: 'block' });

  // Keep calData & listingIndex accessible in effects without re-triggering network fetches
  const calDataRef = useRef(calData);
  const setCalDataRef = useRef(setCalData);
  const listingIndexRef = useRef(listingIndex);
  useEffect(() => {
    calDataRef.current = calData;
    setCalDataRef.current = setCalData;
    listingIndexRef.current = listingIndex;
  }, [calData, setCalData, listingIndex]);

  // Cleanup timers on unmount
  useEffect(() => {
    const up = () => {
      if (didDrag.current) {
        justFinishedDrag.current = true;
      }
      drag.current = false;
      dragStart.current = null;
      didDrag.current = false;
    };
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mouseup', up);
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  // Hydrate calendar from backend on listing change
  useEffect(() => {
    if (!activeListingId) return;

    const idx = listingIndexRef.current;
    const fallback = calDataRef.current?.[idx] || calDataRef.current?.[0] || {};
    const normalizedFallback = {};
    for (const [k, v] of Object.entries(fallback)) {
      if (v === 'booked' || v === 'blocked' || v === 'block') {
        normalizedFallback[k] = 'blocked';
      } else {
        normalizedFallback[k] = v;
      }
    }

    let isMounted = true;
    availabilityApi
      .getListingAvailability(activeListingId)
      .then((data) => {
        if (!isMounted) return;
        const fetchedBlocks = data.blocks || [];
        const {
          statusMap,
          confirmedDates: confDates,
          holdDates: hDates,
        } = blocksToDayStatusMap(fetchedBlocks);
        setBlocks(fetchedBlocks);
        setConfirmedDates(confDates);
        setHoldDates(hDates);
        setEtag(data.etag);
        setServerToday(data.today);
        setDirty(false);
        setConflictHoldRanges([]);
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        setRetryState({ active: false, attempt: 0, maxAttempts: 3, countdown: 0 });

        setDayStatusMap(statusMap);
        if (setCalDataRef.current) {
          setCalDataRef.current((prev) => ({
            ...prev,
            [listingIndexRef.current]: { ...statusMap },
          }));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBlocks([]);
          setConfirmedDates(new Set());
          setHoldDates(new Set());
          setDayStatusMap(normalizedFallback);
          showToast(apiErrorMessage(err, 'Failed to load availability calendar.'), 'error');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadedListingId(activeListingId);
        }
      });

    return () => {
      isMounted = false;
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [activeListingId, showToast]);

  // Past date check anchored strictly to server today (Asia/Kolkata)
  const isPast = (d) => {
    const dateStr = formatDateKey(year, month, d);
    if (serverToday) {
      return isBefore(dateStr, serverToday);
    }
    const today = new Date();
    return (
      new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  };

  const clearSel = () => {
    setRange({ start: null, end: null });
    setHoverDay(null);
  };

  const applyRange = (startDay, endDay, applyMode) => {
    if (startDay == null) return;
    const s = Math.min(startDay, endDay ?? startDay);
    const e = Math.max(startDay, endDay ?? startDay);
    const next = { ...dayStatusMap };
    let count = 0;
    for (let d = s; d <= e; d++) {
      const k = formatDateKey(year, month, d);
      if (isPast(d) || confirmedDates.has(k) || holdDates.has(k)) continue;
      if (applyMode === 'available') {
        delete next[k];
      } else {
        next[k] = 'blocked';
      }
      count++;
    }
    if (count === 0) {
      showToast(
        'Selected dates are in the past or locked by a booking or hold and cannot be modified.',
        'info',
      );
      clearSel();
      return;
    }
    setDayStatusMap(next);
    if (setCalData) {
      setCalData((prev) => ({
        ...prev,
        [listingIndex]: { ...next },
      }));
    }
    setDirty(true);
    const msgs = {
      block: 'Dates marked as blocked',
      available: 'Dates marked as available',
    };
    showToast(`${msgs[applyMode]}: ${count} day(s). Click "Save Changes" to save.`, 'info');
    clearSel();
  };

  const down = (d) => {
    if (isLoading || isSaving) return;
    const dateStr = formatDateKey(year, month, d);
    if (isPast(d) || confirmedDates.has(dateStr) || holdDates.has(dateStr)) return;
    drag.current = true;
    dragStart.current = d;
    didDrag.current = false;
  };

  const enter = (d) => {
    if (isLoading || isSaving) return;
    const dateStr = formatDateKey(year, month, d);
    if (isPast(d) || confirmedDates.has(dateStr) || holdDates.has(dateStr)) return;
    if (drag.current && dragStart.current != null) {
      if (d !== dragStart.current) {
        didDrag.current = true;
      }
      setRange({ start: dragStart.current, end: d });
    } else if (range.start != null && range.end == null) {
      setHoverDay(d);
    }
  };

  const handleDayClick = (d) => {
    if (isLoading || isSaving) return;
    if (justFinishedDrag.current) {
      justFinishedDrag.current = false;
      return;
    }
    const dateStr = formatDateKey(year, month, d);
    if (isPast(d) || confirmedDates.has(dateStr) || holdDates.has(dateStr)) return;

    if (range.start == null || range.end != null) {
      // First click: sets start date
      setRange({ start: d, end: null });
      setHoverDay(null);
    } else {
      // Second click: sets end date and automatically applies the range
      const startDay = range.start;
      const endDay = d;
      applyRange(startDay, endDay, mode);
    }
  };

  const changeMonth = (delta) => {
    clearSel();
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
  };

  const effectiveEnd = range.end ?? (range.start != null ? hoverDay : null) ?? range.start;
  const rs = range.start != null ? Math.min(range.start, effectiveEnd) : null;
  const re = range.start != null ? Math.max(range.start, effectiveEnd) : null;

  // Stage selected range into local map
  const apply = () => {
    if (isLoading || isSaving) return;
    if (range.start == null) {
      showToast('Select dates on the calendar first.');
      return;
    }
    const end = range.end ?? hoverDay ?? range.start;
    applyRange(range.start, end, mode);
  };

  // Quick range apply
  const applyQuick = () => {
    if (isLoading || isSaving) return;
    if (!qb.from || !qb.to) {
      showToast('Select both from and to dates.', 'error');
      return;
    }
    if (!isValidDateKey(qb.from) || !isValidDateKey(qb.to)) {
      showToast('Enter valid dates in YYYY-MM-DD format.', 'error');
      return;
    }
    if (qb.from > qb.to) {
      showToast('From date must be before To date.', 'error');
      return;
    }
    if (daysBetweenInclusive(qb.from, qb.to) > 730) {
      showToast('Selected date range cannot exceed 730 days.', 'error');
      return;
    }
    if (serverToday && isBefore(qb.to, serverToday)) {
      showToast('Selected date range is entirely in the past.', 'error');
      return;
    }

    const next = { ...dayStatusMap };
    let curr = qb.from;
    let count = 0;
    while (curr && curr <= qb.to) {
      const isPastDate = serverToday
        ? isBefore(curr, serverToday)
        : curr < new Date().toISOString().slice(0, 10);
      if (!isPastDate && !confirmedDates.has(curr) && !holdDates.has(curr)) {
        if (qb.type === 'available') {
          delete next[curr];
        } else {
          next[curr] = 'blocked';
        }
        count++;
      }
      curr = addDays(curr, 1);
    }

    if (count === 0) {
      showToast(
        'No editable dates in selected range (dates are in the past or locked by a booking or hold).',
        'info',
      );
      return;
    }

    setDayStatusMap(next);
    if (setCalData) {
      setCalData((prev) => ({
        ...prev,
        [listingIndex]: { ...next },
      }));
    }
    setDirty(true);
    const parts = parseDateParts(qb.from);
    if (parts) {
      setMonth(parts.month);
      setYear(parts.year);
    }
    showToast(`${count} day(s) staged. Click "Save Changes" to commit.`, 'info');
  };

  // Commit changes to backend with If-Match ETag guard
  const saveAvailability = async (retryAttempt = 0) => {
    if (!activeListingId || isSaving) return;

    const rangesToSend = dayStatusMapToRanges(dayStatusMap, confirmedDates, holdDates);
    setIsSaving(true);

    try {
      const data = await availabilityApi.syncListingAvailability(
        activeListingId,
        rangesToSend,
        etag,
      );

      // STRICT REHYDRATION from server blocks
      const savedBlocks = data.blocks || [];
      const {
        statusMap,
        confirmedDates: confDates,
        holdDates: hDates,
      } = blocksToDayStatusMap(savedBlocks);
      setBlocks(savedBlocks);
      setDayStatusMap(statusMap);
      if (setCalData) {
        setCalData((prev) => ({
          ...prev,
          [listingIndex]: { ...statusMap },
        }));
      }
      setConfirmedDates(confDates);
      setHoldDates(hDates);
      setEtag(data.etag);
      setServerToday(data.today);
      setDirty(false);
      setConflictHoldRanges([]);

      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setRetryState({ active: false, attempt: 0, maxAttempts: 3, countdown: 0 });

      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warn) => showToast(warn, 'warning'));
      }
      showToast('Availability calendar saved successfully.', 'success');
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data;

      if (status === 503) {
        const retryAfterSec = extractRetryAfterSeconds(err, 5);
        handleBusyRetry(retryAttempt, retryAfterSec);
      } else if (status === 412) {
        setStaleModal({
          open: true,
          serverBlocks: errData?.currentBlocks || [],
          newEtag: errData?.etag || null,
          newToday: errData?.today || null,
        });
      } else if (status === 409) {
        const conflicts = errData?.conflictingRanges || [];
        setConflictHoldRanges(conflicts);
        showToast(
          'Checkout in progress on selected dates. These dates are temporarily held and cannot be modified.',
          'error',
        );
      } else {
        showToast(apiErrorMessage(err, 'Failed to save availability.'), 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBusyRetry = (attempt, waitSeconds) => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    const nextAttempt = attempt + 1;

    if (nextAttempt <= 3) {
      let countdown = waitSeconds;
      setRetryState({ active: true, attempt: nextAttempt, maxAttempts: 3, countdown });

      retryTimerRef.current = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
          saveAvailability(nextAttempt);
        } else {
          setRetryState((prev) => ({ ...prev, countdown }));
        }
      }, 1000);
    } else {
      setRetryState({ active: true, attempt: nextAttempt, maxAttempts: 3, countdown: 0 });
      showToast('Calendar is experiencing high demand. Please click Retry Now.', 'error');
    }
  };

  const handleManualRetry = () => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryState({ active: false, attempt: 0, maxAttempts: 3, countdown: 0 });
    saveAvailability(0);
  };

  const handleAcceptStaleReload = () => {
    const serverBlocks = staleModal.serverBlocks;
    const {
      statusMap,
      confirmedDates: confDates,
      holdDates: hDates,
    } = blocksToDayStatusMap(serverBlocks);
    setBlocks(serverBlocks);
    setDayStatusMap(statusMap);
    if (setCalData) {
      setCalData((prev) => ({
        ...prev,
        [listingIndex]: { ...statusMap },
      }));
    }
    setConfirmedDates(confDates);
    setHoldDates(hDates);
    if (staleModal.newEtag) setEtag(staleModal.newEtag);
    if (staleModal.newToday) setServerToday(staleModal.newToday);
    setDirty(false);
    setStaleModal({ open: false, serverBlocks: [], newEtag: null, newToday: null });
    showToast('Calendar reloaded to latest server state.', 'info');
  };

  const ownerBlockedRanges = useMemo(
    () => dayStatusMapToRanges(dayStatusMap, confirmedDates, holdDates),
    [dayStatusMap, confirmedDates, holdDates],
  );

  if (loadingListings) {
    return (
      <div className="page active">
        <PageHeader title="Availability Calendar" sub="Loading billboard inventory..." />
        <div className="section-card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-muted)' }}>Loading your billboard listings...</p>
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="page active">
        <PageHeader
          title="Availability Calendar"
          sub="Manage your billboard blocking and availability."
        />
        <div className="section-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📅</div>
          <h3 style={{ marginBottom: 8 }}>No Billboard Listings Found</h3>
          <p
            style={{
              color: 'var(--ink-muted)',
              marginBottom: 20,
              maxWidth: 420,
              margin: '0 auto 20px',
            }}
          >
            Create your first billboard listing to begin managing its availability calendar and
            blocking dates.
          </p>
          <button className="btn-teal" onClick={() => navigate(ROUTES.newBillboardListing)}>
            Create New Listing
          </button>
        </div>
      </div>
    );
  }

  const rangeText = (() => {
    if (range.start == null) return null;
    const action = mode === 'available' ? 'Marking available' : 'Blocking';
    if (range.end == null) {
      if (hoverDay != null && hoverDay !== range.start) {
        const count = re - rs + 1;
        return `${action}: ${MONTHS[month]} ${rs} – ${re}, ${year} (${count} days — click date ${hoverDay} to confirm)`;
      }
      return `Selected start: ${MONTHS[month]} ${range.start}, ${year}. Click second date (e.g. ${Math.min(range.start + 4, 28)}) to select range, or click Apply for single day.`;
    }
    const count = re - rs + 1;
    return `${action}: ${MONTHS[month]} ${rs}${rs !== re ? ` – ${re}` : ''}, ${year} (${count} day${count > 0 ? 's' : ''})`;
  })();

  const upcomingBookings = blocks.filter((b) => b.blockType === 'CONFIRMED_BOOKING');
  const upcomingHolds = blocks.filter((b) => b.blockType === 'BOOKING_HOLD');

  return (
    <div className="page active">
      <PageHeader
        title="Availability Calendar"
        sub="Click or drag to select a date range. Choose a mode, stage your changes, then click Save Changes."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dirty && (
            <span
              className="chip chip-amber"
              style={{ fontSize: 11, padding: '4px 8px', fontWeight: 600 }}
            >
              Unsaved Changes
            </span>
          )}
          <button
            className="btn-teal"
            style={{ padding: '8px 18px', fontSize: 13, minWidth: 120 }}
            onClick={() => saveAvailability(0)}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </PageHeader>

      {/* 503 Auto-Retry Countdown Banner */}
      {retryState.active && (
        <div className="cal-alert cal-alert-busy">
          <div style={{ fontSize: 18 }}>⏳</div>
          <div className="cal-alert-content">
            <strong>Calendar is currently busy.</strong>
            <div>
              {retryState.attempt <= retryState.maxAttempts && retryState.countdown > 0
                ? `Retrying automatically in ${retryState.countdown}s (attempt ${retryState.attempt}/${retryState.maxAttempts})...`
                : 'Calendar is experiencing high demand. Please try again.'}
            </div>
          </div>
          {retryState.countdown === 0 && (
            <button className="btn-teal btn-sm" onClick={handleManualRetry} disabled={isSaving}>
              Retry Now
            </button>
          )}
        </div>
      )}

      {/* 409 Hold Conflict Alert */}
      {conflictHoldRanges.length > 0 && (
        <div className="cal-alert cal-alert-conflict">
          <div style={{ fontSize: 18 }}>⚠️</div>
          <div className="cal-alert-content">
            <strong>Checkout in progress on selected dates:</strong>
            <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {conflictHoldRanges.map((r, i) => (
                <span key={i} className="chip chip-amber" style={{ fontSize: 11 }}>
                  {r.startDate} to {r.endDate}
                </span>
              ))}
            </div>
            <small style={{ color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
              An advertiser is currently completing checkout for these dates. This temporary hold
              will automatically resolve in a few minutes — no action needed from you.
            </small>
          </div>
          <button className="btn-ghost btn-xs" onClick={() => setConflictHoldRanges([])}>
            Dismiss
          </button>
        </div>
      )}

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}
        className="cal-layout"
      >
        <div className="section-card">
          <div className="sc-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>{selectedListing?.name || 'Billboard'} — Availability</h3>
              {isLoading && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Refreshing...</span>
              )}
            </div>
            <select
              aria-label="Select Billboard Listing"
              className="form-control"
              style={{ width: 'auto', fontSize: 12.5, padding: '7px 12px', borderRadius: 9 }}
              value={activeListingId || ''}
              onChange={(e) => {
                const newId = Number(e.target.value);
                if (newId === activeListingId) return;
                if (dirty) {
                  if (
                    !window.confirm(
                      'You have unsaved availability changes. Switch billboard and discard them?',
                    )
                  ) {
                    return;
                  }
                }
                if (retryTimerRef.current) {
                  clearInterval(retryTimerRef.current);
                  retryTimerRef.current = null;
                }
                setRetryState({ active: false, attempt: 0, maxAttempts: 3, countdown: 0 });
                setSelectedListingId(newId);
                setBlocks([]);
                setDayStatusMap({});
                setConfirmedDates(new Set());
                setHoldDates(new Set());
                setEtag(null);
                setDirty(false);
                setConflictHoldRanges([]);
                setLoadedListingId(null);
                clearSel();
              }}
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.status ? `(${l.status})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="cal-toolbar">
            {[
              ['block', 'Block Dates'],
              ['available', 'Mark Available'],
            ].map(([m, lbl]) => (
              <button
                key={m}
                className={cn('cal-mode-btn', mode === m && 'active')}
                onClick={() => setMode(m)}
              >
                {lbl}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="cal-nav" onClick={() => changeMonth(-1)}>
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
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span
                className="cal-month"
                style={{ padding: '0 8px', minWidth: 120, textAlign: 'center' }}
              >
                {MONTHS[month]} {year}
              </span>
              <button className="cal-nav" onClick={() => changeMonth(1)}>
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
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className={cn('cal-range-info', range.start != null && 'visible')}>
            <span className="cal-range-text">{rangeText || 'No dates selected'}</span>
            <div className="cal-range-actions">
              <button className="btn-teal btn-sm" onClick={apply} disabled={isLoading || isSaving}>
                Apply
              </button>
              <button className="btn-ghost btn-sm" onClick={clearSel}>
                Clear
              </button>
            </div>
          </div>

          <div
            className="avail-calendar"
            style={{ padding: '18px 22px' }}
            onMouseLeave={() => setHoverDay(null)}
          >
            <CalGrid
              month={month}
              year={year}
              serverToday={serverToday}
              statusFor={(d) => {
                const k = formatDateKey(year, month, d);
                return dayStatusMap[k] || 'available';
              }}
              extra={(d) => {
                let c = isPast(d) ? 'past' : '';
                const k = formatDateKey(year, month, d);
                if (confirmedDates.has(k)) c += ' booked';
                else if (holdDates.has(k)) c += ' hold';
                if (rs != null) {
                  if (d === rs && d === re) c += ' selected';
                  else if (d === rs) c += ' range-start';
                  else if (d === re) c += ' range-end';
                  else if (d > rs && d < re) c += ' in-range';
                }
                return c;
              }}
              dayProps={(d) => ({
                onClick: () => handleDayClick(d),
                onMouseDown: () => down(d),
                onMouseEnter: () => enter(d),
              })}
            />
            <div className="cal-legend" style={{ marginTop: 16 }}>
              <div className="cal-legend-item">
                <div className="cal-legend-dot" style={{ background: 'var(--green)' }} />
                Available
              </div>
              <div className="cal-legend-item">
                <div className="cal-legend-dot" style={{ background: '#b45309' }} />
                Blocked by Owner
              </div>
              <div className="cal-legend-item">
                <div className="cal-legend-dot" style={{ background: 'var(--rose)' }} />
                Confirmed Booking
              </div>
              <div className="cal-legend-item">
                <div
                  className="cal-legend-dot"
                  style={{ background: '#f97316', border: '1px solid #ea580c' }}
                />
                Checkout Hold
              </div>
              <div className="cal-legend-item">
                <div className="cal-legend-dot" style={{ background: 'var(--teal)' }} />
                Selected Range
              </div>
              <div className="cal-legend-item">
                <div className="cal-legend-dot" style={{ background: 'var(--indigo)' }} />
                Today (IST)
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ padding: 22 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'var(--ink-faint)',
                marginBottom: 16,
              }}
            >
              Confirmed Bookings
            </div>
            {upcomingBookings.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                No active confirmed bookings on this billboard.
              </p>
            ) : (
              upcomingBookings.map((b) => (
                <div className="booking-row" key={b.id || `${b.startDate}-${b.endDate}`}>
                  <div className="booking-name">Confirmed Booking</div>
                  <div className="booking-dates">
                    {b.startDate} to {b.endDate}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 4,
                    }}
                  >
                    <span className="chip chip-booked" style={{ fontSize: 10.5 }}>
                      Read-Only
                    </span>
                  </div>
                </div>
              ))
            )}
            {upcomingHolds.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    color: '#c2410c',
                    marginBottom: 10,
                  }}
                >
                  Active Checkout Holds
                </div>
                {upcomingHolds.map((h) => (
                  <div className="booking-row" key={h.id || `hold-${h.startDate}-${h.endDate}`}>
                    <div className="booking-name">Temporary Hold</div>
                    <div className="booking-dates">
                      {h.startDate} to {h.endDate}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span className="chip chip-amber" style={{ fontSize: 10.5 }}>
                        Checkout in Progress
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: '#b45309',
                  marginBottom: 10,
                }}
              >
                Owner-Blocked Dates
              </div>
              {ownerBlockedRanges.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: 0 }}>
                  No owner-blocked dates scheduled.
                </p>
              ) : (
                <div className="cal-blocked-list">
                  {ownerBlockedRanges.map((r) => {
                    const label =
                      r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`;
                    const span = daysBetweenInclusive(r.startDate, r.endDate);
                    return (
                      <button
                        key={`${r.startDate}-${r.endDate}`}
                        type="button"
                        className="cal-blocked-chip"
                        onClick={() => {
                          const parts = parseDateParts(r.startDate);
                          if (parts) {
                            clearSel();
                            setMonth(parts.month);
                            setYear(parts.year);
                          }
                        }}
                        title="Jump calendar to this month"
                      >
                        <span>{label}</span>
                        <span className="cal-blocked-days">{span}d</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="section-card" style={{ padding: 22 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'var(--ink-faint)',
                marginBottom: 14,
              }}
            >
              Quick Block by Date Range
            </div>
            <div className="form-group">
              <label htmlFor="qb-from">From</label>
              <input
                id="qb-from"
                type="date"
                className="form-control"
                min={serverToday || undefined}
                value={qb.from}
                onChange={(e) => setQb({ ...qb, from: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="qb-to">To</label>
              <input
                id="qb-to"
                type="date"
                className="form-control"
                min={qb.from || serverToday || undefined}
                value={qb.to}
                onChange={(e) => setQb({ ...qb, to: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label htmlFor="qb-action">Action</label>
              <select
                id="qb-action"
                className="form-control"
                value={qb.type}
                onChange={(e) => setQb({ ...qb, type: e.target.value })}
              >
                <option value="block">Block Dates</option>
                <option value="available">Mark Available</option>
              </select>
            </div>
            <button
              className="btn-teal"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={applyQuick}
              disabled={isLoading || isSaving}
            >
              Apply Date Range
            </button>
          </div>

          <BookingRulesCard
            key={activeListingId}
            activeListingId={activeListingId}
            selectedListing={selectedListing}
            onListingUpdated={onListingUpdated}
          />
        </div>
      </div>

      {/* 412 Stale Write Modal */}
      {staleModal.open && (
        <Modal
          title="Calendar Updated Elsewhere"
          onClose={() =>
            setStaleModal({ open: false, serverBlocks: [], newEtag: null, newToday: null })
          }
          footer={
            <>
              <button
                className="btn-ghost"
                onClick={() =>
                  setStaleModal({ open: false, serverBlocks: [], newEtag: null, newToday: null })
                }
              >
                Cancel
              </button>
              <button className="btn-teal" onClick={handleAcceptStaleReload}>
                Load Latest Calendar
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            The availability calendar for this billboard was modified in another session or device.
            To avoid overwriting those changes, please reload the latest calendar state.
          </p>
        </Modal>
      )}
    </div>
  );
}

function QuotesPage({ onRespond }) {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState(QUOTES);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const decline = (i) => {
    setQuotes((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, status: 'Declined', sc: 'chip-declined' } : x)),
    );
    showToast('Quote declined.');
  };
  const filtered = quotes.filter(
    (x) =>
      (!q ||
        x.name.toLowerCase().includes(q.toLowerCase()) ||
        x.listing.toLowerCase().includes(q.toLowerCase())) &&
      (status === 'all' || x.status.toLowerCase() === status),
  );
  return (
    <div className="page active">
      <PageHeader
        title="Quote Requests"
        sub="Respond to inbound quote requests from verified businesses."
      />
      <div className="section-card">
        <div className="sc-header">
          <h3>All Requests ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input" style={{ minWidth: 140 }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ padding: '7px 12px 7px 30px', borderRadius: 9, fontSize: 12 }}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: 12.5, padding: '6px 10px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No quote requests found.</p>
          </div>
        ) : (
          filtered.map((x) => {
            const idx = quotes.indexOf(x);
            const isDone = x.status === 'Responded' || x.status === 'Declined';
            return (
              <div className="quote-item" key={x.init + x.name}>
                <div
                  className="qi-avatar"
                  style={{ background: `linear-gradient(135deg,${x.c1},${x.c2})` }}
                >
                  {x.init}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="qi-title">
                    {x.name} · {x.listing}
                  </div>
                  <div className="qi-meta">{x.meta}</div>
                  <div className="qi-actions">
                    {!isDone && (
                      <button
                        className="btn-teal btn-sm"
                        onClick={() => onRespond(x.name, x.listing)}
                      >
                        Send Quote
                      </button>
                    )}
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => showToast('Message thread opened.')}
                    >
                      Message
                    </button>
                    {!isDone && (
                      <button className="btn-ghost btn-sm" onClick={() => decline(idx)}>
                        Decline
                      </button>
                    )}
                  </div>
                </div>
                <span className={cn('chip', x.sc)}>{x.status}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TendersPage({ onBid }) {
  const [city, setCity] = useState('all');
  const filtered = city === 'all' ? TENDERS : TENDERS.filter((t) => t.city === city);
  return (
    <div className="page active">
      <PageHeader
        title="Tender Board"
        sub="Browse and bid on active advertiser tenders that match your listings."
      />
      <div className="section-card">
        <div className="sc-header">
          <h3>Active Tenders (5)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              Growth plan · unlimited bids
            </span>
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: 12.5, padding: '6px 10px' }}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              <option>Mumbai</option>
              <option>Delhi NCR</option>
              <option>Pune</option>
              <option>Hyderabad</option>
              <option>Pan India</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>No tenders match your filter.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div className="tender-item" key={t.ind}>
              <div className="ti-info">
                <div className="ti-name">
                  {t.ind}
                  {t.isNew && <span className="ti-new">NEW</span>}
                </div>
                <div className="ti-meta">
                  {t.desc} · {t.city} · {t.dur}
                </div>
                <span className="ti-deadline">{t.deadline}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="ti-budget">{t.budget}</div>
                <div className="ti-budget-label">per month</div>
              </div>
              <button className="btn-teal btn-sm" onClick={() => onBid(`${t.ind} – ${t.city}`)}>
                Bid Now →
              </button>
            </div>
          ))
        )}
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
  const b = bars.slice(start),
    l = line.slice(start),
    labels = CHART_MONTHS_12.slice(start);
  const totalRev = b.reduce((a, v) => a + v, 0);
  const totalViews = l.reduce((a, v) => a + v, 0);
  const growth = b.length > 1 && b[0] > 0 ? Math.round(((b[b.length - 1] - b[0]) / b[0]) * 100) : 0;
  return (
    <div className="page active">
      <PageHeader
        title="Analytics"
        sub="Track your listing performance, views, and revenue over time."
      >
        <button
          className="btn-ghost"
          onClick={() => showToast('Report downloaded as CSV.', 'success')}
        >
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>{' '}
          Export Report
        </button>
      </PageHeader>
      <StatCards
        items={[
          STAT(
            'blue',
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>,
            'Total Views',
            '247',
            <>
              <span className="card-trend up">↑34%</span> this month
            </>,
          ),
          STAT(
            'teal',
            <>
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </>,
            'Quote Requests',
            '14',
            '4 pending response',
          ),
          STAT(
            'gold',
            <>
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </>,
            'Revenue YTD',
            '₹43L',
            <>
              <span className="card-trend up">↑22%</span> vs last year
            </>,
          ),
          STAT(
            'green',
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </>,
            'Occupancy Rate',
            '78%',
            'across all listings',
          ),
        ]}
      />
      <div className="section-card">
        <div className="tab-bar">
          {[
            ['revenue', 'Revenue'],
            ['views', 'Views'],
            ['occupancy', 'Occupancy'],
            ['split', 'Revenue Split'],
          ].map(([id, lbl]) => (
            <button
              key={id}
              className={cn('tab-btn', tab === id && 'active')}
              onClick={() => setTab(id)}
            >
              {lbl}
            </button>
          ))}
        </div>
        {tab === 'revenue' && (
          <div className="tab-content active">
            <div className="chart-wrap">
              <div className="chart-toolbar">
                <div className="chart-kpi">
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Total Revenue</span>
                    <span className="chart-kpi-val">₹{totalRev.toFixed(1)}L</span>
                  </div>
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Total Views</span>
                    <span className="chart-kpi-val">{totalViews}</span>
                  </div>
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Avg Monthly</span>
                    <span className="chart-kpi-val">₹{(totalRev / b.length).toFixed(1)}L</span>
                  </div>
                  <div className="chart-kpi-item">
                    <span className="chart-kpi-label">Growth</span>
                    <span className={cn('chart-kpi-val', growth >= 0 ? 'up' : 'down')}>
                      {Math.abs(growth)}%
                    </span>
                  </div>
                </div>
                <div className="chart-toolbar-controls">
                  <select
                    className="chart-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Listings</option>
                    <option value="0">BKC LED Screen</option>
                    <option value="1">Andheri Flyover</option>
                    <option value="2">Powai IT Park LED</option>
                  </select>
                  <div className="range-toggle">
                    <button className={cn(range === 6 && 'active')} onClick={() => setRange(6)}>
                      6M
                    </button>
                    <button className={cn(range === 12 && 'active')} onClick={() => setRange(12)}>
                      12M
                    </button>
                  </div>
                </div>
              </div>
              <ComboChart
                labels={labels}
                bars={b}
                line={l}
                opts={{
                  width: 800,
                  height: 240,
                  barColor: 'var(--teal)',
                  lineColor: 'var(--amber)',
                  barLabel: 'Revenue',
                  barPrefix: '₹',
                  barSuffix: 'L',
                  lineLabel: 'Views',
                  lineSuffix: ' views',
                }}
              />
              <div className="chart-legend">
                <div className="chart-legend-item">
                  <div className="chart-legend-dot" style={{ background: 'var(--teal)' }} />
                  Revenue (₹L)
                </div>
                <div className="chart-legend-item">
                  <div className="chart-legend-dot line" style={{ background: 'var(--amber)' }} />
                  Profile Views
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'views' && (
          <div className="tab-content active">
            <div className="chart-wrap">
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 14 }}>
                Profile Views per listing — this month
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {VIEWS_DATA.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', minWidth: 170 }}>
                      {d.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: 'var(--canvas)',
                        borderRadius: 50,
                        height: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 50,
                          background: d.color,
                          width: `${(d.views / 142) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--ink-rich)',
                        minWidth: 40,
                        textAlign: 'right',
                      }}
                    >
                      {d.views}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'occupancy' && (
          <div className="tab-content active">
            <div className="chart-wrap">
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 14 }}>
                Occupancy rate per listing
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {OCCUPANCY_DATA.map((d) => (
                  <div key={d.name}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{d.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-rich)' }}>
                        {d.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        background: 'var(--canvas)',
                        borderRadius: 50,
                        height: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 50,
                          background: d.color,
                          width: `${d.pct}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'split' && (
          <div className="tab-content active">
            <div className="chart-wrap">
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 16 }}>
                Revenue contribution by listing — current month
              </div>
              <Donut />
            </div>
          </div>
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
  const prefs = [
    'New quote requests',
    'Tender board matches',
    'Payment confirmations',
    'Weekly digest',
  ];
  return (
    <div className="page active">
      <PageHeader
        title="User Profile"
        sub="Manage your profile, billing, and notification preferences."
      />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
        className="settings-grid"
      >
        {/* key on user id so the defaultValue inputs re-mount when the signed-in user changes */}
        <div key={user?.id || 'anon'} className="section-card" style={{ padding: 28 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--ink-rich)',
              letterSpacing: '-.3px',
              marginBottom: 20,
            }}
          >
            Owner Profile
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                className="form-control"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                className="form-control"
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              defaultValue={user?.email || ''}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              className="form-control"
              defaultValue={user?.phone || ''}
              placeholder="Not provided"
            />
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              className="form-control"
              defaultValue=""
              placeholder="Add your business name"
            />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input
              type="text"
              className="form-control"
              defaultValue=""
              placeholder="Not on file"
              readOnly
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>City</label>
            <select className="form-control" defaultValue="Mumbai">
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Bangalore</option>
              <option>Pune</option>
              <option>Hyderabad</option>
            </select>
          </div>
          <button
            className="btn-teal"
            onClick={() => {
              onSaveName(`${first} ${last}`);
              showToast('Profile saved successfully!', 'success');
            }}
          >
            Save Changes
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card" style={{ padding: 28 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--ink-rich)',
                letterSpacing: '-.3px',
                marginBottom: 16,
              }}
            >
              Current Plan
            </h3>
            <div className="plan-card">
              <div className="plan-name">Growth Plan</div>
              <div className="plan-price">₹2,999/month · Renews 10 Jul 2026</div>
              <div className="plan-features">
                {[
                  'Up to 10 billboard listings',
                  'Unlimited quote responses',
                  'Tender board access',
                  'Analytics dashboard',
                ].map((f) => (
                  <div className="plan-feature" key={f}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="btn-teal"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => showToast('Opening plan upgrade...')}
            >
              Upgrade to Enterprise →
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => showToast('Opening billing portal...')}
            >
              Manage Billing
            </button>
          </div>
          <div className="section-card" style={{ padding: 28 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--ink-rich)',
                letterSpacing: '-.3px',
                marginBottom: 16,
              }}
            >
              Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prefs.map((p, i) => (
                <label
                  key={p}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--ink-muted)',
                  }}
                >
                  {p}
                  <input
                    type="checkbox"
                    defaultChecked={i < 3}
                    onChange={() => showToast('Preference saved.')}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--teal)' }}
                  />
                </label>
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
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function DeleteListingModal({ listing, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onConfirm(listing.id);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };
  return (
    <Modal
      title="Delete Billboard Listing"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Listing'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--ink-muted)', fontSize: 13.5, lineHeight: 1.5 }}>
        Are you sure you want to delete listing{' '}
        <strong style={{ color: 'var(--ink-rich)' }}>&ldquo;{listing?.name}&rdquo;</strong>? This
        action cannot be undone and will remove the billboard from your inventory.
      </p>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export function OwnerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const tabParam = searchParams.get('tab');
  const page = VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  const [calData, setCalData] = useState(() =>
    user ? {} : import.meta.env.DEV ? initCalData() : {},
  );
  const [userName, setUserName] = useState(() => displayName(user));
  const [listings, setListings] = useState(() => (user ? [] : import.meta.env.DEV ? LISTINGS : []));
  const [loadingListings, setLoadingListings] = useState(() => Boolean(user));
  const [modal, setModal] = useState(null); // {type, brand, listing, tender, name}
  const [refreshKey, setRefreshKey] = useState(0);
  const hydratedOverviewListingRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);

  const primaryListingId = listings[0]?.id ?? null;

  useEffect(() => {
    if (!user || page !== 'overview' || !primaryListingId) {
      return;
    }
    if (hydratedOverviewListingRef.current === primaryListingId) {
      return;
    }

    let isMounted = true;
    Promise.resolve(availabilityApi.getListingAvailability(primaryListingId))
      .then((data) => {
        if (!isMounted || !data) return;
        hydratedOverviewListingRef.current = primaryListingId;
        const { statusMap } = blocksToDayStatusMap(data.blocks || []);
        setCalData((prev) => ({
          ...prev,
          0: { ...statusMap },
        }));
      })
      .catch(() => {
        // Overview MiniCalendar stays blank-available if availability API is unreachable.
      });

    return () => {
      isMounted = false;
    };
  }, [user, page, primaryListingId]);

  const refreshListings = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;
    ownerListingApi
      .getListings()
      .then((data) => {
        if (isMounted) {
          setListings(data || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (import.meta.env.DEV) {
            setListings(LISTINGS);
          } else {
            showToast(apiErrorMessage(err, 'Failed to load listings.'), 'error');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingListings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, refreshKey, showToast]);

  const closeModal = () => setModal(null);
  const nav = (p) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (p === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', p);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleDeleteListing = async (id) => {
    if (user && id) {
      try {
        await ownerListingApi.deleteListing(id);
        showToast('Billboard listing deleted successfully.', 'success');
        refreshListings();
      } catch (err) {
        showToast(apiErrorMessage(err, 'Failed to delete listing.'), 'error');
      }
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id && l.name !== modal?.listing?.name));
      showToast('Billboard listing deleted successfully.', 'success');
    }
  };

  const [submittingReviewId, setSubmittingReviewId] = useState(null);

  const handleSubmitForReview = async (listing) => {
    if (!listing?.id || submittingReviewId === listing.id) return;
    setSubmittingReviewId(listing.id);
    try {
      await ownerListingApi.submitListing(listing.id);
      showToast(`"${listing.name}" submitted for review!`, 'success');
      refreshListings();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to submit listing for review.'), 'error');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const handleListingUpdated = (id, fields) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...fields } : l)));
  };

  return (
    <div className="owner-dashboard-page">
      <Sidebar active={page} onNav={nav} userName={userName} listingsCount={listings.length} />
      <div className="main">
        <Topbar
          title={TITLES[page] || 'Dashboard'}
          onAddListing={() => navigate(ROUTES.newBillboardListing)}
          onNav={nav}
        />
        {page === 'overview' && (
          <Overview onNav={nav} calData={calData} listingsCount={listings.length} />
        )}
        {page === 'listings' && (
          <Listings
            listings={listings}
            loading={loadingListings}
            onAddListing={() => navigate(ROUTES.newBillboardListing)}
            onEditListing={(listing) => {
              if (listing?.id) {
                navigate(ROUTES.editBillboardListing(listing.id), { state: { listing } });
              }
            }}
            onDeleteListing={(listing) => setModal({ type: 'deleteListing', listing })}
            onSubmitForReview={handleSubmitForReview}
            submittingId={submittingReviewId}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage
            calData={calData}
            setCalData={setCalData}
            listings={listings}
            loadingListings={loadingListings}
            onListingUpdated={handleListingUpdated}
          />
        )}
        {page === 'quotes' && (
          <QuotesPage onRespond={(brand, listing) => setModal({ type: 'quote', brand, listing })} />
        )}
        {page === 'tenders' && (
          <TendersPage onBid={(tender) => setModal({ type: 'bid', tender })} />
        )}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'settings' && <SettingsPage onSaveName={setUserName} />}
      </div>
      {modal?.type === 'deleteListing' && (
        <DeleteListingModal
          listing={modal.listing}

          onClose={closeModal}
          onConfirm={handleDeleteListing}
        />
      )}
      {modal?.type === 'quote' && (
        <Modal
          title="Send Quote Response"
          onClose={closeModal}
          footer={
            <>
              <button className="btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-teal"
                onClick={() => {
                  showToast('Quote response sent!', 'success');
                  closeModal();
                }}
              >
                Send Response
              </button>
            </>
          }
        >
          <div
            style={{
              background: 'var(--canvas)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              fontSize: 12.5,
              color: 'var(--ink-muted)',
            }}
          >
            Responding to: <strong style={{ color: 'var(--ink-rich)' }}>{modal.brand}</strong> for{' '}
            <strong style={{ color: 'var(--ink-rich)' }}>{modal.listing}</strong>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Your Rate (₹/month)</label>
              <input type="text" className="form-control" placeholder="e.g. 5,80,000" />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <select className="form-control">
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>12 Months</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              className="form-control"
              rows="3"
              style={{ resize: 'vertical' }}
              placeholder="Brief note about your listing and availability..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Available From</label>
            <input type="date" className="form-control" defaultValue={today} />
          </div>
        </Modal>
      )}
      {modal?.type === 'bid' && (
        <Modal
          title="Submit Bid"
          onClose={closeModal}
          footer={
            <>
              <button className="btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-teal"
                onClick={() => {
                  showToast('Bid submitted successfully!', 'success');
                  closeModal();
                }}
              >
                Submit Bid
              </button>
            </>
          }
        >
          <div
            style={{
              background: 'var(--canvas)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              fontSize: 12.5,
              color: 'var(--ink-muted)',
            }}
          >
            Bidding on: <strong style={{ color: 'var(--ink-rich)' }}>{modal.tender}</strong>
          </div>
          <div className="form-group">
            <label>Select Listing</label>
            <select className="form-control">
              <option>BKC LED Screen</option>
              <option>Andheri Flyover Hoarding</option>
              <option>Powai IT Park LED</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bid Rate (₹/month)</label>
              <input type="text" className="form-control" placeholder="e.g. 4,50,000" />
            </div>
            <div className="form-group">
              <label>Available From</label>
              <input type="date" className="form-control" defaultValue={today} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Pitch (optional)</label>
            <textarea
              className="form-control"
              rows="3"
              style={{ resize: 'vertical' }}
              placeholder="Why your space is ideal for this campaign..."
            />
          </div>
        </Modal>
      )}
      <Toast />
    </div>
  );
}
