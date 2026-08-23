import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

const Chevron = () => (
  <svg
    className="sf-chevron"
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Accessible custom dropdown that recreates the `.sf-select-wrap` widget from
 * index.html (display value + chevron + option panel with icons). Keeps a
 * visually-hidden native <select> in sync for form semantics.
 *
 * @param {object} props
 * @param {{ value: string, label: string, icon?: import('react').ReactNode }[]} props.options
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.name]
 * @param {number} [props.dividerAfter=0]  index after which to draw a divider
 */
export function SearchSelect({ options, value, onChange, name, dividerAfter = 0 }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const isPlaceholder = !value;

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  useClickOutside(wrapRef, close, open);

  useEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => close();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, close]);

  const choose = (option) => {
    onChange(option.value);
    close();
  };

  const handleKeyDown = (e) => {
    const current = focusIndex >= 0 ? focusIndex : options.findIndex((o) => o.value === value);

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (current >= 0) choose(options[current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setFocusIndex(Math.min(current + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(Math.max(current - 1, 0));
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={cn('sf-select-wrap', open && 'open')}
      tabIndex={0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen((v) => !v)}
      onKeyDown={handleKeyDown}
    >
      <select
        className="sf-select"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span className={cn('sf-select-display', isPlaceholder && 'placeholder')}>
        {selected?.label}
      </span>
      <Chevron />

      <div className={cn('sf-dropdown-panel', open && 'open')} role="listbox">
        {options.map((option, i) => (
          <Fragment key={option.value || 'all'}>
            <div
              className={cn(
                'sf-dropdown-option',
                option.value === value && 'selected',
                i === focusIndex && 'focused',
              )}
              data-value={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={(e) => {
                e.stopPropagation();
                choose(option);
              }}
              onMouseEnter={() => setFocusIndex(i)}
            >
              {option.icon}
              {option.label}
            </div>
            {i === dividerAfter && i < options.length - 1 && (
              <div className="sf-dropdown-divider" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
