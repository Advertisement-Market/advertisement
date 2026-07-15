import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/ui/Reveal';
import { PORTALS } from '@/data/landing';

const ICON_STROKE = { adv: 'var(--indigo)', own: 'var(--teal)', age: 'var(--gold-role)' };

function PortalIcon({ icon, stroke }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  if (icon === 'home') {
    return (
      <svg {...common}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (icon === 'billboard') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="11" rx="2" />
        <path d="M12 15v5M8 20h8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function Portals() {
  return (
    <section className="portals-section">
      <div className="section-header">
        <span className="section-eyebrow">Who uses The AdBasket</span>
        <h2 className="section-heading">
          Choose your <em>path in.</em>
        </h2>
        <p className="section-sub">
          Whether you&apos;re placing ads, selling space, or running campaigns — The AdBasket has a
          dedicated workspace for you.
        </p>
      </div>

      <div className="portals-grid">
        {PORTALS.map((portal, i) => (
          <Reveal as="div" className={cn('portal-card', portal.role)} index={i} key={portal.role}>
            <div className="portal-accent" />
            <div className="portal-body">
              <div className="portal-icon-wrap">
                <PortalIcon icon={portal.icon} stroke={ICON_STROKE[portal.role]} />
              </div>
              <div className="portal-role-label">{portal.roleLabel}</div>
              <div className="portal-title">{portal.title}</div>
              <div className="portal-desc">{portal.desc}</div>
              <ul className="portal-list">
                {portal.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link to={portal.ctaTo} className="portal-cta">
                {portal.ctaLabel}
              </Link>
              <Link to={portal.secondaryTo} className="portal-secondary-link">
                {portal.secondaryLabel}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
