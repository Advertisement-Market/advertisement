/* Dummy data for the Find Agencies page — from templates/browse-agencies.html. */

export const TYPE_GRADIENT = {
  'Full-Service Ad Agency': 'ci-fullservice',
  'Media Planning Agency': 'ci-media',
  'Creative Studio': 'ci-creative',
  'PR & Communications Firm': 'ci-pr',
  'Production House': 'ci-production',
  'Digital Agency (with OOH)': 'ci-digital',
};
export const TYPE_BADGE_CLASS = {
  'Full-Service Ad Agency': 'tb-full',
  'Media Planning Agency': 'tb-media',
  'Creative Studio': 'tb-creative',
  'PR & Communications Firm': 'tb-pr',
  'Production House': 'tb-production',
  'Digital Agency (with OOH)': 'tb-digital',
};

export const AGENCY_TYPES = [
  { v: 'Full-Service Ad Agency', short: 'Full-Service' },
  { v: 'Media Planning Agency', short: 'Media Planning' },
  { v: 'Creative Studio', short: 'Creative Studio' },
  { v: 'PR & Communications Firm', short: 'PR & Comms' },
  { v: 'Production House', short: 'Production House' },
  { v: 'Digital Agency (with OOH)', short: 'Digital + OOH' },
];
export const CITIES = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad'];
export const COVERAGES = ['Pan India', 'Single City'];
export const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'exp_desc', label: 'Most Experienced' },
  { value: 'campaigns_desc', label: 'Most Campaigns' },
  { value: 'budget_asc', label: 'Budget: Low → High' },
];
export const SERVICE_PILLS = [
  { v: 'OOH Media Planning', l: 'OOH Planning' },
  { v: 'Creative Design', l: 'Creative Design' },
  { v: 'Media Buying', l: 'Media Buying' },
  { v: 'Campaign Strategy', l: 'Strategy' },
  { v: 'Production & Fabrication', l: 'Production' },
  { v: 'Campaign Analytics', l: 'Analytics' },
  { v: 'Digital + OOH Integration', l: 'Digital + OOH' },
  { v: 'Installation & Maintenance', l: 'Installation' },
];
export const INDUSTRY_PILLS = [
  { v: 'FMCG', l: 'FMCG' },
  { v: 'Real Estate', l: 'Real Estate' },
  { v: 'Education', l: 'Education' },
  { v: 'Healthcare', l: 'Healthcare' },
  { v: 'Automotive', l: 'Automotive' },
  { v: 'Technology', l: 'Technology' },
  { v: 'Banking', l: 'Banking' },
  { v: 'Retail & Fashion', l: 'Retail' },
];
export const EXPERIENCE = [
  { v: '1', l: '1+ years' },
  { v: '3', l: '3+ years' },
  { v: '5', l: '5+ years' },
  { v: '10', l: '10+ years' },
];
export const BUDGETS = [
  { v: '25000', l: 'Up to ₹25,000' },
  { v: '50000', l: 'Up to ₹50,000' },
  { v: '100000', l: 'Up to ₹1 Lakh' },
  { v: '500000', l: 'Up to ₹5 Lakh' },
];

