import { Reveal } from '@/components/ui/Reveal';
import { HOW_STEPS } from '@/data/landing';

const STEP_ICONS = [
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </>,
  <>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </>,
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>,
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>,
];

export function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="section-header" style={{ textAlign: 'center' }}>
        <span className="section-eyebrow">How The AdBasket Works</span>
        <h2 className="section-heading" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          From search to live campaign in 4 steps.
        </h2>
      </div>

      <div className="how-grid">
        {HOW_STEPS.map((step, i) => (
          <Reveal as="div" className="how-step" index={i} key={step.num}>
            <span className="how-step-num">{step.num}</span>
            <div className="how-step-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {STEP_ICONS[i]}
              </svg>
            </div>
            <div className="how-step-title">{step.title}</div>
            <div className="how-step-desc">{step.desc}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
