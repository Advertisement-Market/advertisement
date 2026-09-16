import { api } from '@/lib/apiClient';

/**
 * REST API client for billboard owner listing inventory.
 */
export const ownerListingApi = {
  getListings: () => api.get('/api/owner/listings').then((r) => r.data),
  getListing: (id) => api.get(`/api/owner/listings/${id}`).then((r) => r.data),
  createListing: (payload) => api.post('/api/owner/listings', payload).then((r) => r.data),
  updateListing: (id, payload) => api.patch(`/api/owner/listings/${id}`, payload).then((r) => r.data),
  deleteListing: (id) => api.delete(`/api/owner/listings/${id}`),
};
