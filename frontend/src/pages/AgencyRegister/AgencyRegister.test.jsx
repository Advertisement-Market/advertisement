import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterProvider } from '@/features/register';
import { Step2 } from './steps';
import { validate as validateAgency } from './AgencyRegister';
import { MSG } from '@/lib/validators';

describe('AgencyRegister Pincode Validation', () => {
  const baseData = {
    f_agencyName: 'Pinnacle Media',
    f_agencyType: 'OOH Specialist',
    f_yearEst: '2015',
    f_addressLine1: '4th Floor, Tower A',
    f_city: 'Mumbai',
    f_state: 'Maharashtra',
  };

  it('fails Step 2 if pincode is blank', () => {
    const showToast = vi.fn();
    const result = validateAgency(2, {
      data: { ...baseData, f_pincode: '' },
      selections: {},
      showToast,
    });
    expect(result).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Please enter your headquarters pincode.', 'error');
  });

  it('fails Step 2 if pincode starts with 0', () => {
    const showToast = vi.fn();
    const result = validateAgency(2, {
      data: { ...baseData, f_pincode: '012345' },
      selections: {},
      showToast,
    });
    expect(result).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      'Please enter a valid 6-digit headquarters pincode (cannot start with 0).',
      'error',
    );
  });

  it('passes Step 2 if pincode is a valid 6-digit number starting with 1-9', () => {
    const showToast = vi.fn();
    const result = validateAgency(2, {
      data: { ...baseData, f_pincode: '400051' },
      selections: {},
      showToast,
    });
    expect(result).toBe(true);
  });

  it('displays inline error on blur when f_pincode starts with 0', () => {
    render(
      <MemoryRouter>
        <RegisterProvider initialData={{ f_pincode: '' }}>
          <Step2 />
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

