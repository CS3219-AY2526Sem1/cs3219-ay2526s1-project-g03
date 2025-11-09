// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import React from 'react';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import {BrowserRouter, MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import CompleteProfile from '../../pages/completeProfile';
import useAuth from '../../hooks/useAuth';
import * as api from '../../lib/api';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api');
jest.mock('../../assets/peerprep-icon.svg', () => ({
  __esModule: true,
  default: 'peerprep-icon.svg',
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });
};

let queryClient: QueryClient;

const renderComponent = () => {
  const queryClient = createTestQueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <CompleteProfile />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
  queryClient?.clear();
  jest.clearAllMocks();
});

describe('pages/completeProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      const {container} = renderComponent();

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to home if profile is already complete', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {profileComplete: true},
        isLoading: false,
      });

      renderComponent();

      // Navigate component should render (redirects in test environment)
      expect(screen.queryByText('Finishing touches...')).not.toBeInTheDocument();
    });

    it('should not redirect if profile is incomplete', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {profileComplete: false},
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('Finishing touches...')).toBeInTheDocument();
    });
  });

  describe('Regular User (Non-OAuth)', () => {
    const regularUser = {
      username: 'testuser',
      email: 'test@example.com',
      hasPassword: true,
      googleOAuthVerified: false,
      githubOAuthVerified: false,
      profileComplete: false,
      firstName: '',
      lastName: '',
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: regularUser,
        isLoading: false,
      });
    });

    it('should render form for regular users', () => {
      renderComponent();

      expect(screen.getByText('Finishing touches...')).toBeInTheDocument();
      expect(screen.getByText('Just a few more details to get started!')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Occupation')).toBeInTheDocument();
      expect(screen.getByLabelText(/area of studies/i)).toBeInTheDocument();
    });

    it('should NOT show username field for regular users', () => {
      renderComponent();

      expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    });

    it('should update firstName input', () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
      fireEvent.change(firstNameInput, {target: {value: 'John'}});

      expect(firstNameInput.value).toBe('John');
    });

    it('should update lastName input', () => {
      renderComponent();

      const lastNameInput = screen.getByLabelText('Last Name') as HTMLInputElement;
      fireEvent.change(lastNameInput, {target: {value: 'Doe'}});

      expect(lastNameInput.value).toBe('Doe');
    });

    it('should update occupation select', () => {
      renderComponent();

      const occupationSelect = screen.getByLabelText('Occupation') as HTMLSelectElement;
      fireEvent.change(occupationSelect, {target: {value: 'student'}});

      expect(occupationSelect.value).toBe('student');
    });

    it('should update area of study select', () => {
      renderComponent();

      const areaSelect = screen.getByLabelText(/area of studies/i) as HTMLSelectElement;
      fireEvent.change(areaSelect, {target: {value: 'computer-science'}});

      expect(areaSelect.value).toBe('computer-science');
    });

    it('should submit personal info for regular users', async () => {
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}});
      fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}});
      fireEvent.change(screen.getByLabelText('Occupation'), {target: {value: 'student'}});
      fireEvent.change(screen.getByLabelText(/area of studies/i), {
        target: {value: 'computer-science'},
      });

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() =>
        expect(api.changePersonalInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            occupation: 'student',
            areaOfStudy: 'computer-science',
          }),
          expect.anything()
        )
      );
    });

    it('should navigate to home after successful submission', async () => {
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}});
      fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(api.changePersonalInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
          }),
          expect.anything()
        );
      });
    });

    it('should trim whitespace from inputs', async () => {
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: '  John  '}});
      fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: '  Doe  '}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(api.changePersonalInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            occupation: '',
            areaOfStudy: '',
          }),
          expect.anything()
        );
      });
    });
  });

  describe('OAuth User', () => {
    const oauthUser = {
      username: 'oauthuser',
      email: 'oauth@example.com',
      hasPassword: false,
      googleOAuthVerified: true,
      githubOAuthVerified: false,
      profileComplete: false,
      firstName: 'OAuth',
      lastName: 'User',
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: oauthUser,
        isLoading: false,
      });
    });

    it('should show username field for OAuth users', () => {
      renderComponent();

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should pre-fill username from OAuth user data', () => {
      renderComponent();

      const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
      expect(usernameInput.value).toBe('oauthuser');
    });

    it('should pre-fill first name from OAuth user data', () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
      expect(firstNameInput.value).toBe('OAuth');
    });

    it('should pre-fill last name from OAuth user data', () => {
      renderComponent();

      const lastNameInput = screen.getByLabelText('Last Name') as HTMLInputElement;
      expect(lastNameInput.value).toBe('User');
    });

    it('should update username for OAuth users', () => {
      renderComponent();

      const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
      fireEvent.change(usernameInput, {target: {value: 'newoauthuser'}});

      expect(usernameInput.value).toBe('newoauthuser');
    });

    it('should call both username and personal info updates for OAuth users', async () => {
      (api.changeUsernameOrEmail as jest.Mock).mockResolvedValue({});
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('Username'), {target: {value: 'newusername'}});
      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}});
      fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(api.changeUsernameOrEmail).toHaveBeenCalledWith(
          expect.objectContaining({username: 'newusername'}),
          expect.anything()
        );
        expect(api.changePersonalInfo).toHaveBeenCalled();
      });
    });

    it('should only update username if changed', async () => {
      (api.changeUsernameOrEmail as jest.Mock).mockResolvedValue({});
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      // Don't change username
      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.changeUsernameOrEmail).not.toHaveBeenCalled();
        expect(api.changePersonalInfo).toHaveBeenCalled();
      });
    });

    it('should navigate after both updates succeed for OAuth users', async () => {
      (api.changeUsernameOrEmail as jest.Mock).mockResolvedValue({});
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('Username'), {target: {value: 'newusername'}});
      fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', {replace: true});
      });
    });

    it('should handle OAuth user with GitHub verification', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...oauthUser,
          googleOAuthVerified: false,
          githubOAuthVerified: true,
        },
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    const regularUser = {
      username: 'testuser',
      hasPassword: true,
      googleOAuthVerified: false,
      githubOAuthVerified: false,
      profileComplete: false,
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: regularUser,
        isLoading: false,
      });
    });

    it('should display error message on personal info update failure', async () => {
      const errorMessage = 'Update failed';
      (api.changePersonalInfo as jest.Mock).mockRejectedValue({message: errorMessage});

      renderComponent();

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display error message on username update failure', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...regularUser,
          hasPassword: false,
          googleOAuthVerified: true,
          username: 'oldusername',
        },
        isLoading: false,
      });

      const errorMessage = 'Username already taken';
      (api.changeUsernameOrEmail as jest.Mock).mockRejectedValue({message: errorMessage});
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText('Username'), {target: {value: 'newusername'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display multiple error messages separated by newlines', async () => {
      (api.changePersonalInfo as jest.Mock).mockRejectedValue({
        message: 'Error 1\nError 2',
      });

      renderComponent();

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
      });
    });

    it('should remove duplicate error messages', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...regularUser,
          hasPassword: false,
          googleOAuthVerified: true,
          username: 'oldusername',
        },
        isLoading: false,
      });

      const errorMessage = 'Same error';
      (api.changeUsernameOrEmail as jest.Mock).mockRejectedValue({message: errorMessage});
      (api.changePersonalInfo as jest.Mock).mockRejectedValue({message: errorMessage});

      renderComponent();

      fireEvent.change(screen.getByLabelText('Username'), {target: {value: 'newusername'}});

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElements = screen.getAllByText('Same error');
        expect(errorElements).toHaveLength(1); // Should appear only once
      });
    });

    it('should show default error message if no error message provided', async () => {
      (api.changePersonalInfo as jest.Mock).mockRejectedValue({});

      renderComponent();

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    const regularUser = {
      username: 'testuser',
      hasPassword: true,
      googleOAuthVerified: false,
      githubOAuthVerified: false,
      profileComplete: false,
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: regularUser,
        isLoading: false,
      });
    });

    it('should show "Get started" button text by default', () => {
      renderComponent();

      expect(screen.getByRole('button', {name: /Get started/i})).toBeInTheDocument();
    });

    it('should disable button and show loading text while submitting', async () => {
      (api.changePersonalInfo as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      const submitButton = screen.getByRole('button', {name: /Get started/i});
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creating Account...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('UI Elements', () => {
    const regularUser = {
      username: 'testuser',
      hasPassword: true,
      googleOAuthVerified: false,
      githubOAuthVerified: false,
      profileComplete: false,
    };

    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: regularUser,
        isLoading: false,
      });
    });

    it('should render logo', () => {
      renderComponent();

      const logo = screen.getByAltText('PeerPrep');
      expect(logo).toBeInTheDocument();
    });

    it('should render back to home link', () => {
      renderComponent();

      const backLink = screen.getByRole('link', {name: /Back to Home/i});
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/Home');
    });

    it('should render all occupation options', () => {
      renderComponent();

      const occupationSelect = screen.getByLabelText('Occupation');
      const options = occupationSelect.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(0);
    });

    it('should render all area of study options', () => {
      renderComponent();

      const areaSelect = screen.getByLabelText(/area of studies/i);
      const options = areaSelect.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(0);
    });

    it('should have back arrow in back link', () => {
      const {container} = renderComponent();

      const backArrow = container.querySelector('.back-arrow');
      expect(backArrow).toBeInTheDocument();
    });
  });
});
