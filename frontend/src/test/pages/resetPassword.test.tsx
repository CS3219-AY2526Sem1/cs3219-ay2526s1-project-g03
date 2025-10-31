// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import * as api from '../../lib/api';
import ResetPassword from '../../pages/resetPassword';

jest.mock('../../lib/api');
jest.mock('../../assets/peerprep-icon.svg', () => 'peerprep-icon.svg');
jest.mock('../../assets/alert-icon.svg', () => 'alert-icon.svg');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const mockUseSearchParams = require('react-router-dom').useSearchParams as jest.Mock;
const mockUseNavigate = require('react-router-dom').useNavigate as jest.Mock;

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('pages/resetPassword', () => {
  let mockNavigate: jest.Mock;
  const futureTime = Date.now() + 3600000; // 1 hour in the future

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Page Rendering', () => {
    it('should render reset password form with valid link', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      expect(screen.getByText('Reset your password')).toBeInTheDocument();
    });

    it('should render password input field when link is valid', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('should render submit button when link is valid', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      expect(screen.getByRole('button', {name: /Reset Password/i})).toBeInTheDocument();
    });

    it('should render logo', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const logo = screen.getByAltText('PeerPrep');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Link Validation', () => {
    it('should show error message when code is missing', () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams(`exp=${futureTime}`)]);
      renderComponent();

      expect(screen.getByText(/Invalid link! Request a new link/i)).toBeInTheDocument();
    });

    it('should show error message when exp is missing', () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('code=test-code')]);
      renderComponent();

      expect(screen.getByText(/Invalid link! Request a new link/i)).toBeInTheDocument();
    });

    it('should show error message when link is expired', () => {
      const pastTime = Date.now() - 3600000; // 1 hour in the past
      mockUseSearchParams.mockReturnValue([new URLSearchParams(`code=test-code&exp=${pastTime}`)]);
      renderComponent();

      expect(screen.getByText(/Invalid link! Request a new link/i)).toBeInTheDocument();
    });

    it('should not render password input when link is invalid', () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('')]);
      renderComponent();

      expect(screen.queryByLabelText(/Password/i)).not.toBeInTheDocument();
    });

    it('should render link to forgot password page when invalid', () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('')]);
      renderComponent();

      const forgotPasswordLink = screen.getByRole('link', {
        name: /Invalid link! Request a new link/i,
      });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/password/forgot');
    });
  });

  describe('Form Submission', () => {
    it('should successfully reset password and navigate to login', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockResolvedValue({});
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'NewPassword123!'}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.resetPassword).toHaveBeenCalledWith(
          {
            verificationCode: 'test-code',
            password: 'NewPassword123!',
          },
          expect.anything()
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Success!/i)).toBeInTheDocument();
      });

      // Fast-forward timers to trigger navigation
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {replace: true});
      });
    });

    it('should show error message on API failure', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockRejectedValue(new Error('Invalid password'));
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'weak'}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid password/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button when password is empty', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const submitButton = screen.getByRole('button', {name: /Reset Password/i});
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when password is entered', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'Password123!'}});

      expect(submitButton).not.toBeDisabled();
    });

    it('should show updating text during submission', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'Password123!'}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', {name: /Updating.../i})).toBeInTheDocument();
      });
    });

    it('should trim password before submitting', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockResolvedValue({});
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: '  Password123!  '}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.resetPassword).toHaveBeenCalledWith(
          {
            verificationCode: 'test-code',
            password: 'Password123!',
          },
          expect.anything()
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should render back to home link', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const homeLink = screen.getByRole('link', {name: /Back to Home/i});
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/Home');
    });

    it('should render sign in link', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const signInLink = screen.getByRole('link', {name: /Sign in/i});
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render sign up link', () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      renderComponent();

      const signUpLink = screen.getByRole('link', {name: /Sign up/i});
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Success State', () => {
    it('should show countdown after successful password reset', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockResolvedValue({});
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'Password123!'}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Success! Redirecting to/i)).toBeInTheDocument();
        expect(screen.getByText(/in 3 seconds.../i)).toBeInTheDocument();
      });
    });

    it('should render login page link in success message', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams(`code=test-code&exp=${futureTime}`),
      ]);
      (api.resetPassword as jest.Mock).mockResolvedValue({});
      renderComponent();

      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', {name: /Reset Password/i});

      fireEvent.change(passwordInput, {target: {value: 'Password123!'}});
      fireEvent.click(submitButton);

      await waitFor(() => {
        const loginLink = screen.getByRole('link', {name: /login page/i});
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });
  });
});
