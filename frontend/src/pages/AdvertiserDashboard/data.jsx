/* eslint-disable react-refresh/only-export-components */
/* Data + inline icons for the advertiser dashboard (from templates/advertiser-dashboard.html). */

const I = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const NAV = [
  {
    section: 'Main',
    items: [
      {
        page: 'overview',
        label: 'Overview',
        icon: (
          <I>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </I>
        ),
      },
      {
        page: 'campaigns',
        label: 'Campaigns',
        badge: '3',
        icon: (
          <I>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </I>
        ),
      },
      {
        page: 'mediaplan',
        label: 'Media Plan Builder',
        icon: (
          <I>
            <rect x="3" y="4" width="18" height="11" rx="2" />
            <path d="M12 15v5M8 20h8" />
          </I>
        ),
      },
      {
        page: 'browse-dash',
        label: 'Browse & Shortlist',
        icon: (
          <I>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </I>
        ),
      },
    ],
  },
  {
    section: 'Manage',
    items: [
      {
        page: 'quotes',
        label: 'Quotes & Proposals',
        badge: '5',
        icon: (
          <I>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </I>
        ),
      },
      {
        page: 'tenders',
        label: 'My Tenders',
        icon: (
          <I>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </I>
        ),
      },
      {
        page: 'analytics',
        label: 'Analytics & ROI',
        icon: (
          <I>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </I>
        ),
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        page: 'settings',
        label: 'Settings',
        icon: (
          <I>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </I>
        ),
      },
    ],
  },
];

export const TITLES = {
  overview: 'Overview',
  campaigns: 'My Campaigns',
  mediaplan: 'Media Plan Builder',
  'browse-dash': 'Browse & Shortlist',
  quotes: 'Quotes & Proposals',
  tenders: 'My Tenders',
  analytics: 'Analytics & ROI',
  settings: 'Account Settings',
};

export const NOTIFICATIONS = [
  {
    dot: 'indigo',
    unread: true,
    text: (
      <>
        <strong>New quote received</strong> from BKC LED Screen owner — ₹5.2L/mo proposal
      </>
    ),
    time: '2 hours ago',
  },
  {
    dot: 'teal',
    unread: true,
    text: (
      <>
        Your tender <strong>&quot;Mumbai FMCG Launch&quot;</strong> received 3 new bids
      </>
    ),
    time: '5 hours ago',
  },
  {
    dot: 'gold',
    unread: true,
    text: (
      <>
        <strong>BKC listing was viewed</strong> 24 times this week — high interest
      </>
    ),
    time: '1 day ago',
  },
  {
    dot: 'green',
    unread: false,
    text: (
      <>
        Campaign <strong>&quot;Summer 2026 · MG Road&quot;</strong> is live and running
      </>
    ),
    time: '3 days ago',
  },
  {
    dot: 'indigo',
    unread: false,
    text: (
      <>
        Quote from Anna Nagar Bus Shelter <strong>expires in 2 days</strong> — take action
      </>
    ),
    time: '4 days ago',
  },
];

export const ONBOARD_STEPS = [
  { label: 'Create your account', done: true },
  { label: 'Complete your profile', done: true },
  { label: 'Browse billboards', done: false, goto: 'browse-dash' },
  { label: 'Save your first shortlist', done: false },
  { label: 'Post your first tender', done: false },
];

export const QUOTES = [
  {
    id: 'q1',
    init: 'BK',
    color: 'var(--indigo)',
    title: 'BKC LED Screen · Mumbai',
    sub: '40×25 ft · LED · BKC, Mumbai',
    price: '₹5.2L',
    status: 'New',
    statusClass: 'chip-new',
  },
  {
    id: 'q2',
    init: 'AN',
    color: 'var(--teal)',
    title: 'Andheri Flyover · Mumbai',
    sub: '40×20 ft · Static · Andheri West',
    price: '₹3.0L',
    status: 'Expiring in 2d',
    statusClass: 'chip-pending',
  },
  {
    id: 'q3',
    init: 'MG',
    color: 'var(--green)',
    title: 'MG Road LED · Bengaluru',
    sub: '30×15 ft · LED · MG Road',
    price: '₹2.6L',
    status: 'Accepted',
    statusClass: 'chip-success',
  },
  {
    id: 'q4',
    init: 'HP',
    color: 'var(--gold)',
    title: 'Hitech City Gantry · Hyderabad',
    sub: '60×20 ft · Gantry · Hitech City',
    price: '₹2.0L',
    status: 'Reviewed',
    statusClass: 'chip-pending',
  },
  {
    id: 'q5',
    init: 'NH',
    color: '#8B5CF6',
    title: 'NH-48 Unipole · Pune',
    sub: '50×25 ft · Unipole · Wakad',
    price: '₹1.3L',
    status: 'Reviewed',
    statusClass: 'chip-pending',
  },
];

const LED_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
const PIN_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 5-5 13-5 13S7 12 7 7a5 5 0 0 1 5-5z"/><circle cx="12" cy="7" r="2"/></svg>`;
const IMG_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><path d="m9 17 5-5 5 5"/></svg>`;

export const MEDIA_PLAN_INIT = [
  {
    id: 7,
    name: 'BKC LED Screen · Mumbai',
    meta: '40×25 ft · LED Digital · BKC',
    price: '₹5.8L',
    priceNum: 580000,
    icon: LED_ICON,
    color: 'linear-gradient(135deg,#0c2340,#0a82c0)',
    footfall: 120000,
  },
  {
    id: 2,
    name: 'MG Road LED · Bengaluru',
    meta: '30×15 ft · LED Digital · MG Road',
    price: '₹2.8L',
    priceNum: 280000,
    icon: PIN_ICON,
    color: 'linear-gradient(135deg,#1e2d5a,#2d4a8a)',
    footfall: 110000,
  },
];

export const SAVED = [
  {
    id: 's1',
    icon: PIN_ICON,
    color: 'linear-gradient(135deg,#1e2d5a,#2d4a8a)',
    name: 'Andheri Flyover · West Side',
    meta: 'Mumbai · Static Hoarding · 40×20 ft',
    price: '₹3.2L',
    priceNum: 320000,
    footfall: 90000,
  },
  {
    id: 's2',
    icon: LED_ICON,
    color: 'linear-gradient(135deg,#0c2340,#0a82c0)',
    name: 'MG Road LED Screen',
    meta: 'Bengaluru · LED Digital · 30×15 ft',
    price: '₹2.8L',
    priceNum: 280000,
    footfall: 110000,
  },
  {
    id: 's3',
    icon: IMG_ICON,
    color: 'linear-gradient(135deg,#1a2e1a,#3d6b3d)',
    name: 'NH-48 Highway Unipole',
    meta: 'Pune · Unipole · 50×25 ft',
    price: '₹1.4L',
    priceNum: 140000,
    footfall: 75000,
  },
];

export const NOTIF_PREFS = [
  ['New quote received', 'Email + App'],
  ['Tender bid received', 'Email + App'],
  ['Quote expiring soon', 'Email'],
  ['Campaign goes live', 'App only'],
  ['Weekly reach report', 'Email'],
];

export const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const CHART_IMPRESSIONS = [1.1, 1.4, 1.8, 2.2, 3.6, 4.2];
export const CHART_SPEND = [1.8, 2.2, 2.8, 3.5, 5.6, 8.4];
