import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import * as v from '@/lib/validators';
import { useRegister, useFieldError, FieldError, FieldLabel } from '@/features/register';

/* ── 6-box OTP ── */
export function OtpBoxes({ channel, dest, disabled }) {
  const { showToast } = useRegister();
  const [stage, setStage] = useState('idle'); // idle | sent | verified
  const [countdown, setCountdown] = useState(0);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const send = () => {
    if (countdown > 0) return;
    setStage('sent');
    showToast(`OTP sent to ${dest?.() || 'you'}. (Demo: use 123456)`, 'success');
    setCountdown(30);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const onDigit = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    setDigits((arr) => {
      const next = [...arr];
      next[i] = d;
      return next;
    });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const verify = () => {
    if (digits.join('') === '123456') {
      setStage('verified');
      clearInterval(timer.current);
      showToast(
        `${channel === 'email' ? 'Email' : 'Mobile number'} verified successfully.`,
        'success',
      );
    } else {
      showToast('Incorrect OTP. Please try again. (Hint: 123456)', 'error');
    }
  };

  if (stage === 'verified') {
    return (
      <div
        style={{
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--green)',
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
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
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {channel === 'email' ? 'Email' : 'Mobile'} verified
      </div>
    );
  }

  return (
    <>
      {stage === 'idle' && (
        <div className="otp-row" style={{ display: 'block' }}>
          <button type="button" className="otp-send-btn" onClick={send} disabled={disabled}>
            Send OTP to verify {channel === 'email' ? 'email' : 'mobile'}
          </button>
        </div>
      )}
      {stage === 'sent' && (
        <div className="otp-input-group" style={{ display: 'flex' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              className="otp-box"
              maxLength={1}
              inputMode="numeric"
              value={d}
              onChange={(e) => onDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
            />
          ))}
          <button type="button" className="otp-verify-btn" onClick={verify}>
            Verify
          </button>
          <button type="button" className="otp-resend" onClick={send} disabled={countdown > 0}>
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
          </button>
        </div>
      )}
    </>
  );
}

/* ── Password with pw-rules-grid ── */
const EyeShow = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeHide = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function PwWrap({ name, placeholder, invalidClass, onBlur }) {
  const { field, setField } = useRegister();
  const [visible, setVisible] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        type={visible ? 'text' : 'password'}
        className={cn('form-control', invalidClass)}
        placeholder={placeholder}
        value={field(name)}
        onChange={(e) => setField(name, e.target.value)}
        onBlur={onBlur}
      />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label="Show password"
      >
        {visible ? EyeHide : EyeShow}
      </button>
    </div>
  );
}

export function PasswordRulesField({ name, placeholder }) {
  const { field } = useRegister();
  const val = field(name);
  const err = useFieldError(name, [
    v.required(),
    v.minLength(8, 'Password must be at least 8 characters.'),
  ]);
  const rules = [
    { key: 'length', text: '8+ characters', ok: val.length >= 8 },
    { key: 'upper', text: 'Uppercase letter', ok: /[A-Z]/.test(val) },
    { key: 'number', text: 'Number', ok: /[0-9]/.test(val) },
    { key: 'symbol', text: 'Special symbol', ok: /[^A-Za-z0-9]/.test(val) },
  ];
  return (
    <div className="form-group">
      <label>
        Password <span className="req">*</span>
      </label>
      <PwWrap
        name={name}
        placeholder={placeholder}
        invalidClass={err.invalidClass}
        onBlur={err.onBlur}
      />
      {err.show && !val && <FieldError show={err.show} error={err.error} />}
      <div className="pw-rules-grid">
        {rules.map((r) => (
          <div key={r.key} className={cn('pw-rule', r.ok && 'met')}>
            <span className="pw-rule-icon" />
            <span className="pw-rule-text">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConfirmPwField({ name, placeholder, against = 'f_password' }) {
  const { field } = useRegister();
  const value = field(name);
  const other = field(against);
  const err = useFieldError(name, [
    v.required(),
    (val) => (!val || val === other ? null : 'Passwords do not match.'),
  ]);
  const matches = value && value === other;
  return (
    <div className="form-group">
      <label>
        Confirm Password <span className="req">*</span>
      </label>
      <PwWrap
        name={name}
        placeholder={placeholder}
        invalidClass={!matches ? err.invalidClass : ''}
        onBlur={err.onBlur}
      />
      {matches ? (
        <div className="form-hint success">Passwords match.</div>
      ) : (
        <FieldError show={err.show} error={err.error} />
      )}
    </div>
  );
}

/* ── Structure type grid (single select) ── */
export function TypeGrid({ name, options }) {
  const { field, setField } = useRegister();
  const value = field(name);
  return (
    <div className="type-grid">
      {options.map((opt) => (
        <div
          key={opt.code}
          className={cn('type-option', value === opt.code && 'selected')}
          onClick={() => setField(name, opt.code)}
        >
          <div className="type-option-icon">{opt.icon}</div>
          <div className="type-option-label">{opt.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Select with an "Other" text reveal ── */
export function SelectWithOther({ name, otherName, options, placeholder = 'Select' }) {
  const { field, setField } = useRegister();
  const value = field(name);
  return (
    <>
      <select
        className="form-control"
        value={value}
        onChange={(e) => setField(name, e.target.value)}
      >
        <option value="">{placeholder}</option>
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
      {v.isOther(value) && (
        <input
          type="text"
          className="form-control"
          placeholder="Describe"
          maxLength={120}
          style={{ marginTop: 8 }}
          value={field(otherName)}
          onChange={(e) => setField(otherName, e.target.value)}
        />
      )}
    </>
  );
}

/* ── Ownership options (single select) ── */
export function OwnershipOptions({ name, options }) {
  const { field, setField } = useRegister();
  const value = field(name) || options[0].value;
  return (
    <div className="ownership-options" style={{ marginBottom: 20 }}>
      {options.map((o) => (
        <div
          key={o.value}
          className={cn('ownership-option', value === o.value && 'selected')}
          onClick={() => setField(name, o.value)}
        >
          <div className="ownership-icon">{o.icon}</div>
          <div>
            <div className="ownership-label">{o.label}</div>
            <div className="ownership-desc">{o.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApprovalOptions({ name, options }) {
  const { field, setField } = useRegister();
  const value = field(name) || options[0].value;
  return (
    <div className="approval-options">
      {options.map((o) => (
        <div
          key={o.value}
          className={cn('approval-option', value === o.value && 'selected')}
          onClick={() => setField(name, o.value)}
        >
          <div className="approval-radio" />
          <div className="approval-text">{o.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Photo / file upload zone with thumbnail previews & delete handling ── */
export function UploadZone({
  icon,
  title,
  sub,
  accept,
  multiple = true,
  sectionTitle,
  badge,
  single,
  style,
  files: controlledFiles,
  onChange,
  existingFiles = [],
  onRemoveExisting,
  onSetCover,
  category,
  maxCount = 10,
}) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [internalFiles, setInternalFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const isControlled = Array.isArray(controlledFiles) && typeof onChange === 'function';
  const currentFiles = isControlled ? controlledFiles : internalFiles;

  const setFiles = (updater) => {
    if (isControlled) {
      const next = typeof updater === 'function' ? updater(currentFiles) : updater;
      onChange(next);
    } else {
      setInternalFiles(updater);
    }
  };

  const validateFile = (file) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isVideo = category === 'VIDEO' || file.type.startsWith('video/');

    if (isVideo) {
      if (!['mp4', 'mov'].includes(ext) && !['video/mp4', 'video/quicktime'].includes(file.type)) {
        showToast(`Invalid video format for "${file.name}". Only MP4 and MOV are supported.`, 'error');
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        showToast(`Video "${file.name}" exceeds the 100MB limit.`, 'error');
        return false;
      }
      return true;
    }

    // Photo validation
    if (['heic', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) {
      showToast(`Format .${ext} is not supported. Please upload standard JPG or PNG images.`, 'error');
      return false;
    }
    if (!['jpg', 'jpeg', 'png'].includes(ext) && !['image/jpeg', 'image/png'].includes(file.type)) {
      showToast(`Invalid image file "${file.name}". Only JPG and PNG are supported.`, 'error');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Photo "${file.name}" exceeds the 10MB limit.`, 'error');
      return false;
    }
    return true;
  };

  const add = (list) => {
    const arr = Array.from(list);
    if (!arr.length) return;

    const valid = arr.filter(validateFile);
    if (!valid.length) return;

    const currentTotal = existingFiles.length + currentFiles.length;
    if (currentTotal >= maxCount) {
      showToast(`Limit reached: maximum ${maxCount} files allowed.`, 'error');
      return;
    }

    const availableSlots = maxCount - currentTotal;
    const toAdd = single ? valid.slice(0, 1) : valid.slice(0, availableSlots);

    if (toAdd.length < valid.length) {
      showToast(`Only ${toAdd.length} file(s) added to stay within the limit of ${maxCount}.`, 'warning');
    } else {
      showToast(`${toAdd.length} ${toAdd.length === 1 ? 'file' : 'files'} added.`, 'success');
    }

    setFiles((prev) => (single ? toAdd : [...prev, ...toAdd]));
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const previews = useMemo(
    () =>
      currentFiles.map((f) => ({
        name: f.name,
        size: f.size,
        file: f,
        url: f.type?.startsWith('image/') || /\.(jpe?g|png)$/i.test(f.name) ? URL.createObjectURL(f) : null,
      })),
    [currentFiles],
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [previews]);

  return (
    <div className="upload-section" style={style}>
      {sectionTitle && (
        <div className="upload-section-title">
          {sectionTitle} {badge}
        </div>
      )}
      <div
        className={cn('upload-zone', dragging && 'dragover')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
      >
        <div className="upload-icon">{icon}</div>
        <div className="upload-title">{title}</div>
        <div className="upload-sub">{sub}</div>
      </div>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Previews: Existing files + Newly added files */}
      {(existingFiles.length > 0 || previews.length > 0) && (
        <div
          className="upload-preview"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}
        >
          {/* 1. Existing Media from DB */}
          {existingFiles.map((item) => (
            <div
              key={`existing-${item.id}`}
              style={{
                position: 'relative',
                width: 84,
                height: 84,
                borderRadius: 10,
                overflow: 'hidden',
                border: item.isCover ? '2px solid var(--teal, #0d9488)' : '1px solid var(--border-medium, #cbd5e1)',
                background: 'var(--cream-warm, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--ink-faint, #64748b)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.originalName || 'Listing photo'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ padding: 4, textAlign: 'center' }}>{item.originalName || 'Media'}</span>
              )}
              {item.isCover && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    left: 3,
                    background: 'var(--teal, #0d9488)',
                    color: '#fff',
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: '1.5px 5px',
                    borderRadius: 4,
                    letterSpacing: 0.3,
                  }}
                >
                  COVER
                </div>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  title="Remove this photo"
                  aria-label="Remove photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExisting(item.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* 2. Newly Added Files */}
          {previews.map((p, i) => (
            <div
              key={`new-${i}`}
              style={{
                position: 'relative',
                width: 84,
                height: 84,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--border-medium, #cbd5e1)',
                background: 'var(--cream-warm, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--ink-faint, #64748b)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ padding: 4, textAlign: 'center', wordBreak: 'break-all' }}>{p.name}</span>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 3,
                  left: 3,
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#fff',
                  fontSize: 8.5,
                  padding: '1.5px 4px',
                  borderRadius: 3,
                }}
              >
                NEW
              </div>
              <button
                type="button"
                title="Remove this file"
                aria-label="Remove file"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const BOOKING_DURATION_UNITS = [
  { value: 'DAYS', label: 'Days' },
  { value: 'WEEKS', label: 'Weeks' },
  { value: 'MONTHS', label: 'Months' },
];

export function MinBookingInput() {
  const { field, setField } = useRegister();
  const value = field('f_minBookingValue') ?? '';
  const unit = field('f_minBookingUnit') || 'MONTHS';
  const { error, show, invalidClass, onBlur } = useFieldError('f_minBookingValue', [
    v.required('Please enter a minimum booking duration.'),
    v.range(1, 1000, 'Must be at least 1.'),
  ]);

  return (
    <div className="form-group">
      <FieldLabel label="Minimum Booking Duration" required />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          min="1"
          step="1"
          className={cn('form-control', invalidClass)}
          style={{ flex: 1, minWidth: 0 }}
          placeholder="1"
          value={value}
          onChange={(e) => setField('f_minBookingValue', e.target.value)}
          onBlur={onBlur}
        />
        <select
          className="form-control"
          style={{ flex: 1.2, minWidth: 0 }}
          value={unit}
          onChange={(e) => setField('f_minBookingUnit', e.target.value)}
        >
          {BOOKING_DURATION_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      {show ? (
        <FieldError show={show} error={error} />
      ) : (
        <div className="form-hint">E.g., 15 Days, 2 Weeks, or 1 Month</div>
      )}
    </div>
  );
}
