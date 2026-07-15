import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useScrolled } from '@/hooks/useScrolled';
import { useToggle } from '@/hooks/useToggle';
import { useAuthModal } from '@/context/AuthModalContext';
import { Logo } from '@/components/layout/Logo';

const HIDDEN_PILL = { opacity: 0, width: 0, transform: 'translateX(0px)' };

/**
 * Fixed site navigation. Gains a `.scrolled` background on scroll, animates a
 * role-switcher pill on hover, and toggles a mobile menu.
 *
 * @param {object} props
 * @param {{ label: string, to?: string, href?: string }[]} props.links
 * @param {{ label: string, to: string, key: string }[]} props.roles
 * @param {string} [props.activeRole]  role key that stays highlighted
 * @param {{ label: string, to?: string, href?: string }[]} props.mobileLinks
 */
export function Navbar({ links = [], roles = [], activeRole, mobileLinks = [] }) {
  const scrolled = useScrolled(40);
  const [mobileOpen, mobile] = useToggle(false);
  const { openLogin, openRegister } = useAuthModal();

  const switcherRef = useRef(null);
  const activeBtnRef = useRef(null);
  const [pill, setPill] = useState(HIDDEN_PILL);

  const movePill = useCallback((btn) => {
    const switcher = switcherRef.current;
    if (!switcher || !btn) return;
    const sr = switcher.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPill({ opacity: 1, width: br.width, transform: `translateX(${br.left - sr.left - 3}px)` });
  }, []);

  const resetPill = useCallback(() => {
    if (activeRole && activeBtnRef.current) movePill(activeBtnRef.current);
    else setPill(HIDDEN_PILL);
  }, [activeRole, movePill]);

  // Position the pill under the active role on mount / when it changes.
  useLayoutEffect(() => {
    resetPill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  const handleMobileNav = () => mobile.close();

  return (
    <>
      <nav className={cn('site-nav', scrolled && 'scrolled')}>
        <div className="nav-left">
          <Logo className="nav-logo" />

          {roles.length > 0 && (
            <div className="role-switcher" ref={switcherRef} onMouseLeave={resetPill}>
              <div className="role-pill" style={pill} />
              {roles.map((role) => {
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
          )}
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
          <button className="btn-nav-ghost" onClick={openLogin}>
            Sign In
          </button>
          <button className="btn-nav-primary" onClick={openRegister}>
            Join Free
          </button>
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
            <Link key={link.label} to={link.to} onClick={handleMobileNav}>
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.href} onClick={handleMobileNav}>
              {link.label}
            </a>
          ),
        )}
        <div className="mobile-nav-cta">
          <button
            className="btn-ghost-dark"
            style={{ padding: '10px 18px' }}
            onClick={() => {
              openLogin();
              mobile.close();
            }}
          >
            Sign In
          </button>
          <button
            className="btn-amber"
            style={{ padding: '10px 18px' }}
            onClick={() => {
              openRegister();
              mobile.close();
            }}
          >
            Join Free
          </button>
        </div>
      </div>
    </>
  );
}
