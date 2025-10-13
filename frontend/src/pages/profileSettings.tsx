import React, {useState} from 'react';
import {Link} from 'react-router-dom';
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
} from '../lib/api';
import queryClient from '../config/queryClient';
import {OCCUPATIONS} from '../constants/occupation';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy';

const ProfileSettings: React.FC = () => {
  const {user} = useAuth();
  const {
    username: currentUsername,
    email: currentEmail,
    profilePicture: currentProfilePicture,
    firstName: currentFirstName,
    lastName: currentLastName,
    occupation: currentOccupation,
    areaOfStudy: currentAreaOfStudy,
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

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
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
    if (currentPassword && password && confirmPassword) {
      passwordMutation.mutate({
        currentPassword: currentPassword.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });
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
                {personalInfoMutation.error?.message ||
                  'Failed to update profile. Please try again.'}
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
                {usernameOrEmailMutation.error?.message ||
                  'Failed to update profile. Please try again.'}
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
            <h2 className="section-title">Change Password</h2>
            {passwordMutation.isSuccess && (
              <div className="success-message">Profile updated successfully!</div>
            )}
            {passwordMutation.isError && (
              <div className="error-message">
                {passwordMutation.error?.message || 'Failed to update profile. Please try again.'}
              </div>
            )}
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

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                placeholder="Confirm new password"
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
              {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Connected Accounts</h2>
            <div className="connected-accounts">
              <div className="account-item">
                <div className="account-info">
                  <img src={GitHubIcon} alt="GitHub" className="icon-github" />
                  <div>
                    <div className="account-name">GitHub</div>
                    <div className="account-status">Not connected</div>
                  </div>
                </div>
                <button type="button" className="connect-button">
                  Connect
                </button>
              </div>
              <div className="account-item">
                <div className="account-info">
                  <img src={GoogleIcon} alt="Google" className="icon-google" />
                  <div>
                    <div className="account-name">Google</div>
                    <div className="account-status">Not connected</div>
                  </div>
                </div>
                <button type="button" className="connect-button">
                  Connect
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h2 className="section-title danger-title">Delete Account</h2>
            <p className="danger-description">
              Once you delete your account, there is no going back. Please be certain
            </p>
            <button type="button" className="delete-button">
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
