import { PublicLayout } from '@/components/layout/PublicLayout';
import { LANDING_MOBILE_LINKS, LANDING_NAV_LINKS, NAV_ROLES, SITE_FOOTER } from '@/data/navigation';
import {
  CtaDark,
  Featured,
  Hero,
  HowItWorks,
  LiveTicker,
  MarketplaceSplit,
  Portals,
  StatsBand,
} from './sections';
import './Landing.css';

/**
 * The AdBasket landing page — a faithful React port of templates/index.html.
 * All styling lives in Landing.css, scoped under `.landing-page`.
 */
export function Landing() {
  return (
    <PublicLayout
      pageClassName="landing-page"
      nav={{
        links: LANDING_NAV_LINKS,
        roles: NAV_ROLES,
        mobileLinks: LANDING_MOBILE_LINKS,
      }}
      footer={SITE_FOOTER}
    >
      <Hero />
      <LiveTicker />
      <Portals />
      <Featured />
      <MarketplaceSplit />
      <StatsBand />
      <HowItWorks />
      <CtaDark />
    </PublicLayout>
  );
}

export default Landing;
