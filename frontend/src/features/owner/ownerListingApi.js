import { api } from '@/lib/apiClient';

/**
 * REST API client for billboard owner listing inventory.
 */
export const ownerListingApi = {
  getListings: () => api.get('/api/owner/listings').then((r) => r.data),
  getListing: (id, config) =>
    (config
      ? api.get(`/api/owner/listings/${id}`, config)
      : api.get(`/api/owner/listings/${id}`)
    ).then((r) => r.data),
  createListing: (payload) => api.post('/api/owner/listings', payload).then((r) => r.data),
  updateListing: (id, payload) =>
    api.patch(`/api/owner/listings/${id}`, payload).then((r) => r.data),
  deleteListing: (id) => api.delete(`/api/owner/listings/${id}`),
  getBillboardTypes: () => api.get('/api/lov/billboard-types').then((r) => r.data),

  // Media sync & lifecycle
  syncMedia: (id, manifest, files = []) => {
    const formData = new FormData();
    const manifestBlob = new Blob([JSON.stringify(manifest)], {
      type: 'application/json',
    });
    formData.append('manifest', manifestBlob);
    files.forEach((f) => {
      formData.append('files', f);
    });
    return api
      .post(`/api/owner/listings/${id}/media/sync`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  uploadSingleMedia: (id, category, file, uploadId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (uploadId) formData.append('uploadId', uploadId);
    return api
      .post(`/api/owner/listings/${id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  setCover: (id, mediaId) =>
    api.put(`/api/owner/listings/${id}/media/${mediaId}/cover`).then((r) => r.data),

  reorderMedia: (id, mediaIds) =>
    api.put(`/api/owner/listings/${id}/media/order`, { mediaIds }).then((r) => r.data),

  submitListing: (id) =>
    api.post(`/api/owner/listings/${id}/submit`).then((r) => r.data),
};
