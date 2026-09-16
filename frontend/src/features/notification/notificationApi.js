import { api } from '@/lib/apiClient';

/**
 * Shared API client for user notifications across all personas.
 */
export const notificationApi = {
  getNotifications: () => api.get('/api/notifications').then((r) => r.data),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
};
