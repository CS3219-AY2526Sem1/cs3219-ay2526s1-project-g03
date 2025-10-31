// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import UserProfile from '../../pages/userProfile';

jest.mock('../../hooks/useAuth');
jest.mock(
  '../../assets/default-profile-icon.svg',
  () => ({
    __esModule: true,
    default: 'default-profile-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/trophy-icon.svg',
  () => ({
    __esModule: true,
    default: 'trophy-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/green-target-icon.svg',
  () => ({
    __esModule: true,
    default: 'green-target-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/blue-clock-icon.svg',
  () => ({
    __esModule: true,
    default: 'blue-clock-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/trend-up-icon.svg',
  () => ({
    __esModule: true,
    default: 'trend-up-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/work-case-icon.svg',
  () => ({
    __esModule: true,
    default: 'work-case-icon.svg',
  }),
  {virtual: true}
);

jest.mock(
  '../../assets/user-profile/graduation-hat-icon.svg',
  () => ({
    __esModule: true,
    default: 'graduation-hat-icon.svg',
  }),
  {virtual: true}
);

const renderComponent = (mockUser: any) => {
  (useAuth as jest.Mock).mockReturnValue({user: mockUser});

  return render(
    <BrowserRouter>
      <UserProfile />
    </BrowserRouter>
  );
};

const baseUser = {
  username: 'testuser',
  email: 'test@example.com',
  occupation: 'information-technology',
  areaOfStudy: 'computer-science',
  createdAt: '2024-01-15T00:00:00.000Z',
  profilePicture: null,
  googleOAuthEmail: null,
  githubOAuthEmail: null,
};

describe('pages/userProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Header', () => {
    it('should render username', () => {
      renderComponent(baseUser);

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should render email', () => {
      renderComponent(baseUser);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render Google OAuth email when regular email is not present', () => {
      const userWithGoogleAuth = {
        ...baseUser,
        email: null,
        googleOAuthEmail: 'google@example.com',
      };

      renderComponent(userWithGoogleAuth);

      expect(screen.getByText('google@example.com')).toBeInTheDocument();
    });

    it('should render GitHub OAuth email when other emails are not present', () => {
      const userWithGitHubAuth = {
        ...baseUser,
        email: null,
        googleOAuthEmail: null,
        githubOAuthEmail: 'github@example.com',
      };

      renderComponent(userWithGitHubAuth);

      expect(screen.getByText('github@example.com')).toBeInTheDocument();
    });

    it('should prioritize regular email over OAuth emails', () => {
      const userWithMultipleEmails = {
        ...baseUser,
        email: 'regular@example.com',
        googleOAuthEmail: 'google@example.com',
        githubOAuthEmail: 'github@example.com',
      };

      renderComponent(userWithMultipleEmails);

      expect(screen.getByText('regular@example.com')).toBeInTheDocument();
      expect(screen.queryByText('google@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('github@example.com')).not.toBeInTheDocument();
    });

    it('should render member since date', () => {
      renderComponent(baseUser);

      expect(screen.getByText(/Member since/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 2024/)).toBeInTheDocument();
    });

    it('should render default profile picture when user has no custom picture', () => {
      renderComponent(baseUser);

      const {container} = renderComponent(baseUser);

      const profilePicture = container.querySelector(
        '.profile-header img.profile-picture[alt="Profile"]'
      );

      expect(profilePicture).toBeInTheDocument();
      expect(profilePicture).toHaveAttribute('src', 'default-profile-icon.svg');
    });

    it('should render custom profile picture when user has one', () => {
      const userWithPicture = {
        ...baseUser,
        profilePicture: 'https://example.com/profile.jpg',
      };

      const {container} = renderComponent(userWithPicture);

      const profilePicture = container.querySelector('.profile-header .profile-picture');
      expect(profilePicture).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('should render occupation label', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Information Technology')).toBeInTheDocument();
    });

    it('should render area of study label', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Computer science')).toBeInTheDocument();
    });

    it('should render occupation icon', () => {
      renderComponent(baseUser);

      const occupationIcon = screen.getByAltText('Occupation');
      expect(occupationIcon).toBeInTheDocument();
      expect(occupationIcon).toHaveClass('occupation-picture');
    });

    it('should render area of study icon', () => {
      renderComponent(baseUser);

      const studyIcon = screen.getByAltText('Area Of study');
      expect(studyIcon).toBeInTheDocument();
      expect(studyIcon).toHaveClass('study-picture');
    });
  });

  describe('Navigation', () => {
    it('should render back to home link', () => {
      renderComponent(baseUser);

      const homeLink = screen.getByRole('link', {name: /Back to Home/i});
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should show back arrow in home link', () => {
      const {container} = renderComponent(baseUser);

      const backArrow = container.querySelector('.back-arrow');
      expect(backArrow).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should render sessions completed stat', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Sessions Completed')).toBeInTheDocument();
      const statValues = screen.getAllByText('0');
      expect(statValues.length).toBeGreaterThan(0);
    });

    it('should render problems solved stat', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    });

    it('should render hours practiced stat', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Hours Practiced')).toBeInTheDocument();
    });

    it('should render current streak stat', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Current Streak')).toBeInTheDocument();
    });

    it('should display trophy icon for sessions', () => {
      renderComponent(baseUser);

      const trophyIcon = screen.getByAltText('Sessions');
      expect(trophyIcon).toBeInTheDocument();
      expect(trophyIcon).toHaveClass('stat-icon');
    });

    it('should display target icon for problems', () => {
      renderComponent(baseUser);

      const targetIcon = screen.getByAltText('Problems');
      expect(targetIcon).toBeInTheDocument();
      expect(targetIcon).toHaveClass('stat-icon');
    });

    it('should display time icon for hours', () => {
      renderComponent(baseUser);

      const timeIcon = screen.getByAltText('Hours');
      expect(timeIcon).toBeInTheDocument();
      expect(timeIcon).toHaveClass('stat-icon');
    });

    it('should display trend icon for streak', () => {
      renderComponent(baseUser);

      const trendIcon = screen.getByAltText('Streak');
      expect(trendIcon).toBeInTheDocument();
      expect(trendIcon).toHaveClass('stat-icon');
    });

    it('should show 0 for all statistics', () => {
      renderComponent(baseUser);

      const statValues = screen.getAllByText('0');
      expect(statValues).toHaveLength(4);
    });
  });

  describe('Placeholder Section', () => {
    it('should render placeholder for future components', () => {
      renderComponent(baseUser);

      expect(screen.getByText('Placeholder for future components')).toBeInTheDocument();
    });
  });

  describe('UI Layout', () => {
    it('should have user-profile-wrapper container', () => {
      const {container} = renderComponent(baseUser);

      expect(container.querySelector('.user-profile-wrapper')).toBeInTheDocument();
    });

    it('should have user-profile-container', () => {
      const {container} = renderComponent(baseUser);

      expect(container.querySelector('.user-profile-container')).toBeInTheDocument();
    });

    it('should have profile-header section', () => {
      const {container} = renderComponent(baseUser);

      expect(container.querySelector('.profile-header')).toBeInTheDocument();
    });

    it('should have stats-card section', () => {
      const {container} = renderComponent(baseUser);

      expect(container.querySelector('.stats-card')).toBeInTheDocument();
    });

    it('should have reset-questions-card section', () => {
      const {container} = renderComponent(baseUser);

      expect(container.querySelector('.reset-questions-card')).toBeInTheDocument();
    });
  });

  describe('Different Occupations', () => {
    it('should handle student occupation', () => {
      const studentUser = {...baseUser, occupation: 'student'};
      renderComponent(studentUser);

      expect(screen.getByText('Student')).toBeInTheDocument();
    });

    it('should handle consulting occupation', () => {
      const consultingUser = {...baseUser, occupation: 'consulting-advisory'};
      renderComponent(consultingUser);

      expect(screen.getByText('Consulting / Advisory')).toBeInTheDocument();
    });

    it('should handle others occupation', () => {
      const othersUser = {...baseUser, occupation: 'others'};
      renderComponent(othersUser);

      expect(screen.getByText('Others')).toBeInTheDocument();
    });
  });

  describe('Different Areas of Study', () => {
    it('should handle biology area of study', () => {
      const bioUser = {...baseUser, areaOfStudy: 'biology'};
      renderComponent(bioUser);

      expect(screen.getByText('Biology')).toBeInTheDocument();
    });

    it('should handle mathematics area of study', () => {
      const mathUser = {...baseUser, areaOfStudy: 'mathematics'};
      renderComponent(mathUser);

      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    it('should handle others area of study', () => {
      const othersUser = {...baseUser, areaOfStudy: 'others'};
      renderComponent(othersUser);

      expect(screen.getByText('Others')).toBeInTheDocument();
    });
  });
});
