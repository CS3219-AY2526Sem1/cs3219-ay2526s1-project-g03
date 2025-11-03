// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import UserMenu from '../../components/userMenu';
import useAuth from '../../hooks/useAuth';
import * as api from '../../lib/api';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api');
jest.mock(
  '../../assets/peerprep-icon.svg',
  () => ({
    __esModule: true,
    default: 'peerprep-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/default-profile-icon.svg',
  () => ({
    __esModule: true,
    default: 'default-profile-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/profile/notification-icon.svg',
  () => ({
    __esModule: true,
    default: 'notification-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/settings-icon.svg',
  () => ({
    __esModule: true,
    default: 'settings-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/profile/logout-icon.svg',
  () => ({
    __esModule: true,
    default: 'logout-icon.svg',
  }),
  {virtual: true}
);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockUseNavigate = require('react-router-dom').useNavigate as jest.Mock;
const mockUseLocation = require('react-router-dom').useLocation as jest.Mock;

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
        <UserMenu />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const baseUser = {
  username: 'testuser',
  email: 'test@example.com',
  verified: true,
  googleOAuthVerified: false,
  githubOAuthVerified: false,
  profilePicture: null,
};

describe('components/userMenu', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({pathname: '/'});
  });

  describe('Logo and Branding', () => {
    it('should render PeerPrep logo', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const logo = screen.getByAltText('PeerPrep');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('header-logo');
    });

    it('should link logo to home page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const logoLink = screen.getByRole('link', {name: /PeerPrep/i});
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Non-Profile Page View', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({pathname: '/'});
    });

    it('should render notification icon', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const notificationIcon = screen.getByAltText('Notifications');
      expect(notificationIcon).toBeInTheDocument();
      expect(notificationIcon).toHaveClass('notification-icon');
    });

    it('should render username', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    it('should render default profile icon when user has no custom picture', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      const {container} = renderComponent();

      const profileIcon = container.querySelector('.user-profile-icon');
      expect(profileIcon).toBeInTheDocument();
      expect(profileIcon).toHaveAttribute('src', 'default-profile-icon.svg');
    });

    it('should render custom profile picture when user has one', () => {
      const userWithPicture = {
        ...baseUser,
        profilePicture: 'https://example.com/profile.jpg',
      };
      (useAuth as jest.Mock).mockReturnValue({user: userWithPicture});
      const {container} = renderComponent();

      const profileIcon = container.querySelector('.user-profile-icon');
      expect(profileIcon).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('should render logout button', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const logoutIcon = screen.getByAltText('Logout');
      expect(logoutIcon).toBeInTheDocument();
      expect(logoutIcon).toHaveClass('exit-icon');
    });
  });

  describe('Profile Page View', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({pathname: '/profile'});
    });

    it('should render account settings link when on profile page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const settingsLink = screen.getByRole('link', {name: /Account Settings/i});
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/profile/settings');
    });

    it('should render settings icon when on profile page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const settingsIcon = screen.getByAltText('Settings');
      expect(settingsIcon).toBeInTheDocument();
      expect(settingsIcon).toHaveClass('settings-icon');
    });

    it('should not render notification icon when on profile page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      expect(screen.queryByAltText('Notifications')).not.toBeInTheDocument();
    });

    it('should not render username when on profile page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      expect(screen.queryByText(/testuser/i)).not.toBeInTheDocument();
    });

    it('should render logout button on profile page', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      renderComponent();

      const logoutIcon = screen.getByAltText('Logout');
      expect(logoutIcon).toBeInTheDocument();
    });
  });

  describe('User Verification Status', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({pathname: '/'});
    });

    it('should render clickable profile link when user is verified', () => {
      const verifiedUser = {...baseUser, verified: true};
      (useAuth as jest.Mock).mockReturnValue({user: verifiedUser});
      renderComponent();

      const profileLink = screen.getByRole('link', {name: /User Profile testuser/i});
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', '/profile/');
    });

    it('should render clickable profile link when user is Google OAuth verified', () => {
      const googleUser = {...baseUser, verified: false, googleOAuthVerified: true};
      (useAuth as jest.Mock).mockReturnValue({user: googleUser});
      renderComponent();

      const profileLink = screen.getByRole('link', {name: /User Profile testuser/i});
      expect(profileLink).toBeInTheDocument();
    });

    it('should render clickable profile link when user is GitHub OAuth verified', () => {
      const githubUser = {...baseUser, verified: false, githubOAuthVerified: true};
      (useAuth as jest.Mock).mockReturnValue({user: githubUser});
      renderComponent();

      const profileLink = screen.getByRole('link', {name: /User Profile testuser/i});
      expect(profileLink).toBeInTheDocument();
    });

    it('should render disabled profile section when user is not verified', () => {
      const unverifiedUser = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      };
      (useAuth as jest.Mock).mockReturnValue({user: unverifiedUser});
      const {container} = renderComponent();

      const disabledLink = container.querySelector('.icon-link.disabled');
      expect(disabledLink).toBeInTheDocument();
      expect(screen.queryByRole('link', {name: /User Profile/i})).not.toBeInTheDocument();
    });

    it('should still show username for unverified users', () => {
      const unverifiedUser = {
        ...baseUser,
        verified: false,
        googleOAuthVerified: false,
        githubOAuthVerified: false,
      };
      (useAuth as jest.Mock).mockReturnValue({user: unverifiedUser});
      renderComponent();

      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({pathname: '/'});
    });

    it('should call logout API when logout button is clicked', async () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      (api.logout as jest.Mock).mockResolvedValue({});
      renderComponent();

      const logoutButton = screen.getByRole('button', {name: /Logout/i});
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(api.logout).toHaveBeenCalled();
      });
    });

    it('should navigate to home after logout', async () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      (api.logout as jest.Mock).mockResolvedValue({});
      renderComponent();

      const logoutButton = screen.getByRole('button', {name: /Logout/i});
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home', {replace: true});
      });
    });

    it('should navigate to home even if logout API fails', async () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      (api.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));
      renderComponent();

      const logoutButton = screen.getByRole('button', {name: /Logout/i});
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home', {replace: true});
      });
    });
  });

  describe('Profile Page Logout', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({pathname: '/profile'});
    });

    it('should logout from profile page', async () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      (api.logout as jest.Mock).mockResolvedValue({});
      renderComponent();

      const logoutButton = screen.getByRole('button', {name: /Logout/i});
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(api.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home', {replace: true});
      });
    });
  });

  describe('UI Structure', () => {
    it('should have user-menu-wrapper container', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      const {container} = renderComponent();

      expect(container.querySelector('.user-menu-wrapper')).toBeInTheDocument();
    });

    it('should have user-menu-header', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      const {container} = renderComponent();

      expect(container.querySelector('.user-menu-header')).toBeInTheDocument();
    });

    it('should have logo-container', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      const {container} = renderComponent();

      expect(container.querySelector('.logo-container')).toBeInTheDocument();
    });

    it('should have header-right section', () => {
      (useAuth as jest.Mock).mockReturnValue({user: baseUser});
      const {container} = renderComponent();

      expect(container.querySelector('.header-right')).toBeInTheDocument();
    });
  });
});
