import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterProvider, useRegister } from '@/features/register';
import { TypeGrid, SelectWithOther, UploadZone, ThumbnailCard } from './widgets';
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

      // 1. Boundary: 50MB + 1 byte rejected
      const oversizedFile = new File([new ArrayBuffer(1024)], 'walkthrough.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(oversizedFile, 'size', { value: 50 * 1024 * 1024 + 1 });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      expect(onChange).not.toHaveBeenCalled();

      // 2. Unsupported video format rejected (e.g. .avi)
      const aviFile = new File([new ArrayBuffer(1024)], 'clip.avi', {
        type: 'video/x-msvideo',
      });
      fireEvent.change(fileInput, { target: { files: [aviFile] } });
      expect(onChange).not.toHaveBeenCalled();

      // 3. Boundary: exactly 50MB accepted
      const boundaryMp4 = new File([new ArrayBuffer(1024)], 'boundary.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(boundaryMp4, 'size', { value: 50 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [boundaryMp4] } });
      expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ file: boundaryMp4 })]);

      // 4. Browser quirk: .mov with empty MIME type ('') is accepted based on extension
      const movEmptyMime = new File([new ArrayBuffer(1024)], 'iphone_clip.mov', {
        type: '',
      });
      Object.defineProperty(movEmptyMime, 'size', { value: 35 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [movEmptyMime] } });
      expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ file: movEmptyMime })]);
    });
  });

  describe('ThumbnailCard & UploadZone media features', () => {
    it('renders COVER badge and calls onPreview when clicked', () => {
      const onPreview = vi.fn();
      const item = {
        id: 'm1',
        originalName: 'sunny.jpg',
        category: 'DAY_PHOTO',
        url: 'https://img.com/1',
      };

      render(
        <ThumbnailCard
          item={item}
          isExisting={true}
          isCover={true}
          category="DAY_PHOTO"
          onPreview={onPreview}
        />,
      );

      expect(screen.getByText('⭐ COVER')).toBeDefined();
      fireEvent.click(screen.getByTitle('Click to preview full-size'));
      expect(onPreview).toHaveBeenCalledWith(item);
    });

    it('renders Make Cover button on non-cover daylight photo and handles selection', () => {
      const onSelectCover = vi.fn();
      const item = {
        id: 'm2',
        originalName: 'angle2.jpg',
        category: 'DAY_PHOTO',
        url: 'https://img.com/2',
      };

      render(
        <ThumbnailCard
          item={item}
          isExisting={true}
          isCover={false}
          category="DAY_PHOTO"
          onSelectCover={onSelectCover}
        />,
      );

      const makeCoverBtn = screen.getByLabelText('Set as cover photo');
      expect(makeCoverBtn).toBeDefined();
      fireEvent.click(makeCoverBtn);
      expect(onSelectCover).toHaveBeenCalledWith(item);
    });

    it('displays staged delete overlay with Undo button and handles restoration', () => {
      const onUndoDelete = vi.fn();
      const item = {
        id: 'm3',
        originalName: 'old.jpg',
        category: 'DAY_PHOTO',
        url: 'https://img.com/3',
      };

      render(
        <ThumbnailCard
          item={item}
          isExisting={true}
          isStagedDelete={true}
          category="DAY_PHOTO"
          onUndoDelete={onUndoDelete}
        />,
      );

      expect(screen.getByText('Removing')).toBeDefined();
      expect(screen.queryByLabelText('Set as cover photo')).toBeNull();
      expect(screen.queryByLabelText('Remove photo')).toBeNull();

      const undoBtn = screen.getByLabelText('Undo removal');
      fireEvent.click(undoBtn);
      expect(onUndoDelete).toHaveBeenCalledWith('m3');
    });

    it('renders both existing and new files in UploadZone with undo and cover support', () => {
      const onSelectCover = vi.fn();
      const onUndoDelete = vi.fn();
      const existingFiles = [
        {
          id: 'ex-1',
          originalName: 'existing1.jpg',
          isCover: true,
          category: 'DAY_PHOTO',
          url: 'https://img.com/ex1',
        },
        {
          id: 'ex-2',
          originalName: 'existing2.jpg',
          isCover: false,
          category: 'DAY_PHOTO',
          url: 'https://img.com/ex2',
        },
      ];
      const newFiles = [
        {
          id: 'new-1',
          file: new File(['x'], 'new1.jpg', { type: 'image/jpeg' }),
          category: 'DAY_PHOTO',
        },
      ];

      render(
        <RegisterProvider>
          <UploadZone
            sectionTitle="Day Photos"
            category="DAY_PHOTO"
            existingFiles={existingFiles}
            files={newFiles}
            stagedDeleteIds={['ex-2']}
            onSelectCover={onSelectCover}
            onUndoDelete={onUndoDelete}
          />
        </RegisterProvider>,
      );

      // Verify existing file 1 has cover badge
      expect(screen.getByText('⭐ COVER')).toBeDefined();
      // Verify existing file 2 has removing overlay and undo button
      expect(screen.getByText('Removing')).toBeDefined();
      const undoBtn = screen.getByLabelText('Undo removal');
      fireEvent.click(undoBtn);
      expect(onUndoDelete).toHaveBeenCalledWith('ex-2');
    });

    it('renders image src from fileUrl when url is omitted on existing media', () => {
      const item = {
        id: 'ex-backend',
        originalName: 'backend_photo.jpg',
        category: 'DAY_PHOTO',
        fileUrl: '/api/media/backend_photo_key.jpg',
      };

      render(<ThumbnailCard item={item} isExisting={true} category="DAY_PHOTO" />);

      const img = screen.getByAltText('backend_photo.jpg');
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toBe('/api/media/backend_photo_key.jpg');
    });
  });
});
