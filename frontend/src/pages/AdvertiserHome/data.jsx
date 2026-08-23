/* eslint-disable react-refresh/only-export-components */
/* Data + inline icons for the advertiser home page (from templates/advertiser-home.html). */

const OptIcon = ({ children }) => (
  <svg
    className="opt-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
const Bars = (
  <OptIcon>
    <rect x="3" y="9" width="5" height="12" />
    <rect x="9" y="5" width="6" height="16" />
    <rect x="17" y="11" width="4" height="10" />
  </OptIcon>
);
const Users = (
  <OptIcon>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </OptIcon>
);
const Grid = (
  <OptIcon>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </OptIcon>
);
const Globe = (
  <OptIcon>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
  </OptIcon>
);
const Pin = (
  <OptIcon>
    <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </OptIcon>
);
const Briefcase = (
  <OptIcon>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </OptIcon>
);
const TrendDown = (
  <OptIcon>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </OptIcon>
);
const BarsLow = (
  <OptIcon>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </OptIcon>
);
const BarsHigh = (
  <OptIcon>
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <line x1="6" y1="20" x2="6" y2="12" />
  </OptIcon>
);
const TrendUp = (
  <OptIcon>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </OptIcon>
);
const Star = (
  <OptIcon>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </OptIcon>
);

export const HERO_TYPE_OPTIONS = [
  { value: 'billboards', label: 'Billboard Spaces', icon: Bars },
  { value: 'agencies', label: 'Ad Agencies', icon: Users },
  { value: 'both', label: 'Both', icon: Grid },
];
export const HERO_CITY_OPTIONS = [
  { value: '', label: 'Any City', icon: Globe },
  ...[
    'Mumbai',
    'Delhi NCR',
    'Bengaluru',
    'Pune',
    'Hyderabad',
    'Chennai',
    'Ahmedabad',
    'Kolkata',
  ].map((c) => ({ value: c, label: c, icon: Pin })),
];
export const HERO_BUDGET_OPTIONS = [
  { value: '', label: 'Any Budget', icon: Briefcase },
  { value: 'Under ₹50K', label: 'Under ₹50K', icon: TrendDown },
  { value: '₹50K – ₹2L', label: '₹50K – ₹2L', icon: BarsLow },
  { value: '₹2L – ₹10L', label: '₹2L – ₹10L', icon: BarsHigh },
  { value: '₹10L – ₹50L', label: '₹10L – ₹50L', icon: TrendUp },
  { value: '₹1Cr+', label: '₹1Cr+', icon: Star },
];

export const HERO_STATS = [
  { target: 12000, label: 'Billboard listings' },
  { target: 400, label: 'Verified agencies' },
  { target: 180, label: 'Cities covered' },
];

const FeedBar = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--indigo)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="9" width="5" height="12" />
    <rect x="9" y="5" width="6" height="16" />
    <rect x="17" y="11" width="4" height="10" />
  </svg>
);
const FeedUsers = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--gold-dark)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
const FeedDoc = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--teal-dark)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export const FEED_ITEMS = [
  {
    icon: 'bb',
    node: FeedBar,
    text: (
      <>
        <strong>New listing:</strong> BKC LED Screen, Mumbai
      </>
    ),
    time: '2 min ago',
    badge: 'New',
    badgeCls: 'fb-new',
  },
  {
    icon: 'ag',
    node: FeedUsers,
    text: (
      <>
        <strong>Brandworks Mumbai</strong> is accepting new briefs
      </>
    ),
    time: '5 min ago',
    badge: 'Agency',
    badgeCls: 'fb-agency',
  },
  {
    icon: 'td',
    node: FeedDoc,
    text: (
      <>
        FMCG campaign received <strong>11 bids</strong> in 36 hrs
      </>
    ),
    time: '18 min ago',
    badge: 'Campaign',
    badgeCls: 'fb-tender',
  },
  {
    icon: 'bb',
    node: FeedBar,
    text: (
      <>
        <strong>New listing:</strong> Connaught Place Gantry, Delhi
      </>
    ),
    time: '24 min ago',
    badge: 'New',
    badgeCls: 'fb-new',
  },
  {
    icon: 'ag',
    node: FeedUsers,
    text: (
      <>
        <strong>OOHive Delhi</strong> joined — 210 campaigns completed
      </>
    ),
    time: '31 min ago',
    badge: 'Agency',
    badgeCls: 'fb-agency',
  },
  {
    icon: 'td',
    node: FeedDoc,
    text: <>EdTech campaign posted · Pune · ₹2–5L budget</>,
    time: '47 min ago',
    badge: 'Campaign',
    badgeCls: 'fb-tender',
  },
  {
    icon: 'bb',
    node: FeedBar,
    text: (
      <>
        <strong>MG Road LED</strong> marked available, Bengaluru
      </>
    ),
    time: '1 hr ago',
    badge: 'New',
    badgeCls: 'fb-new',
  },
  {
    icon: 'ag',
    node: FeedUsers,
    text: (
      <>
        <strong>Signify Creative</strong> · New case study added
      </>
    ),
    time: '1 hr ago',
    badge: 'Agency',
    badgeCls: 'fb-agency',
  },
];

