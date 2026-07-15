import { ROUTES } from '@/lib/routes';

/** Role switcher entries shared by the public navbar. */
export const NAV_ROLES = [
  { key: 'advertiser', label: 'Advertisers', to: ROUTES.advertisers },
  { key: 'owner', label: 'Owners', to: ROUTES.owners },
  { key: 'agency', label: 'Agencies', to: ROUTES.agencies },
];

/** Primary (desktop) links for the landing navbar. */
export const LANDING_NAV_LINKS = [
  { label: 'Browse Billboards', to: ROUTES.browse },
  { label: 'Find Agencies', to: ROUTES.browseAgencies },
  { label: 'Live Campaigns', href: '#campaigns' },
  { label: 'How It Works', href: '#how' },
];

/** Mobile menu links for the landing navbar. */
export const LANDING_MOBILE_LINKS = [
  { label: 'Browse Billboards', to: ROUTES.browse },
  { label: 'Find Agencies', to: ROUTES.browseAgencies },
  { label: 'Live Campaigns', href: '#campaigns' },
  { label: 'For Billboard Owners', to: ROUTES.owners },
  { label: 'For Agencies', to: ROUTES.agencies },
];

/** Footer content (shared across the site). */
export const SITE_FOOTER = {
  description:
    "India's marketplace for outdoor advertising. Connecting businesses, billboard owners, and agencies across 180+ cities.",
  copyright: '© 2026 The AdBasket India Pvt. Ltd. All rights reserved. Made in India 🇮🇳',
  meta: 'Privacy · Terms · Sitemap',
  columns: [
    {
      title: 'For Advertisers',
      links: [
        { label: 'Browse Billboards', to: ROUTES.browse },
        { label: 'Post a Campaign', to: ROUTES.advertisers },
        { label: 'ROI Calculator', to: ROUTES.advertisers },
        { label: 'My Dashboard', to: ROUTES.advertiserDashboard },
      ],
    },
    {
      title: 'Owners and Agencies',
      links: [
        { label: 'List Your Billboard', to: ROUTES.owners },
        { label: 'Owner Signup', to: ROUTES.ownerRegister },
        { label: 'For Agencies', to: ROUTES.agencies },
        { label: 'Register Agency', to: ROUTES.agencyRegister },
        { label: 'Browse Agencies', to: ROUTES.browseAgencies },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'How It Works', href: '#how' },
        { label: 'About Us', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
      ],
    },
  ],
};
