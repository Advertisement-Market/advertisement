import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { TENDERS, AGENCIES } from '@/data/landing';

const centered = { marginLeft: 'auto', marginRight: 'auto' };

export function MarketplaceSplit() {
  const { openGate } = useAuthModal();
  const { showToast } = useToast();

  return (
    <section className="split-section" id="campaigns">
      <div className="section-header" style={{ textAlign: 'center' }}>
        <span className="section-eyebrow">The AdBasket Marketplace</span>
        <h2 className="section-heading" style={centered}>
          Live campaigns. Verified <em>agencies.</em>
        </h2>
        <p className="section-sub" style={{ ...centered, textAlign: 'center' }}>
          Brands post campaigns anonymously. Owners and agencies compete. Everyone gets a fair shot.
        </p>
      </div>

      <div className="split-grid">
        {/* CAMPAIGNS / TENDERS */}
        <div className="tenders-col">
          <span className="col-label c-teal">Active Right Now</span>
          <h3 className="col-heading c-teal">
            Campaigns looking <em>for spaces.</em>
          </h3>
          <p className="col-sub">
            These businesses have posted their budgets. Billboard owners and agencies can bid
            anonymously until accepted.
          </p>

          <div className="tender-list">
            {TENDERS.map((tender, i) => (
              <Reveal
                as="div"
                className="tender-row"
                index={i}
                key={tender.sector}
                onClick={() => showToast('Sign in to view full details and submit a bid.')}
              >
                <div className={cn('t-dot', tender.dot)} />
                <div className="t-info">
                  <div className="t-sector">
                    {tender.sector}
                    {tender.isNew && <span className="t-new-tag">NEW</span>}
                  </div>
                  <div className="t-desc">{tender.desc}</div>
                  <div className="t-meta">
                    {tender.meta.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
                <div className="t-budget">
                  <span className="t-budget-val">{tender.budget}</span>
                  <span className="t-budget-lbl">{tender.budgetSub}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="col-footer">
            <button className="btn-primary btn-sm" onClick={openGate}>
              Post a Campaign
            </button>
            <Button variant="teal" size="sm" to={ROUTES.owners}>
              Bid as Owner
            </Button>
            <Button variant="gold" size="sm" to={ROUTES.agencies}>
              Bid as Agency
            </Button>
          </div>
        </div>

        <div className="split-divider" />

        {/* AGENCIES */}
        <div className="agencies-col" id="agencies">
          <span className="col-label c-gold">Verified Professionals</span>
          <h3 className="col-heading c-gold">
            Top agencies <em>on the platform.</em>
          </h3>
          <p className="col-sub">
            840+ verified OOH agencies — from full-service shops to production houses. Browse
            profiles, check case studies, send briefs directly.
          </p>

          <div className="agency-list">
            {AGENCIES.map((agency, i) => (
              <Reveal
                as={Link}
                to={ROUTES.browseAgencies}
                className="agency-row"
                index={i}
                key={agency.name}
              >
                <div className={cn('agency-avatar', agency.avatar)}>{agency.initials}</div>
                <div className="agency-info">
                  <div className="agency-name">{agency.name}</div>
                  <div className="agency-type">{agency.type}</div>
                  <div className="agency-tags">
                    {agency.tags.map((tag) => (
                      <span className="agency-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="agency-right">
                  <div className="agency-rating">
                    <span className="agency-star">★</span> {agency.rating} · {agency.reviews}
                  </div>
                  <div className="agency-verified">✓ Verified</div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="col-footer">
            <Button variant="gold" size="sm" to={ROUTES.browseAgencies}>
              Browse All 840+ Agencies
            </Button>
            <Button variant="ghost" size="sm" to={ROUTES.agencyRegister}>
              Register Your Agency
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
