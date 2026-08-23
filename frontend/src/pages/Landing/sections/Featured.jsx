import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { useAuthModal } from '@/context/AuthModalContext';
import { FEATURED_LISTINGS } from '@/data/landing';

function ListingArt({ bg }) {
  const common = {
    width: 38,
    height: 38,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'rgba(255,255,255,0.35)',
    strokeWidth: 1.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const art = {
    city: (
      <svg {...common}>
        <rect x="3" y="9" width="5" height="12" />
        <rect x="9" y="5" width="6" height="16" />
        <rect x="17" y="11" width="4" height="10" />
        <line x1="1" y1="21" x2="23" y2="21" />
      </svg>
    ),
    led: (
      <svg {...common}>
        <line x1="9" y1="18" x2="15" y2="18" />
        <line x1="10" y1="22" x2="14" y2="22" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
    highway: (
      <svg {...common}>
        <path d="M3 17l3-10 3 5 3-8 3 8 3-5 3 10" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
    metro: (
      <svg {...common}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01M9 6h6M9 10h6M9 14h3" />
      </svg>
    ),
  };
  return art[bg] ?? null;
}

export function Featured() {
  const { openRegister } = useAuthModal();

  return (
    <section className="featured-section">
      <div className="section-header-split">
        <div>
          <span className="section-eyebrow">Featured This Week</span>
          <h2
            className="section-heading"
            style={{ fontSize: 'clamp(26px,3.5vw,40px)', marginBottom: 0 }}
          >
            Top billboard spaces.
          </h2>
        </div>
        <Button variant="ghost" to={ROUTES.browse}>
          View all 12,000+
        </Button>
      </div>

      <div className="listings-grid">
        {FEATURED_LISTINGS.map((listing, i) => (
          <Reveal
            as={Link}
            to={ROUTES.browse}
            className="listing-card"
            index={i}
            key={listing.name}
          >
            <div className="lc-img">
              <div className={cn('lc-img-bg', `bg-${listing.bg}`)}>
                <ListingArt bg={listing.bg} />
              </div>
              <div className="lc-badges">
                {listing.badges.map((badge) => (
                  <span className={cn('lc-badge', badge.cls)} key={badge.label}>
                    {badge.label}
                  </span>
                ))}
              </div>
              <span className="lc-status ls-avail">{listing.status}</span>
            </div>
            <div className="lc-body">
              <div className="lc-city">{listing.city}</div>
              <div className="lc-name">{listing.name}</div>
              <div className="lc-specs">{listing.specs}</div>
              <div className="lc-foot">
                <div>
                  <div className="lc-price">{listing.price}</div>
                  <div className="lc-price-sub">{listing.priceSub}</div>
                </div>
                <button
                  className="lc-btn"
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
