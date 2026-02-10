import React, { useState, useRef } from 'react';
import './HowItWorks.css';

// Small reusable component that renders a horizontal 4-step flow (number circles, arrows, titles, descriptions)
const ProcessSteps = ({ steps }) => {
  return (
    <div className="process-steps">
      {steps.map((s, i) => (
        <div key={i} className="step-wrapper">
          <div className="step-item">
            <div className="step-number">{i + 1}</div>
            <div className="step-content">
              <h3 className="step-title">{s.title}</h3>
              <p className="step-description">{s.description}</p>
            </div>
          </div>
          {i !== steps.length - 1 && (
            <div className="howit-step-connector" aria-hidden>
              <svg width="60" height="12" viewBox="0 0 60 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 6h48" stroke="#d8e3ee" strokeWidth="2" strokeLinecap="round" />
                <path d="M52 2l6 4-6 4" stroke="#d8e3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const HowItWorks = () => {
  // Visual process steps (kept for graphics)
  const serviceProviderSteps = [
    { title: 'Upload portfolio', description: 'Add your portfolio to showcase services.' },
    { title: 'Accept requests', description: 'Handle incoming requests from businesses.' },
    { title: 'Manage bookings', description: 'Coordinate schedules and bookings efficiently.' },
    { title: 'Deliver service', description: 'Complete the job and collect feedback.' },
  ];

  const businessOwnersOption1 = [
    { title: 'Choose Location', description: 'Pick locations that fit your target audience.' },
    { title: 'Select Duration', description: 'Choose campaign dates and duration.' },
    { title: 'Select Billboards', description: 'Pick from available billboard inventory.' },
    { title: 'Get the best package', description: 'Receive curated package recommendations.' },
  ];

  const businessOwnersOption2 = [
    { title: 'Decide budget', description: 'Set your campaign budget.' },
    { title: 'Choose Duration', description: 'Specify the campaign timeframe.' },
    { title: 'Open Tender', description: 'Invite billboard owners to bid.' },
    { title: 'Finalize portfolios', description: 'Select winning billboard owners and connect.' },
  ];

  const billboardOwnersOption1 = [
    { title: 'Upload portfolio', description: 'Showcase billboards with photos and specs.' },
    { title: 'Configure availability', description: 'Set available dates and pricing.' },
    { title: 'Receive requests', description: 'Accept ad posting requests from advertisers.' },
    { title: 'Finalize advertisers', description: 'Approve and schedule ad campaigns.' },
  ];

  const billboardOwnersOption2 = [
    { title: 'Participate in Tender', description: 'Bid on advertiser tenders.' },
    { title: 'Upload portfolio', description: 'Keep portfolio up-to-date for visibility.' },
    { title: 'Get offers', description: 'Receive offers and negotiate terms.' },
    { title: 'Confirm bookings', description: 'Accept offers and schedule campaigns.' },
  ];

  const tabs = [
    {
      id: 'service-provider',
      title: 'Service Provider',
      content: <ProcessSteps steps={serviceProviderSteps} />,
    },
    {
      id: 'business-owners',
      title: 'Business Owners',
      content: (
        <div>
          <h4 className="process-option-title">Option 1</h4>
          <ProcessSteps steps={businessOwnersOption1} />

          <h4 className="process-option-title">Option 2</h4>
          <ProcessSteps steps={businessOwnersOption2} />
        </div>
      ),
    },
    {
      id: 'billboard-owners',
      title: 'Billboard Owners',
      content: (
        <div>
          <h4 className="process-option-title">Option 1</h4>
          <ProcessSteps steps={billboardOwnersOption1} />

          <h4 className="process-option-title">Option 2</h4>
          <ProcessSteps steps={billboardOwnersOption2} />
        </div>
      ),
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0); // default first tab
  const tabsRef = useRef([]);

  const onKeyDown = (e) => {
    const max = tabs.length;
    if (e.key === 'ArrowRight') {
      setActiveIndex((i) => (i + 1) % max);
      const next = (activeIndex + 1) % max;
      tabsRef.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      setActiveIndex((i) => (i - 1 + max) % max);
      const prev = (activeIndex - 1 + max) % max;
      tabsRef.current[prev]?.focus();
    }
  };

  return (
    <section className="howitworks-section">
      <div className="howitworks-container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">Get your billboard campaign live in just a few simple steps</p>
        </div>

        <div className="howitworks">
          <div role="tablist" aria-label="How it works tabs" className="howitworks__tabs">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                ref={(el) => (tabsRef.current[idx] = el)}
                role="tab"
                aria-selected={activeIndex === idx}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`howitworks__tab ${activeIndex === idx ? 'howitworks__tab--active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={onKeyDown}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <div className="howitworks__panels">
            {tabs.map((tab, idx) => (
              <section
                key={tab.id}
                id={`panel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={activeIndex !== idx}
                className={`howitworks__panel ${activeIndex === idx ? '' : 'howitworks__panel--hidden'}`}
              >
                {tab.content}
              </section>
            ))}
          </div>

          
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

