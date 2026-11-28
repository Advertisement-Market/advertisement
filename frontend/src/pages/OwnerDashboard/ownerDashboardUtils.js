import { formatBillboardType } from './data';

/**
 * Escapes characters with special meaning in RegExp.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts and returns up to `limit` most recent listings sorted deterministically by creation date.
 * Immutably sorts without modifying the incoming array.
 *
 * @param {Array} listings
 * @param {number} limit
 * @returns {Array}
 */
export function getRecentListings(listings = [], limit = 3) {
  if (!Array.isArray(listings) || limit <= 0) return [];

  return [...listings]
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const timeA = new Date(a.item?.createdAt || 0).getTime();
      const timeB = new Date(b.item?.createdAt || 0).getTime();
      const validA = Number.isNaN(timeA) ? 0 : timeA;
      const validB = Number.isNaN(timeB) ? 0 : timeB;

      if (validB !== validA) {
        return validB - validA;
      }

      // Numeric id tiebreaker if valid and distinct
      const idA = Number(a.item?.id);
      const idB = Number(b.item?.id);
      if (!Number.isNaN(idA) && !Number.isNaN(idB) && idB !== idA) {
        return idB - idA;
      }

      // Stable fallback to original index
      return a.originalIndex - b.originalIndex;
    })
    .slice(0, limit)
    .map((wrapper) => wrapper.item);
}

/**
 * Formats location, dimensions, and billboard type metadata with word-boundary deduplication.
 * Prevents repeating city names when already present in the landmark/address across common
 * separators (whitespace, commas, hyphens, slashes).
 *
 * @param {Object} l Listing object
 * @returns {string}
 */
export function formatListingMeta(l) {
  if (!l) return '';

  const parts = [];
  const loc = (l.landmark || l.addressLine1 || '').trim();
  const city = (l.city || '').trim();

  if (loc) {
    parts.push(loc);
  }

  if (city) {
    const escapedCity = escapeRegExp(city);
    // Checks if city is bounded by start/end or common punctuation/whitespace: [ , / - ]
    const cityWordRegex = new RegExp(`(^|[\\s,/-])${escapedCity}($|[\\s,/-])`, 'i');
    if (!loc || !cityWordRegex.test(loc)) {
      parts.push(city);
    }
  }

  if (l.widthFt && l.heightFt) {
    parts.push(`${l.widthFt}×${l.heightFt} ft`);
  }

  const typeFormatted = formatBillboardType(l.type, l.typeOther);
  if (typeFormatted) {
    parts.push(typeFormatted);
  }

  return parts.join(' · ');
}

/**
 * Formats monthly pricing according to the strict priority hierarchy:
 * 1. Base package rate (guarded: rate > 0 and durationDays > 0, normalized to 30 days)
 * 2. Daily startPrice multiplied by 30
 * 3. Fallback to "Price on request"
 *
 * Formats Lakhs and Crores with rounded values and stripped trailing .0.
 * Promotes 99.96L (which rounds to 100L) to 1Cr.
 *
 * @param {Object} listing
 * @returns {string}
 */
export function formatListingMonthlyPrice(listing) {
  if (!listing) return 'Price on request';

  let rawMonthly = null;
  const basePkg = listing.pricingPackages?.find((p) => p?.isBase);

  if (
    basePkg &&
    basePkg.rate != null &&
    Number(basePkg.rate) > 0 &&
    basePkg.durationDays != null &&
    Number(basePkg.durationDays) > 0
  ) {
    rawMonthly = (Number(basePkg.rate) / Number(basePkg.durationDays)) * 30;
  } else if (listing.startPrice != null && Number(listing.startPrice) > 0) {
    rawMonthly = Number(listing.startPrice) * 30;
  }

  if (rawMonthly == null || rawMonthly <= 0 || Number.isNaN(rawMonthly)) {
    return 'Price on request';
  }

  const rounded = Math.round(rawMonthly);

  // 1 Crore = 10,000,000. Values >= 99,95,000 round to 1.00 Cr
  if (rounded >= 9995000) {
    const cr = parseFloat((rounded / 10000000).toFixed(2));
    return `₹${cr}Cr`;
  }
  // 1 Lakh = 100,000. Values >= 99,500 round to 1.0 Lakh
  if (rounded >= 99500) {
    const l = parseFloat((rounded / 100000).toFixed(1));
    return `₹${l}L`;
  }

  return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Normalizes status string and maps to badge label and CSS chip class.
 *
 * @param {string} status
 * @returns {{ label: string, className: string }}
 */
export function getListingStatusBadge(status) {
  if (!status) return { label: 'Unknown', className: 'chip-neutral' };

  const norm = String(status).trim().toUpperCase();

  switch (norm) {
    case 'ACTIVE':
    case 'AVAILABLE':
      return { label: 'Available', className: 'chip-available' };
    case 'BOOKED':
      return { label: 'Booked', className: 'chip-booked' };
    case 'PENDING_APPROVAL':
    case 'PENDING_VERIFICATION':
    case 'UNDER_REVIEW':
      return { label: 'Under Review', className: 'chip-pending' };
    case 'DRAFT':
      return { label: 'Draft', className: 'chip-draft' };
    case 'SUSPENDED':
    case 'REJECTED':
      return { label: 'Unavailable', className: 'chip-declined' };
    default: {
      const label = norm
        .split('_')
        .map((w) => (w.length > 0 ? w.charAt(0) + w.slice(1).toLowerCase() : ''))
        .join(' ');
      return { label: label || 'Unknown', className: 'chip-neutral' };
    }
  }
}
