import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../components/Footer/Footer';

describe('Footer Component', () => {
  beforeEach(() => {
    render(<Footer />);
  });

  describe('Company Branding', () => {
    test('renders company logo and name', () => {
      expect(screen.getByText('AdBoard Pro')).toBeInTheDocument();
      const logo = document.querySelector('.footer-logo svg');
      expect(logo).toBeInTheDocument();
    });

    test('renders company description', () => {
      const description = screen.getByText(/connecting premium billboard owners/i);
      expect(description).toBeInTheDocument();
    });

    test('renders social media links', () => {
      const socialLinks = document.querySelectorAll('.social-link');
      expect(socialLinks).toHaveLength(4);
      
      socialLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Footer Sections', () => {
    test('renders Services section with links', () => {
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Billboard Rental' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Digital Displays' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Transit Advertising' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Street Furniture' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Mobile Billboards' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Campaign Management' })).toBeInTheDocument();
    });

    test('renders Resources section with links', () => {
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pricing Calculator' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Location Finder' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Case Studies' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Advertising Guide' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Market Insights' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Help Center' })).toBeInTheDocument();
    });

    test('renders Company section with links', () => {
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'About Us' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Careers' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Press & Media' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Partners' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Investors' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();
    });

    test('renders Legal section with links', () => {
      expect(screen.getByText('Legal')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cookie Policy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Compliance' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Accessibility' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'GDPR' })).toBeInTheDocument();
    });
  });

  describe('Newsletter Section', () => {
    test('renders newsletter signup form', () => {
      expect(screen.getByText('Stay Updated')).toBeInTheDocument();
      expect(screen.getByText(/get the latest industry insights/i)).toBeInTheDocument();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
      
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(subscribeButton).toBeInTheDocument();
    });

    test('allows user to enter email address', () => {
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('renders subscribe button with icon', () => {
      const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
      expect(subscribeButton).toBeInTheDocument();
      
      const icon = subscribeButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('newsletter-icon');
    });
  });

  describe('Footer Bottom', () => {
    test('renders copyright with current year', () => {
      const currentYear = new Date().getFullYear();
      const copyrightText = screen.getByText(new RegExp(`© ${currentYear} AdBoard Pro. All rights reserved.`));
      expect(copyrightText).toBeInTheDocument();
    });

    test('renders bottom links with separators', () => {
      expect(screen.getByRole('link', { name: 'Sitemap' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Support' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Security' })).toBeInTheDocument();
      
      const separators = document.querySelectorAll('.separator');
      expect(separators).toHaveLength(2);
    });
  });

  describe('Links and Navigation', () => {
    test('all footer links have proper href attributes', () => {
      const allLinks = screen.getAllByRole('link');
      
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toMatch(/^#/); // All should be anchor links
      });
    });

    test('social links have aria-labels for accessibility', () => {
      const socialLinks = document.querySelectorAll('.social-link');
      const labels = ['Facebook', 'Twitter', 'LinkedIn', 'Instagram'];
      
      socialLinks.forEach((link, index) => {
        expect(link).toHaveAttribute('aria-label', labels[index]);
      });
    });
  });

  describe('Form Handling', () => {
    test('newsletter form submission', () => {
      const form = document.querySelector('.newsletter-form');
      expect(form).toBeInTheDocument();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      
      expect(emailInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    test('required email validation works', () => {
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      expect(emailInput).toBeRequired();
    });
  });

  describe('Responsive Design', () => {
    test('applies correct CSS classes', () => {
      const footer = document.querySelector('.footer');
      const footerContainer = document.querySelector('.footer-container');
      const newsletterSection = document.querySelector('.newsletter-section');
      const footerBottom = document.querySelector('.footer-bottom');
      
      expect(footer).toHaveClass('footer');
      expect(footerContainer).toHaveClass('footer-container');
      expect(newsletterSection).toHaveClass('newsletter-section');
      expect(footerBottom).toHaveClass('footer-bottom');
    });

    test('footer sections have proper structure', () => {
      const footerSections = document.querySelectorAll('.footer-section');
      expect(footerSections.length).toBeGreaterThan(4); // Company info + 4 link sections
    });
  });

  describe('Content Structure', () => {
    test('footer titles have proper hierarchy', () => {
      const footerTitles = screen.getAllByRole('heading', { level: 4 });
      expect(footerTitles.length).toBeGreaterThan(4); // Services, Resources, Company, Legal, etc.
    });

    test('footer lists are properly structured', () => {
      const footerLists = document.querySelectorAll('.footer-links');
      expect(footerLists.length).toBeGreaterThan(3);
      
      footerLists.forEach(list => {
        const listItems = list.querySelectorAll('li');
        expect(listItems.length).toBeGreaterThan(0);
      });
    });
  });
});
