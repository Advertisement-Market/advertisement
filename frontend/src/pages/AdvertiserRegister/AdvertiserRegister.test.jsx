import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterProvider } from '@/features/register';
import { Step3 } from './steps';
import { validate as validateAdvertiser } from './AdvertiserRegister';
import { MSG } from '@/lib/validators';

describe('AdvertiserRegister Pincode Validation', () => {
  const baseData = {
    f_firstName: 'Rohan',
    f_desig: 'Head of Growth',
    f_email: 'rohan@example.com',
    f_phone: '9876543210',
    f_addressLine1: '12 MG Road',
    f_city: 'Bengaluru',
    f_state: 'Karnataka',
  };

  it('fails Step 3 if pincode is blank', () => {
    const showToast = vi.fn();
    const result = validateAdvertiser(3, {
      data: { ...baseData, f_pincode: '' },
      selections: {},
      showToast,
    });
    expect(result).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Please enter your pincode.', 'error');
  });

  it('fails Step 3 if pincode starts with 0', () => {
    const showToast = vi.fn();
    const result = validateAdvertiser(3, {
      data: { ...baseData, f_pincode: '012345' },
      selections: {},
      showToast,
    });
    expect(result).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      'Please enter a valid 6-digit PIN code (cannot start with 0).',
      'error',
    );
  });

  it('passes Step 3 if pincode is a valid 6-digit number starting with 1-9', () => {
    const showToast = vi.fn();
    const result = validateAdvertiser(3, {
      data: { ...baseData, f_pincode: '560001' },
      selections: {},
      showToast,
    });
    expect(result).toBe(true);
  });

  it('displays inline error on blur when f_pincode starts with 0', () => {
    render(
      <MemoryRouter>
        <RegisterProvider initialData={{ f_pincode: '' }}>
          <Step3 />
        </RegisterProvider>
      </MemoryRouter>,
    );

    const pinInput = screen.getByPlaceholderText('400001');
    fireEvent.change(pinInput, { target: { value: '012345' } });
    fireEvent.blur(pinInput);

    expect(pinInput.classList.contains('invalid')).toBe(true);
    expect(screen.getByText(MSG.pincode)).toBeDefined();
  });
});
