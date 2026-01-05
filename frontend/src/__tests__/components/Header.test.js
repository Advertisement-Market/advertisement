import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/Header/Header';

describe('Header Component', () => {
  beforeEach(() => {
    render(<Header />);
  });

  describe('Rendering', () => {
    test('renders company name and tagline', () => {
      expect(screen.getByText('AdBoard Pro')).toBeInTheDocument();
      expect(screen.getByText('Premium Billboard Solutions')).toBeInTheDocument();
    });

    test('renders logo SVG', () => {
      const logo = document.querySelector('.logo svg');
      expect(logo).toBeInTheDocument();
    });

    test('renders search input with placeholder', () => {
      const searchInput = screen.getByPlaceholderText('Search locations, billboards...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    test('renders navigation links', () => {
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'About Us' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();
    });

    test('renders login/register button', () => {
      const loginButtons = screen.getAllByText(/login.*register/i);
      expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    });

    test('renders mobile menu toggle button', () => {
      const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
      expect(mobileMenuToggle).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('allows user to type in search input', () => {
      const searchInput = screen.getByPlaceholderText('Search locations, billboards...');
      
      fireEvent.change(searchInput, { target: { value: 'Times Square' } });
      
      expect(searchInput).toHaveValue('Times Square');
    });

    test('handles search form submission', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const searchInput = screen.getByPlaceholderText('Search locations, billboards...');
      const searchButton = screen.getByRole('button', { name: 'Search' });
      
      fireEvent.change(searchInput, { target: { value: 'Broadway' } });
      fireEvent.click(searchButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Search query:', 'Broadway');
      
      consoleSpy.mockRestore();
    });

    test('search form elements exist', () => {
      const searchForm = document.querySelector('.search-form');
      expect(searchForm).toBeInTheDocument();
      
      const searchInput = screen.getByPlaceholderText('Search locations, billboards...');
      const searchButton = screen.getByRole('button', { name: 'Search' });
      
      expect(searchInput).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Mobile Menu', () => {
    test('mobile menu is initially closed', () => {
      const mobileMenu = document.querySelector('.mobile-menu');
      expect(mobileMenu).not.toHaveClass('open');
    });

    test('toggles mobile menu when hamburger button is clicked', async () => {
      const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
      
      fireEvent.click(mobileMenuToggle);
      
      await waitFor(() => {
        const mobileMenu = document.querySelector('.mobile-menu');
        expect(mobileMenu).toHaveClass('open');
      });
      
      fireEvent.click(mobileMenuToggle);
      
      await waitFor(() => {
        const mobileMenu = document.querySelector('.mobile-menu');
        expect(mobileMenu).not.toHaveClass('open');
      });
    });

    test('renders mobile navigation links', () => {
      // Mobile menu elements might be hidden initially
      const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
      expect(mobileNavLinks.length).toBeGreaterThan(0);
    });

    test('renders mobile search input', () => {
      const mobileSearchInput = document.querySelector('.mobile-search-input');
      expect(mobileSearchInput).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('home link has active class by default', () => {
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('active');
    });

    test('navigation links have correct href attributes', () => {
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
      expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '#services');
      expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '#about');
      expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '#contact');
    });
  });

  describe('Accessibility', () => {
    test('search input is accessible', () => {
      const searchInput = screen.getByPlaceholderText('Search locations, billboards...');
      expect(searchInput).toBeVisible();
      expect(searchInput).not.toHaveAttribute('aria-label', '');
    });

    test('navigation has proper structure', () => {
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      const searchButton = screen.getByRole('button', { name: 'Search' });
      const loginButton = document.querySelector('.login-button');
      
      expect(loginButton).not.toHaveAttribute('tabindex', '-1');
      expect(searchButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Responsive Behavior', () => {
    test('applies correct CSS classes', () => {
      const header = document.querySelector('.header');
      const headerContainer = document.querySelector('.header-container');
      
      expect(header).toHaveClass('header');
      expect(headerContainer).toHaveClass('header-container');
    });
  });
});
