/**
 * Centralized route map (clean paths).
 * The original static site linked between *.html files; these constants are the
 * single source of truth for the SPA so links never drift.
 */
export const ROUTES = {
  home: '/',

  // Role landing / marketing pages
  advertisers: '/advertisers',
  owners: '/owners',
  agencies: '/agencies',

  // Registration flows
  advertiserRegister: '/advertisers/register',
  ownerRegister: '/owners/register',
  agencyRegister: '/agencies/register',

  // Authenticated dashboards
  advertiserDashboard: '/advertisers/dashboard',
  ownerDashboard: '/owners/dashboard',
  agencyDashboard: '/agencies/dashboard',

  // Discovery
  browse: '/browse',
  browseAgencies: '/browse/agencies',
};

/** Maps an authenticated user's role to their dashboard route. */
export const DASHBOARD_BY_ROLE = {
  ADVERTISER: ROUTES.advertiserDashboard,
  OWNER: ROUTES.ownerDashboard,
  AGENCY: ROUTES.agencyDashboard,
};

/**
 * Build a URL with a query string from a params object (skips empty values).
 * Mirrors the original handleBillboardSearch/handleAgencySearch helpers.
 *
 * @param {string} path
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '') search.set(key, String(value).trim());
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
