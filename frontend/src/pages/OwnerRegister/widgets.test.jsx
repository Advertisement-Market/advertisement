import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterProvider, useRegister } from '@/features/register';
import { TypeGrid, SelectWithOther, UploadZone } from './widgets';
import { TYPE_OPTIONS as REGISTER_TYPE_OPTIONS, Step2, Step3 } from './steps';
import { TYPE_OPTIONS as WIZARD_TYPE_OPTIONS, ListingStep1 } from '../NewBillboardListing/steps';
import { validate as validateOwner } from './OwnerRegister';
import { MSG } from '@/lib/validators';

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

  describe('Pincode validation across OwnerRegister steps', () => {
    it('validates f_bizPin in Step 2 step validation', () => {
      const showToast = vi.fn();
      const baseData = {
        f_companyName: 'Acme Signs',
        f_bizAddr1: '100 Main St',
        f_bizCity: 'Mumbai',
        f_bizState: 'Maharashtra',
      };

      // Fails on blank
      expect(validateOwner(2, { data: { ...baseData, f_bizPin: '' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please enter your office pincode.', 'error');

      // Fails on leading zero
      expect(validateOwner(2, { data: { ...baseData, f_bizPin: '012345' }, showToast })).toBe(
        false,
      );
      expect(showToast).toHaveBeenCalledWith(
        'Please enter a valid 6-digit office pincode (cannot start with 0).',
        'error',
      );

      // Succeeds on valid pin
      expect(validateOwner(2, { data: { ...baseData, f_bizPin: '400050' }, showToast })).toBe(true);
    });

    it('validates f_bbPin in Step 3 step validation', () => {
      const showToast = vi.fn();
      const baseData = {
        f_bbName: 'Prime Screen',
        f_bbAddr: '100 Main St',
        f_bbCity: 'Mumbai',
        f_bbState: 'Maharashtra',
        f_bbType: 'STATIC_HOARDING',
        f_bbWidth: '30',
        f_bbHeight: '15',
        f_facing: 'NORTH',
        f_trafficType: 'HIGHWAY',
        f_audience: 'COMMUTERS',
      };

      // Fails on blank
      expect(validateOwner(3, { data: { ...baseData, f_bbPin: '' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please enter the billboard pincode.', 'error');

      // Fails on leading zero
      expect(validateOwner(3, { data: { ...baseData, f_bbPin: '012345' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith(
        'Please enter a valid 6-digit billboard pincode (cannot start with 0).',
        'error',
      );

      // Succeeds on valid pin
      expect(validateOwner(3, { data: { ...baseData, f_bbPin: '400050' }, showToast })).toBe(true);
    });

    it('displays inline error on blur when f_bizPin starts with 0', () => {
      render(
        <RegisterProvider initialData={{ f_bizPin: '' }}>
          <Step2 />
        </RegisterProvider>,
      );

      const pinInput = screen.getByPlaceholderText('411001');
      fireEvent.change(pinInput, { target: { value: '012345' } });
      fireEvent.blur(pinInput);

      expect(pinInput.classList.contains('invalid')).toBe(true);
      expect(screen.getByText(MSG.pincode)).toBeDefined();
    });

    it('displays inline error on blur when f_bbPin starts with 0', () => {
      render(
        <RegisterProvider initialData={{ f_bbPin: '' }}>
          <Step3 />
        </RegisterProvider>,
      );

      const pinInput = screen.getByPlaceholderText('400053');
      fireEvent.change(pinInput, { target: { value: '012345' } });
      fireEvent.blur(pinInput);

      expect(pinInput.classList.contains('invalid')).toBe(true);
      expect(screen.getByText(MSG.pincode)).toBeDefined();
    });
  });

  describe('UploadZone video validation', () => {
    it('rejects video exceeding 50MB and accepts valid MP4 and MOV within 50MB', () => {
      const showToast = vi.fn();
      const onChange = vi.fn();

      render(
        <RegisterProvider value={{ showToast }}>
          <UploadZone sectionTitle="Short Video" category="VIDEO" files={[]} onChange={onChange} />
        </RegisterProvider>,
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeDefined();

      // 1. File > 50MB rejected
      const oversizedFile = new File([new ArrayBuffer(1024)], 'walkthrough.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(oversizedFile, 'size', { value: 55 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      // In UploadZone, validateFile shows toast and does not call onChange with the invalid file
      expect(onChange).not.toHaveBeenCalled();

      // 2. Unsupported video format rejected (e.g. .avi)
      const aviFile = new File([new ArrayBuffer(1024)], 'clip.avi', {
        type: 'video/x-msvideo',
      });
      fireEvent.change(fileInput, { target: { files: [aviFile] } });
      expect(onChange).not.toHaveBeenCalled();

      // 3. Valid MP4 within 50MB accepted
      const validMp4 = new File([new ArrayBuffer(1024)], 'clip.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(validMp4, 'size', { value: 25 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [validMp4] } });
      expect(onChange).toHaveBeenCalledWith([validMp4]);

      // 4. Valid MOV within 50MB accepted
      const validMov = new File([new ArrayBuffer(1024)], 'iphone_clip.mov', {
        type: 'video/quicktime',
      });
      Object.defineProperty(validMov, 'size', { value: 35 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [validMov] } });
      expect(onChange).toHaveBeenCalledWith([validMov]);
    });
  });
});