export const TICKER_ITEMS = [
  <>
    <strong>New:</strong> BKC LED Screen — ₹5.8L/mo · Available now
  </>,
  <>
    <strong>Agency:</strong> <span className="ticker-agency">Brandworks Mumbai</span> · OOH
    Specialist · 4.9★ · Taking briefs
  </>,
  <>
    <strong>New:</strong> Connaught Place Gantry · Delhi · ₹4.2L/mo
  </>,
  <>
    <strong>Agency:</strong> <span className="ticker-agency">OOHive Delhi</span> · Media Planning +
    Production · 4.8★
  </>,
  <>
    <strong>New:</strong> MG Road LED · Bengaluru · ₹2.8L/mo · Available
  </>,
  <>
    <strong>Agency:</strong> <span className="ticker-agency">Signify Creative</span> · Bengaluru ·
    Full-service OOH · 4.7★
  </>,
  <>
    <strong>New:</strong> Sarkhej Highway · Ahmedabad · ₹75K/mo
  </>,
  <>
    <strong>Agency:</strong> <span className="ticker-agency">Pune OOH Co.</span> · Creative + Buying
    · 4.9★
  </>,
];

export const TRUST_LOGOS = [
  'Swiggy',
  'Godrej',
  'Marico',
  'PolicyBazaar',
  'Tata Cliq',
  "Byju's",
  'Lenskart',
];

export const FEATURED = [
  {
    bg: 'city',
    badges: [
      ['Premium', 'f-badge-premium'],
      ['High Traffic', 'f-badge-traffic'],
    ],
    loc: 'Mumbai · BKC',
    title: 'Bandra-Kurla Complex LED',
    specs: ['40 × 25 ft', 'LED Digital', '1,20,000/day'],
    price: '₹5.8L',
  },
  {
    bg: 'led',
    badges: [
      ['Digital', 'f-badge-digital'],
      ['High Traffic', 'f-badge-traffic'],
    ],
    loc: 'Bengaluru · MG Road',
    title: 'MG Road LED Screen',
    specs: ['30 × 15 ft', 'LED Digital', '1,10,000/day'],
    price: '₹2.8L',
  },
  {
    bg: 'highway',
    badges: [['Highway', 'f-badge-traffic']],
    loc: 'Pune · Wakad',
    title: 'NH-48 Highway Unipole',
    specs: ['50 × 25 ft', 'Unipole', '65,000/day'],
    price: '₹1.4L',
  },
];

export const CITY_LIST = [
  ['Mumbai', 'Maharashtra', '3,840'],
  ['Delhi NCR', 'Delhi · Haryana · UP', '3,120'],
  ['Bengaluru', 'Karnataka', '2,240'],
  ['Pune', 'Maharashtra', '1,180'],
  ['Hyderabad', 'Telangana', '980'],
  ['Chennai', 'Tamil Nadu', '820'],
  ['Ahmedabad', 'Gujarat', '560'],
  ['Kolkata', 'West Bengal', '480'],
];
export const CITY_DATA = {
  Mumbai: {
    listings: '3,840',
    agencies: '18',
    cpm: '₹14',
    formats: [
      ['LED Screen', 58],
      ['Unipole', 24],
      ['Gantry', 12],
      ['Other', 6],
    ],
  },
  'Delhi NCR': {
    listings: '3,120',
    agencies: '15',
    cpm: '₹16',
    formats: [
      ['Unipole', 45],
      ['Gantry', 32],
      ['LED Screen', 16],
      ['Other', 7],
    ],
  },
  Bengaluru: {
    listings: '2,240',
    agencies: '12',
    cpm: '₹15',
    formats: [
      ['LED Screen', 40],
      ['Mall Facade', 28],
      ['Transit', 20],
      ['Other', 12],
    ],
  },
  Pune: {
    listings: '1,180',
    agencies: '8',
    cpm: '₹18',
    formats: [
      ['Unipole', 38],
      ['Bus Shelter', 30],
      ['LED Screen', 22],
      ['Other', 10],
    ],
  },
  Hyderabad: {
    listings: '980',
    agencies: '7',
    cpm: '₹17',
    formats: [
      ['Gantry', 42],
      ['LED Screen', 28],
      ['Unipole', 18],
      ['Other', 12],
    ],
  },
  Chennai: {
    listings: '820',
    agencies: '6',
    cpm: '₹19',
    formats: [
      ['Unipole', 36],
      ['Transit', 32],
      ['LED Screen', 22],
      ['Other', 10],
    ],
  },
  Ahmedabad: {
    listings: '560',
    agencies: '5',
    cpm: '₹22',
    formats: [
      ['Hoarding', 48],
      ['Unipole', 26],
      ['LED Screen', 18],
      ['Other', 8],
    ],
  },
  Kolkata: {
    listings: '480',
    agencies: '4',
    cpm: '₹21',
    formats: [
      ['Hoarding', 44],
      ['Transit', 30],
      ['Bus Shelter', 16],
      ['Other', 10],
    ],
  },
};

