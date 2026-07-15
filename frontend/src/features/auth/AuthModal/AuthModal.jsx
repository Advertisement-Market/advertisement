import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

function TabBar({ active, onSwitch }) {
  return (
    <div className="tab-bar">
      <button
        className={cn('tab-btn', active === 'login' && 'active')}
        onClick={() => onSwitch('login')}
      >
        Sign In
      </button>
      <button
        className={cn('tab-btn', active === 'register' && 'active')}
        onClick={() => onSwitch('register')}
      >
        Create Account
      </button>
    </div>
  );
}

function LoginView({ onSwitch, onSubmit, submitClass }) {
  return (
    <>
      <h3>Welcome back</h3>
      <p className="sub">Sign in to your AdBasket account.</p>
      <TabBar active="login" onSwitch={onSwitch} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" className="form-control" placeholder="you@company.com" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control" placeholder="Your password" required />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--ink-mid)',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" style={{ accentColor: 'var(--gold)' }} /> Remember me
          </label>
          <a href="#" style={{ fontSize: 13, color: 'var(--gold-dim)' }}>
            Forgot password?
          </a>
        </div>
        <button type="submit" className={cn(submitClass, 'form-submit')}>
          Sign In
        </button>
      </form>
      <p className="form-footer">
        No account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitch('register');
          }}
        >
          Register free
        </a>
      </p>
    </>
  );
}

function RegisterView({ onSwitch, onSubmit, submitClass }) {
  return (
    <>
      <h3>Create your account</h3>
      <p className="sub">Free to join. Browse 12,000+ billboard spaces.</p>
      <TabBar active="register" onSwitch={onSwitch} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" className="form-control" placeholder="Rahul" required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" className="form-control" placeholder="Sharma" required />
          </div>
        </div>
        <div className="form-group">
          <label>Business Email</label>
          <input type="email" className="form-control" placeholder="you@company.com" required />
        </div>
        <div className="form-group">
          <label>Phone (+91)</label>
          <input
            type="tel"
            className="form-control"
            placeholder="+91 98765 43210"
            required
            pattern="[0-9+\-\s]{10,15}"
            title="Enter a valid phone number"
          />
        </div>
        <div className="form-group">
          <label>I am a</label>
          <select className="form-control" defaultValue="" required>
            <option value="">Select your role</option>
            <option>Business / Brand (Advertiser)</option>
            <option>Billboard Owner</option>
            <option>Ad Agency / Service Provider</option>
          </select>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Min 8 characters"
            required
            minLength={8}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 12.5,
              color: 'var(--ink-mid)',
              cursor: 'pointer',
              fontWeight: 300,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              required
              style={{ accentColor: 'var(--gold)', marginTop: 2, flexShrink: 0 }}
            />{' '}
            I agree to the{' '}
            <a href="#" style={{ color: 'var(--gold-dim)' }}>
              Terms &amp; Privacy Policy
            </a>
          </label>
        </div>
        <button type="submit" className={cn(submitClass, 'form-submit')}>
          Create Free Account
        </button>
      </form>
      <p className="form-footer">
        Already registered?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitch('login');
          }}
        >
          Sign in
        </a>
      </p>
    </>
  );
}

function SuccessView({ onBrowse, submitVariant }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(201,148,58,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 style={{ marginBottom: 8 }}>You're in!</h3>
      <p className="sub" style={{ marginBottom: 28 }}>
        Check your email to verify your account. You can start browsing right now.
      </p>
      <Button
        variant={submitVariant}
        to={ROUTES.browse}
        onClick={onBrowse}
        style={{ fontSize: 15, padding: '13px 28px', display: 'inline-flex' }}
      >
        Browse Billboards
      </Button>
    </div>
  );
}

function GateView({ onSignIn, onRegister }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'var(--indigo-light, #EEF2FF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h3 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 8 }}>
        Registration required
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: '#9CA3AF',
          fontWeight: 300,
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        You need to register as an advertiser before posting a campaign. It&apos;s free and takes
        just a few minutes.
      </p>
      <Button
        variant="primary"
        to={ROUTES.advertiserRegister}
        onClick={onRegister}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '13px 28px',
          borderRadius: 12,
        }}
      >
        Register as Advertiser →
      </Button>
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#9CA3AF',
          fontWeight: 300,
          marginTop: 14,
        }}
      >
        Already registered?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSignIn();
          }}
          style={{ color: '#3730A3' }}
        >
          Sign in →
        </a>
      </p>
    </div>
  );
}

/**
 * Global auth modal. Rendered inside the page scope so it inherits page styling.
 * Views: login / register / success / gate. Closes on overlay click and Escape.
 */
export function AuthModal({ submitVariant = 'amber' }) {
  const { view, close, setView } = useAuthModal();
  const { showToast } = useToast();
  const navigate = useNavigate();
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

  const handleLogin = () => {
    showToast('Welcome back — redirecting to your dashboard…');
    setTimeout(() => {
      close();
      navigate(ROUTES.advertiserDashboard);
    }, 1200);
  };

  return (
    <div
      className={cn('modal-overlay', open && 'open')}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-hidden={!open}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={close} aria-label="Close">
          &times;
        </button>
        <div>
          {view === 'login' && (
            <LoginView onSwitch={setView} onSubmit={handleLogin} submitClass={submitClass} />
          )}
          {view === 'register' && (
            <RegisterView
              onSwitch={setView}
              onSubmit={() => setView('success')}
              submitClass={submitClass}
            />
          )}
          {view === 'success' && <SuccessView onBrowse={close} submitVariant={submitVariant} />}
          {view === 'gate' && <GateView onSignIn={() => setView('login')} onRegister={close} />}
        </div>
      </div>
    </div>
  );
}
