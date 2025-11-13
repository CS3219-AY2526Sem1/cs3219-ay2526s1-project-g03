// AI Assistance Disclosure:
// Tool: Auto (Cursor)
// Date: 2025-01-XX
// Scope: Generated comprehensive test cases for Profile component

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import * as api from '../../lib/api';
import Profile from '../../pages/profile';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api', () => ({
  resendEmail: jest.fn(),
  getHistoryProgress: jest.fn(),
  getAllAttemptSummaries: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../../features/progress/RecentSessionsList', () => {
  return function MockRecentSessionsList({ userId, limit }: { userId: string; limit: number }) {
    return <div data-testid="recent-sessions-list">Recent Sessions List (userId: {userId}, limit: {limit})</div>;
  };
});

const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

const renderComponent = (mockUser: any, mockProgress?: any, mockSummaries?: any[]) => {
  (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  if (mockProgress !== undefined) {
    (api.getHistoryProgress as jest.Mock).mockResolvedValue(mockProgress);
  }
  if (mockSummaries !== undefined) {
    (api.getAllAttemptSummaries as jest.Mock).mockResolvedValue(mockSummaries);
  }

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
  _id: 'user123',
};

const mockProgress = {
  total_sessions_completed: 5,
  total_successes: 2,
  total_time_ms: 28800000, // 8 hours
  current_streak: 1,
};

describe('Profile Page', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
  });

  describe('Unverified Users', () => {
    it('should render email verification prompt', () => {
      renderComponent({
        ...verifiedUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      });

      expect(screen.getByText('Email verification required')).toBeInTheDocument();
      expect(screen.getByText('Please verify your email!')).toBeInTheDocument();
      expect(screen.getByText(/Please check your inbox and click on the link/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resend verification' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Home/i })).toHaveAttribute('href', '/Home');
    });

    it('should call resendEmail and show success alert', async () => {
      (api.resendEmail as jest.Mock).mockResolvedValue({});

      renderComponent({
        ...verifiedUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      });

      fireEvent.click(screen.getByRole('button', { name: 'Resend verification' }));

      await waitFor(() => {
        expect(api.resendEmail).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockAlert).toHaveBeenCalledWith('Verification email resent! Please check your inbox');
      });
    });

    it('should show alert on resendEmail failure', async () => {
      (api.resendEmail as jest.Mock).mockRejectedValue({ message: 'Failed to resend' });

      renderComponent({
        ...verifiedUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      });

      fireEvent.click(screen.getByRole('button', { name: 'Resend verification' }));

      await waitFor(() => {
        expect(api.resendEmail).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Failed to resend');
      });
    });
  });

  describe('Verified Users', () => {
    it('should render the profile page with user data', async () => {
      renderComponent(verifiedUser, mockProgress, []);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Ready to sharpen your coding skills today?')).toBeInTheDocument();
      });

      // Stats
      expect(screen.getByText('Sessions Completed')).toBeInTheDocument();
      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
      expect(screen.getByText('Hours Practiced')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();

      // Quick actions
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Find Match')).toBeInTheDocument();
      expect(screen.getByText('Question Settings')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

      // Recent Activity
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should show a loading state initially', async () => {
      (api.getHistoryProgress as jest.Mock).mockImplementation(() => new Promise(() => {}));
      (api.getAllAttemptSummaries as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderComponent(verifiedUser);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show an error message if API call fails', async () => {
      (api.getHistoryProgress as jest.Mock).mockRejectedValue(new Error('API Error'));
      (api.getAllAttemptSummaries as jest.Mock).mockResolvedValue([]);

      renderComponent(verifiedUser);

      await waitFor(() => {
        expect(screen.getByText('Error loading stats')).toBeInTheDocument();
      });
    });

    it('should show "Manage Admins" button for admin user', () => {
      renderComponent({ ...verifiedUser, role: 'admin' }, mockProgress, []);

      const adminLink = screen.getByRole('link', { name: /Manage Admins/i });
      expect(adminLink).toHaveAttribute('href', '/admin/manage');
    });

    it('should render RecentSessionsList when data is loaded', async () => {
      renderComponent(verifiedUser, mockProgress, []);

      await waitFor(() => {
        expect(screen.getByTestId('recent-sessions-list')).toBeInTheDocument();
        expect(screen.getByText(/Recent Sessions List \(userId: user123, limit: 5\)/)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Verified Users', () => {
    it('should render dashboard if user verified via Google OAuth', () => {
      renderComponent({ ...verifiedUser, verified: false, googleOAuthVerified: true }, mockProgress, []);

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });

    it('should render dashboard if user verified via GitHub OAuth', () => {
      renderComponent({ ...verifiedUser, verified: false, githubOAuthVerified: true }, mockProgress, []);

      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });
});