export const STEPS = [
  [
    'STEP 01',
    'Search or post a campaign',
    'Browse 12,000+ billboard spaces by city, format, and budget — or post your campaign brief anonymously and let verified owners and agencies pitch to you.',
  ],
  [
    'STEP 02',
    'Build your shortlist',
    'Save billboards and agencies side by side. The Campaign Planner shows combined reach, total cost, and estimated impressions across your entire shortlist.',
  ],
  [
    'STEP 03',
    'Compare bids & quotes',
    'Receive packaged proposals. Compare on a single screen. Your identity stays private until you decide to engage with any owner or agency.',
  ],
  [
    'STEP 04',
    'Book, track & measure',
    'Confirm through the platform. Your dashboard tracks go-live dates, displays proof-of-posting photos, and logs all campaign activity in real time.',
  ],
];

export const COMPARE_METRICS = [
  'CPM (Cost/1,000 views)',
  'Creative lifespan',
  'Ad blindness',
  'Brand recall uplift',
  'Audience targeting',
  'Best for',
];
export const COMPARE_TABS = [
  ['ooh', 'vs Google Display'],
  ['meta', 'vs Meta / Instagram'],
  ['print', 'vs Print'],
  ['tv', 'vs TV'],
];
export const COMPARE_DATA = {
  ooh: {
    header: 'Google Display',
    rows: [
      ['₹40–80', '₹8–18', 'Best'],
      ['1–7 days', '30–90 days', 'Best'],
      ['High — 47% skip rate', 'Very low — physical', ''],
      ['4–6% unaided', '17% unaided', 'Best'],
      ['Demo + interest + retargeting', 'Location + context', 'Best', 'other'],
      ['Performance, retargeting', 'Brand awareness, launches', ''],
    ],
  },
  meta: {
    header: 'Meta / Instagram',
    rows: [
      ['₹35–70', '₹8–18', 'Best'],
      ['0–3 days', '30–90 days', 'Best'],
      ['High — feeds scroll past', 'Very low — physical', ''],
      ['3–5% unaided', '17% unaided', 'Best'],
      ['Demo + behaviour + interests', 'Location + context', 'Best', 'other'],
      ['Direct response, awareness', 'Brand dominance, launches', ''],
    ],
  },
  print: {
    header: 'Print / Newspaper',
    rows: [
      ['₹120–400', '₹8–18', 'Best'],
      ['1 day only', '30–90 days', 'Best'],
      ['Low, but declining readership', 'Very low, mass reach', ''],
      ['8–12% unaided', '17% unaided', 'Best'],
      ['Demographic by publication', 'Location-based, format', ''],
      ['National brand news', 'Hyperlocal, sustained presence', 'Best'],
    ],
  },
  tv: {
    header: 'Television (GEC/News)',
    rows: [
      ['₹200–800', '₹8–18', 'Best'],
      ['Per spot (30 sec)', '30–90 days', 'Best'],
      ['High zapping / ad skipping', 'Cannot skip — always visible', ''],
      ['10–14% unaided', '17% unaided', 'Best'],
      ['Broad mass demographic', 'Precise geography', 'Best', 'other'],
      ['Mass reach, national brands', 'City-level dominance, launches', ''],
    ],
  },
};

