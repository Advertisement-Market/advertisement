import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useRegister } from '../RegisterContext';

const OptionCheck = (
  <span className="ms-option-check">
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);
const ChipRemove = (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const Chevron = (
  <svg
    className="ms-chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const PillCheck = (
  <span className="pill-check">
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

/** Chips + dropdown multi-select bound to a selection `group`. */
export function MultiSelectDropdown({ group, options, placeholder }) {
  const { selection, isSelected, toggleSelection } = useRegister();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const selected = selection(group);

  return (
    <div className="ms-wrap" ref={wrapRef}>
      <button
        type="button"
        className={cn('ms-trigger', open && 'open')}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="ms-trigger-inner">
          {selected.length === 0 ? (
            <span className="ms-placeholder">{placeholder}</span>
          ) : (
            selected.map((val) => (
              <span className="ms-chip" key={val}>
                {val}
                <span
                  className="ms-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(group, val);
                  }}
                >
                  {ChipRemove}
                </span>
              </span>
            ))
          )}
        </div>
        {Chevron}
      </button>
      <div className={cn('ms-dropdown', open && 'open')}>
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <div
              key={value}
              className={cn('ms-option', isSelected(group, value) && 'selected')}
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(group, value);
              }}
            >
              {OptionCheck}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Custom single-select (cs-trigger / cs-dropdown) bound to a field `name`. */
export function CustomSelect({ name, options, placeholder }) {
  const { field, setField } = useRegister();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const value = field(name);
  const selected = options.find((o) => (typeof o === 'string' ? o : o.value) === value);
  const selectedLabel = selected ? (typeof selected === 'string' ? selected : selected.label) : '';

  return (
    <div className="cs-wrap" ref={wrapRef}>
      <button
        type="button"
        className={cn('cs-trigger', open && 'open')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={cn('cs-value', !value && 'cs-placeholder')}>
          {selectedLabel || placeholder}
        </span>
        {Chevron}
      </button>
      <div className={cn('cs-dropdown', open && 'open')}>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <div
              key={val}
              className={cn('cs-option', val === value && 'selected')}
              onClick={(e) => {
                e.stopPropagation();
                setField(name, val);
                setOpen(false);
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Multi-select toggle pills bound to a selection `group`. */
export function TogglePills({ group, options }) {
  const { isSelected, toggleSelection } = useRegister();
  return (
    <div className="pill-group">
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <div
            key={value}
            className={cn('toggle-pill', isSelected(group, value) && 'selected')}
            onClick={() => toggleSelection(group, value)}
          >
            {PillCheck}
            {label}
          </div>
        );
      })}
    </div>
  );
}

/** Single-select radio cards bound to a field `name`. */
export function RadioCards({ name, options, groupStyle, cardStyle }) {
  const { field, setField } = useRegister();
  const value = field(name);
  return (
    <div className="radio-cards" style={groupStyle}>
      {options.map((opt) => (
        <div
          key={opt.value}
          className={cn('radio-card', value === opt.value && 'selected')}
          style={cardStyle}
          onClick={() => setField(name, opt.value)}
        >
          <div className="radio-dot" />
          <div>
            <div className="radio-card-label">{opt.label}</div>
            {opt.sub && <div className="radio-card-sub">{opt.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Two-option yes/no toggle bound to a field `name`. */
export function YesNoToggle({ name, options }) {
  const { field, setField } = useRegister();
  const value = field(name);
  return (
    <div className="yesno-toggle">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={cn('yesno-btn', value === opt.value && 'selected')}
          onClick={() => setField(name, opt.value)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}
