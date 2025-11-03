// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {render, screen} from '@testing-library/react';
import React from 'react';
import {BrowserRouter} from 'react-router-dom';
import Home from '../../pages/home';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('pages/home', () => {
  it('should render the header with logo', () => {
    renderWithRouter(<Home />);
    const logo = screen.getByAltText('PeerPrep');
    expect(logo).toBeInTheDocument();
  });

  it('should render Sign In link', () => {
    renderWithRouter(<Home />);
    const signInLink = screen.getByRole('link', {name: /sign in/i});
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('should render Get Started link', () => {
    renderWithRouter(<Home />);
    const getStartedLink = screen.getByRole('link', {name: /get started/i});
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink).toHaveAttribute('href', '/register');
  });

  it('should render main title', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText('Code Together,')).toBeInTheDocument();
    expect(screen.getByText('Learn Faster')).toBeInTheDocument();
  });

  it('should render main description', () => {
    renderWithRouter(<Home />);
    const description = screen.getByText(/practice coding interviews with peers worldwide/i);
    expect(description).toBeInTheDocument();
  });

  it('should render Start Practicing CTA button', () => {
    renderWithRouter(<Home />);
    const ctaButton = screen.getByRole('link', {name: /start practicing/i});
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/login');
  });

  it('should render all three feature cards', () => {
    renderWithRouter(<Home />);
    expect(screen.getByText('Find Your Match')).toBeInTheDocument();
    expect(screen.getByText('Targeted Practice')).toBeInTheDocument();
    expect(screen.getByText('Real-time Coding')).toBeInTheDocument();
  });

  it('should render feature icons', () => {
    renderWithRouter(<Home />);
    expect(screen.getByAltText('Find Match')).toBeInTheDocument();
    expect(screen.getByAltText('Targeted Practice')).toBeInTheDocument();
    expect(screen.getByAltText('Real-time Coding')).toBeInTheDocument();
  });

  it('should render feature descriptions', () => {
    renderWithRouter(<Home />);
    expect(
      screen.getByText(/get paired with coding partners at your skills level/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/choose from various topics and difficulty levels/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/code together in real-time with integrated voice chat/i)
    ).toBeInTheDocument();
  });

  it('should have correct structure with home-wrapper', () => {
    const {container} = renderWithRouter(<Home />);
    expect(container.querySelector('.home-wrapper')).toBeInTheDocument();
  });

  it('should have header and main sections', () => {
    const {container} = renderWithRouter(<Home />);
    expect(container.querySelector('.home-header')).toBeInTheDocument();
    expect(container.querySelector('.home-main')).toBeInTheDocument();
  });
});
