import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationApi } from './notificationApi';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('notificationApi client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotifications calls GET /api/notifications and unwraps data', async () => {
    const mockData = {
      unreadCount: 1,
      notifications: [
        {
          id: 1,
          title: 'Welcome',
          message: 'Welcome aboard',
          category: 'ONBOARDING',
          tone: 'teal',
          read: false,
        },
      ],
    };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await notificationApi.getNotifications();

    expect(api.get).toHaveBeenCalledWith('/api/notifications');
    expect(result).toEqual(mockData);
  });

  it('markAsRead calls PATCH /api/notifications/{id}/read', async () => {
    api.patch.mockResolvedValueOnce({ status: 204 });

    await notificationApi.markAsRead(42);

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/42/read');
  });

  it('markAllAsRead calls POST /api/notifications/read-all', async () => {
    api.post.mockResolvedValueOnce({ status: 204 });

    await notificationApi.markAllAsRead();

    expect(api.post).toHaveBeenCalledWith('/api/notifications/read-all');
  });
});
