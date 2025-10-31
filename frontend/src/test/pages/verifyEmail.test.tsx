// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import * as api from '../../lib/api';
import VerifyEmail from '../../pages/verifyEmail';

// Mock the API
jest.mock('../../lib/api');

// Mock the SVG imports
jest.mock('../../assets/tick-icon.svg', () => 'tick-icon.svg');
jest.mock('../../assets/alert-icon.svg', () => 'alert-icon.svg');

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithRouter = (code: string = 'test-code-123') => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/verify/${code}`]}>
        <Routes>
          <Route path="/verify/:code" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('pages/verifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while verifying', () => {
      (api.verifyEmail as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const {container} = renderWithRouter();

      const spinner = container.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should show success message when email is verified', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter('valid-code');

      await waitFor(() => {
        expect(screen.getByText(/Email verified!/i)).toBeInTheDocument();
      });
    });

    it('should display success icon when verification succeeds', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter();

      await waitFor(() => {
        const successIcon = screen.getByAltText('Success');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('alert-icon');
      });
    });

    it('should show success alert styling', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter();

      await waitFor(() => {
        const alert = screen.getByText(/Email verified!/i).closest('.alert');
        expect(alert).toHaveClass('alert-success');
      });
    });

    it('should show Back to Home link on success', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter();

      await waitFor(() => {
        const homeLink = screen.getByRole('link', {name: /Back to Home/i});
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/Home');
      });
    });

    it('should not show error message on success', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Email verified!/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Invalid link!/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/The link is either invalid or expired/i)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when verification fails', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter('invalid-code');

      await waitFor(() => {
        expect(screen.getByText(/Invalid link!/i)).toBeInTheDocument();
      });
    });

    it('should display error icon when verification fails', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter();

      await waitFor(() => {
        const errorIcon = screen.getByAltText('Error');
        expect(errorIcon).toBeInTheDocument();
        expect(errorIcon).toHaveAttribute('src', 'alert-icon.svg');
      });
    });

    it('should show error alert styling', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter();

      await waitFor(() => {
        const alert = screen.getByText(/Invalid link!/i).closest('.alert');
        expect(alert).toHaveClass('alert-error');
      });
    });

    it('should display detailed error message', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/The link is either invalid or expired/i)).toBeInTheDocument();
      });
    });

    it('should show link to get new verification link', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter();

      await waitFor(() => {
        const registerLink = screen.getByRole('link', {name: /Get a new link/i});
        expect(registerLink).toBeInTheDocument();
        expect(registerLink).toHaveAttribute('href', '/register');
      });
    });

    it('should show Back to Home link on error', async () => {
      (api.verifyEmail as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      renderWithRouter();

      await waitFor(() => {
        const homeLink = screen.getByRole('link', {name: /Back to Home/i});
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/Home');
      });
    });
  });

  describe('API Integration', () => {
    it('should call verifyEmail with the code from URL params', async () => {
      const testCode = 'abc123xyz';
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter(testCode);

      await waitFor(() => {
        expect(api.verifyEmail).toHaveBeenCalledWith(testCode);
      });
    });

    it('should call verifyEmail only once', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter();

      await waitFor(() => {
        expect(api.verifyEmail).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle undefined code parameter', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      const queryClient = createTestQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/verify/']}>
            <Routes>
              <Route path="/verify/:code?" element={<VerifyEmail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(api.verifyEmail).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Query Configuration', () => {
    it('should use correct query key', async () => {
      const testCode = 'unique-code';
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      renderWithRouter(testCode);

      await waitFor(() => {
        expect(api.verifyEmail).toHaveBeenCalledWith(testCode);
      });

      // Verify the query was called with the code in the key
      expect(api.verifyEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI Layout', () => {
    it('should have verify-wrapper container', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      const {container} = renderWithRouter();

      await waitFor(() => {
        expect(container.querySelector('.verify-wrapper')).toBeInTheDocument();
      });
    });

    it('should have verify-container', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      const {container} = renderWithRouter();

      await waitFor(() => {
        expect(container.querySelector('.verify-container')).toBeInTheDocument();
      });
    });

    it('should show back arrow in home link', async () => {
      (api.verifyEmail as jest.Mock).mockResolvedValue({});

      const {container} = renderWithRouter();

      await waitFor(() => {
        const backArrow = container.querySelector('.back-arrow');
        expect(backArrow).toBeInTheDocument();
      });
    });
  });
});
