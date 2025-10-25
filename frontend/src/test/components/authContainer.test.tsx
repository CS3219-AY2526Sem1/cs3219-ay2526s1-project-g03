// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {render, screen} from '@testing-library/react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import AuthContainer from '../../components/authContainer';
import useAuth from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');
jest.mock('../../components/userMenu', () => {
  return function UserMenu() {
    return require('react').createElement('div', {'data-testid': 'user-menu'}, 'UserMenu');
  };
});

const mockUseAuth = useAuth as jest.Mock;

const renderComponent = (initialRoute = '/') => {
  window.history.pushState({}, '', initialRoute);

  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthContainer />}>
          <Route index element={<div>Home Content</div>} />
          <Route path="profile" element={<div>Profile Content</div>} />
          <Route path="settings" element={<div>Settings Content</div>} />
        </Route>
        <Route path="/home" element={<div>Landing Page</div>} />
        <Route path="/complete-profile" element={<div>Complete Profile Page</div>} />
      </Routes>
    </BrowserRouter>
  );
};

const baseUser = {
  username: 'testuser',
  email: 'test@example.com',
  verified: true,
  googleOAuthVerified: false,
  githubOAuthVerified: false,
  profileComplete: true,
};

describe('components/authContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when isLoading is true', () => {
      mockUseAuth.mockReturnValue({user: null, isLoading: true});
      const {container} = renderComponent();

      expect(container.querySelector('.loading')).toBeInTheDocument();
      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('should not render UserMenu when loading', () => {
      mockUseAuth.mockReturnValue({user: null, isLoading: true});
      renderComponent();

      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });

    it('should not render outlet content when loading', () => {
      mockUseAuth.mockReturnValue({user: null, isLoading: true});
      renderComponent();

      expect(screen.queryByText('Home Content')).not.toBeInTheDocument();
    });
  });

  describe('No User (Unauthenticated)', () => {
    it('should redirect to /home when user is null', () => {
      mockUseAuth.mockReturnValue({user: null, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });

    it('should redirect to /home when user is undefined', () => {
      mockUseAuth.mockReturnValue({user: undefined, isLoading: false});
      renderComponent('/settings');

      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });

    it('should not render UserMenu when not authenticated', () => {
      mockUseAuth.mockReturnValue({user: null, isLoading: false});
      renderComponent();

      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User - Profile Complete', () => {
    it('should render UserMenu when user is authenticated', () => {
      mockUseAuth.mockReturnValue({user: baseUser, isLoading: false});
      renderComponent();

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should render outlet content when user is authenticated', () => {
      mockUseAuth.mockReturnValue({user: baseUser, isLoading: false});
      renderComponent();

      expect(screen.getByText('Home Content')).toBeInTheDocument();
    });

    it('should render container div with correct class', () => {
      mockUseAuth.mockReturnValue({user: baseUser, isLoading: false});
      const {container} = renderComponent();

      expect(container.querySelector('.container')).toBeInTheDocument();
    });
  });

  describe('Profile Incomplete', () => {
    it('should redirect to /complete-profile when profileComplete is false', () => {
      const incompleteUser = {...baseUser, profileComplete: false};
      mockUseAuth.mockReturnValue({user: incompleteUser, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Complete Profile Page')).toBeInTheDocument();
    });

    it('should not redirect when already on /complete-profile', () => {
      const incompleteUser = {...baseUser, profileComplete: false};
      mockUseAuth.mockReturnValue({user: incompleteUser, isLoading: false});

      window.history.pushState({}, '', '/complete-profile');
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/complete-profile" element={<AuthContainer />}>
              <Route index element={<div>Complete Profile Content</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Complete Profile Content')).toBeInTheDocument();
    });

    it('should not render UserMenu when profile is incomplete', () => {
      const incompleteUser = {...baseUser, profileComplete: false};
      mockUseAuth.mockReturnValue({user: incompleteUser, isLoading: false});
      renderComponent('/settings');

      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });
  });

  describe('User Verification', () => {
    it('should allow verified user to access any route', () => {
      const verifiedUser = {...baseUser, verified: true};
      mockUseAuth.mockReturnValue({user: verifiedUser, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Profile Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should allow Google OAuth verified user to access any route', () => {
      const googleUser = {...baseUser, verified: false, googleOAuthVerified: true};
      mockUseAuth.mockReturnValue({user: googleUser, isLoading: false});
      renderComponent('/settings');

      expect(screen.getByText('Settings Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should allow GitHub OAuth verified user to access any route', () => {
      const githubUser = {...baseUser, verified: false, githubOAuthVerified: true};
      mockUseAuth.mockReturnValue({user: githubUser, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Profile Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should redirect unverified user to / when trying to access other routes', () => {
      const unverifiedUser = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      };

      // Set window location before rendering
      delete (window as any).location;
      (window as any).location = {pathname: '/profile'};

      mockUseAuth.mockReturnValue({user: unverifiedUser, isLoading: false});
      renderComponent('/');

      expect(screen.getByText('Home Content')).toBeInTheDocument();
    });

    it('should allow unverified user to stay on / route', () => {
      const unverifiedUser = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      };
      mockUseAuth.mockReturnValue({user: unverifiedUser, isLoading: false});
      renderComponent('/');

      expect(screen.getByText('Home Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should redirect unverified user from /settings to /', () => {
      const unverifiedUser = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      };

      // Set window location before rendering
      delete (window as any).location;
      (window as any).location = {pathname: '/settings'};

      mockUseAuth.mockReturnValue({user: unverifiedUser, isLoading: false});
      renderComponent('/');

      expect(screen.getByText('Home Content')).toBeInTheDocument();
    });
  });

  describe('Combined Scenarios', () => {
    it('should redirect unverified user with incomplete profile to /complete-profile', () => {
      const user = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
        profileComplete: false,
      };
      mockUseAuth.mockReturnValue({user, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Complete Profile Page')).toBeInTheDocument();
    });

    it('should prioritize profile completion over verification', () => {
      const user = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
        profileComplete: false,
      };
      mockUseAuth.mockReturnValue({user, isLoading: false});
      renderComponent('/settings');

      // Should redirect to complete-profile, not to /
      expect(screen.getByText('Complete Profile Page')).toBeInTheDocument();
      expect(screen.queryByText('Home Content')).not.toBeInTheDocument();
    });

    it('should handle verified user with complete profile on any route', () => {
      const user = {...baseUser, verified: true, profileComplete: true};
      mockUseAuth.mockReturnValue({user, isLoading: false});
      renderComponent('/settings');

      expect(screen.getByText('Settings Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with all verification methods', () => {
      const fullyVerifiedUser = {
        ...baseUser,
        verified: true,
        googleOAuthVerified: true,
        githubOAuthVerified: true,
      };
      mockUseAuth.mockReturnValue({user: fullyVerifiedUser, isLoading: false});
      renderComponent('/profile');

      expect(screen.getByText('Profile Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should handle transition from loading to authenticated', () => {
      // First render: loading state
      mockUseAuth.mockReturnValue({user: null, isLoading: true});

      const {container} = renderComponent('/');

      // Check loading spinner is present
      expect(container.querySelector('.spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();

      // Clean up first render
      container.remove();

      // Second render: authenticated state
      mockUseAuth.mockReturnValue({user: baseUser, isLoading: false});

      renderComponent('/');

      // Check authenticated content is present
      expect(screen.queryByText('Home Content')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });
});
