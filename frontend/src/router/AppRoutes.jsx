import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Landing } from '@/pages/Landing/Landing';
import { AdvertiserHome } from '@/pages/AdvertiserHome/AdvertiserHome';
import { AdvertiserRegister } from '@/pages/AdvertiserRegister/AdvertiserRegister';
import { OwnerHome } from '@/pages/OwnerHome/OwnerHome';
import { OwnerRegister } from '@/pages/OwnerRegister/OwnerRegister';
import { AgencyHome } from '@/pages/AgencyHome/AgencyHome';
import { AgencyRegister } from '@/pages/AgencyRegister/AgencyRegister';
import { Browse } from '@/pages/Browse/Browse';
import { ComingSoon } from '@/pages/_stubs/ComingSoon';

/**
 * Application route table (clean paths).
 * Only the landing page is fully built in Phase 1; the remaining routes render a
 * ComingSoon placeholder so navigation and links resolve end-to-end.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<Landing />} />

      <Route path={ROUTES.advertisers} element={<AdvertiserHome />} />
      <Route path={ROUTES.owners} element={<OwnerHome />} />
      <Route path={ROUTES.agencies} element={<AgencyHome />} />

      <Route path={ROUTES.advertiserRegister} element={<AdvertiserRegister />} />
      <Route path={ROUTES.ownerRegister} element={<OwnerRegister />} />
      <Route path={ROUTES.agencyRegister} element={<AgencyRegister />} />

      <Route
        path={ROUTES.advertiserDashboard}
        element={<ComingSoon title="Advertiser Dashboard" />}
      />
      <Route path={ROUTES.ownerDashboard} element={<ComingSoon title="Owner Dashboard" />} />
      <Route path={ROUTES.agencyDashboard} element={<ComingSoon title="Agency Dashboard" />} />

      <Route path={ROUTES.browse} element={<Browse />} />
      <Route path={ROUTES.browseAgencies} element={<ComingSoon title="Find Agencies" />} />

      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
  );
}
