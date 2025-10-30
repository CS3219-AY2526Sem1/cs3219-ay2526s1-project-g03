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
import ProfileSettings from '../../pages/profileSettings';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api');

// Mock window methods
const mockAlert = jest.fn();
const mockConfirm = jest.fn();

Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

const mockUser = {
  username: 'testuser',
  email: 'test@example.com',
  verified: true,
  profilePicture: null,
  firstName: 'Test',
  lastName: 'User',
  occupation: 'student',
  areaOfStudy: 'computer-science',
  hasPassword: true,
  googleOAuthVerified: false,
  githubOAuthVerified: false,
  googleOAuthEmail: null,
  githubOAuthEmail: null,
};

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ProfileSettings />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('pages/profileSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({user: mockUser});
  });

  describe('Rendering', () => {
    it('should render the component with all sections', () => {
      renderComponent();

      expect(screen.getByRole('heading', {name: 'Account Settings'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Profile Picture'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Personal Information'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Basic Information'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Change Password'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Connected Accounts'})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: 'Delete Account'})).toBeInTheDocument();
    });

    it('should display user information in form fields', () => {
      renderComponent();

      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    });

    it('should show "Set Password" when user has no password', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, hasPassword: false},
      });

      renderComponent();

      expect(screen.getByRole('heading', {name: 'Set Password'})).toBeInTheDocument();
    });
  });

  // Not done due to some issues with JSDOM and trying to mock windows. Could not fix.
  //   describe('OAuth Success/Error Messages', () => {
  //   });

  describe('Profile Picture Management', () => {
    it('should handle file selection', () => {
      renderComponent();

      const file = new File(['test'], 'test.png', {type: 'image/png'});
      const input = screen.getByLabelText('Choose File') as HTMLInputElement;

      fireEvent.change(input, {target: {files: [file]}});

      expect(screen.getByText('test.png')).toBeInTheDocument();
    });

    it('should upload profile picture', async () => {
      (api.changeProfilePic as jest.Mock).mockResolvedValue({});

      renderComponent();

      const file = new File(['test'], 'test.png', {type: 'image/png'});
      const input = screen.getByLabelText('Choose File') as HTMLInputElement;

      fireEvent.change(input, {target: {files: [file]}});

      const uploadButton = screen.getByText('Upload Picture');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(api.changeProfilePic).toHaveBeenCalled();
      });
    });

    it('should delete profile picture with confirmation', async () => {
      mockConfirm.mockReturnValue(true);
      (api.deleteProfilePic as jest.Mock).mockResolvedValue({});
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, profilePicture: 'existing-picture.jpg'},
      });

      renderComponent();

      const deleteButton = screen.getByText('Remove Picture');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          'Are you sure you want to remove your profile picture?'
        );
        expect(api.deleteProfilePic).toHaveBeenCalled();
      });
    });

    it('should not delete profile picture when confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false);
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, profilePicture: 'existing-picture.jpg'},
      });

      renderComponent();

      const deleteButton = screen.getByText('Remove Picture');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteProfilePic).not.toHaveBeenCalled();
    });
  });

  describe('Personal Information Update', () => {
    it('should update personal information', async () => {
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      const firstNameInput = screen.getByLabelText('First Name');
      fireEvent.change(firstNameInput, {target: {value: 'NewFirst'}});

      const saveButtons = screen.getAllByText('Save Changes');
      const saveButton = saveButtons[0]; // Personal Information is first

      fireEvent.click(saveButton);

      await waitFor(
        () => {
          const call = (api.changePersonalInfo as jest.Mock).mock.calls[0];
          expect(call[0]).toEqual({
            firstName: 'NewFirst',
            lastName: 'User',
            occupation: 'student',
            areaOfStudy: 'computer-science',
          });
        },
        {timeout: 3000}
      );
    });
  });

  describe('Username/Email Update', () => {
    it('should update username only', async () => {
      (api.changeUsernameOrEmail as jest.Mock).mockResolvedValue({});

      renderComponent();

      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, {target: {value: 'newusername'}});

      const saveButtons = screen.getAllByText('Save Changes');
      const saveButton = saveButtons[1]; // Basic Information is second

      fireEvent.click(saveButton);

      await waitFor(
        () => {
          const call = (api.changeUsernameOrEmail as jest.Mock).mock.calls[0];
          expect(call[0]).toEqual({
            username: 'newusername',
          });
        },
        {timeout: 3000}
      );
    });

    it('should update email only', async () => {
      (api.changeUsernameOrEmail as jest.Mock).mockResolvedValue({});

      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, {target: {value: 'newemail@example.com'}});

      const saveButtons = screen.getAllByText('Save Changes');
      const saveButton = saveButtons[1];

      fireEvent.click(saveButton);

      await waitFor(
        () => {
          const call = (api.changeUsernameOrEmail as jest.Mock).mock.calls[0];
          expect(call[0]).toEqual({
            email: 'newemail@example.com',
          });
        },
        {timeout: 3000}
      );
    });

    it('should not update when no changes', () => {
      renderComponent();

      const saveButtons = screen.getAllByText('Save Changes');
      const saveButton = saveButtons[1];

      fireEvent.click(saveButton);

      expect(api.changeUsernameOrEmail).not.toHaveBeenCalled();
    });
  });

  describe('Password Management', () => {
    it('should change password with current password', async () => {
      (api.changePassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(currentPasswordInput, {target: {value: 'oldpass'}});
      fireEvent.change(newPasswordInput, {target: {value: 'newpass'}});
      fireEvent.change(confirmPasswordInput, {target: {value: 'newpass'}});

      const updateButton = screen.getByRole('button', {name: 'Update Password'});
      fireEvent.click(updateButton);

      await waitFor(
        () => {
          const call = (api.changePassword as jest.Mock).mock.calls[0];
          expect(call[0]).toEqual({
            currentPassword: 'oldpass',
            password: 'newpass',
            confirmPassword: 'newpass',
          });
        },
        {timeout: 3000}
      );
    });

    it('should set password for user without password', async () => {
      (api.changePassword as jest.Mock).mockResolvedValue({});
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, hasPassword: false, verified: true},
      });

      renderComponent();

      const newPasswordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(newPasswordInput, {target: {value: 'newpass'}});
      fireEvent.change(confirmPasswordInput, {target: {value: 'newpass'}});

      const setButton = screen.getByRole('button', {name: 'Set Password'});
      fireEvent.click(setButton);

      await waitFor(() => {
        const call = (api.changePassword as jest.Mock).mock.calls[0];
        expect(call[0]).toEqual({
          currentPassword: '',
          password: 'newpass',
          confirmPassword: 'newpass',
        });
      });
    });

    it('should not update password when fields are incomplete for user with password', () => {
      renderComponent();

      const updateButton = screen.getByRole('button', {name: 'Update Password'});
      fireEvent.click(updateButton);

      expect(api.changePassword).not.toHaveBeenCalled();
    });

    it('should show info message when no email for password setting', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, email: null},
      });

      renderComponent();

      expect(
        screen.getByText('You need to have a local email address before you can set a password!')
      ).toBeInTheDocument();
    });

    it('should show verification message when email not verified', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, verified: false},
      });

      renderComponent();

      expect(
        screen.getByText(/You need to verify your email address before you can set a password/)
      ).toBeInTheDocument();
    });

    it('should resend verification email', async () => {
      (api.resendEmail as jest.Mock).mockResolvedValue({});
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, verified: false},
      });

      renderComponent();

      const resendButton = screen.getByText('resend verification email');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(api.resendEmail).toHaveBeenCalledWith({email: 'test@example.com'});
        expect(mockAlert).toHaveBeenCalledWith(
          'Verification email resent! Please check your inbox.'
        );
      });
    });

    it('should handle resend email error', async () => {
      (api.resendEmail as jest.Mock).mockRejectedValue(new Error('Failed'));
      (useAuth as jest.Mock).mockReturnValue({
        user: {...mockUser, verified: false},
      });

      renderComponent();

      const resendButton = screen.getByText('resend verification email');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to resend email. Please try again!');
      });
    });
  });

  describe('OAuth Account Management', () => {
    it('should display GitHub as connected', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          githubOAuthVerified: true,
          githubOAuthEmail: 'github@example.com',
        },
      });

      renderComponent();

      expect(screen.getByText('Connected (github@example.com)')).toBeInTheDocument();
    });

    it('should display Google as connected', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          googleOAuthVerified: true,
          googleOAuthEmail: 'google@example.com',
        },
      });

      renderComponent();

      expect(screen.getByText('Connected (google@example.com)')).toBeInTheDocument();
    });

    it('should unlink GitHub account with confirmation', async () => {
      mockConfirm.mockReturnValue(true);
      (api.unlinkOAuthProvider as jest.Mock).mockResolvedValue({});
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          githubOAuthVerified: true,
          githubOAuthEmail: 'github@example.com',
        },
      });

      renderComponent();

      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          'Are you sure you want to unlink your GitHub accuont?'
        );
        expect(api.unlinkOAuthProvider).toHaveBeenCalledWith('github');
      });
    });

    it('should unlink Google account with confirmation', async () => {
      mockConfirm.mockReturnValue(true);
      (api.unlinkOAuthProvider as jest.Mock).mockResolvedValue({});
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          googleOAuthVerified: true,
          googleOAuthEmail: 'google@example.com',
        },
      });

      renderComponent();

      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          'Are you sure you want to unlink your Google account?'
        );
        expect(api.unlinkOAuthProvider).toHaveBeenCalledWith('google');
      });
    });

    it('should not unlink when confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false);
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          githubOAuthVerified: true,
          githubOAuthEmail: 'github@example.com',
        },
      });

      renderComponent();

      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(api.unlinkOAuthProvider).not.toHaveBeenCalled();
    });
  });

  describe('Account Deletion', () => {
    it('should not delete account when confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false);

      renderComponent();

      const passwordInput = screen.getByLabelText('Enter your password to confirm');
      fireEvent.change(passwordInput, {target: {value: 'password123'}});

      const deleteButton = screen.getByRole('button', {name: 'Delete Account'});
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteAccount).not.toHaveBeenCalled();
    });

    it('should disable delete button when password is empty', () => {
      renderComponent();

      const deleteButton = screen.getByRole('button', {name: 'Delete Account'});

      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display profile picture update error', async () => {
      const error = new Error('Upload failed');
      (api.changeProfilePic as jest.Mock).mockRejectedValue(error);

      renderComponent();

      const file = new File(['test'], 'test.png', {type: 'image/png'});
      const input = screen.getByLabelText('Choose File') as HTMLInputElement;
      fireEvent.change(input, {target: {files: [file]}});

      const uploadButton = screen.getByText('Upload Picture');
      fireEvent.click(uploadButton);

      await waitFor(() => expect(api.changeProfilePic).toHaveBeenCalled());

      // FIX: Check for actual error message
      await waitFor(
        () => {
          expect(screen.getByText('Upload failed')).toBeInTheDocument();
        },
        {timeout: 3000}
      );
    });

    it('should display personal info update error with message', async () => {
      const error = {message: 'Invalid data'};
      (api.changePersonalInfo as jest.Mock).mockRejectedValue(error);

      renderComponent();

      const saveButton = screen.getAllByText('Save Changes')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid data')).toBeInTheDocument();
      });
    });

    it('should display multiple error messages', async () => {
      const error = {message: 'Error 1\nError 2'};
      (api.changePersonalInfo as jest.Mock).mockRejectedValue(error);

      renderComponent();

      const saveButton = screen.getAllByText('Save Changes')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
      });
    });
  });

  describe('Success Messages', () => {
    it('should display profile picture update success', async () => {
      (api.changeProfilePic as jest.Mock).mockResolvedValue({});

      renderComponent();

      const file = new File(['test'], 'test.png', {type: 'image/png'});
      const input = screen.getByLabelText('Choose File') as HTMLInputElement;
      fireEvent.change(input, {target: {files: [file]}});

      const uploadButton = screen.getByText('Upload Picture');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Profile picture updated successfully!')).toBeInTheDocument();
      });
    });

    it('should display personal info update success', async () => {
      (api.changePersonalInfo as jest.Mock).mockResolvedValue({});

      renderComponent();

      const saveButton = screen.getAllByText('Save Changes')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });

    it('should display password update success', async () => {
      (api.changePassword as jest.Mock).mockResolvedValue({});

      renderComponent();

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(currentPasswordInput, {target: {value: 'oldpass'}});
      fireEvent.change(newPasswordInput, {target: {value: 'newpass'}});
      fireEvent.change(confirmPasswordInput, {target: {value: 'newpass'}});

      const updateButton = screen.getByRole('button', {name: 'Update Password'});
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully!')).toBeInTheDocument();
      });
    });
  });
});
