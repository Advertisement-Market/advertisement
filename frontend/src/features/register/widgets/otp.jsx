import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRegister } from '../RegisterContext';

const Check = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const Clock = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * OTP verify flow (demo OTP: 123456). Send → 30s resend countdown → verify.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.sendIcon
 * @param {string} props.label        initial button text
 * @param {string} props.typeLabel    "Email" | "Mobile"
 * @param {() => string} props.getDest resolves the destination for the toast
 * @param {boolean} [props.disabled]
 */
export function OtpVerify({ sendIcon, label, typeLabel, getDest, disabled }) {
  const { showToast } = useRegister();
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const send = () => {
    if (countdown > 0) return;
    setSent(true);
    setStatus(null);
    showToast(`OTP sent to ${getDest?.() || 'you'}. (Demo: use 123456)`, 'success');
    setCountdown(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const verify = () => {
    if (code.length !== 6) {
      setStatus({ type: 'error', msg: 'Please enter the 6-digit OTP.' });
      return;
    }
    if (code === '123456') {
      setVerified(true);
      clearInterval(timerRef.current);
      setStatus(null);
      showToast(
        `${typeLabel === 'Email' ? 'Email' : 'Mobile number'} verified successfully.`,
        'success',
      );
    } else {
      setStatus({ type: 'error', msg: 'Incorrect OTP. Please try again. (Hint: 123456)' });
    }
  };

  if (verified) {
    return (
      <div className="otp-verify-wrap">
        <div className="otp-send-row">
          <span className="otp-verified-badge">
            {Check} {typeLabel} Verified
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-verify-wrap">
      <div className="otp-send-row">
        <button
          type="button"
          className="btn-send-otp"
          onClick={send}
          disabled={disabled || countdown > 0}
        >
          {sent ? Clock : sendIcon}
          {sent ? 'Resend OTP' : label}
        </button>
        {countdown > 0 && <span className="otp-timer">Resend in {countdown}s</span>}
      </div>
      {sent && (
        <div className="otp-input-row" style={{ display: 'flex' }}>
          <input
            type="text"
            className="form-control"
            placeholder="— — — —"
            maxLength={6}
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="button" className="btn-verify-otp" onClick={verify}>
            {Check}
            Verify
          </button>
        </div>
      )}
      {status && <div className={cn('otp-status', status.type)}>{status.msg}</div>}
    </div>
  );
}
