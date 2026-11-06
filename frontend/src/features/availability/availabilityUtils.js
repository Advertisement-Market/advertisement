/**
 * Availability date and range calculation utilities.
 * Handles pure YYYY-MM-DD string arithmetic without client timezone drift.
 */

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
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day };
};

/**
 * Add N days to a YYYY-MM-DD date string.
 */
export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

/**
 * Compare two YYYY-MM-DD strings. Returns true if d1 < d2.
 */
export const isBefore = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1 < d2;
};

/**
 * Calculate inclusive day count between two YYYY-MM-DD dates.
 */
export const daysBetweenInclusive = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Transform server availability blocks into a calendar day map.
 * @param {Array<{startDate: string, endDate: string, blockType: string}>} blocks
 * @returns {{ statusMap: Record<string, 'blocked'|'booked'|'hold'>, confirmedDates: Set<string>, holdDates: Set<string> }}
 */
export const blocksToDayStatusMap = (blocks = []) => {
  const statusMap = {};
  const confirmedDates = new Set();
  const holdDates = new Set();

  for (const block of blocks) {
    if (!block.startDate || !block.endDate) continue;
    let curr = block.startDate;
    const end = block.endDate;

    let status = 'blocked';
    if (block.blockType === 'CONFIRMED_BOOKING') {
      status = 'booked';
    } else if (block.blockType === 'BOOKING_HOLD') {
      status = 'hold';
    }

    while (curr <= end) {
      statusMap[curr] = status;
      if (status === 'booked') {
        confirmedDates.add(curr);
      } else if (status === 'hold') {
        holdDates.add(curr);
      }
      curr = addDays(curr, 1);
    }
  }

  return { statusMap, confirmedDates, holdDates };
};

/**
 * Convert calendar day map into sorted, merged contiguous [startDate, endDate] ranges.
 * Strips any dates that belong to confirmed bookings (Phase 4 read-only protection).
 * @param {Record<string, string>} dayStatusMap - Map of YYYY-MM-DD to status.
 * @param {Set<string>} [confirmedDates] - Dates with confirmed bookings to omit.
 * @returns {Array<{startDate: string, endDate: string}>}
 */
export const dayStatusMapToRanges = (dayStatusMap = {}, confirmedDates = new Set()) => {
  const blockedDates = Object.keys(dayStatusMap)
    .filter((k) => {
      const status = dayStatusMap[k];
      const isBlockedOrBooked = status === 'blocked' || status === 'block' || status === 'booked';
      return isBlockedOrBooked && !confirmedDates.has(k);
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
 */
export const extractRetryAfterSeconds = (error, defaultSeconds = 5) => {
  const headerVal =
    error?.response?.headers?.['retry-after'] ||
    error?.response?.headers?.['Retry-After'] ||
    error?.response?.headers?.retryAfter;

  if (headerVal) {
    const parsed = parseInt(headerVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultSeconds;
};

