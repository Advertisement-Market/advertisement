import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OwnerRegister } from './OwnerRegister';
import { useAuth } from '@/context/AuthContext';
import { ownerListingApi } from '@/features/owner/ownerListingApi';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('OwnerRegister Component & Media Upload Flow', () => {
  const mockRegisterOwner = vi.fn();
  const mockSyncMedia = vi.spyOn(ownerListingApi, 'syncMedia');
  const mockSubmitListing = vi.spyOn(ownerListingApi, 'submitListing');

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      registerOwner: mockRegisterOwner,
      user: null,
    });
    window.scrollTo = vi.fn();
  });

  const validRegistrationData = {
    f_firstName: 'Vedant',
    f_lastName: 'Salunkhe',
    f_email: 'vedant@example.com',
    f_phone: '9876543210',
    f_password: 'Password123!',
    f_confirmPassword: 'Password123!',
    f_companyName: 'AdMedia Ltd',
    f_bizAddr1: '100 Main Road',
    f_bizCity: 'Mumbai',
    f_bizState: 'Maharashtra',
    f_bizPin: '400053',
    f_bbName: 'Andheri West Flyover',
    f_bbAddr: 'SV Road, Andheri West',
    f_bbCity: 'Mumbai',
    f_bbState: 'Maharashtra',
    f_bbPin: '400058',
    f_bbType: 'UNIPOLE',
    f_bbWidth: '30',
    f_bbHeight: '15',
    f_facing: 'North',
    f_trafficType: 'vehicular',
    f_trafficOther: '',
    f_audience: 'commuters',
    f_audienceOther: '',
    f_startPrice: '10000',
    f_minBookingValue: 1,
    f_minBookingUnit: 'MONTHS',
    f_termsAccept: true,
  };

  it('uploads media and submits listing for verification post-registration when at least 2 day photos uploaded', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'day2.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      token: 'jwt-token-123',
      initialListingId: 501,
      user: { id: 10, email: 'vedant@example.com' },
    });
    mockSyncMedia.mockResolvedValueOnce([
      { id: 1, isCover: false, category: 'DAY_PHOTO' },
      { id: 2, isCover: true, category: 'DAY_PHOTO' },
    ]);
    mockSubmitListing.mockResolvedValueOnce({ id: 501, status: 'PENDING_APPROVAL' });

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [
              { id: 'up-1', file: file1 },
              { id: 'up-2', file: file2 },
            ],
            f_selectedCover: { type: 'NEW', uploadId: 'up-2' },
          }}
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /submit for verification/i });
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalledWith(
        501,
        expect.objectContaining({
          fileMappings: [
            expect.objectContaining({ uploadId: 'up-1', isCover: false }),
            expect.objectContaining({ uploadId: 'up-2', isCover: true }),
          ],
        }),
        [file1, file2],
      );
      expect(mockSubmitListing).toHaveBeenCalledWith(501);
      expect(screen.getByText('Submitted!')).toBeDefined();
    });
  });

  it('gracefully handles syncMedia failure post-registration without blocking user on Step 7', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      token: 'jwt-token-123',
      initialListingId: 502,
      user: { id: 10, email: 'vedant@example.com' },
    });
    mockSyncMedia.mockRejectedValueOnce(new Error('S3 upload timeout'));

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [{ id: 'up-1', file: file1 }],
          }}
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /submit for verification/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalled();
      // User lands on success screen despite media upload failure
      expect(screen.getByText('Submitted!')).toBeDefined();
      expect(
        screen.getByText(
          'Account created, but media upload failed. You can add photos from My Listings.',
        ),
      ).toBeDefined();
    });
  });

  it('does not invoke submitListing when fewer than 2 day photos are uploaded', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      token: 'jwt-token-123',
      initialListingId: 503,
      user: { id: 10, email: 'vedant@example.com' },
    });
    mockSyncMedia.mockResolvedValueOnce([{ id: 1, isCover: true, category: 'DAY_PHOTO' }]);

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [{ id: 'up-1', file: file1 }],
          }}
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /submit for verification/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalled();
      // submitListing must NOT be invoked since day photos < 2
      expect(mockSubmitListing).not.toHaveBeenCalled();
      expect(screen.getByText('Submitted!')).toBeDefined();
    });
  });
});
