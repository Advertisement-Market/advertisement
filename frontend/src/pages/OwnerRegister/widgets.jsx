import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import * as v from '@/lib/validators';
import { useRegister, useFieldError, FieldError } from '@/features/register';

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
          key={opt.label}
          className={cn('type-option', value === opt.label && 'selected')}
          onClick={() => setField(name, opt.label)}
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
      {value === 'other' && (
        <input
          type="text"
          className="form-control"
          placeholder="Describe"
          style={{ marginTop: 8 }}
          value={field(otherName)}
          onChange={(e) => setField(otherName, e.target.value.replace(/[0-9]/g, ''))}
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

/* ── Photo / file upload zone with thumbnail previews ── */
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
}) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const add = (list) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    setFiles((prev) => (single ? arr.slice(0, 1) : [...prev, ...arr]));
    showToast(`${arr.length} ${arr.length === 1 ? 'file' : 'files'} added.`, 'success');
  };

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  return (
    <div className="upload-section" style={style}>
      {sectionTitle && (
        <div className="upload-section-title">
          {sectionTitle} {badge}
        </div>
      )}
      <div
        className={cn('upload-zone', dragging && 'dragover')}
        onClick={() => inputRef.current.click()}
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
        onChange={(e) => add(e.target.files)}
      />
      {previews.length > 0 && (
        <div
          className="upload-preview"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}
        >
          {previews.map((p, i) => (
            <div
              key={i}
              style={{
                width: 78,
                height: 78,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--border-medium)',
                background: 'var(--cream-warm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--ink-faint)',
                padding: 4,
                textAlign: 'center',
              }}
            >
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                p.name
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
