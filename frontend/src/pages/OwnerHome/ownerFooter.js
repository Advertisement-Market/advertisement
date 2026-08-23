import { ROUTES } from '@/lib/routes';

/** Owner-home footer (its columns differ from the shared site footer). */
export const OWNER_FOOTER = {
  description:
    "India's marketplace for outdoor advertising. Connecting billboard owners with verified business campaigns across 180+ cities.",
  copyright: '© 2026 The AdBasket. All rights reserved.',
  meta: "India's OOH Marketplace",
  columns: [
    {
      title: 'For Owners',
      links: [
        { label: 'How It Works', href: '#journey' },
        { label: 'Earnings Calculator', href: '#earnings' },
        { label: 'Live Tenders', href: '#tenders' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Register Now', to: ROUTES.ownerRegister },
      ],
    },
    {
      title: 'Platform',
      links: [
        { label: 'For Advertisers', to: ROUTES.advertisers },
        { label: 'For Agencies', to: ROUTES.agencies },
        { label: 'Dashboard', to: ROUTES.ownerDashboard },
        { label: 'Help Centre', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Privacy Policy', href: '#' },
      ],
    },
  ],
};
