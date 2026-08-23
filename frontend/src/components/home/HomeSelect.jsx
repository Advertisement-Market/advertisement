import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

const Chevron = () => (
  <svg
    className="hsd-chevron"
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
 * Custom dropdown for the home hero search (`.hsd-wrap`). Controlled by value /
 * onChange; opens upward. Mirrors the teleporting select from the templates.
 *
 * @param {object} props
 * @param {{ value: string, label: string, icon?: import('react').ReactNode }[]} props.options
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {number} [props.dividerAfter]
 */
export function HomeSelect({ options, value, onChange, name, dividerAfter = 0 }) {
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
    const onScrollResize = () => close();
    window.addEventListener('scroll', onScrollResize, { passive: true });
    window.addEventListener('resize', onScrollResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollResize);
      window.removeEventListener('resize', onScrollResize);
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
      className={cn('hsd-wrap', open && 'open')}
      tabIndex={0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen((v) => !v)}
      onKeyDown={handleKeyDown}
    >
      <select
        className="hsd-select"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      >
        {options.map((o) => (
          <option key={o.value || 'any'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={cn('hsd-display', isPlaceholder && 'placeholder')}>{selected?.label}</span>
      <Chevron />
      <div className={cn('hsd-panel', open && 'open')} role="listbox">
        {options.map((option, i) => (
          <Fragment key={option.value || 'any'}>
            <div
              className={cn(
                'hsd-option',
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
            {i === dividerAfter && i < options.length - 1 && <div className="hsd-divider" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
