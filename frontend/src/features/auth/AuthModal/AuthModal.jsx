import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/features/auth/GoogleButton';

// Common country dialling codes (label kept ASCII — flag emoji don't render on Windows).
const DIAL_CODES = [
  ['+91', 'IN +91'],
  ['+1', 'US +1'],
  ['+44', 'UK +44'],
  ['+61', 'AU +61'],
  ['+971', 'AE +971'],
  ['+65', 'SG +65'],
  ['+880', 'BD +880'],
  ['+92', 'PK +92'],
];

const EyeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.06-4.94M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19M1 1l22 22" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

/** Password field with a temporary show/hide (eye) toggle. Uncontrolled — value flows via FormData. */
function PasswordInput({ name, placeholder, minLength, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        className="form-control"
        placeholder={placeholder}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', top: 0, bottom: 0, right: 6, margin: 'auto',
          height: 30, width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', padding: 0,
        }}
      >
        {show ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  );
}

function OrDivider({ label = 'or continue with email' }) {
  const line = { flex: 1, height: 1, background: 'var(--border-cream, rgba(0,0,0,0.12))' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <span style={line} />
      <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 400, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={line} />
    </div>
  );
}

function TabBar({ active, onSwitch }) {
  return (
    <div className="tab-bar">
      <button className={cn('tab-btn', active === 'login' && 'active')} onClick={() => onSwitch('login')}>
        Sign In
      </button>
      <button className={cn('tab-btn', active === 'register' && 'active')} onClick={() => onSwitch('register')}>
        Create Account
      </button>
    </div>
  );
}

function LoginView({ onSwitch, onSubmit, onGoogle, submitClass, submitting }) {
  return (
    <>
      <h3>Welcome back</h3>
      <p className="sub">Sign in to your AdBasket account.</p>
      <TabBar active="login" onSwitch={onSwitch} />
      <GoogleButton onCredential={onGoogle} text="signin_with" />
      <OrDivider />
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" className="form-control" placeholder="you@company.com" autoComplete="email" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput name="password" placeholder="Your password" autoComplete="current-password" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-mid)', cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--gold)' }} /> Remember me
          </label>
          <a href="#" style={{ fontSize: 13, color: 'var(--gold-dim)' }} onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>
        </div>
        <button type="submit" className={cn(submitClass, 'form-submit')} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="form-footer">
        No account?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitch('register'); }}>Register free</a>
      </p>
    </>
  );
}

function RegisterView({ onSwitch, onSubmit, onGoogle, submitClass, submitting }) {
  return (
    <>
      <h3>Create your account</h3>
      <p className="sub">Free to join. Browse 12,000+ billboard spaces.</p>
      <TabBar active="register" onSwitch={onSwitch} />
      <GoogleButton onCredential={onGoogle} text="signup_with" />
      <OrDivider label="or sign up with email" />
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" className="form-control" placeholder="Rahul" autoComplete="given-name" required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="lastName" className="form-control" placeholder="Sharma" autoComplete="family-name" required />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" className="form-control" placeholder="you@company.com" autoComplete="email" required />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select name="phoneCode" className="form-control" defaultValue="+91" style={{ flex: '0 0 104px', paddingRight: 30 }}>
              {DIAL_CODES.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <input
              type="tel" name="phoneNumber" className="form-control" placeholder="98765 43210"
              autoComplete="tel-national" inputMode="numeric" pattern="[0-9\s\-]{6,12}"
              title="Enter a valid phone number" required style={{ flex: 1 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput name="password" placeholder="Min 8 characters" minLength={8} autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-mid)', cursor: 'pointer', fontWeight: 300, lineHeight: 1.5 }}>
            <input type="checkbox" required style={{ accentColor: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />{' '}
            I agree to the{' '}
            <a href="#" style={{ color: 'var(--gold-dim)' }} onClick={(e) => e.preventDefault()}>Terms &amp; Privacy Policy</a>
          </label>
        </div>
        <button type="submit" className={cn(submitClass, 'form-submit')} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Free Account'}
        </button>
      </form>
      <p className="form-footer">
        Already registered?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitch('login'); }}>Sign in</a>
      </p>
    </>
  );
}

function SuccessView({ onBrowse, submitVariant }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(201,148,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 style={{ marginBottom: 8 }}>You&apos;re in!</h3>
      <p className="sub" style={{ marginBottom: 28 }}>
        Your account is created — you&apos;re signed in. Browse now, or register as an advertiser,
        billboard owner, or agency whenever you&apos;re ready.
      </p>
      <Button variant={submitVariant} to={ROUTES.browse} onClick={onBrowse} style={{ fontSize: 15, padding: '13px 28px', display: 'inline-flex' }}>
        Browse Billboards
      </Button>
    </div>
  );
}

function GateView({ onSignIn, onRegister }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--indigo-light, #EEF2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h3 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 8 }}>Registration required</h3>
      <p style={{ fontSize: 13.5, color: '#9CA3AF', fontWeight: 300, marginBottom: 24, lineHeight: 1.6 }}>
        You need to register as an advertiser before posting a campaign. It&apos;s free and takes just a few minutes.
      </p>
      <Button variant="primary" to={ROUTES.advertiserRegister} onClick={onRegister} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 28px', borderRadius: 12 }}>
        Register as Advertiser →
      </Button>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', fontWeight: 300, marginTop: 14 }}>
        Already registered?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }} style={{ color: '#3730A3' }}>Sign in →</a>
      </p>
    </div>
  );
}

/**
 * Global auth modal. A successful sign-in / sign-up (email or Google) just marks the user as logged
 * in and closes — it does NOT push to a dashboard. Users onboard into a marketplace role later via
 * the register wizards. Closes only via the ✕ button or Escape.
 */
export function AuthModal({ submitVariant = 'amber' }) {
  const { view, close, setView } = useAuthModal();
  const { showToast } = useToast();
  const { login, loginWithGoogle, registerBasic } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const open = view !== null;
  const submitClass = submitVariant === 'primary' ? 'btn-primary' : 'btn-amber';

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleLogin = async (formData) => {
    setSubmitting(true);
    try {
      await login(formData.get('email'), formData.get('password'));
      showToast("You're signed in.");
      close();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (idToken) => {
    setSubmitting(true);
    try {
      await loginWithGoogle(idToken);
      showToast("You're signed in with Google.");
      close();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (formData) => {
    setSubmitting(true);
    try {
      const code = formData.get('phoneCode') || '+91';
      const digits = String(formData.get('phoneNumber') || '').replace(/\D/g, '');
      await registerBasic({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: digits ? `${code} ${digits}` : '',
        password: formData.get('password'),
      });
      setView('success');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('modal-overlay auth-modal', open && 'open')} aria-hidden={!open}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={close} aria-label="Close">&times;</button>
        <div>
          {view === 'login' && (
            <LoginView onSwitch={setView} onSubmit={handleLogin} onGoogle={handleGoogle} submitClass={submitClass} submitting={submitting} />
          )}
          {view === 'register' && (
            <RegisterView onSwitch={setView} onSubmit={handleRegister} onGoogle={handleGoogle} submitClass={submitClass} submitting={submitting} />
          )}
          {view === 'success' && <SuccessView onBrowse={close} submitVariant={submitVariant} />}
          {view === 'gate' && <GateView onSignIn={() => setView('login')} onRegister={close} />}
        </div>
      </div>
    </div>
  );
}
