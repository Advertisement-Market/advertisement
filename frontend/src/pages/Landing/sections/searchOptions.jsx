/* Dropdown option definitions for the hero search (billboards + agencies).
   Icons are inline SVGs copied verbatim from index.html's `.opt-icon` markup.
   This module exports data (with embedded JSX icons), not components. */
/* eslint-disable react-refresh/only-export-components */

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

const GridIcon = (
  <OptIcon>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </OptIcon>
);

const BriefcaseIcon = (
  <OptIcon>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </OptIcon>
);

const BriefcaseRupeeIcon = (
  <OptIcon>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </OptIcon>
);

const TrendDownIcon = (
  <OptIcon>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </OptIcon>
);

const TrendUpIcon = (
  <OptIcon>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </OptIcon>
);

const BarsLowIcon = (
  <OptIcon>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </OptIcon>
);

const BarsHighIcon = (
  <OptIcon>
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <line x1="6" y1="20" x2="6" y2="12" />
  </OptIcon>
);

const StarIcon = (
  <OptIcon>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </OptIcon>
);

const PinIcon = (
  <OptIcon>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </OptIcon>
);

export const BILLBOARD_TYPE_OPTIONS = [
  { value: '', label: 'All formats', icon: GridIcon },
  {
    value: 'Static Hoarding',
    label: 'Static Hoarding',
    icon: (
      <OptIcon>
        <rect x="2" y="3" width="20" height="13" rx="2" />
        <path d="M12 16v5M8 21h8" />
      </OptIcon>
    ),
  },
  {
    value: 'LED Digital',
    label: 'LED Digital',
    icon: (
      <OptIcon>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </OptIcon>
    ),
  },
  {
    value: 'Unipole',
    label: 'Unipole',
    icon: (
      <OptIcon>
        <path d="M4 4h13v9H4z" />
        <line x1="10" y1="13" x2="10" y2="21" />
        <line x1="7" y1="21" x2="13" y2="21" />
      </OptIcon>
    ),
  },
  {
    value: 'Gantry',
    label: 'Gantry',
    icon: (
      <OptIcon>
        <path d="M3 9h18M3 9v10M21 9v10M3 9l3-5h12l3 5" />
        <line x1="9" y1="9" x2="9" y2="19" />
        <line x1="15" y1="9" x2="15" y2="19" />
      </OptIcon>
    ),
  },
  {
    value: 'Bus Shelter',
    label: 'Bus Shelter',
    icon: (
      <OptIcon>
        <rect x="1" y="7" width="22" height="12" rx="2" />
        <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        <circle cx="7" cy="22" r="1" />
        <circle cx="17" cy="22" r="1" />
      </OptIcon>
    ),
  },
  {
    value: 'Building Wrap',
    label: 'Building Wrap',
    icon: (
      <OptIcon>
        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </OptIcon>
    ),
  },
];

export const BILLBOARD_BUDGET_OPTIONS = [
  { value: '', label: 'Any budget', icon: BriefcaseRupeeIcon },
  { value: 'Under ₹50K', label: 'Under ₹50K', icon: TrendDownIcon },
  { value: '₹50K – ₹2L', label: '₹50K – ₹2L', icon: BarsLowIcon },
  { value: '₹2L – ₹10L', label: '₹2L – ₹10L', icon: BarsHighIcon },
  { value: '₹10L – ₹50L', label: '₹10L – ₹50L', icon: TrendUpIcon },
  { value: '₹1 Crore+', label: '₹1 Crore+', icon: StarIcon },
];

export const AGENCY_TYPE_OPTIONS = [
  { value: '', label: 'All types', icon: GridIcon },
  { value: 'Full-Service Agency', label: 'Full-Service Agency', icon: BriefcaseIcon },
  {
    value: 'Media Planning',
    label: 'Media Planning',
    icon: (
      <OptIcon>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </OptIcon>
    ),
  },
  {
    value: 'Production House',
    label: 'Production House',
    icon: (
      <OptIcon>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m10 8 6 4-6 4V8z" />
      </OptIcon>
    ),
  },
  { value: 'OOH Specialist', label: 'OOH Specialist', icon: PinIcon },
  {
    value: 'PR and Integrated',
    label: 'PR and Integrated',
    icon: (
      <OptIcon>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </OptIcon>
    ),
  },
];

export const AGENCY_BUDGET_OPTIONS = [
  { value: '', label: 'Any size', icon: BriefcaseRupeeIcon },
  { value: 'Under ₹5L', label: 'Under ₹5L', icon: TrendDownIcon },
  { value: '₹5L – ₹25L', label: '₹5L – ₹25L', icon: BarsLowIcon },
  { value: '₹25L – ₹1Cr', label: '₹25L – ₹1Cr', icon: BarsHighIcon },
  { value: '₹1Cr+', label: '₹1Cr+', icon: StarIcon },
];
