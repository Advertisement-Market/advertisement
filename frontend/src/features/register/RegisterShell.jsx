import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/layout/Logo';
import { useRegister } from './RegisterContext';

const CheckIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function StepItem({ index, title, desc }) {
  const { currentStep, maxStepReached, goToStep } = useRegister();
  const step = index + 1;
  const state =
    step === currentStep
      ? 'active'
      : step < currentStep
        ? 'done'
        : step > maxStepReached
          ? 'locked'
          : '';

  return (
    <div className={cn('step-item', state)} onClick={() => goToStep(step)}>
      <div className="step-dot">
        <span className="step-dot-num">{step}</span>
        <span className="step-dot-check">{CheckIcon}</span>
      </div>
      <div className="step-info">
        <div className="step-info-title">{title}</div>
        <div className="step-info-desc">{desc}</div>
      </div>
    </div>
  );
}

/**
 * Shared registration wizard chrome: sidebar (step list + trust badges), topbar
 * (step pill, counter, cancel), progress bar, and the toast. Wizard state comes
 * from RegisterProvider; the page renders the active step (or success) as children.
 *
 * @param {object} props
 * @param {string} props.tagline            e.g. "Advertiser Registration"
 * @param {{ title: string, desc: string }[]} props.steps
 * @param {string} props.signInTo           route for the sign-in link
 * @param {string} props.cancelTo           route for the cancel link
 */
export function RegisterShell({ tagline, steps, signInTo, cancelTo, children }) {
  const { currentStep, totalSteps, submitted, toast } = useRegister();

  return (
    <div className="reg-shell">
      <aside className="reg-sidebar">
        <div className="sidebar-inner">
          <Logo className="sidebar-logo" />
          <div className="sidebar-tagline">{tagline}</div>

          <div className="steps-list">
            {steps.map((s, i) => (
              <StepItem key={s.title} index={i} title={s.title} desc={s.desc} />
            ))}
          </div>

          <div className="sidebar-trust">
            <div className="sidebar-trust-item">
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured with 256-bit SSL
            </div>
            <div className="sidebar-trust-item">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Data never shared publicly
            </div>
          </div>

          <div className="sidebar-bottom">
            <p>Already registered?</p>
            <Link to={signInTo}>
              Sign in to your account{' '}
              <svg
                width="12"
                height="12"
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
            </Link>
          </div>
        </div>
      </aside>

      <div className="reg-main">
        {!submitted && (
          <>
            <div className="reg-topbar">
              <div className="topbar-left">
                <div className="step-pill">
                  Step {currentStep} / {totalSteps}
                </div>
                <span className="step-counter">{steps[currentStep - 1]?.title}</span>
              </div>
              <Link to={cancelTo} className="cancel-link">
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancel
              </Link>
            </div>
            <div className="reg-progress">
              <div
                className="reg-progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </>
        )}

        <div className="reg-body">{children}</div>
      </div>

      <div className={cn('toast', toast.show && 'show')}>
        <div className={cn('toast-bar', toast.type)} />
        <div className="toast-text">{toast.message}</div>
      </div>
    </div>
  );
}
