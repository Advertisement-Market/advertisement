import { api } from '@/lib/apiClient';

/**
 * REST API client for billboard availability calendar and sync pipeline.
 */
export const availabilityApi = {
  /**
   * Fetch availability for an owner billboard listing.
   * @param {number|string} listingId - The billboard listing ID.
   * @returns {Promise<{blocks: Array<{id: number, startDate: string, endDate: string, blockType: string}>, etag: string, today: string}>}
   */
  getListingAvailability: (listingId) =>
    api.get(`/api/owner/listings/${listingId}/availability`).then((r) => r.data),

  /**
   * Sync owner availability blocks with optimistic concurrency ETag guard.
   * @param {number|string} listingId - The billboard listing ID.
   * @param {Array<{startDate: string, endDate: string}>} ranges - Contiguous inclusive date intervals.
   * @param {string|null} etag - Current ETag from previous fetch/save.
   * @returns {Promise<{blocks: Array<{id: number, startDate: string, endDate: string, blockType: string}>, warnings: string[], etag: string, today: string}>}
   */
  syncListingAvailability: (listingId, ranges, etag) => {
    const headers = {};
    if (etag) {
      const cleanEtag = etag.replace(/^"|"$/g, '');
      headers['If-Match'] = `"${cleanEtag}"`;
    }
    return api
      .put(`/api/owner/listings/${listingId}/availability`, { ranges }, { headers })
      .then((r) => r.data);
  },

  /**
   * Fetch public availability intervals for shopper date pickers.
   * Clamped to max(from, today) by backend.
   * @param {number|string} listingId - The billboard listing ID.
   * @param {string} [from] - Start date (YYYY-MM-DD).
   * @param {string} [to] - End date (YYYY-MM-DD).
   * @returns {Promise<Array<{startDate: string, endDate: string, blockType: string}>>}
   */
  getPublicAvailability: (listingId, from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return api.get(`/api/listings/${listingId}/availability`, { params }).then((r) => r.data);
  },
};
