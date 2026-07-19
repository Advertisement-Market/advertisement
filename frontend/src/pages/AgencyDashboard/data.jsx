/* eslint-disable react-refresh/only-export-components */
/* Data + icons for the agency dashboard (from templates/agency-dashboard.html). */

const I = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props} />
);

export const NAV = [
  {
    section: 'Main',
    items: [
      { page: 'overview', label: 'Overview', icon: <I><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></I> },
      { page: 'tenders', label: 'Tender Board', badge: '12', icon: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></I> },
      { page: 'mybids', label: 'My Bids', badge: '5', icon: <I><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></I> },
      { page: 'campaigns', label: 'Active Campaigns', icon: <I><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></I> },
    ],
  },
  {
    section: 'Clients & Work',
    items: [
      { page: 'clients', label: 'Clients', icon: <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></I> },
      { page: 'casestudies', label: 'Case Studies', icon: <I><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></I> },
    ],
  },
  {
    section: 'Insights',
    items: [{ page: 'analytics', label: 'Analytics & Revenue', icon: <I><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></I> }],
  },
  {
    section: 'Account',
    items: [
      { page: 'profile', label: 'Agency Profile', icon: <I><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></I> },
      { page: 'settings', label: 'Settings', icon: <I><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></I> },
    ],
  },
];

export const TITLES = {
  overview: 'Overview', tenders: 'Tender Board', mybids: 'My Bids', campaigns: 'Active Campaigns',
  clients: 'Clients', casestudies: 'Case Studies', analytics: 'Analytics & Revenue',
  profile: 'Agency Profile', settings: 'Account Settings',
};

export const NOTIFICATIONS = [
  { dot: 'gold', unread: true, text: <><strong>New tender posted</strong> — Automotive brand · Hyderabad · ₹15–25L budget</>, time: '1 hour ago' },
  { dot: 'green', unread: true, text: <>Your bid on <strong>&quot;FMCG Summer Launch&quot;</strong> was shortlisted by the advertiser</>, time: '3 hours ago' },
  { dot: 'indigo', unread: true, text: <><strong>Direct brief received</strong> from Reliance Retail — respond within 48 hrs</>, time: 'Yesterday' },
  { dot: 'teal', unread: false, text: <>Campaign <strong>&quot;MG Road LED · Tech Brand&quot;</strong> went live — 3 month run confirmed</>, time: '2 days ago' },
  { dot: 'gold', unread: false, text: <>Your GST verification badge has been <strong>renewed for 2026–27</strong></>, time: '5 days ago' },
];

export const ONBOARD_STEPS = [
  { label: 'Register agency', done: true },
  { label: 'Upload GST certificate', done: true },
  { label: 'Add agency services', done: true },
  { label: 'Add a case study', done: false },
  { label: 'Submit your first bid', done: false },
];

export const TENDERS = [
  { sector: 'FMCG / Consumer Goods', name: 'Summer launch campaign — Multiple formats welcome', city: 'Mumbai', dur: '3 months', fmt: 'Static or LED', budget: '₹8–12L', isNew: true, color: '#D97706' },
  { sector: 'Automotive', name: 'New model launch — High-traffic highways preferred', city: 'Hyderabad', dur: '3 months', fmt: 'Gantry / Unipole', budget: '₹15–25L', isNew: false, color: '#4F46E5' },
  { sector: 'Real Estate', name: 'New township launch — Premium locations preferred', city: 'Delhi NCR', dur: '6 months', fmt: 'Hoardings', budget: '₹3–5L', isNew: false, color: '#0891B2' },
  { sector: 'Education', name: 'Admission season drive — Near colleges & coaching hubs', city: 'Pune', dur: '2 months', fmt: 'Bus Shelters', budget: '₹80K–1.5L', isNew: true, color: '#059669' },
  { sector: 'Banking / Finance', name: 'Pan India awareness — Metros and Tier 2 cities', city: 'Pan India', dur: '12 months', fmt: 'LED preferred', budget: '₹50L–1Cr', isNew: false, color: '#8B5CF6' },
  { sector: 'Healthcare / Pharma', name: 'OTC product launch — Chemist-cluster targeting', city: 'Bengaluru', dur: '1 month', fmt: 'Unipoles', budget: '₹1.5–3L', isNew: true, color: '#E53935' },
  { sector: 'Retail / E-Commerce', name: 'Festive season mega sale — High-footfall malls', city: 'Mumbai', dur: '2 months', fmt: 'LED Digital', budget: '₹10–18L', isNew: false, color: '#D97706' },
  { sector: 'Technology / SaaS', name: 'B2B awareness — Business districts only', city: 'Bengaluru', dur: '3 months', fmt: 'Static Hoarding', budget: '₹4–8L', isNew: false, color: '#4F46E5' },
  { sector: 'FMCG / Consumer Goods', name: 'New SKU awareness — Tier 2 rollout', city: 'Jaipur, Indore', dur: '3 months', fmt: 'Any format', budget: '₹2–4L', isNew: true, color: '#D97706' },
  { sector: 'Automotive', name: 'EV awareness blitz — Metro stations + highways', city: 'Delhi NCR', dur: '2 months', fmt: 'LED + Static', budget: '₹20–35L', isNew: false, color: '#4F46E5' },
  { sector: 'Real Estate', name: 'Luxury apartments — Premium billboard only', city: 'Mumbai', dur: '4 months', fmt: 'Unipoles', budget: '₹6–10L', isNew: false, color: '#0891B2' },
  { sector: 'Telecom', name: 'Network expansion announcement — Pan South India', city: 'Chennai, Hyderabad', dur: '6 months', fmt: 'Any', budget: '₹25–50L', isNew: true, color: '#059669' },
];

