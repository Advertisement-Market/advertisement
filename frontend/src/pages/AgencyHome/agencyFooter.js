import { ROUTES } from '@/lib/routes';

/** Agency-home footer. */
export const AGENCY_FOOTER = {
  description:
    "India's marketplace for outdoor advertising. Connecting businesses, billboard owners, and agencies across 180+ cities.",
  copyright: '© 2026 The AdBasket India Pvt. Ltd. Made with ♥ in India 🇮🇳',
  meta: 'Privacy · Terms · Sitemap',
  columns: [
    {
      title: 'For Agencies',
      links: [
        { label: 'Register Agency', to: ROUTES.agencyRegister },
        { label: 'Live Tenders', href: '#tenders' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Agency Dashboard', to: ROUTES.agencyDashboard },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Platform',
      links: [
        { label: 'Browse Billboards', to: ROUTES.browse },
        { label: 'Browse Agencies', to: ROUTES.browseAgencies },
        { label: 'For Billboard Owners', to: ROUTES.owners },
        { label: 'For Advertisers', to: ROUTES.advertisers },
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
