import React, {useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import DefaultProfileIcon from '../assets/default-profile-icon.svg';
import GitHubIcon from '../assets/github-icon.svg';
import GoogleIcon from '../assets/google-icon.svg';
import '../../styles/profileSettings.css';
import useAuth from '../hooks/useAuth';
import {
  changePassword,
  changePersonalInfo,
  changeProfilePic,
  changeUsernameOrEmail,
  deleteAccount,
  deleteProfilePic,
  resendEmail,
  unlinkOAuthProvider,
} from '../lib/api';
import queryClient from '../config/queryClient';
import {OCCUPATIONS} from '../constants/occupation';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy';

const ProfileSettings: React.FC = () => {
  const {user} = useAuth();
  const {
    username: currentUsername,
    email: currentEmail,
    verified: isVerified,
    profilePicture: currentProfilePicture,
    firstName: currentFirstName,
    lastName: currentLastName,
    occupation: currentOccupation,
    areaOfStudy: currentAreaOfStudy,
    hasPassword,
    googleOAuthVerified: hasGoogle,
    githubOAuthVerified: hasGithub,
  } = user;

  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [occupation, setOccupation] = useState(currentOccupation);
  const [areaOfStudy, setAreaOfStudy] = useState(currentAreaOfStudy);

  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const [deletePassword, setDeletePassword] = useState('');

  const [oAuthSuccess, setOAuthSuccess] = useState(null);
  const [oAuthError, setOAuthError] = useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      setOAuthSuccess(decodeURIComponent(success));
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (error) {
      setOAuthError(decodeURIComponent(error));
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  const personalInfoMutation = useMutation({
    mutationFn: changePersonalInfo,
  });

  const usernameOrEmailMutation = useMutation({
    mutationFn: changeUsernameOrEmail,
    onSuccess: () => {
      if (email !== currentEmail) {
        window.location.reload();
      }
    },
  });

  const pictureMutation = useMutation({
    mutationFn: changeProfilePic,
    onSuccess: () => {
      setProfilePicture(null);
      queryClient.invalidateQueries({queryKey: ['auth']});
    },
  });

  const deletePictureMutation = useMutation({
    mutationFn: deleteProfilePic,
    onSuccess: () => {
      setProfilePicture(null);
      queryClient.invalidateQueries({queryKey: ['auth']});
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      if (currentPassword === '') {
        window.location.reload();
      }
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      setDeletePassword('');
      alert('Account marked for deletion. You have 30 days to cancel by logging in.');
      window.location.href = '/home';
    },
  });

  const unlinkGoogleMutation = useMutation({
    mutationFn: () => unlinkOAuthProvider('google'),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['auth']});
    },
  });

  const unlinkGithubMutation = useMutation({
    mutationFn: () => unlinkOAuthProvider('github'),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['auth']});
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handlePersonalInfoSubmit = () => {
    personalInfoMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      occupation,
      areaOfStudy,
    });
  };

  const handleUsernameOrEmailSubmit = () => {
    const updates: any = {};
    if (username !== currentUsername) updates.username = username.trim();
    if (email !== currentEmail) updates.email = email.trim();

    if (Object.keys(updates).length > 0) {
      usernameOrEmailMutation.mutate(updates);
    }
  };

  const handlePictureSubmit = () => {
    if (profilePicture) {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);
      pictureMutation.mutate(formData);
    }
  };

  const handlePasswordSubmit = () => {
    if (hasPassword) {
      if (currentPassword && password && confirmPassword) {
        passwordMutation.mutate({
          currentPassword: currentPassword.trim(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        });
      }
    } else {
      if (password && confirmPassword) {
        passwordMutation.mutate({
          currentPassword: '',
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        });
      }
    }
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-container">
        <Link to="/profile" className="back-link">
          <span className="back-arrow" />
          <span>Back to Profile</span>
        </Link>

        <div className="settings-header">
          <h1 className="settings-title">Account Settings</h1>
          <p className="settings-subtitle">Manage your profile information</p>
        </div>

        <form className="settings-form">
          <div className="settings-section">
            <h2 className="section-title">Profile Picture</h2>
            {pictureMutation.isSuccess && (
              <div className="success-message">Profile picture updated successfully!</div>
            )}
            {pictureMutation.isError && (
              <div className="error-message">
                {pictureMutation.error?.message ||
                  'Failed to update profile picture. Please try again.'}
              </div>
            )}
            {deletePictureMutation.isSuccess && (
              <div className="success-message">Profile picture removed successfully!</div>
            )}
            {deletePictureMutation.isError && (
              <div className="error-message">
                {deletePictureMutation.error?.message ||
                  'Failed to remove profile picture. Please try again.'}
              </div>
            )}
            <div className="profile-picture-group">
              <img
                src={
                  profilePicture
                    ? URL.createObjectURL(profilePicture)
                    : currentProfilePicture || DefaultProfileIcon
                }
                alt="Profile"
                className="settings-profile-picture"
              />
              <div className="picture-upload">
                <label htmlFor="profilePicture" className="upload-button">
                  Choose File
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <span className="file-name">
                  {profilePicture ? profilePicture.name : 'No file chosen'}
                </span>
                {profilePicture && (
                  <button
                    type="button"
                    className="save-button"
                    disabled={pictureMutation.isPending}
                    onClick={handlePictureSubmit}
                  >
                    {pictureMutation.isPending ? 'Uploading...' : 'Upload Picture'}
                  </button>
                )}
                {(currentProfilePicture || profilePicture) && (
                  <button
                    type="button"
                    className="delete-button"
                    disabled={deletePictureMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove your profile picture?')) {
                        setProfilePicture(null);
                        deletePictureMutation.mutate();
                      }
                    }}
                  >
                    {deletePictureMutation.isPending ? 'Removing...' : 'Remove Picture'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Personal Information</h2>
            {personalInfoMutation.isSuccess && (
              <div className="success-message">Profile updated successfully!</div>
            )}
            {personalInfoMutation.isError && (
              <div className="error-message">
                {personalInfoMutation.error?.message
                  ? personalInfoMutation.error.message
                      .split('\n')
                      .map((msg, idx) => <div key={idx}>{msg}</div>)
                  : 'Failed to update profile. Please try again.'}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                className="form-input"
                placeholder="Enter your first name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                className="form-input"
                placeholder="Enter your last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <select
                id="occupation"
                className="form-select"
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
              >
                {OCCUPATIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="areaOfStudy">What is your area of studies?</label>
              <select
                id="areaOfStudy"
                className="form-select"
                value={areaOfStudy}
                onChange={e => setAreaOfStudy(e.target.value)}
              >
                {AREAS_OF_STUDY.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="save-button"
              disabled={personalInfoMutation.isPending}
              onClick={handlePersonalInfoSubmit}
            >
              {usernameOrEmailMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Basic Information</h2>
            {usernameOrEmailMutation.isSuccess && (
              <div className="success-message">Profile updated successfully!</div>
            )}
            {usernameOrEmailMutation.isError && (
              <div className="error-message">
                {usernameOrEmailMutation.error?.message
                  ? usernameOrEmailMutation.error.message
                      .split('\n')
                      .map((msg, idx) => <div key={idx}>{msg}</div>)
                  : 'Failed to update profile. Please try again.'}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="save-button"
              disabled={usernameOrEmailMutation.isPending}
              onClick={handleUsernameOrEmailSubmit}
            >
              {usernameOrEmailMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="settings-section">
            <h2 className="section-title">{hasPassword ? 'Change Password' : 'Set Password'}</h2>
            {passwordMutation.isSuccess && (
              <div className="success-message">
                {hasPassword ? 'Password updated successfully!' : 'Password set successfully!'}
              </div>
            )}
            {passwordMutation.isError && (
              <div className="error-message">
                {passwordMutation.error?.message
                  ? passwordMutation.error.message
                      .split('\n')
                      .map((msg, idx) => <div key={idx}>{msg}</div>)
                  : 'Failed to update password. Please try again.'}
              </div>
            )}

            {!currentEmail ? (
              <div className="info-message">
                You need to have a local email address before you can set a password!
              </div>
            ) : !isVerified ? (
              <div className="info-message">
                You need to verify your email address before you can set a password. Please check
                your inbox for the verification email, of{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={async () => {
                    try {
                      await resendEmail({email});
                      alert('Verification email resent! Please check your inbox.');
                    } catch (error) {
                      alert('Failed to resend email. Please try again!');
                    }
                  }}
                >
                  resend verification email
                </button>
                .
              </div>
            ) : (
              <>
                {hasPassword && (
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      className="form-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label htmlFor="password">{hasPassword ? 'New Password' : 'Password'}</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder={hasPassword ? 'Enter new password' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {hasPassword ? 'Confirm New Password' : 'Confirm Password'}
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                placeholder={hasPassword ? 'Confirm new password' : 'Confirm your password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="save-button"
              disabled={passwordMutation.isPending}
              onClick={handlePasswordSubmit}
            >
              {passwordMutation.isPending
                ? 'Updating...'
                : hasPassword
                  ? 'Update Password'
                  : 'Set Password'}
            </button>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Connected Accounts</h2>
            {oAuthSuccess && <div className="success-message">Account linked successfully!</div>}
            {oAuthError && (
              <div className="error-message">
                {oAuthError || 'An error occurred, please try again.'}
              </div>
            )}
            {usernameOrEmailMutation.isError && (
              <div className="error-message">
                {usernameOrEmailMutation.error?.message ||
                  'Failed to update profile. Please try again.'}
              </div>
            )}
            {unlinkGithubMutation.isError && (
              <div className="error-message">
                {unlinkGithubMutation.error?.message || 'Failed to unlink GitHub account!'}
              </div>
            )}
            {unlinkGoogleMutation.isError && (
              <div className="error-message">
                {unlinkGoogleMutation.error?.message || 'Failed to unlink Google account!'}
              </div>
            )}
            <div className="connected-accounts">
              <div className="account-item">
                <div className="account-info">
                  <img src={GitHubIcon} alt="GitHub" className="icon-github" />
                  <div>
                    <div className="account-name">GitHub</div>
                    <div className="account-status">
                      {hasGithub ? `Connected (${user.githubOAuthEmail})` : 'Not connected'}
                    </div>
                  </div>
                </div>
                {hasGithub ? (
                  <button
                    type="button"
                    className="connect-button"
                    disabled={unlinkGithubMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to unlink your GitHub accuont?')) {
                        unlinkGithubMutation.mutate();
                      }
                    }}
                  >
                    {unlinkGithubMutation.isPending ? 'Unlinking...' : 'Unlink'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="connect-button"
                    disabled={unlinkGithubMutation.isPending}
                    onClick={() =>
                      (window.location.href = `${import.meta.env.VITE_USER_SERVICE_URL}/auth/github?link=true`)
                    }
                  >
                    Connect
                  </button>
                )}
              </div>
              <div className="account-item">
                <div className="account-info">
                  <img src={GoogleIcon} alt="Google" className="icon-google" />
                  <div>
                    <div className="account-name">Google</div>
                    <div className="account-status">
                      {hasGoogle ? `Connected (${user.googleOAuthEmail})` : 'Not connected'}
                    </div>
                  </div>
                </div>
                {hasGoogle ? (
                  <button
                    type="button"
                    className="connect-button"
                    disabled={unlinkGoogleMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to unlink your Google account?')) {
                        unlinkGoogleMutation.mutate();
                      }
                    }}
                  >
                    {unlinkGoogleMutation.isPending ? 'Unlinking...' : 'Unlink'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="connect-button"
                    onClick={() =>
                      (window.location.href = `${import.meta.env.VITE_USER_SERVICE_URL}/auth/google?link=true`)
                    }
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h2 className="section-title danger-title">Delete Account</h2>
            {deleteAccountMutation.isError && (
              <div className="error-message">
                {deleteAccountMutation.error?.message ||
                  'Failed to delete account. Please try again.'}
              </div>
            )}
            <p className="danger-description">
              Once you delete your account, you have 30 days to cancel by logging in. After that,
              all data will be permanently removed.
            </p>

            <div className="form-group">
              <label htmlFor="deletePassword">Enter your password to confirm</label>
              <input
                type="password"
                id="deletePassword"
                className="form-input"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="delete-button"
              disabled={deleteAccountMutation.isPending || !deletePassword.trim()}
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure? Your account will be deleted in 30 days unless you log in again.'
                  )
                ) {
                  deleteAccountMutation.mutate({password: deletePassword});
                }
              }}
            >
              {deleteAccountMutation.isPending ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