export const BIDS = [
  { color: 'var(--gold)', name: 'FMCG Summer Launch · Mumbai', meta: '₹8–12L/mo · 3 months · Bid on 2 Jun 2026', bid: '₹9.5L/mo', status: 'Shortlisted', chip: 'chip-new' },
  { color: 'var(--indigo)', name: 'Auto Brand Launch · Hyderabad', meta: '₹15–25L/mo · 3 months · Bid on 28 May 2026', bid: '₹18L/mo', status: 'Under Review', chip: 'chip-pending' },
  { color: 'var(--green)', name: 'Reliance Retail · Pan India', meta: '₹50L–1Cr/mo · 12 months · Bid on 20 May 2026', bid: '₹62L/mo', status: 'Won', chip: 'chip-success' },
  { color: 'var(--teal)', name: 'EdTech — Pune Colleges', meta: '₹80K–1.5L/mo · 2 months · Bid on 14 May 2026', bid: '₹1.1L/mo', status: 'Lost', chip: 'chip-lost' },
  { color: '#8B5CF6', name: 'Banking Brand · Pan India', meta: '₹50L–1Cr/mo · 12 months · Bid on 5 May 2026', bid: '₹55L/mo', status: 'Under Review', chip: 'chip-pending' },
];

const FLAG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
const PHONE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
const HOME = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const CAP = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;

export const CAMPAIGNS = [
  { color: 'linear-gradient(135deg,var(--gold),#FBBF24)', icon: FLAG, name: 'Reliance Retail — Q3 OOH', meta: 'Pan India · 1 Jul – 30 Sep 2026 · LED + Static', impressions: '8.4Cr', spend: '₹62L/mo', status: 'Live', chip: 'chip-live' },
  { color: 'linear-gradient(135deg,var(--indigo),#818CF8)', icon: PHONE, name: 'TechCorp B2B · Bengaluru', meta: 'Bengaluru · 15 Jun – 15 Sep 2026 · Static Hoarding', impressions: '1.8Cr', spend: '₹5.5L/mo', status: 'Live', chip: 'chip-live' },
  { color: 'linear-gradient(135deg,var(--teal),#22D3EE)', icon: HOME, name: 'RealCo Township · Delhi NCR', meta: 'Delhi NCR · 1 Jul – 31 Dec 2026 · Hoardings', impressions: '—', spend: '₹3.5L/mo', status: 'Scheduled', chip: 'chip-pending' },
  { color: 'linear-gradient(135deg,#059669,#34D399)', icon: CAP, name: 'LearnFast Admission Drive', meta: 'Pune · 20 Jun – 20 Aug 2026 · Bus Shelters', impressions: '—', spend: '₹1.1L/mo', status: 'Scheduled', chip: 'chip-pending' },
];

export const CLIENTS = [
  { init: 'RL', color: 'linear-gradient(135deg,var(--gold),#FBBF24)', name: 'Reliance Retail', meta: 'Active · ₹62L/mo · Since 2024', val: '₹3.2Cr', sub: 'lifetime value' },
  { init: 'TC', color: 'linear-gradient(135deg,var(--indigo),#818CF8)', name: 'TechCorp India', meta: 'Active · ₹5.5L/mo · Since 2025', val: '₹38L', sub: 'lifetime value' },
  { init: 'RC', color: 'linear-gradient(135deg,var(--teal),#22D3EE)', name: 'RealCo Developers', meta: 'Active · ₹3.5L/mo · Since 2025', val: '₹22L', sub: 'lifetime value' },
  { init: 'FM', color: 'linear-gradient(135deg,#D97706,#FBBF24)', name: 'FreshMart FMCG', meta: 'Completed · ₹9.5L/mo · 2026', val: '₹28.5L', sub: 'lifetime value' },
  { init: 'LF', color: 'linear-gradient(135deg,#059669,#34D399)', name: 'LearnFast EdTech', meta: 'Active · ₹1.1L/mo · Since 2026', val: '₹2.2L', sub: 'lifetime value' },
  { init: 'BK', color: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', name: 'BlueKing Finance', meta: 'Prospect · In discussion', val: '₹15–25L', sub: 'estimated value' },
];

export const CASESTUDIES = [
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`, bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', name: 'Reliance Retail — Diwali OOH Blitz', meta: 'Pan India · 120 billboards · 30 days · 2024', result: '+34% footfall' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`, bg: 'linear-gradient(135deg,#1e3a5f,#2d6a9f)', name: 'TechCorp Brand Awareness · Bengaluru', meta: 'Bengaluru · 8 LED screens · 3 months · 2025', result: '2.4Cr impressions' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, bg: 'linear-gradient(135deg,#1a3a2a,#2d6a4a)', name: 'RealCo Township Launch · Delhi NCR', meta: 'Delhi NCR · 22 hoardings · 4 months · 2025', result: '900+ site visits' },
];

export const ANALYTICS_CLIENTS = [
  { init: 'RL', color: 'var(--gold)', name: 'Reliance Retail', campaigns: 3, revenue: '₹62L/mo', share: '52%' },
  { init: 'TC', color: 'var(--indigo)', name: 'TechCorp India', campaigns: 1, revenue: '₹5.5L/mo', share: '18%' },
  { init: 'RC', color: 'var(--teal)', name: 'RealCo Developers', campaigns: 1, revenue: '₹3.5L/mo', share: '12%' },
  { init: 'FM', color: '#D97706', name: 'FreshMart FMCG', campaigns: 2, revenue: '₹9.5L/mo', share: '18%' },
];

export const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const CHART_REVENUE = [8.2, 10.4, 11.8, 14.2, 16.5, 18.2];
export const CHART_BIDS = [3, 5, 6, 7, 8, 9];
export const CHART_WON = [1, 2, 2, 3, 3, 4];
