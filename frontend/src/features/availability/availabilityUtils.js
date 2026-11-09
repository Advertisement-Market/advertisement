/**
 * Availability date and range calculation utilities.
 * Handles pure YYYY-MM-DD string arithmetic without client timezone drift.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BLOCK_EXPAND_DAYS = 3650;
export const MAX_RETRY_AFTER_SECONDS = 60;

const STATUS_PRIORITY = {
  blocked: 1,
  hold: 2,
  booked: 3,
};

/**
 * Validate that a string is a real YYYY-MM-DD calendar date.
 */
export const isValidDateKey = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !ISO_DATE_RE.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

/**
 * Format year, 0-indexed month, and day into YYYY-MM-DD.
 */
export const formatDateKey = (year, monthIndex, day) => {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

/**
 * Split YYYY-MM-DD into numeric year, 0-indexed month, and day.
 */
export const parseDateParts = (dateStr) => {
  if (!isValidDateKey(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day };
};

/**
 * Add N days to a YYYY-MM-DD date string.
 */
export const addDays = (dateStr, n) => {
  if (!isValidDateKey(dateStr) || !Number.isFinite(n)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Math.trunc(n)));
  return dt.toISOString().slice(0, 10);
};

/**
 * Compare two YYYY-MM-DD strings. Returns true if d1 < d2.
 */
export const isBefore = (d1, d2) => {
  if (!isValidDateKey(d1) || !isValidDateKey(d2)) return false;
  return d1 < d2;
};

/**
 * Calculate inclusive day count between two YYYY-MM-DD dates.
 */
export const daysBetweenInclusive = (startStr, endStr) => {
  if (!isValidDateKey(startStr) || !isValidDateKey(endStr)) return 0;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Transform server availability blocks into a calendar day map.
 * Enforces precedence booked > hold > blocked and caps per-block expansion against corrupt spans.
 * @param {Array<{startDate: string, endDate: string, blockType: string}>} blocks
 * @returns {{ statusMap: Record<string, 'blocked'|'booked'|'hold'>, confirmedDates: Set<string>, holdDates: Set<string> }}
 */
export const blocksToDayStatusMap = (blocks = []) => {
  const statusMap = {};
  const confirmedDates = new Set();
  const holdDates = new Set();

  if (!Array.isArray(blocks)) {
    return { statusMap, confirmedDates, holdDates };
  }

  for (const block of blocks) {
    if (!isValidDateKey(block?.startDate) || !isValidDateKey(block?.endDate)) continue;
    if (block.startDate > block.endDate) continue;

    let curr = block.startDate;
    const end = block.endDate;

    let status = 'blocked';
    if (block.blockType === 'CONFIRMED_BOOKING') {
      status = 'booked';
    } else if (block.blockType === 'BOOKING_HOLD') {
      status = 'hold';
    }

    let steps = 0;
    while (curr && curr <= end && steps < MAX_BLOCK_EXPAND_DAYS) {
      const prevStatus = statusMap[curr];
      if (!prevStatus || STATUS_PRIORITY[status] >= STATUS_PRIORITY[prevStatus]) {
        statusMap[curr] = status;
      }

      if (status === 'booked') {
        confirmedDates.add(curr);
        holdDates.delete(curr);
      } else if (status === 'hold' && !confirmedDates.has(curr)) {
        holdDates.add(curr);
      }

      curr = addDays(curr, 1);
      steps += 1;
    }
  }

  return { statusMap, confirmedDates, holdDates };
};

/**
 * Convert calendar day map into sorted, merged contiguous [startDate, endDate] ranges.
 * Strips any dates that belong to confirmed bookings or active checkout holds.
 * @param {Record<string, string>} dayStatusMap - Map of YYYY-MM-DD to status.
 * @param {Set<string>} [confirmedDates] - Dates with confirmed bookings to omit.
 * @param {Set<string>} [holdDates] - Dates with active booking holds to omit.
 * @returns {Array<{startDate: string, endDate: string}>}
 */
export const dayStatusMapToRanges = (
  dayStatusMap = {},
  confirmedDates = new Set(),
  holdDates = new Set(),
) => {
  const confSet = confirmedDates instanceof Set ? confirmedDates : new Set();
  const holdSet = holdDates instanceof Set ? holdDates : new Set();

  const blockedDates = Object.keys(dayStatusMap || {})
    .filter((k) => {
      const status = dayStatusMap[k];
      const isBlockedOrBooked = status === 'blocked' || status === 'block' || status === 'booked';
      return isValidDateKey(k) && isBlockedOrBooked && !confSet.has(k) && !holdSet.has(k);
    })
    .sort();

  if (blockedDates.length === 0) return [];

  const ranges = [];
  let rangeStart = blockedDates[0];
  let rangeEnd = blockedDates[0];

  for (let i = 1; i < blockedDates.length; i++) {
    const d = blockedDates[i];
    const expectedNext = addDays(rangeEnd, 1);

    if (d === expectedNext) {
      rangeEnd = d;
    } else {
      ranges.push({ startDate: rangeStart, endDate: rangeEnd });
      rangeStart = d;
      rangeEnd = d;
    }
  }

  ranges.push({ startDate: rangeStart, endDate: rangeEnd });
  return ranges;
};

/**
 * Extract Retry-After header seconds from an Axios error response.
 * Rejects non-numeric values and clamps excessively large retry hints.
 */
export const extractRetryAfterSeconds = (error, defaultSeconds = 5) => {
  const headerVal =
    error?.response?.headers?.['retry-after'] ??
    error?.response?.headers?.['Retry-After'] ??
    error?.response?.headers?.retryAfter;

  if (headerVal !== undefined && headerVal !== null) {
    const str = String(headerVal).trim();
    if (/^\d+$/.test(str)) {
      const parsed = Number(str);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.min(parsed, MAX_RETRY_AFTER_SECONDS);
      }
    }
  }
  return defaultSeconds;
};