export const AGENCIES = [
  { id: 1, name: 'Pixel & Print Communications', tagline: "India's most trusted OOH media planning agency", type: 'Full-Service Ad Agency', city: 'Mumbai', hq: 'Andheri East, Mumbai', yearEst: 2008, expYears: 16, services: ['OOH Media Planning', 'Creative Design', 'Campaign Strategy', 'Media Buying', 'Campaign Analytics'], industries: ['FMCG', 'Real Estate', 'Automotive', 'Banking'], campaigns: '200+', campaignsNum: 200, minBudget: '₹50,000', minBudgetNum: 50000, cities: 'Mumbai, Pune, Bengaluru, Delhi NCR', coverage: 'Pan India', clients: 'HUL, Tata Motors, HDFC Bank', portfolio: [{ title: 'FMCG Brand Launch — Mumbai 2024', meta: '₹45L budget · 60 billboards · 3 months · FMCG' }, { title: 'Real Estate City Launch', meta: '₹18L budget · 22 billboards · 2 months · Real Estate' }], pricing: 'Monthly Retainer', verified: true },
  { id: 2, name: 'MediaForce OOH', tagline: 'Precision outdoor media planning for ambitious brands', type: 'Media Planning Agency', city: 'Delhi NCR', hq: 'Connaught Place, New Delhi', yearEst: 2012, expYears: 12, services: ['OOH Media Planning', 'Media Buying', 'Audience Research', 'Campaign Analytics', 'Digital + OOH Integration'], industries: ['Technology', 'Banking', 'FMCG', 'Telecom'], campaigns: '150+', campaignsNum: 150, minBudget: '₹1 Lakh', minBudgetNum: 100000, cities: 'Delhi NCR, Mumbai, Hyderabad', coverage: 'Pan India', clients: 'Zomato, ICICI Bank, Airtel', portfolio: [{ title: 'Fintech App National Launch', meta: '₹1.2Cr budget · 180 boards · 2 months · Banking' }, { title: 'Tech Product Awareness Drive', meta: '₹65L budget · 90 boards · 3 months · Technology' }], pricing: 'Commission-Based', verified: true },
  { id: 3, name: 'CreativeOOH Studio', tagline: 'Where art meets the street — bold visual identities outdoors', type: 'Creative Studio', city: 'Bengaluru', hq: 'Koramangala, Bengaluru', yearEst: 2015, expYears: 9, services: ['Creative Design', 'Production & Fabrication', 'Installation & Maintenance', 'Digital + OOH Integration'], industries: ['Retail & Fashion', 'Education', 'Technology', 'Food & Beverage'], campaigns: '80+', campaignsNum: 80, minBudget: '₹25,000', minBudgetNum: 25000, cities: 'Bengaluru, Chennai, Hyderabad', coverage: 'Single City', clients: "Myntra, Byju's, Swiggy", portfolio: [{ title: 'Fashion Brand — Summer Campaign', meta: '₹22L budget · 35 boards · 1 month · Retail' }, { title: 'EdTech Launch — Bengaluru', meta: '₹8L budget · 18 boards · 2 months · Education' }], pricing: 'Fixed', verified: true },
  { id: 4, name: 'Brandscape Media', tagline: '360° campaign execution — from strategy to installation', type: 'Full-Service Ad Agency', city: 'Mumbai', hq: 'BKC, Mumbai', yearEst: 2005, expYears: 19, services: ['OOH Media Planning', 'Creative Design', 'Campaign Strategy', 'Media Buying', 'Production & Fabrication', 'Installation & Maintenance', 'PR & Communications'], industries: ['Automotive', 'FMCG', 'Banking', 'Hospitality', 'Real Estate'], campaigns: '350+', campaignsNum: 350, minBudget: '₹5 Lakh', minBudgetNum: 500000, cities: 'Pan India', coverage: 'Pan India', clients: 'Maruti Suzuki, ITC, Marriott', portfolio: [{ title: 'Auto Brand National OOH', meta: '₹4.5Cr budget · 400 boards · 4 months · Automotive' }, { title: 'Hotel Chain Awareness', meta: '₹80L budget · 65 boards · 6 months · Hospitality' }], pricing: 'Monthly Retainer', verified: true },
  { id: 5, name: 'OutdoorPR Nexus', tagline: 'PR meets OOH — integrated visibility for modern brands', type: 'PR & Communications Firm', city: 'Pune', hq: 'Kalyani Nagar, Pune', yearEst: 2017, expYears: 7, services: ['PR & Communications', 'Campaign Strategy', 'OOH Media Planning', 'Audience Research'], industries: ['Education', 'Healthcare', 'Real Estate', 'Food & Beverage'], campaigns: '35+', campaignsNum: 35, minBudget: '₹25,000', minBudgetNum: 25000, cities: 'Pune, Mumbai, Nashik', coverage: 'Single City', clients: 'Symbiosis, Manipal Hospitals, Godrej', portfolio: [{ title: 'Healthcare Awareness Campaign', meta: '₹12L budget · 20 boards · 3 months · Healthcare' }, { title: 'Education Institute Admissions', meta: '₹5L budget · 14 boards · 2 months · Education' }], pricing: 'Flexible', verified: true },
  { id: 6, name: 'DigitalOOH Labs', tagline: 'DOOH-first agency — where programmatic meets out-of-home', type: 'Digital Agency (with OOH)', city: 'Hyderabad', hq: 'Hitech City, Hyderabad', yearEst: 2019, expYears: 5, services: ['Digital + OOH Integration', 'Campaign Analytics', 'OOH Media Planning', 'Campaign Strategy', 'Audience Research'], industries: ['Technology', 'Banking', 'Telecom', 'Food & Beverage'], campaigns: '45+', campaignsNum: 45, minBudget: '₹50,000', minBudgetNum: 50000, cities: 'Hyderabad, Bengaluru, Chennai', coverage: 'Single City', clients: 'PhonePe, Google India, Dunzo', portfolio: [{ title: 'Fintech DOOH Launch', meta: '₹30L budget · 40 LED boards · 1 month · Banking' }, { title: 'Super App Launch Campaign', meta: '₹55L budget · 80 boards · 6 weeks · Technology' }], pricing: 'Fixed', verified: true },
  { id: 7, name: 'OOHprint Productions', tagline: 'End-to-end production — we make OOH campaigns come alive', type: 'Production House', city: 'Ahmedabad', hq: 'CG Road, Ahmedabad', yearEst: 2010, expYears: 14, services: ['Production & Fabrication', 'Installation & Maintenance', 'Creative Design'], industries: ['FMCG', 'Real Estate', 'Retail & Fashion', 'Automotive'], campaigns: '120+', campaignsNum: 120, minBudget: '₹25,000', minBudgetNum: 25000, cities: 'Ahmedabad, Surat, Vadodara', coverage: 'Single City', clients: 'Amul, Adani Realty, Big Bazaar', portfolio: [{ title: 'FMCG Festive Season Campaign', meta: '₹28L budget · 50 boards · 1 month · FMCG' }, { title: 'Retail Chain Pan-Gujarat Rollout', meta: '₹42L budget · 90 boards · 2 months · Retail' }], pricing: 'Fixed', verified: true },
  { id: 8, name: 'ChennaiMediaWorks', tagline: "South India's OOH specialists — regional reach, national quality", type: 'Media Planning Agency', city: 'Chennai', hq: 'Anna Salai, Chennai', yearEst: 2011, expYears: 13, services: ['OOH Media Planning', 'Media Buying', 'Creative Design', 'Campaign Analytics', 'Production & Fabrication'], industries: ['Education', 'Healthcare', 'FMCG', 'Retail & Fashion', 'Automotive'], campaigns: '95+', campaignsNum: 95, minBudget: '₹50,000', minBudgetNum: 50000, cities: 'Chennai, Coimbatore, Madurai, Trichy', coverage: 'Single City', clients: 'SRM University, Apollo Hospitals, TVS', portfolio: [{ title: 'University Admissions Drive', meta: '₹15L budget · 28 boards · 2 months · Education' }, { title: 'Auto Showroom Launch — Tamil Nadu', meta: '₹35L budget · 55 boards · 1 month · Automotive' }], pricing: 'Commission-Based', verified: true },
];
