// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import * as api from '../../lib/api';
import ForgotPassword from '../../pages/forgotPassword';

jest.mock('../../lib/api');
jest.mock('../../assets/peerprep-icon.svg', () => 'peerprep-icon.svg');
jest.mock('../../assets/tick-icon.svg', () => 'tick-icon.svg');

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });
};

const renderComponent = () => {
  const queryClient = createTestQueryClient();

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ForgotPassword />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('pages/forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the forgot password page', () => {
      renderComponent();

      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
      expect(
        screen.getByText('Provide the email address associated with your account')
      ).toBeInTheDocument();
    });

    it('should render back to home link', () => {
      renderComponent();

      const homeLink = screen.getByRole('link', {name: /Back to Home/i});
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/Home');
    });

    it('should render PeerPrep logo', () => {
      renderComponent();

      const logo = screen.getByAltText('PeerPrep');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('logo-icon');
    });

    it('should render email input field', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
    });

    it('should render reset password button', () => {
      renderComponent();

      const button = screen.getByRole('button', {name: 'Reset Password'});
      expect(button).toBeInTheDocument();
    });

    it('should render sign in and sign up links', () => {
      renderComponent();

      const signInLink = screen.getByRole('link', {name: 'Sign in'});
      const signUpLink = screen.getByRole('link', {name: 'Sign up'});

      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('should have reset button disabled initially', () => {
      renderComponent();

      const button = screen.getByRole('button', {name: 'Reset Password'});
      expect(button).toBeDisabled();
    });
  });

  describe('Email Input', () => {
    it('should update email state on input change', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should enable button when email is entered', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});

      expect(button).not.toBeDisabled();
    });

    it('should keep button disabled if email is only whitespace', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: '   '}});

      expect(button).toBeDisabled();
    });

    it('should autofocus on email input', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      expect(document.activeElement).toBe(emailInput);
    });
  });

  describe('Form Submission', () => {
    it('should call forgotPassword API with trimmed email on button click', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: '  test@example.com  '}});
      fireEvent.click(button);

      await waitFor(() => {
        const calls = (api.forgotPassword as jest.Mock).mock.calls;
        expect(calls[0][0]).toEqual({email: 'test@example.com'});
      });
    });

    it('should call forgotPassword API on Enter key press', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.keyDown(emailInput, {key: 'Enter', code: 'Enter'});

      await waitFor(() => {
        const calls = (api.forgotPassword as jest.Mock).mock.calls;
        expect(calls[0][0]).toEqual({email: 'test@example.com'});
      });
    });

    it('should not submit on Enter if email is empty', () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');

      fireEvent.keyDown(emailInput, {key: 'Enter', code: 'Enter'});

      expect(api.forgotPassword).not.toHaveBeenCalled();
    });

    it('should show submitting state while request is pending', async () => {
      (api.forgotPassword as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button');

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message when email is sent', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('Email sent! Please check your inbox for more instructions.')
        ).toBeInTheDocument();
      });
    });

    it('should display success icon on successful submission', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        const successIcon = screen.getByAltText('Success');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('alert-icon');
      });
    });

    it('should hide form inputs on success', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('Email sent! Please check your inbox for more instructions.')
        ).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', {name: 'Reset Password'})).not.toBeInTheDocument();
    });

    it('should show success styling', async () => {
      (api.forgotPassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        const successDiv = screen
          .getByText('Email sent! Please check your inbox for more instructions.')
          .closest('.success');
        expect(successDiv).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message on API failure', async () => {
      (api.forgotPassword as jest.Mock).mockRejectedValue({message: 'User not found'});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('should show default error message when error has no message', async () => {
      (api.forgotPassword as jest.Mock).mockRejectedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should show error styling', async () => {
      (api.forgotPassword as jest.Mock).mockRejectedValue({message: 'User not found'});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        const errorDiv = screen.getByText('User not found').closest('.error');
        expect(errorDiv).toBeInTheDocument();
      });
    });

    it('should keep form inputs visible on error', async () => {
      (api.forgotPassword as jest.Mock).mockRejectedValue({message: 'User not found'});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const button = screen.getByRole('button', {name: 'Reset Password'});

      fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Reset Password'})).toBeInTheDocument();
    });
  });

  describe('UI Layout', () => {
    it('should have login-wrapper container', () => {
      const {container} = renderComponent();

      expect(container.querySelector('.login-wrapper')).toBeInTheDocument();
    });

    it('should have login-container', () => {
      const {container} = renderComponent();

      expect(container.querySelector('.login-container')).toBeInTheDocument();
    });

    it('should show back arrow in home link', () => {
      const {container} = renderComponent();

      const backArrow = container.querySelector('.back-arrow');
      expect(backArrow).toBeInTheDocument();
    });
  });
});
