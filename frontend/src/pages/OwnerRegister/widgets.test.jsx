import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterProvider, useRegister } from '@/features/register';
import { TypeGrid, SelectWithOther } from './widgets';
import { TYPE_OPTIONS as REGISTER_TYPE_OPTIONS, Step3 } from './steps';
import { TYPE_OPTIONS as WIZARD_TYPE_OPTIONS, ListingStep1 } from '../NewBillboardListing/steps';

function FieldInspector({ name }) {
  const { field } = useRegister();
  return <div data-testid={`val-${name}`}>{field(name)}</div>;
}

describe('OwnerRegister and Wizard Widgets', () => {
  describe('TypeGrid code storage', () => {
    it('stores the canonical code on click, not the display label', () => {
      render(
        <RegisterProvider initialData={{ f_bbType: '' }}>
          <TypeGrid name="f_bbType" options={WIZARD_TYPE_OPTIONS} />
          <FieldInspector name="f_bbType" />
        </RegisterProvider>,
      );

      // Verify initially empty
      expect(screen.getByTestId('val-f_bbType').textContent).toBe('');

      // Click on "Static Hoarding" option card
      const staticOption = screen.getByText('Static Hoarding').closest('.type-option');
      fireEvent.click(staticOption);

      // Value must be canonical code STATIC_HOARDING, NOT "Static Hoarding"
      expect(screen.getByTestId('val-f_bbType').textContent).toBe('STATIC_HOARDING');
      expect(screen.getByTestId('val-f_bbType').textContent).not.toBe('Static Hoarding');

      // Click on "LED Digital" option card
      const ledOption = screen.getByText('LED Digital').closest('.type-option');
      fireEvent.click(ledOption);

      expect(screen.getByTestId('val-f_bbType').textContent).toBe('LED_DIGITAL');
    });
  });

  describe('SelectWithOther lowercase and uppercase tolerance', () => {
    it('reveals companion input for the lowercase "other" value used by traffic and audience', () => {
      const options = [
        { value: 'vehicular', label: 'Vehicular Traffic' },
        { value: 'other', label: 'Other Traffic Profile' },
      ];

      const { unmount } = render(
        <RegisterProvider initialData={{ f_trafficType: 'vehicular', f_trafficOther: '' }}>
          <SelectWithOther
            name="f_trafficType"
            otherName="f_trafficOther"
            options={options}
            placeholder="Select Traffic"
          />
        </RegisterProvider>,
      );

      // Not visible when non-other
      expect(screen.queryByPlaceholderText('Describe')).toBeNull();
      unmount();

      // Render with lowercase 'other'
      render(
        <RegisterProvider initialData={{ f_trafficType: 'other', f_trafficOther: '' }}>
          <SelectWithOther
            name="f_trafficType"
            otherName="f_trafficOther"
            options={options}
            placeholder="Select Traffic"
          />
        </RegisterProvider>,
      );

      // Must reveal companion input for lowercase 'other'
      const input = screen.getByPlaceholderText('Describe');
      expect(input).toBeDefined();

      // Enter digits and characters: "Terminal 2 Route 44"
      fireEvent.change(input, { target: { value: 'Terminal 2 Route 44' } });
      expect(input.value).toBe('Terminal 2 Route 44');
    });
  });

  describe('f_bbTypeOther companion rendering in Wizard and OwnerRegister', () => {
    it('renders f_bbTypeOther only when isOther(f_bbType) in ListingStep1 (wizard)', () => {
      const { unmount } = render(
        <RegisterProvider initialData={{ f_bbType: 'STATIC_HOARDING' }}>
          <ListingStep1 />
        </RegisterProvider>,
      );

      // Non-other: input is absent
      expect(screen.queryByPlaceholderText('e.g., Bridge Panel, Skywalk, Pillar')).toBeNull();
      unmount();

      // Render with OTHER
      render(
        <RegisterProvider initialData={{ f_bbType: 'OTHER' }}>
          <ListingStep1 />
        </RegisterProvider>,
      );

      // OTHER: companion input is rendered
      expect(screen.getByPlaceholderText('e.g., Bridge Panel, Skywalk, Pillar')).toBeDefined();
    });

    it('renders f_bbTypeOther only when isOther(f_bbType) in Step3 (OwnerRegister)', () => {
      const { unmount } = render(
        <RegisterProvider initialData={{ f_bbType: 'LED_DIGITAL' }}>
          <Step3 />
        </RegisterProvider>,
      );

      // Non-other: input is absent
      expect(screen.queryByPlaceholderText('e.g., Bridge Panel, Skywalk, Pillar')).toBeNull();
      unmount();

      // Render with OTHER
      render(
        <RegisterProvider initialData={{ f_bbType: 'OTHER' }}>
          <Step3 />
        </RegisterProvider>,
      );

      // OTHER: companion input is rendered
      expect(screen.getByPlaceholderText('e.g., Bridge Panel, Skywalk, Pillar')).toBeDefined();
    });
  });
});
