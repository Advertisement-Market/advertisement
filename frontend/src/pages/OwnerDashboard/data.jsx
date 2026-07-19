/* eslint-disable react-refresh/only-export-components */
/* Data + icons for the owner dashboard (from templates/owner-dashboard.html). */

const I = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} />
);

export const NAV = [
  {
    section: 'Main',
    items: [
      { page: 'overview', label: 'Overview', icon: <I><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></I> },
      { page: 'listings', label: 'My Listings', badge: '3', icon: <I><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M12 16v5M8 21h8" /></I> },
      { page: 'calendar', label: 'Availability Calendar', icon: <I><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></I> },
    ],
  },
  {
    section: 'Leads',
    items: [
      { page: 'quotes', label: 'Quote Requests', badge: '4', icon: <I><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></I> },
      { page: 'tenders', label: 'Tender Board', icon: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></I> },
    ],
  },
  {
    section: 'Insights',
    items: [{ page: 'analytics', label: 'Analytics', icon: <I><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></I> }],
  },
  {
    section: 'Account',
    items: [{ page: 'settings', label: 'Settings', icon: <I><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></I> }],
  },
];

export const TITLES = {
  overview: 'Overview', listings: 'My Listings', calendar: 'Availability Calendar',
  quotes: 'Quote Requests', tenders: 'Tender Board', analytics: 'Analytics', settings: 'Account Settings',
};

export const NOTIFICATIONS = [
  { dot: 'teal', unread: true, text: <><strong>New quote request</strong> from FMCG brand for BKC LED — 3-month campaign</>, time: '1 hour ago' },
  { dot: 'indigo', unread: true, text: <>Your <strong>Andheri Flyover listing</strong> was viewed 24 times today</>, time: '4 hours ago' },
  { dot: 'gold', unread: true, text: <>New tender: <strong>Real estate · Mumbai · ₹3–5L/mo</strong> matches your listings</>, time: '6 hours ago' },
  { dot: 'green', unread: false, text: <><strong>Payment received</strong> ₹2.8L from MG Road campaign — verified</>, time: '2 days ago' },
  { dot: 'teal', unread: false, text: <>Growth plan renews in <strong>7 days</strong> — manage in settings</>, time: '3 days ago' },
];

export const ONBOARD_STEPS = [
  { label: 'Register account', done: true },
  { label: 'Upload GST & PAN', done: true },
  { label: 'Add first listing', done: true },
  { label: 'Upload photos', done: false },
  { label: 'Set availability calendar', done: false },
];

export const LISTING_NAMES = ['BKC LED Screen', 'Andheri Flyover', 'Powai IT Park LED'];

const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">${inner}</svg>`;
export const LED = svg('<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>');
export const STATIC = svg('<path d="M3 17l3-10h12l3 10"/><line x1="12" y1="7" x2="12" y2="17"/>');
export const BOLT = svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');

export const LISTINGS = [
  { svgInner: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>', color: 'linear-gradient(135deg,#1e3a5f,#1d6fa4)', name: 'BKC LED Screen', meta: 'BKC · Mumbai · 40×25 ft · LED Digital', views: 142, quotes: 3, price: '₹5.8L', status: 'Available', sc: 'chip-available' },
  { svgInner: '<path d="M3 17l3-10h12l3 10"/><line x1="12" y1="7" x2="12" y2="17"/>', color: 'linear-gradient(135deg,#1a3320,#2e5e32)', name: 'Andheri Flyover Hoarding', meta: 'Andheri West · Mumbai · 40×20 ft · Static', views: 68, quotes: 1, price: '₹3.2L', status: 'Booked', sc: 'chip-booked' },
  { svgInner: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', color: 'linear-gradient(135deg,#0c2340,#0a70c0)', name: 'Powai IT Park LED', meta: 'Powai · Mumbai · 35×18 ft · LED Digital', views: 37, quotes: 0, price: '₹2.2L', status: 'Available', sc: 'chip-available' },
];

export const QUOTES = [
  { init: 'NP', c1: '#4F46E5', c2: '#818CF8', name: 'FMCG Brand', listing: 'BKC LED Screen', meta: '3 months · ₹5–7L/mo · 1 hr ago', status: 'New', sc: 'chip-new' },
  { init: 'RS', c1: '#D97706', c2: '#FBBF24', name: 'Real Estate Co.', listing: 'Andheri Flyover', meta: '6 months · ₹3L/mo · Yesterday', status: 'Pending', sc: 'chip-pending' },
  { init: 'MK', c1: '#0891B2', c2: '#22D3EE', name: 'Auto Brand', listing: 'Powai IT Park LED', meta: '3 months · ₹2–3L/mo · 3 days ago', status: 'Responded', sc: 'chip-success' },
  { init: 'SK', c1: '#7C3AED', c2: '#A78BFA', name: 'EdTech Brand', listing: 'BKC LED Screen', meta: '1 month · ₹5L/mo · 5 days ago', status: 'Declined', sc: 'chip-declined' },
];

export const TENDERS = [
  { ind: 'FMCG / Consumer Goods', desc: 'Summer launch · Multiple formats welcome', city: 'Mumbai', dur: '3 months', budget: '₹8–12L', isNew: true, deadline: 'Closes 20 Jun' },
  { ind: 'Real Estate', desc: 'Township launch — premium locations preferred', city: 'Delhi NCR', dur: '6 months', budget: '₹3–5L', isNew: false, deadline: 'Closes 30 Jun' },
  { ind: 'Education', desc: 'Admission season · Near colleges & coaching hubs', city: 'Pune', dur: '2 months', budget: '₹80K–1.5L', isNew: true, deadline: 'Closes 15 Jun' },
  { ind: 'Automotive', desc: 'New model launch · High-traffic highways', city: 'Hyderabad', dur: '3 months', budget: '₹15–25L', isNew: false, deadline: 'Closes 25 Jun' },
  { ind: 'Banking / Finance', desc: 'Pan India brand awareness — metros + Tier 2', city: 'Pan India', dur: '12 months', budget: '₹50L–1Cr', isNew: false, deadline: 'Closes 1 Jul' },
];

export const BOOKINGS = [
  { name: 'FMCG Summer Campaign', listing: 'BKC LED Screen', dates: '1 Jul – 30 Sep 2026', price: '₹5.8L/mo' },
  { name: 'Tech Brand Launch', listing: 'Andheri Flyover', dates: '1 Aug – 31 Oct 2026', price: '₹3.2L/mo' },
];

export const CHART_MONTHS_12 = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const CHART_REVENUE_12 = [3.1, 3.4, 3.8, 3.6, 4.0, 4.2, 4.2, 5.8, 6.1, 7.4, 8.2, 9.8];
export const CHART_VIEWS_12 = [38, 45, 52, 58, 65, 72, 80, 110, 142, 185, 220, 247];
export const REVENUE_BY_LISTING = {
  0: CHART_REVENUE_12.map((v) => +(v * 0.5).toFixed(2)),
  1: CHART_REVENUE_12.map((v) => +(v * 0.3).toFixed(2)),
  2: CHART_REVENUE_12.map((v) => +(v * 0.2).toFixed(2)),
};
export const VIEWS_BY_LISTING = {
  0: CHART_VIEWS_12.map((v) => Math.round(v * 0.55)),
  1: CHART_VIEWS_12.map((v) => Math.round(v * 0.28)),
  2: CHART_VIEWS_12.map((v) => Math.round(v * 0.17)),
};
export const VIEWS_DATA = [
  { name: 'BKC LED Screen', views: 142, color: 'var(--teal)' },
  { name: 'Andheri Flyover', views: 68, color: 'var(--amber)' },
  { name: 'Powai IT Park LED', views: 37, color: 'var(--indigo)' },
];
export const OCCUPANCY_DATA = [
  { name: 'BKC LED Screen', pct: 85, color: 'var(--green)' },
  { name: 'Andheri Flyover', pct: 100, color: 'var(--rose)' },
  { name: 'Powai IT Park LED', pct: 45, color: 'var(--amber)' },
];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* Initial booked days for listing 0 and 1 (current month). */
export function initCalData() {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const data = { 0: {}, 1: {}, 2: {} };
  [3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 21, 22].forEach((d) => { data[0][`${y}-${pad(m + 1)}-${pad(d)}`] = 'booked'; });
  [1, 2, 10, 11, 12].forEach((d) => { data[1][`${y}-${pad(m + 1)}-${pad(d)}`] = 'booked'; });
  return data;
}
export const dayKey = (y, m, d) => { const pad = (n) => (n < 10 ? `0${n}` : `${n}`); return `${y}-${pad(m + 1)}-${pad(d)}`; };
