import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageLightboxModal } from './ImageLightboxModal';

describe('ImageLightboxModal', () => {
  const mockItems = [
    {
      id: 'day-1',
      originalName: 'day1.jpg',
      category: 'DAY_PHOTO',
      url: 'https://example.com/day1.jpg',
      isCover: false,
    },
    {
      id: 'night-1',
      originalName: 'night1.jpg',
      category: 'NIGHT_PHOTO',
      url: 'https://example.com/night1.jpg',
      isCover: false,
    },
    {
      id: 'video-1',
      originalName: 'tour.mp4',
      category: 'VIDEO',
      url: 'https://example.com/tour.mp4',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    render(<ImageLightboxModal isOpen={false} items={mockItems} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders modal with metadata when isOpen is true', () => {
    render(
      <ImageLightboxModal isOpen={true} items={mockItems} initialIndex={0} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('day1.jpg')).toBeDefined();
    expect(screen.getByText('Day Photo')).toBeDefined();
    expect(screen.getByText('(1 of 3)')).toBeDefined();
  });

  it('locks body scroll when open and restores on unmount', () => {
    const { unmount } = render(
      <ImageLightboxModal isOpen={true} items={mockItems} initialIndex={0} onClose={vi.fn()} />,
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('displays Cover Photo badge when item is designated cover', () => {
    const coverItems = [{ ...mockItems[0], isCover: true }, mockItems[1]];

    render(
      <ImageLightboxModal isOpen={true} items={coverItems} initialIndex={0} onClose={vi.fn()} />,
    );

    expect(screen.getByText('⭐ Cover Photo')).toBeDefined();
  });

  it('displays Projected Cover (Auto) badge when projectedCoverId matches and no explicit cover is chosen', () => {
    render(
      <ImageLightboxModal
        isOpen={true}
        items={mockItems}
        initialIndex={0}
        projectedCoverId="day-1"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('⭐ Projected Cover (Auto)')).toBeDefined();
  });

  it('navigates through items via next and previous buttons', () => {
    render(
      <ImageLightboxModal isOpen={true} items={mockItems} initialIndex={0} onClose={vi.fn()} />,
    );

    expect(screen.getByText('day1.jpg')).toBeDefined();

    // Click next
    const nextBtn = screen.getByLabelText('Next image');
    fireEvent.click(nextBtn);
    expect(screen.getByText('night1.jpg')).toBeDefined();
    expect(screen.getByText('(2 of 3)')).toBeDefined();

    // Click prev
    const prevBtn = screen.getByLabelText('Previous image');
    fireEvent.click(prevBtn);
    expect(screen.getByText('day1.jpg')).toBeDefined();
  });

  it('navigates via arrow keys and closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <ImageLightboxModal isOpen={true} items={mockItems} initialIndex={0} onClose={onClose} />,
    );

    expect(screen.getByText('day1.jpg')).toBeDefined();

    // ArrowRight
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('night1.jpg')).toBeDefined();

    // ArrowLeft
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('day1.jpg')).toBeDefined();

    // Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('invokes onSetCover when clicking Set as Primary Cover', () => {
    const onSetCover = vi.fn();
    render(
      <ImageLightboxModal
        isOpen={true}
        items={mockItems}
        initialIndex={0}
        onSetCover={onSetCover}
        onClose={vi.fn()}
      />,
    );

    const setCoverBtn = screen.getByText('⭐ Set as Primary Cover');
    fireEvent.click(setCoverBtn);
    expect(onSetCover).toHaveBeenCalledWith(mockItems[0]);
  });

  it('invokes onRemove and closes modal when clicking delete', () => {
    const onRemove = vi.fn();
    const onClose = vi.fn();
    render(
      <ImageLightboxModal
        isOpen={true}
        items={mockItems}
        initialIndex={0}
        onRemove={onRemove}
        onClose={onClose}
      />,
    );

    const deleteBtn = screen.getByText('🗑 Delete Photo');
    fireEvent.click(deleteBtn);
    expect(onRemove).toHaveBeenCalledWith(mockItems[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders a video element when item is a video', () => {
    render(
      <ImageLightboxModal
        isOpen={true}
        items={mockItems}
        initialIndex={2} // tour.mp4
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('tour.mp4')).toBeDefined();
    expect(screen.getByText('Video Preview')).toBeDefined();
    const video = document.querySelector('video');
    expect(video).toBeDefined();
    expect(video.getAttribute('src')).toBe('https://example.com/tour.mp4');
  });

  it('restores focus to opener when closed', () => {
    const opener = document.createElement('button');
    opener.setAttribute('data-testid', 'test-opener');
    document.body.appendChild(opener);
    opener.focus();

    const onClose = vi.fn();
    const { rerender } = render(
      <ImageLightboxModal isOpen={true} items={mockItems} initialIndex={0} onClose={onClose} />,
    );

    const closeBtn = screen.getByLabelText('Close Lightbox');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    rerender(
      <ImageLightboxModal isOpen={false} items={mockItems} initialIndex={0} onClose={onClose} />,
    );

    expect(document.activeElement).toBe(opener);
    document.body.removeChild(opener);
  });
});
