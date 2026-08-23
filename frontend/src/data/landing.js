import { ROUTES } from '@/lib/routes';

/** Hero stat counters (animate to target, formatted with a "+" suffix). */
export const HERO_STATS = [
  { target: 12000, label: 'Verified listings' },
  { target: 180, label: 'Cities across India' },
  { target: 3400, label: 'Verified owners' },
  { target: 840, label: 'Registered agencies' },
];

/** Platform stats band. */
export const STATS_BAND = [
  { target: 12000, label: 'Billboard listings' },
  { target: 180, label: 'Cities across India' },
  { target: 840, label: 'Verified agencies' },
  { target: 5000, label: 'Active campaigns per month' },
];

/** Live ticker items (duplicated in the UI for a seamless marquee). */
export const TICKER_ITEMS = [
  {
    tag: 'new',
    tagLabel: 'New',
    title: 'BKC LED Screen',
    city: 'Mumbai',
    note: '₹5.8L/mo · Available',
  },
  {
    tag: 'tender',
    tagLabel: 'Campaign',
    title: 'FMCG brand',
    city: 'Mumbai',
    note: '₹8–12L budget · Bids open',
  },
  {
    tag: 'booked',
    tagLabel: 'Booked',
    title: 'MG Road LED',
    city: 'Bengaluru',
    note: '6-month campaign confirmed',
  },
  { tag: 'new', tagLabel: 'New', title: 'Connaught Place Gantry', city: 'Delhi', note: '₹4.2L/mo' },
  {
    tag: 'tender',
    tagLabel: 'Campaign',
    title: 'Automotive brand',
    city: 'Hyderabad',
    note: '₹15–25L · Agency bids welcome',
  },
  {
    tag: 'new',
    tagLabel: 'New',
    title: 'Sarkhej Highway Unipole',
    city: 'Ahmedabad',
    note: '₹75K/mo',
  },
  {
    tag: 'booked',
    tagLabel: 'Booked',
    title: 'Anna Nagar Bus Shelter',
    city: 'Chennai',
    note: '3-month deal signed',
  },
  {
    tag: 'tender',
    tagLabel: 'Campaign',
    title: 'EdTech brand',
    city: 'Pune',
    note: '₹2–5L · Near colleges',
  },
];

/** Three role portals. `icon` maps to an inline SVG in the Portals section. */
export const PORTALS = [
  {
    role: 'adv',
    icon: 'home',
    roleLabel: 'Business / Brand',
    title: 'I want to place ads',
    desc: 'Search 12,000+ verified billboards, build a media plan, compare ROI, and book — or post a budget and let owners bid.',
    list: [
      'Browse and filter 12,000+ listings',
      'ROI calculator with Indian market data',
      'Post anonymous campaigns',
      'Compare up to 3 billboards side by side',
    ],
    ctaLabel: 'Get started free',
    ctaTo: ROUTES.advertisers,
    secondaryLabel: 'Browse billboards first →',
    secondaryTo: ROUTES.browse,
  },
  {
    role: 'own',
    icon: 'billboard',
    roleLabel: 'Billboard Owner',
    title: 'I own billboards',
    desc: 'List your inventory, receive inbound quote requests, bid on anonymous business campaigns, and track performance analytics.',
    list: [
      'List unlimited billboards with photos',
      'Inbound quote requests to your dashboard',
      'Bid on live business campaigns',
      'Availability calendar and booking tools',
    ],
    ctaLabel: 'List your billboard',
    ctaTo: ROUTES.ownerRegister,
    secondaryLabel: 'Learn how it works →',
    secondaryTo: ROUTES.owners,
  },
  {
    role: 'age',
    icon: 'users',
    roleLabel: 'Ad Agency / Service Provider',
    title: 'We run campaigns',
    desc: 'Build a verified agency profile, bid on brand campaigns worth ₹50K to ₹10Cr+, showcase case studies, and receive direct briefs.',
    list: [
      'Public verified agency profile',
      'Bid on 5,000+ campaigns per month',
      'Receive direct inquiries from brands',
      'GST and PAN verified badge in 2–3 days',
    ],
    ctaLabel: 'Register your agency',
    ctaTo: ROUTES.agencyRegister,
    secondaryLabel: 'Browse agency profiles →',
    secondaryTo: ROUTES.browseAgencies,
  },
];

