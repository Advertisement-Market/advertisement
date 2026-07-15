import { Link } from 'react-router-dom';
import { useRegister } from '../RegisterContext';

const ArrowRight = (
  <svg
    width="15"
    height="15"
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

export function ReviewBlock({ children }) {
  return <div className="review-block">{children}</div>;
}

/** A single review row with an Edit link that jumps to `editStep`. */
export function ReviewRow({ label, value, editStep }) {
  const { goToStep } = useRegister();
  return (
    <div className="review-row">
      <div className="review-label">{label}</div>
      <div className="review-value">{value || '—'}</div>
      <button className="edit-link" onClick={() => goToStep(editStep)}>
        Edit
      </button>
    </div>
  );
}

/** Terms acceptance checkbox bound to a boolean field. */
export function TermsRow({ name, children }) {
  const { field, setField } = useRegister();
  return (
    <label className="terms-row">
      <input
        type="checkbox"
        checked={!!field(name)}
        onChange={(e) => setField(name, e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function InfoBanner({ children }) {
  return (
    <div className="info-banner">
      <div className="info-banner-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div className="info-banner-text">{children}</div>
    </div>
  );
}

export function WarningBanner({ children }) {
  return (
    <div className="warning-banner">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1, color: 'var(--gold)' }}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function NotifRow({ children, defaultChecked = true }) {
  return (
    <div className="notif-row">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span>{children}</span>
    </div>
  );
}

/**
 * Post-submit success screen with a status timeline and a dashboard CTA.
 *
 * @param {object} props
 * @param {string} props.accent   CSS var used for the icon/title accent, e.g. 'var(--saffron)'
 * @param {{ icon: import('react').ReactNode, title: string, text: string }[]} props.timeline
 */
export function SuccessScreen({
  accent,
  title,
  titleEm,
  desc,
  timeline,
  dashboardTo,
  dashboardLabel,
}) {
  return (
    <div className="step-panel active">
      <div className="success-screen">
        <div className="success-icon-wrap">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="success-title">
          {title}
          {titleEm && <em style={{ fontStyle: 'italic', color: accent }}> {titleEm}</em>}
        </h1>
        <p className="success-desc">{desc}</p>
        <div className="success-timeline">
          {timeline.map((item) => (
            <div className="timeline-item" key={item.title}>
              <div className="timeline-dot">{item.icon}</div>
              <div className="timeline-text">
                <strong>{item.title}</strong>
                {item.text}
              </div>
            </div>
          ))}
        </div>
        <Link to={dashboardTo} className="btn-next btn-large" style={{ display: 'inline-flex' }}>
          {dashboardLabel}
          {ArrowRight}
        </Link>
      </div>
    </div>
  );
}