export const INSPIRATION = [
  {
    industry: 'fmcg',
    header: 'ins-h1',
    tag: 'FMCG · Mumbai',
    init: 'SW',
    campaign: 'Summer launch campaign — 6 LED screens across BKC, Andheri & Bandra',
    meta: [
      ['₹12L/mo', 'Monthly spend'],
      ['3 months', 'Duration'],
      ['6.2 Cr', 'Impressions'],
      ['₹11 CPM', 'Effective rate'],
    ],
    result: '22% lower CPM than agency-negotiated rates',
  },
  {
    industry: 'realestate',
    header: 'ins-h2',
    tag: 'Real Estate · Delhi NCR',
    init: 'GD',
    campaign: 'Township launch — 12 premium hoardings on NH-48 & Dwarka Expressway',
    meta: [
      ['₹8L/mo', 'Monthly spend'],
      ['6 months', 'Duration'],
      ['4.8 Cr', 'Impressions'],
      ['₹13 CPM', 'Effective rate'],
    ],
    result: 'Site visits up 34% vs prior launch period',
  },
  {
    industry: 'tech',
    header: 'ins-h3',
    tag: 'EdTech · Pune + Bengaluru',
    init: 'BY',
    campaign: 'Admission season — 18 placements near colleges & coaching hubs',
    meta: [
      ['₹3.5L/mo', 'Monthly spend'],
      ['2 months', 'Duration'],
      ['2.1 Cr', 'Impressions'],
      ['₹16 CPM', 'Effective rate'],
    ],
    result: '41% of app installs attributed to OOH in that period',
  },
  {
    industry: 'finance',
    header: 'ins-h4',
    tag: 'Finance · Pan India',
    init: 'PB',
    campaign: 'Brand awareness push — 34 LED screens across 8 metros + 6 Tier 2 cities',
    meta: [
      ['₹28L/mo', 'Monthly spend'],
      ['4 months', 'Duration'],
      ['18 Cr', 'Impressions'],
      ['₹12 CPM', 'Effective rate'],
    ],
    result: 'Unaided brand recall up 19% in target markets',
  },
  {
    industry: 'retail',
    header: 'ins-h5',
    tag: 'Retail · Hyderabad',
    init: 'LK',
    campaign: 'Store launch — 8 placements within 2km of flagship location',
    meta: [
      ['₹2.2L/mo', 'Monthly spend'],
      ['3 months', 'Duration'],
      ['1.4 Cr', 'Impressions'],
      ['₹15 CPM', 'Effective rate'],
    ],
    result: 'Footfall 28% above projection in launch week',
  },
  {
    industry: 'fmcg',
    header: 'ins-h6',
    tag: 'FMCG · Pan India',
    init: 'MC',
    campaign: 'Annual brand refresh — 62 placements across 14 cities via 1 agency brief',
    meta: [
      ['₹45L/mo', 'Monthly spend'],
      ['12 months', 'Duration'],
      ['34 Cr', 'Impressions'],
      ['₹10 CPM', 'Effective rate'],
    ],
    result: 'Managed via single agency brief — zero direct negotiation',
  },
];
export const INS_FILTERS = [
  ['all', 'All Industries'],
  ['fmcg', 'FMCG'],
  ['tech', 'Tech / EdTech'],
  ['realestate', 'Real Estate'],
  ['retail', 'Retail'],
  ['finance', 'Finance'],
];

export const SPOTLIGHT = [
  {
    init: 'BW',
    grad: 'linear-gradient(135deg,#D97706,#F59E0B)',
    name: 'Brandworks Mumbai',
    city: 'Mumbai · Maharashtra',
    tags: ['OOH Strategy', 'Creative', 'Buying', 'LED Specialist'],
    rating: '4.9',
    count: '(38)',
    campaigns: '124 campaigns',
  },
  {
    init: 'OH',
    grad: 'linear-gradient(135deg,#4F46E5,#818CF8)',
    name: 'OOHive Delhi',
    city: 'Delhi NCR · Pan India',
    tags: ['Media Planning', 'Pan India', 'Tier 1 & 2'],
    rating: '4.8',
    count: '(51)',
    campaigns: '210 campaigns',
  },
  {
    init: 'SC',
    grad: 'linear-gradient(135deg,#059669,#34D399)',
    name: 'Signify Creative',
    city: 'Bengaluru · South India',
    tags: ['Full-service', 'South India', 'Transit Ads'],
    rating: '4.7',
    count: '(29)',
    campaigns: '87 campaigns',
  },
];

