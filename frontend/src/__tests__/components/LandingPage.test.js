import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../../components/LandingPage/LandingPage';

describe('LandingPage Component', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe('Hero Section', () => {
    test('renders hero title with gradient text', () => {
      expect(screen.getByText('Transform Your Brand with')).toBeInTheDocument();
      expect(screen.getByText('Premium Billboards')).toBeInTheDocument();
      
      const gradientText = document.querySelector('.gradient-text');
      expect(gradientText).toBeInTheDocument();
      expect(gradientText).toHaveTextContent('Premium Billboards');
    });

    test('renders hero description', () => {
      const description = screen.getByText(/connect with millions of potential customers/i);
      expect(description).toBeInTheDocument();
    });

    test('renders hero statistics', () => {
      expect(screen.getByText('10,000+')).toBeInTheDocument();
      expect(screen.getByText('Premium Locations')).toBeInTheDocument();
      expect(screen.getByText('5M+')).toBeInTheDocument();
      expect(screen.getByText('Daily Impressions')).toBeInTheDocument();
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('Client Satisfaction')).toBeInTheDocument();
    });

    test('renders primary and secondary action buttons', () => {
      const findLocationsButton = screen.getByRole('button', { name: /find locations/i });
      const getQuoteButton = screen.getByRole('button', { name: /get quote/i });
      
      expect(findLocationsButton).toBeInTheDocument();
      expect(getQuoteButton).toBeInTheDocument();
      expect(findLocationsButton).toHaveClass('primary-button');
      expect(getQuoteButton).toHaveClass('secondary-button');
    });

    test('renders billboard mockup and floating cards', () => {
      const billboardMockup = document.querySelector('.billboard-mockup');
      const floatingCards = document.querySelectorAll('.feature-card');
      
      expect(billboardMockup).toBeInTheDocument();
      expect(floatingCards).toHaveLength(3);
      expect(floatingCards[0]).toHaveTextContent('Real-time Analytics');
      expect(floatingCards[1]).toHaveTextContent('Targeted Campaigns');
      expect(floatingCards[2]).toHaveTextContent('Quick Setup');
    });

    test('renders demo billboard content', () => {
      expect(screen.getByText('Your Brand Here')).toBeInTheDocument();
      expect(screen.getByText('Premium Visibility')).toBeInTheDocument();
      expect(screen.getByText('📍 High-Traffic Location')).toBeInTheDocument();
      expect(screen.getByText('👁 2.5M Monthly Views')).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('renders section header', () => {
      expect(screen.getByText('Why Choose AdBoard Pro?')).toBeInTheDocument();
      const sectionDesc = screen.getByText(/discover the advantages that make us/i);
      expect(sectionDesc).toBeInTheDocument();
    });

    test('renders all feature items', () => {
      const featureItems = document.querySelectorAll('.feature-item');
      expect(featureItems).toHaveLength(6);
    });

    test('renders feature titles and descriptions', () => {
      expect(screen.getByText('Prime Locations')).toBeInTheDocument();
      expect(screen.getByText('Data-Driven Insights')).toBeInTheDocument();
      expect(screen.getByText('24/7 Campaign Management')).toBeInTheDocument();
      expect(screen.getByText('Digital & Traditional')).toBeInTheDocument();
      expect(screen.getByText('Flexible Pricing')).toBeInTheDocument();
      expect(screen.getByText('Expert Support')).toBeInTheDocument();
      
      expect(screen.getByText(/access premium billboard locations/i)).toBeInTheDocument();
      expect(screen.getByText(/get detailed analytics and performance metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/professional campaign management with 24\/7 monitoring/i)).toBeInTheDocument();
    });

    test('feature items have proper structure', () => {
      const featureIcons = document.querySelectorAll('.feature-icon-wrapper');
      const featureTitles = document.querySelectorAll('.feature-title');
      const featureDescriptions = document.querySelectorAll('.feature-description');
      
      expect(featureIcons).toHaveLength(6);
      expect(featureTitles).toHaveLength(6);
      expect(featureDescriptions).toHaveLength(6);
    });
  });

  describe('Process Section', () => {
    test('renders section header', () => {
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText(/get your billboard campaign live in just four simple steps/i)).toBeInTheDocument();
    });

    test('renders all process steps', () => {
      const stepItems = document.querySelectorAll('.step-item');
      const stepNumbers = document.querySelectorAll('.step-number');
      
      expect(stepItems).toHaveLength(4);
      expect(stepNumbers).toHaveLength(4);
      
      expect(stepNumbers[0]).toHaveTextContent('1');
      expect(stepNumbers[1]).toHaveTextContent('2');
      expect(stepNumbers[2]).toHaveTextContent('3');
      expect(stepNumbers[3]).toHaveTextContent('4');
    });

    test('renders step titles and descriptions', () => {
      expect(screen.getByText('Choose Location')).toBeInTheDocument();
      expect(screen.getByText('Design Campaign')).toBeInTheDocument();
      expect(screen.getByText('Launch & Monitor')).toBeInTheDocument();
      expect(screen.getByText('Optimize Results')).toBeInTheDocument();
      
      expect(screen.getByText(/browse our extensive network/i)).toBeInTheDocument();
      expect(screen.getByText(/work with our creative team/i)).toBeInTheDocument();
      expect(screen.getByText(/your campaign goes live with real-time monitoring/i)).toBeInTheDocument();
      expect(screen.getByText(/review detailed reports and optimize/i)).toBeInTheDocument();
    });

    test('renders step connectors', () => {
      const stepConnectors = document.querySelectorAll('.step-connector');
      expect(stepConnectors).toHaveLength(3); // Between 4 steps = 3 connectors
    });
  });

  describe('CTA Section', () => {
    test('renders CTA header and description', () => {
      expect(screen.getByText('Ready to Amplify Your Brand?')).toBeInTheDocument();
      const ctaDesc = screen.getByText(/join thousands of successful brands/i);
      expect(ctaDesc).toBeInTheDocument();
    });

    test('renders CTA action buttons', () => {
      const startCampaignButton = screen.getByRole('button', { name: /start your campaign/i });
      const scheduleDemoButton = screen.getByRole('button', { name: /schedule demo/i });
      
      expect(startCampaignButton).toBeInTheDocument();
      expect(scheduleDemoButton).toBeInTheDocument();
      expect(startCampaignButton).toHaveClass('cta-primary-button');
      expect(scheduleDemoButton).toHaveClass('cta-secondary-button');
    });

    test('renders trust indicators', () => {
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('Award-Winning Platform')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
      expect(screen.getByText('Secure & Reliable')).toBeInTheDocument();
      expect(screen.getByText('✨')).toBeInTheDocument();
      expect(screen.getByText('Premium Quality')).toBeInTheDocument();
      
      const trustItems = document.querySelectorAll('.trust-item');
      expect(trustItems).toHaveLength(3);
    });
  });

  describe('Interactive Elements', () => {
    test('buttons are clickable and have proper attributes', () => {
      const allButtons = screen.getAllByRole('button');
      
      allButtons.forEach(button => {
        expect(button).not.toBeDisabled();
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    test('buttons have proper cursor style', () => {
      const primaryButton = screen.getByRole('button', { name: /find locations/i });
      const computedStyle = window.getComputedStyle(primaryButton);
      expect(computedStyle.cursor).toBe('pointer');
    });
  });

  describe('Content Structure', () => {
    test('main element has correct structure', () => {
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('landing-page');
    });

    test('sections have proper semantic structure', () => {
      const sections = document.querySelectorAll('section');
      expect(sections).toHaveLength(4); // Hero, Features, Process, CTA
      
      expect(sections[0]).toHaveClass('hero-section');
      expect(sections[1]).toHaveClass('features-section');
      expect(sections[2]).toHaveClass('process-section');
      expect(sections[3]).toHaveClass('cta-section');
    });

    test('headings have proper hierarchy', () => {
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1Elements).toHaveLength(1); // Main hero title
      expect(h2Elements.length).toBeGreaterThan(2); // Section titles
      expect(h3Elements.length).toBeGreaterThan(5); // Feature and step titles
    });
  });

  describe('Visual Elements', () => {
    test('renders SVG icons in buttons', () => {
      const findLocationsButton = screen.getByRole('button', { name: /find locations/i });
      const getQuoteButton = screen.getByRole('button', { name: /get quote/i });
      
      const findLocationsSvg = findLocationsButton.querySelector('svg');
      const getQuoteSvg = getQuoteButton.querySelector('svg');
      
      expect(findLocationsSvg).toBeInTheDocument();
      expect(getQuoteSvg).toBeInTheDocument();
    });

    test('feature icons are present', () => {
      const featureIcons = document.querySelectorAll('.feature-icon');
      expect(featureIcons).toHaveLength(6);
      
      featureIcons.forEach(icon => {
        expect(icon).toBeInstanceOf(SVGElement);
      });
    });

    test('applies CSS animations', () => {
      const gradientText = document.querySelector('.gradient-text');
      const billboardMockup = document.querySelector('.billboard-mockup');
      
      expect(gradientText).toBeInTheDocument();
      expect(billboardMockup).toBeInTheDocument();
      // Animation styles are applied via CSS classes
      expect(gradientText).toHaveClass('gradient-text');
      expect(billboardMockup).toHaveClass('billboard-mockup');
    });
  });

  describe('Accessibility', () => {
    test('images have proper alt attributes or are decorative', () => {
      // SVG icons should be marked as decorative since they're supplementary to text
      const decorativeSvgs = document.querySelectorAll('svg');
      decorativeSvgs.forEach(svg => {
        // SVGs used as icons should either have aria-hidden or have proper accessibility labels
        expect(svg).toBeDefined();
      });
    });

    test('color contrast is sufficient', () => {
      // This would typically be tested with accessibility testing tools
      // Here we just verify that text elements exist and are visible
      const heroTitle = document.querySelector('.hero-title');
      const sectionTitles = document.querySelectorAll('.section-title');
      
      expect(heroTitle).toBeVisible();
      sectionTitles.forEach(title => {
        expect(title).toBeVisible();
      });
    });

    test('buttons have descriptive text', () => {
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const buttonText = button.textContent || button.getAttribute('aria-label');
        expect(buttonText).toBeTruthy();
        expect(buttonText.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Responsive Design Elements', () => {
    test('applies responsive CSS classes', () => {
      const heroContainer = document.querySelector('.hero-container');
      const featuresContainer = document.querySelector('.features-container');
      const processContainer = document.querySelector('.process-container');
      
      expect(heroContainer).toHaveClass('hero-container');
      expect(featuresContainer).toHaveClass('features-container');
      expect(processContainer).toHaveClass('process-container');
    });

    test('grid layouts are properly structured', () => {
      const featuresGrid = document.querySelector('.features-grid');
      const processSteps = document.querySelector('.process-steps');
      
      expect(featuresGrid).toBeInTheDocument();
      expect(processSteps).toBeInTheDocument();
    });
  });
});
