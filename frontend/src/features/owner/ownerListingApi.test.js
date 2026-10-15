import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ownerListingApi } from './ownerListingApi';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ownerListingApi client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getListings calls GET /api/owner/listings and unwraps data', async () => {
    const mockListings = [
      { id: 1, name: 'Bandra LED', startPrice: 350000.0, city: 'Mumbai' },
      { id: 2, name: 'Worli Unipole', startPrice: 280000.0, city: 'Mumbai' },
    ];
    api.get.mockResolvedValueOnce({ data: mockListings });

    const result = await ownerListingApi.getListings();

    expect(api.get).toHaveBeenCalledWith('/api/owner/listings');
    expect(result).toEqual(mockListings);
  });

  it('getListing calls GET /api/owner/listings/{id} and unwraps data', async () => {
    const mockListing = { id: 10, name: 'Powai LED', startPrice: 200000.0 };
    api.get.mockResolvedValueOnce({ data: mockListing });

    const result = await ownerListingApi.getListing(10);

    expect(api.get).toHaveBeenCalledWith('/api/owner/listings/10');
    expect(result).toEqual(mockListing);
  });

  it('createListing calls POST /api/owner/listings with payload and unwraps created data', async () => {
    const payload = {
      name: 'New Listing',
      addressLine1: 'Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      type: 'LED Digital',
      widthFt: 40,
      heightFt: 20,
      facing: 'North',
      trafficType: 'Vehicular',
      audienceType: 'Commuters',
      startPrice: 300000,
      minBooking: '1 month',
    };
    const createdResponse = { id: 99, ...payload };
    api.post.mockResolvedValueOnce({ data: createdResponse });

    const result = await ownerListingApi.createListing(payload);

    expect(api.post).toHaveBeenCalledWith('/api/owner/listings', payload);
    expect(result).toEqual(createdResponse);
  });

  it('updateListing calls PATCH /api/owner/listings/{id} with payload and unwraps data', async () => {
    const payload = { startPrice: 320000, discountNote: '10% discount' };
    const updatedResponse = { id: 99, name: 'New Listing', ...payload };
    api.patch.mockResolvedValueOnce({ data: updatedResponse });

    const result = await ownerListingApi.updateListing(99, payload);

    expect(api.patch).toHaveBeenCalledWith('/api/owner/listings/99', payload);
    expect(result).toEqual(updatedResponse);
  });

  it('deleteListing calls DELETE /api/owner/listings/{id}', async () => {
    api.delete.mockResolvedValueOnce({ status: 204 });

    await ownerListingApi.deleteListing(99);

    expect(api.delete).toHaveBeenCalledWith('/api/owner/listings/99');
  });
});