/** Featured billboards. `bg` maps to a background class + inline SVG. */
export const FEATURED_LISTINGS = [
  {
    bg: 'city',
    badges: [
      { label: 'Premium', cls: 'lb-premium' },
      { label: 'High Traffic', cls: 'lb-traffic' },
    ],
    status: 'Available',
    city: 'Mumbai · BKC',
    name: 'Bandra-Kurla Complex LED',
    specs: '40 × 25 ft · LED Digital · 1,20,000/day',
    price: '₹5.8L',
    priceSub: 'per month',
  },
  {
    bg: 'led',
    badges: [
      { label: 'Digital', cls: 'lb-digital' },
      { label: 'High Traffic', cls: 'lb-traffic' },
    ],
    status: 'Available',
    city: 'Bengaluru · MG Road',
    name: 'MG Road LED Screen',
    specs: '30 × 15 ft · LED Digital · 1,10,000/day',
    price: '₹2.8L',
    priceSub: 'per month',
  },
  {
    bg: 'highway',
    badges: [{ label: 'Highway', cls: 'lb-highway' }],
    status: 'Available',
    city: 'Pune · Wakad',
    name: 'NH-48 Highway Unipole',
    specs: '50 × 25 ft · Unipole · 65,000/day',
    price: '₹1.4L',
    priceSub: 'per month',
  },
  {
    bg: 'metro',
    badges: [{ label: 'Premium', cls: 'lb-premium' }],
    status: 'Available',
    city: 'Delhi NCR · Gurugram',
    name: 'Golf Course Road Gantry',
    specs: '60 × 20 ft · Gantry · 95,000/day',
    price: '₹3.6L',
    priceSub: 'per month',
  },
];

/** Live campaigns (tenders). `dot` maps to a coloured status dot class. */
export const TENDERS = [
  {
    dot: 't-fmcg',
    sector: 'FMCG / Consumer Goods',
    isNew: true,
    desc: 'Summer launch campaign — Multiple formats welcome',
    meta: ['Mumbai', '3 months', 'Static or LED'],
    budget: '₹8–12L',
    budgetSub: 'per month',
  },
  {
    dot: 't-realty',
    sector: 'Real Estate',
    isNew: false,
    desc: 'New township launch — Premium locations preferred',
    meta: ['Delhi NCR', '6 months', 'Hoardings'],
    budget: '₹3–5L',
    budgetSub: 'per month',
  },
  {
    dot: 't-auto',
    sector: 'Automotive',
    isNew: false,
    desc: 'New model launch — High-traffic highways preferred',
    meta: ['Hyderabad', '3 months', 'Gantry / Unipole'],
    budget: '₹15–25L',
    budgetSub: 'per month',
  },
  {
    dot: 't-fin',
    sector: 'Banking / Finance',
    isNew: false,
    desc: 'Pan India awareness — Metros and Tier 2 cities',
    meta: ['Pan India', '12 months', 'LED preferred'],
    budget: '₹50L–1Cr',
    budgetSub: 'per month',
  },
];

/** Top agencies. `avatar` maps to an avatar colour class. */
export const AGENCIES = [
  {
    avatar: 'av-indigo',
    initials: 'PP',
    name: 'Pixel & Print Co.',
    type: 'Full-Service Ad Agency · Mumbai',
    tags: ['OOH Planning', 'Creative', 'FMCG'],
    rating: '4.9',
    reviews: '14 reviews',
  },
  {
    avatar: 'av-teal',
    initials: 'ME',
    name: 'MediaEdge India',
    type: 'Media Planning Agency · Delhi NCR',
    tags: ['Media Planning', 'Real Estate', 'Auto'],
    rating: '4.7',
    reviews: '21 reviews',
  },
  {
    avatar: 'av-gold',
    initials: 'SC',
    name: 'SignCraft Solutions',
    type: 'Production House · Bengaluru',
    tags: ['Production', 'Printing', 'South India'],
    rating: '4.8',
    reviews: '38 reviews',
  },
  {
    avatar: 'av-indigo',
    initials: 'BM',
    name: 'BrandMile Communications',
    type: 'PR & Media Agency · Pune',
    tags: ['PR', 'Integrated', 'Healthcare'],
    rating: '4.6',
    reviews: '9 reviews',
  },
];

/** "How it works" steps. `icon` maps to an inline SVG by index. */
export const HOW_STEPS = [
  {
    num: '01',
    title: 'Search and Filter',
    desc: 'Enter your city, format, and budget. Browse 12,000+ verified listings with real footfall data and availability calendars.',
  },
  {
    num: '02',
    title: 'Compare and Shortlist',
    desc: 'Compare billboards side by side, save favourites, and build a media plan with combined cost and reach estimates.',
  },
  {
    num: '03',
    title: 'Request or Post Campaign',
    desc: 'Request a quote directly, or post a campaign brief anonymously so verified owners and agencies bid for your campaign.',
  },
  {
    num: '04',
    title: 'Book and Go Live',
    desc: 'Accept the best proposal, confirm dates, and your campaign goes live — fully tracked on your AdBasket dashboard.',
  },
];
