import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES, DASHBOARD_BY_ROLE } from '@/lib/routes';
import { useScrolled } from '@/hooks/useScrolled';
import { useToggle } from '@/hooks/useToggle';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Logo } from '@/components/layout/Logo';
import { NAV_ROLES } from '@/data/navigation';

const HomeIcon = (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const GridIcon = (
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
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

/**
 * Navigation for the role home pages (`#mainNav`): Home link, role switcher with
 * an animated pill, page links, and a Dashboard / Sign In / CTA cluster.
 *
 * @param {object} props
 * @param {'advertiser'|'owner'|'agency'} props.activeRole
 * @param {{ label: string, to?: string, href?: string }[]} props.links
 * @param {{ label: string, to?: string, href?: string }[]} props.mobileLinks
 * @param {string} props.dashboardTo
 * @param {string} [props.ctaLabel]
 */
export function HomeNavbar({
  activeRole,
  links = [],
  mobileLinks = [],
  dashboardTo,
  ctaLabel = 'Get Started Free',
  ctaTo,
  accentBtn = 'btn-primary',
  onSignIn,
}) {
  const scrolled = useScrolled(40);
  const [mobileOpen, mobile] = useToggle(false);
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const signIn = onSignIn ?? openLogin;
  const myDash = (user && DASHBOARD_BY_ROLE[user.role]) || dashboardTo;
  const onboarded = !!(user && DASHBOARD_BY_ROLE[user.role]); // has a marketplace role + dashboard
  const handleLogout = () => {
    logout();
    mobile.close();
    showToast('You have been signed out.');
    navigate(ROUTES.home);
  };

  const switcherRef = useRef(null);
  const activeBtnRef = useRef(null);
  const [pill, setPill] = useState({ width: 0, transform: 'translateX(0px)' });

  const movePill = useCallback((btn) => {
    const sw = switcherRef.current;
    if (!sw || !btn) return;
    const s = sw.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setPill({ width: b.width, transform: `translateX(${b.left - s.left - 3}px)` });
  }, []);

  const resetPill = useCallback(() => movePill(activeBtnRef.current), [movePill]);

  useLayoutEffect(() => {
    resetPill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  return (
    <>
      <nav id="mainNav" className={cn(scrolled && 'scrolled')}>
        <div className="nav-left">
          <Logo className="nav-logo" />
          <Link to={ROUTES.home} className="btn-home">
            {HomeIcon}
            <span>Home</span>
          </Link>
          <div className="role-switcher" ref={switcherRef} onMouseLeave={resetPill}>
            <div className="role-switcher-pill" style={pill} />
            {NAV_ROLES.map((role) => {
              const isActive = role.key === activeRole;
              return (
                <Link
                  key={role.key}
                  to={role.to}
                  ref={isActive ? activeBtnRef : undefined}
                  className={cn('role-btn', isActive && 'active')}
                  onMouseEnter={(e) => movePill(e.currentTarget)}
                >
                  {role.label}
                </Link>
              );
            })}
          </div>
        </div>

        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.label}>
              {link.to ? (
                <NavLink to={link.to}>{link.label}</NavLink>
              ) : (
                <a href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
        </ul>

        <div className="nav-cta">
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>Hi, {user.firstName}</span>
              {onboarded && (
                <Link
                  to={myDash}
                  className={cn(accentBtn, 'btn-sm')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  {GridIcon}
                  My Dashboard
                </Link>
              )}
              <button className="btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={signIn}>
                Sign In
              </button>
              {ctaTo ? (
                <Link to={ctaTo} className={accentBtn}>
                  {ctaLabel}
                </Link>
              ) : (
                <button className={accentBtn} onClick={openRegister}>
                  {ctaLabel}
                </button>
              )}
            </>
          )}
          <button
            className={cn('nav-hamburger', mobileOpen && 'open')}
            onClick={mobile.toggle}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={cn('mobile-nav', mobileOpen && 'open')}>
        {mobileLinks.map((link) =>
          link.to ? (
            <Link key={link.label} to={link.to} onClick={mobile.close}>
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.href} onClick={mobile.close}>
              {link.label}
            </a>
          ),
        )}
        <div className="mobile-nav-cta">
          {isAuthenticated ? (
            <>
              {onboarded && (
                <Link to={myDash} className={accentBtn} onClick={mobile.close}>
                  My Dashboard
                </Link>
              )}
              <button className="btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-ghost"
                onClick={() => {
                  signIn();
                  mobile.close();
                }}
              >
                Sign In
              </button>
              {ctaTo ? (
                <Link to={ctaTo} className={accentBtn} onClick={mobile.close}>
                  {ctaLabel}
                </Link>
              ) : (
                <button
                  className={accentBtn}
                  onClick={() => {
                    openRegister();
                    mobile.close();
                  }}
                >
                  {ctaLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
