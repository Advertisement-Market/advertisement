import { describe, it, expect, vi, beforeEach } from 'vitest';
import { availabilityApi } from './availabilityApi';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('availabilityApi client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getListingAvailability calls GET /api/owner/listings/{id}/availability and unwraps data', async () => {
    const mockData = { blocks: [], etag: 'hash123', today: '2026-11-09' };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await availabilityApi.getListingAvailability(42);

    expect(api.get).toHaveBeenCalledWith('/api/owner/listings/42/availability');
    expect(result).toEqual(mockData);
  });

  it('syncListingAvailability strips quotes from strong ETag and sets If-Match header', async () => {
    api.put.mockResolvedValueOnce({ data: { blocks: [], etag: 'newHash' } });

    const ranges = [{ startDate: '2026-11-10', endDate: '2026-11-15' }];
    await availabilityApi.syncListingAvailability(42, ranges, '"strongHash123"');

    expect(api.put).toHaveBeenCalledWith(
      '/api/owner/listings/42/availability',
      { ranges },
      { headers: { 'If-Match': '"strongHash123"' } },
    );
  });

  it('syncListingAvailability strips W/ prefix and quotes from weak ETag to avoid malformed If-Match', async () => {
    api.put.mockResolvedValueOnce({ data: { blocks: [], etag: 'newHash' } });

    const ranges = [{ startDate: '2026-11-10', endDate: '2026-11-15' }];
    await availabilityApi.syncListingAvailability(42, ranges, 'W/"weakHash123"');

    expect(api.put).toHaveBeenCalledWith(
      '/api/owner/listings/42/availability',
      { ranges },
      { headers: { 'If-Match': '"weakHash123"' } },
    );
  });

  it('syncListingAvailability without etag does not include If-Match header', async () => {
    api.put.mockResolvedValueOnce({ data: { blocks: [] } });

    const ranges = [];
    await availabilityApi.syncListingAvailability(42, ranges, null);

    expect(api.put).toHaveBeenCalledWith(
      '/api/owner/listings/42/availability',
      { ranges },
      { headers: {} },
    );
  });

  it('getPublicAvailability calls GET /api/listings/{id}/availability with query params', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await availabilityApi.getPublicAvailability(42, '2026-11-10', '2026-11-20');

    expect(api.get).toHaveBeenCalledWith('/api/listings/42/availability', {
      params: { from: '2026-11-10', to: '2026-11-20' },
    });
  });
});
