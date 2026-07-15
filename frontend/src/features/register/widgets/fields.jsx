import { useState } from 'react';
import { cn } from '@/lib/cn';
import { minLength, required as requiredRule, validatorsForType } from '@/lib/validators';
import { useRegister } from '../RegisterContext';
import { useFieldError } from '../useFieldError';

/** Inline error message shown beneath an invalid field. */
export function FieldError({ show, error }) {
  if (!show || !error) return null;
  return <div className="field-error">{error}</div>;
}

const ArrowRight = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const ChevronLeft = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export function FormSection({ title, hint, last, children, style }) {
  return (
    <div className="form-section" style={last ? { borderBottom: 'none', ...style } : style}>
      {title != null && (
        <div className="form-section-title">
          {title}
          {hint && <span className="multiselect-hint"> {hint}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormRow({ children }) {
  return <div className="form-row">{children}</div>;
}

export function FieldLabel({ label, required, optional }) {
  return (
    <label>
      {label} {required && <span className="req">*</span>}
      {optional && <span className="opt">(optional)</span>}
    </label>
  );
}

/**
 * Controlled form field bound to RegisterProvider by `name`.
 * Supports text-like inputs, textarea and select, with built-in validation:
 * `required` + format checks inferred from `type` (email / tel / url / number),
 * plus any extra `rules` passed in.
 */
export function Field({
  name,
  label,
  required,
  optional,
  hint,
  type = 'text',
  placeholder,
  options,
  rows,
  groupStyle,
  rules = [],
  ...rest
}) {
  const { field, setField } = useRegister();
  const value = field(name);
  const onChange = (e) => setField(name, e.target.value);

  const validators = [
    ...(required ? [requiredRule()] : []),
    ...validatorsForType(type, { min: rest.min, max: rest.max }),
    ...rules,
  ];
  const { error, show, invalidClass, onBlur } = useFieldError(name, validators);
  const controlClass = cn('form-control', invalidClass);

  let control;
  if (type === 'textarea') {
    control = (
      <textarea
        className={controlClass}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
      />
    );
  } else if (type === 'select') {
    control = (
      <select className={controlClass} value={value} onChange={onChange} onBlur={onBlur} {...rest}>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    );
  } else {
    control = (
      <input
        type={type}
        className={controlClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
      />
    );
  }

  return (
    <div className="form-group" style={groupStyle}>
      {label && <FieldLabel label={label} required={required} optional={optional} />}
      {control}
      {show ? (
        <FieldError show={show} error={error} />
      ) : (
        hint && <div className="form-hint">{hint}</div>
      )}
    </div>
  );
}

export function StepHeader({ step, total, heading, headingEm, sub }) {
  return (
    <div className="step-header">
      <div className="step-label">
        <span className="step-label-dot" />
        Step {step} of {total}
      </div>
      <h2 className="step-heading">
        {heading} {headingEm && <em>{headingEm}</em>}
      </h2>
      <p className="step-subheading">{sub}</p>
    </div>
  );
}

/**
 * Wizard navigation footer: optional Back, and a Next (or custom) button.
 */
export function RegNav({ showBack = true, nextLabel, saveHint, children }) {
  const { nextStep, prevStep } = useRegister();
  return (
    <div className="reg-nav">
      {showBack && (
        <button className="btn-back" onClick={prevStep}>
          {ChevronLeft}
          Back
        </button>
      )}
      {children ?? (
        <button className="btn-next" onClick={nextStep}>
          {nextLabel} {ArrowRight}
        </button>
      )}
      {saveHint && <span className="nav-save-hint">{saveHint}</span>}
    </div>
  );
}

const EyeIcon = (
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>
);
const EyeOffIcon = (
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
);

/** Password input with a visibility toggle and (optionally) a strength checklist. */
export function PasswordField({ name, label, required, placeholder, showReqs }) {
  const { field, setField } = useRegister();
  const [visible, setVisible] = useState(false);
  const value = field(name);

  const validators = required
    ? [requiredRule(), minLength(8, 'Password must be at least 8 characters.')]
    : [];
  const { error, show, invalidClass, onBlur } = useFieldError(name, validators);

  const reqs = {
    '8+ characters': value.length >= 8,
    'Uppercase letter': /[A-Z]/.test(value),
    Number: /[0-9]/.test(value),
    'Special character': /[^A-Za-z0-9]/.test(value),
  };

  return (
    <div className="form-group">
      {label && <FieldLabel label={label} required={required} />}
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          className={cn('form-control', invalidClass)}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
          onBlur={onBlur}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          title="Toggle password visibility"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {visible ? EyeOffIcon : EyeIcon}
          </svg>
        </button>
      </div>
      {show && !showReqs && <FieldError show={show} error={error} />}
      {showReqs && (
        <div className="pw-reqs">
          {Object.entries(reqs).map(([label_, ok]) => (
            <span
              key={label_}
              className="pw-req"
              style={
                ok
                  ? {
                      background: 'var(--green-light)',
                      color: 'var(--green)',
                      borderColor: 'rgba(5,150,105,0.25)',
                    }
                  : undefined
              }
            >
              {label_}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Confirm-password field that shows a match/mismatch hint against `against`. */
export function ConfirmPasswordField({ name, against, label, required, placeholder }) {
  const { field, setField } = useRegister();
  const [visible, setVisible] = useState(false);
  const value = field(name);
  const other = field(against);

  const validators = [
    ...(required ? [requiredRule()] : []),
    (v) => (!v || v === other ? null : 'Passwords do not match.'),
  ];
  const { error, show, invalidClass, onBlur } = useFieldError(name, validators);
  const matches = value && value === other;

  return (
    <div className="form-group">
      {label && <FieldLabel label={label} required={required} />}
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          className={cn('form-control', !matches && invalidClass)}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
          onBlur={onBlur}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          title="Toggle password visibility"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {visible ? EyeOffIcon : EyeIcon}
          </svg>
        </button>
      </div>
      {matches ? (
        <div className="form-hint success">Passwords match.</div>
      ) : (
        <FieldError show={show} error={error} />
      )}
    </div>
  );
}
