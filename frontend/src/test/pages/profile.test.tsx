// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import * as api from '../../lib/api';
import Profile from '../../pages/profile';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api', () => ({
  resendEmail: jest.fn(),
}));

const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

const renderComponent = (mockUser: any) => {
  (useAuth as jest.Mock).mockReturnValue({user: mockUser});

  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const verifiedUser = {
  username: 'testuser',
  email: 'test@example.com',
  verified: true,
  googleOAuthVerified: false,
  githubOAuthVerified: false,
  role: 'user',
};

const unverifiedUser = {
  ...verifiedUser,
  verified: false,
  googleOAuthVerified: false,
  githubOAuthVerified: false,
};

describe('pages/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unverified Users', () => {
    it('should render email verification prompt', () => {
      renderComponent(unverifiedUser);

      expect(screen.getByText('Email verification required')).toBeInTheDocument();
      expect(screen.getByText('Please verify your email!')).toBeInTheDocument();
      expect(screen.getByText(/Please check your inbox and click on the link/)).toBeInTheDocument();

      expect(screen.getByRole('button', {name: 'Resend verification'})).toBeInTheDocument();
      expect(screen.getByRole('link', {name: /Back to Home/i})).toHaveAttribute('href', '/Home');
    });

    it('should call resendEmail and show success alert', async () => {
      (api.resendEmail as jest.Mock).mockResolvedValue({});

      renderComponent(unverifiedUser);

      fireEvent.click(screen.getByRole('button', {name: 'Resend verification'}));

      await waitFor(() => {
        expect(api.resendEmail).toHaveBeenCalledWith({email: 'test@example.com'});
        expect(mockAlert).toHaveBeenCalledWith(
          'Verification email resent! Please check your inbox'
        );
      });
    });

    it('should show alert on resendEmail failure', async () => {
      (api.resendEmail as jest.Mock).mockRejectedValue({message: 'Failed to resend'});

      renderComponent(unverifiedUser);

      fireEvent.click(screen.getByRole('button', {name: 'Resend verification'}));

      await waitFor(() => {
        expect(api.resendEmail).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Failed to resend');
      });
    });
  });

  describe('Verified Users', () => {
    it('should render main profile dashboard', () => {
      renderComponent(verifiedUser);

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Ready to sharpen your coding skills today?')).toBeInTheDocument();

      // Stats
      expect(screen.getByText('Sessions Completed')).toBeInTheDocument();
      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
      expect(screen.getByText('Hours Practiced')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();

      // Quick actions
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Find Match')).toBeInTheDocument();
      expect(screen.getByText('Question Settings')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Start'})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Reset'})).toBeInTheDocument();

      // Recent Activity
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should show "Manage Admins" button for admin user', () => {
      renderComponent({...verifiedUser, role: 'admin'});

      const adminLink = screen.getByRole('link', {name: /Manage Admins/i});
      expect(adminLink).toHaveAttribute('href', '/admin/manage');
    });
  });

  describe('OAuth Verified Users', () => {
    it('should render dashboard if user verified via Google OAuth', () => {
      renderComponent({...verifiedUser, verified: false, googleOAuthVerified: true});

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });

    it('should render dashboard if user verified via GitHub OAuth', () => {
      renderComponent({...verifiedUser, verified: false, githubOAuthVerified: true});

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });
});
