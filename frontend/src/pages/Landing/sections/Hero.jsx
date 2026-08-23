import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES, withQuery } from '@/lib/routes';
import { useAuthModal } from '@/context/AuthModalContext';
import { Counter } from '@/components/ui/Counter';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { HERO_STATS } from '@/data/landing';
import {
  AGENCY_BUDGET_OPTIONS,
  AGENCY_TYPE_OPTIONS,
  BILLBOARD_BUDGET_OPTIONS,
  BILLBOARD_TYPE_OPTIONS,
} from './searchOptions';

const PinIcon = (
  <svg
    width="15"
    height="15"
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
const BillboardIcon = (
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
    <rect x="3" y="4" width="18" height="11" rx="2" />
    <path d="M12 15v5M8 20h8" />
  </svg>
);
const RupeeIcon = (
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
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const UsersIcon = (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
const CardIcon = (
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
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const SearchIcon = (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export function Hero() {
  const navigate = useNavigate();
  const { openLogin } = useAuthModal();

  const [mode, setMode] = useState('billboards');
  const [bill, setBill] = useState({ city: '', type: '', budget: '' });
  const [agency, setAgency] = useState({ city: '', type: '', budget: '' });

  const switcherRef = useRef(null);
  const boardBtnRef = useRef(null);
  const agencyBtnRef = useRef(null);
  const [pill, setPill] = useState({ width: 0, transform: 'translateX(0px)' });

  useLayoutEffect(() => {
    const btn = mode === 'billboards' ? boardBtnRef.current : agencyBtnRef.current;
    if (btn) setPill({ width: btn.offsetWidth, transform: `translateX(${btn.offsetLeft - 4}px)` });
  }, [mode]);

  const runBillboardSearch = () =>
    navigate(withQuery(ROUTES.browse, { city: bill.city, type: bill.type, budget: bill.budget }));
  const runAgencySearch = () =>
    navigate(
      withQuery(ROUTES.browseAgencies, {
        city: agency.city,
        type: agency.type,
        budget: agency.budget,
      }),
    );

  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <div className="hero-bg-glow" />
        <div className="hero-bg-glow2" />
        <div className="hero-bg-dots" />
        <div className="hero-bg-rings" />
      </div>

      <div className="hero-billboard-bg">
        <svg viewBox="0 0 500 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="20"
            y="10"
            width="460"
            height="260"
            rx="8"
            stroke="white"
            strokeWidth="6"
            fill="none"
          />
          <rect x="225" y="270" width="50" height="80" stroke="white" strokeWidth="5" fill="none" />
          <rect
            x="140"
            y="345"
            width="220"
            height="12"
            rx="4"
            stroke="white"
            strokeWidth="4"
            fill="none"
          />
          <rect
            x="38"
            y="26"
            width="424"
            height="228"
            rx="4"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeDasharray="12 8"
          />
          <line x1="20" y1="280" x2="480" y2="280" stroke="white" strokeWidth="4" />
          <line x1="80" y1="270" x2="80" y2="285" stroke="white" strokeWidth="3" />
          <line x1="200" y1="270" x2="200" y2="285" stroke="white" strokeWidth="3" />
          <line x1="300" y1="270" x2="300" y2="285" stroke="white" strokeWidth="3" />
          <line x1="420" y1="270" x2="420" y2="285" stroke="white" strokeWidth="3" />
        </svg>
      </div>

      <div className="hero-inner">
        <div className="hero-badge">
          <span className="badge-live">
            <span className="badge-live-dot" />
            Live
          </span>
          India&apos;s Best Advertising Marketplace
        </div>

        <h1 className="hero-headline">India&apos;s Billboards.</h1>
        <h1 className="hero-headline-2">One Platform.</h1>

        <p className="hero-sub">
          Search, compare, and book from 12,000+ verified outdoor spaces across 180+ cities. Or post
          a campaign — let owners and agencies come to you.
        </p>

        <div className="search-mode-switcher" ref={switcherRef}>
          <div className="search-mode-pill" style={pill} />
          <button
            className={cn('search-mode-btn', mode === 'billboards' && 'active')}
            ref={boardBtnRef}
            onClick={() => setMode('billboards')}
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
              <rect x="3" y="4" width="18" height="11" rx="2" />
              <path d="M12 15v5M8 20h8" />
            </svg>
            Search Billboards
          </button>
          <button
            className={cn('search-mode-btn', mode === 'agencies' && 'active')}
            ref={agencyBtnRef}
            onClick={() => setMode('agencies')}
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Find Agencies
          </button>
        </div>

        <div className="search-wrap">
          {/* BILLBOARD SEARCH */}
          <div className={cn('search-panel', mode === 'billboards' && 'active')}>
            <div className="search-box">
              <div className="search-fields">
                <div className="sf">
                  <span className="sf-icon">{PinIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">City or Area</span>
                    <input
                      className="sf-input"
                      type="text"
                      placeholder="Mumbai, Delhi, Bengaluru…"
                      autoComplete="off"
                      value={bill.city}
                      onChange={(e) => setBill((s) => ({ ...s, city: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && runBillboardSearch()}
                    />
                  </div>
                </div>
                <div className={cn('sf', bill.type && 'has-value')}>
                  <span className="sf-icon">{BillboardIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">Billboard Type</span>
                    <SearchSelect
                      name="searchType"
                      options={BILLBOARD_TYPE_OPTIONS}
                      value={bill.type}
                      onChange={(v) => setBill((s) => ({ ...s, type: v }))}
                    />
                  </div>
                </div>
                <div className={cn('sf', bill.budget && 'has-value')}>
                  <span className="sf-icon">{RupeeIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">Monthly Budget</span>
                    <SearchSelect
                      name="searchBudget"
                      options={BILLBOARD_BUDGET_OPTIONS}
                      value={bill.budget}
                      onChange={(v) => setBill((s) => ({ ...s, budget: v }))}
                    />
                  </div>
                </div>
                <button className="search-btn" onClick={runBillboardSearch}>
                  {SearchIcon}
                  Search
                </button>
              </div>
            </div>
            <div className="search-quick">
              <span className="quick-label">Popular:</span>
              <Link to={withQuery(ROUTES.browse, { city: 'Mumbai' })} className="quick-pill">
                Mumbai
              </Link>
              <Link to={withQuery(ROUTES.browse, { city: 'Delhi' })} className="quick-pill">
                Delhi NCR
              </Link>
              <Link to={withQuery(ROUTES.browse, { city: 'Bengaluru' })} className="quick-pill">
                Bengaluru
              </Link>
              <Link to={withQuery(ROUTES.browse, { type: 'LED Digital' })} className="quick-pill">
                LED Digital
              </Link>
              <Link to={withQuery(ROUTES.browse, { type: 'Highway' })} className="quick-pill">
                Highway
              </Link>
              <Link to={withQuery(ROUTES.browse, { tier: 'Premium' })} className="quick-pill">
                Premium
              </Link>
            </div>
          </div>

          {/* AGENCY SEARCH */}
          <div className={cn('search-panel', mode === 'agencies' && 'active')}>
            <div className="search-box">
              <div className="search-fields agency-fields">
                <div className="sf">
                  <span className="sf-icon">{PinIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">City</span>
                    <input
                      className="sf-input"
                      type="text"
                      placeholder="Mumbai, Delhi, Pan India…"
                      autoComplete="off"
                      value={agency.city}
                      onChange={(e) => setAgency((s) => ({ ...s, city: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && runAgencySearch()}
                    />
                  </div>
                </div>
                <div className={cn('sf', agency.type && 'has-value')}>
                  <span className="sf-icon">{UsersIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">Agency Type</span>
                    <SearchSelect
                      name="agencyType"
                      options={AGENCY_TYPE_OPTIONS}
                      value={agency.type}
                      onChange={(v) => setAgency((s) => ({ ...s, type: v }))}
                    />
                  </div>
                </div>
                <div className={cn('sf', agency.budget && 'has-value')}>
                  <span className="sf-icon">{CardIcon}</span>
                  <div className="sf-body">
                    <span className="sf-label">Campaign Budget</span>
                    <SearchSelect
                      name="agencyBudget"
                      options={AGENCY_BUDGET_OPTIONS}
                      value={agency.budget}
                      onChange={(v) => setAgency((s) => ({ ...s, budget: v }))}
                    />
                  </div>
                </div>
                <button className="search-btn" onClick={runAgencySearch}>
                  {SearchIcon}
                  Find
                </button>
              </div>
            </div>
            <div className="search-quick">
              <span className="quick-label">Browse:</span>
              <Link
                to={withQuery(ROUTES.browseAgencies, { city: 'Mumbai' })}
                className="quick-pill"
              >
                Mumbai Agencies
              </Link>
              <Link to={withQuery(ROUTES.browseAgencies, { city: 'Delhi' })} className="quick-pill">
                Delhi NCR
              </Link>
              <Link
                to={withQuery(ROUTES.browseAgencies, { type: 'OOH Specialist' })}
                className="quick-pill"
              >
                OOH Specialists
              </Link>
              <Link
                to={withQuery(ROUTES.browseAgencies, { verified: 'true' })}
                className="quick-pill"
              >
                GST Verified
              </Link>
              <Link
                to={withQuery(ROUTES.browseAgencies, { sort: 'rating' })}
                className="quick-pill"
              >
                Top Rated
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-stats">
          {HERO_STATS.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <Counter className="hero-stat-num" target={stat.target} />
              <span className="hero-stat-lbl">{stat.label}</span>
            </div>
          ))}
        </div>

        <p className="hero-signin">
          Already on The AdBasket?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openLogin();
            }}
          >
            Sign in to your dashboard
          </a>
        </p>
      </div>
    </section>
  );
}