export const WHY = [
  [
    'wi-indigo',
    'lock',
    'Your identity is protected',
    'Budget and company name stay hidden until you decide to engage. No cold calls, no spam from aggressive agencies or owners.',
  ],
  [
    'wi-teal',
    'shield',
    'Everything is verified',
    'Every billboard has a location pin, ownership proof, and government approval status. Every agency is GST and PAN verified before going live.',
  ],
  [
    'wi-gold',
    'trend',
    'Real audience data',
    'Daily traffic counts, audience type, and peak hours — verified against NHAI and municipal records. Not just a pin on a map.',
  ],
  [
    'wi-indigo',
    'grid',
    'Spaces or agencies — or both',
    'Book billboard inventory directly, or brief a specialist agency. The only platform giving advertisers both options in one place.',
  ],
  [
    'wi-green',
    'rupee',
    'Free to browse & compare',
    'Search, shortlist, build media plans, and get ROI estimates for free. Pay nothing until you’re ready to engage.',
  ],
  [
    'wi-gold',
    'star',
    'Peer-verified ratings',
    'Post-campaign advertiser reviews on every owner and agency profile. Ratings verified by The AdBasket — so you always book with confidence.',
  ],
];

export const TESTIMONIALS = [
  {
    tagStyle: { background: 'var(--indigo-light)', color: 'var(--indigo)' },
    tag: 'FMCG · Marketing Head',
    text: 'We posted a campaign for our Bengaluru launch and had 11 proposals in 36 hours — from billboard owners and two agencies. Booked at rates 22% below what agencies quoted us before.',
    avatar: 'NP',
    grad: 'linear-gradient(135deg,var(--indigo),var(--periwinkle))',
    name: 'Nisha Pillai',
    company: 'Marketing Head · Swiggy',
  },
  {
    tagStyle: { background: 'var(--teal-light)', color: 'var(--teal-dark)' },
    tag: 'Real Estate · CMO',
    text: 'The ROI calculator alone changed how our team justifies outdoor spends. We now compare OOH and digital on the same screen before every campaign decision.',
    avatar: 'AR',
    grad: 'linear-gradient(135deg,var(--teal),#22D3EE)',
    name: 'Arjun Rao',
    company: 'CMO · Godrej Properties',
  },
  {
    tagStyle: { background: 'var(--gold-light)', color: 'var(--gold-dark)' },
    tag: 'FMCG · Brand Manager',
    text: 'Finally — a platform where I can brief one agency or a dozen owners with the same brief. Anonymous until I accept. No spam. No cold calls. Revolutionary for Indian OOH.',
    avatar: 'SK',
    grad: 'linear-gradient(135deg,var(--gold),#FBBF24)',
    name: 'Sunita Kapoor',
    company: 'Brand Manager · Marico',
  },
];

export const FAQ = [
  [
    'What if the bids I receive are overpriced or irrelevant?',
    "You're never obligated to accept any bid. Bids are shown to you in a comparison view — you compare them side by side and only engage with the ones that fit. If all bids miss the mark, you can edit and repost your campaign at no cost.",
  ],
  [
    'How do I know the owner won’t ghost me after I engage?',
    'Every owner on the platform has a verified profile with GST number, ownership proof, and government permit status. They also have advertiser reviews from prior campaigns. If an owner fails to honour a confirmed booking, their account is suspended and you receive a full credit — no paperwork required.',
  ],
  [
    'Can I remain completely anonymous the entire time?',
    'Yes — completely. When you post a campaign, owners and agencies see only your industry category and budget range. Your company name, email, and contact details are revealed only when you explicitly choose to accept and connect with a specific bidder. You control the reveal, always.',
  ],
  [
    'How accurate is the footfall and traffic data?',
    "Every listing's footfall data is cross-referenced against NHAI traffic counts, municipal records, and satellite imagery. We also run periodic spot-checks. Numbers are displayed with a confidence interval — so you always know how fresh the data is. Listings with unverified data are clearly flagged.",
  ],
  [
    'What does “free to browse” actually mean — where’s the catch?',
    "There's no catch. Browsing, comparing, building media plans, running ROI estimates, and posting campaigns are all free. The AdBasket earns a small success fee from billboard owners and agencies only when a deal is confirmed through the platform — not from advertisers. You pay nothing until a campaign is live.",
  ],
  [
    'Can I use The AdBasket for a Pan India campaign with one brief?',
    'Yes. When you post a campaign marked "Pan India," it goes to verified owners across all 180 cities and agencies with national coverage. You can also select "Agencies Only" for your scope — a single OOH agency will manage the entire multi-city campaign end-to-end, so you have one point of contact for everything.',
  ],
];
