import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ImageLightboxModal
 * Accessible full-screen modal previewing high-resolution images or videos.
 *
 * Supports:
 * - Focus restoration and focus trap
 * - Body scroll lock
 * - Keyboard navigation (Esc, ArrowLeft, ArrowRight)
 * - Metadata header (filename, category, dimensions, cover badge)
 * - Action toolbar (Set as Cover, Download, Delete)
 * - Safe per-item object URL generation and cleanup
 */
export function ImageLightboxModal({
  isOpen,
  onClose,
  items = [],
  initialIndex = 0,
  onSetCover,
  onRemove,
  selectedCover,
  isStagedForDelete,
  projectedCoverId,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dimensions, setDimensions] = useState(null);
  const [activeUrl, setActiveUrl] = useState(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync initialIndex when modal transitions to open
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }

  const modalRef = useRef(null);
  const openerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
    }
  }, [isOpen]);

  const currentItem = items[currentIndex];

  // Object URL lifecycle per displayed item (Lightbox-owned)
  useEffect(() => {
    if (!isOpen || !currentItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveUrl(null);
      setDimensions(null);
      return;
    }

    const existingUrl =
      currentItem.url ||
      currentItem.fileUrl ||
      (currentItem.storageKey ? `/api/media/${currentItem.storageKey}` : null);
    if (existingUrl) {
      // Existing persisted asset
      setActiveUrl(existingUrl);
      return;
    }

    const file = currentItem.file || (currentItem instanceof File ? currentItem : null);
    if (file) {
      // Newly staged local file
      const url = URL.createObjectURL(file);
      setActiveUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [isOpen, currentItem]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Pause video if navigating away
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    onClose?.();
    if (openerRef.current && typeof openerRef.current.focus === 'function') {
      openerRef.current.focus();
    }
  }, [onClose]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Keyboard navigation & Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Tab') {
        // Focus trap
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handlePrev, handleNext]);

  if (!isOpen || !currentItem) return null;

  const isVideo = currentItem.category === 'VIDEO' || currentItem.file?.type?.startsWith('video/');
  const isDayPhoto = currentItem.category === 'DAY_PHOTO';

  // Determine cover status
  const isSelectedCover =
    (currentItem.type === 'EXISTING' &&
      selectedCover?.type === 'EXISTING' &&
      String(selectedCover.id) === String(currentItem.id)) ||
    (currentItem.type === 'NEW' &&
      selectedCover?.type === 'NEW' &&
      selectedCover.uploadId === currentItem.id) ||
    (!selectedCover && currentItem.isCover);

  const isProjectedCover = !selectedCover && String(projectedCoverId) === String(currentItem.id);

  const isStaged = isStagedForDelete ? isStagedForDelete(currentItem) : false;

  const filename = currentItem.originalName || currentItem.file?.name || 'Media Asset';

  const categoryLabel = (() => {
    switch (currentItem.category) {
      case 'DAY_PHOTO':
        return 'Day Photo';
      case 'NIGHT_PHOTO':
        return 'Night Photo';
      case 'SURROUNDING_PHOTO':
        return 'Surrounding Area';
      case 'VIDEO':
        return 'Video Preview';
      default:
        return 'Media';
    }
  })();

  const handleDownload = async () => {
    if (!activeUrl) return;

    if (isVideo) {
      // Direct download anchor for video to prevent browser out-of-memory errors
      const a = document.createElement('a');
      a.href = activeUrl;
      a.download = filename || 'billboard-video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const res = await fetch(activeUrl);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'billboard-photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 150);
    } catch {
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview Lightbox"
      ref={modalRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(8, 12, 22, 0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              maxWidth: 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={filename}
          >
            {filename}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(8, 145, 178, 0.25)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {categoryLabel}
          </span>
          {isSelectedCover && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ⭐ Cover Photo
            </span>
          )}
          {isProjectedCover && !isSelectedCover && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(148, 163, 184, 0.2)',
                color: '#cbd5e1',
                border: '1px solid rgba(203, 213, 225, 0.3)',
              }}
            >
              ⭐ Projected Cover (Auto)
            </span>
          )}
          {dimensions && (
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.55)' }}>
              {dimensions.w} × {dimensions.h} px
            </span>
          )}
          {items.length > 1 && (
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.55)' }}>
              ({currentIndex + 1} of {items.length})
            </span>
          )}
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Lightbox"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              transition: 'all 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px 60px',
          overflow: 'hidden',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            style={{
              position: 'absolute',
              left: 20,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            }}
          >
            ‹
          </button>
        )}

        {/* Content Preview */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={activeUrl}
            controls
            autoPlay
            muted
            playsInline
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              borderRadius: 10,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
              background: '#000',
            }}
          />
        ) : (
          activeUrl && (
            <img
              src={activeUrl}
              alt={filename}
              onLoad={(e) =>
                setDimensions({
                  w: e.target.naturalWidth,
                  h: e.target.naturalHeight,
                })
              }
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: 10,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
              }}
            />
          )
        )}

        {/* Next Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            style={{
              position: 'absolute',
              right: 20,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Bottom Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {isDayPhoto && !isSelectedCover && !isStaged && onSetCover && (
          <button
            type="button"
            className="btn-set-cover"
            onClick={() => onSetCover(currentItem)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--teal, #0d9488)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
            }}
          >
            ⭐ Set as Primary Cover
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontWeight: 500,
            fontSize: 13,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⬇ Download
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={() => {
              onRemove(currentItem);
              handleClose();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: isStaged ? 'rgba(100, 116, 139, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              color: isStaged ? '#cbd5e1' : '#fca5a5',
              fontWeight: 500,
              fontSize: 13,
              border: isStaged
                ? '1px solid rgba(203, 213, 225, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.4)',
              cursor: 'pointer',
            }}
          >
            {isStaged ? '↩ Restore from Deletion' : '🗑 Delete Photo'}
          </button>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default ImageLightboxModal;
