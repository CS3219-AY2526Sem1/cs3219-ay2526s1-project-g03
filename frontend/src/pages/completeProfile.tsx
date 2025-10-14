import React, {useState} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import {changePersonalInfo, changeUsernameOrEmail} from '../lib/api.ts';
import '../../styles/register.css';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy.ts';
import {OCCUPATIONS} from '../constants/occupation.ts';
import useAuth from '../hooks/useAuth.ts';

// Users that reach this page are guaranteed to be new.
const CompleteProfile: React.FC = () => {
  const {user, isLoading} = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [areaOfStudy, setAreaOfStudy] = useState('');

  const isOAuthUser =
    !user?.hasPassword && (user?.googleOAuthVerified || user?.githubOAuthVerified);

  React.useEffect(() => {
    if (isOAuthUser && user) {
      setUsername(user.username ?? '');
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
    }
  }, [isOAuthUser, user]); // Watch for changes in both.

  const {
    mutate: updatePersonalInfo,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: changePersonalInfo,
    onSuccess: () => {
      navigate('/', {
        replace: true, // User cannot go back to page
      });
    },
  });

  const {
    mutate: updateUsername,
    isPending: isUsernamePending,
    isError: isUsernameError,
    error: usernameError,
  } = useMutation({
    mutationFn: changeUsernameOrEmail,
    onSuccess: () => {
      updatePersonalInfo({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        occupation,
        areaOfStudy,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (user?.profileComplete) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="registration-wrapper">
      <div className="registration-container">
        <Link to="/Home" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>

        <div className="logo-section">
          <img src={PeerPrepIcon} alt="PeerPrep" className="logo-icon" />
        </div>

        <div className="heading">
          <h1>Finishing touches...</h1>
          <p>Just a few more details to get started!</p>
        </div>

        <form className="form-section">
          {(isError || isUsernameError) && (
            <div className="error">
              {error?.message || usernameError?.message || 'Invalid credentials'}
            </div>
          )}

          {isOAuthUser && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                autoFocus={isOAuthUser}
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              autoFocus={!isOAuthUser}
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

          <div className="button-group">
            <button
              type="button"
              className="submit-button"
              disabled={isPending || isUsernamePending}
              onClick={() => {
                if (isOAuthUser) {
                  const updates: any = {};
                  if (username.trim() !== user?.username) {
                    updates.username = username.trim();
                  }
                  if (Object.keys(updates).length) {
                    updateUsername(updates);
                  } else {
                    updatePersonalInfo({
                      firstName: firstName.trim(),
                      lastName: lastName.trim(),
                      occupation,
                      areaOfStudy,
                    });
                  }
                } else {
                  updatePersonalInfo({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    occupation,
                    areaOfStudy,
                  });
                }
              }}
            >
              {isPending || isUsernamePending ? 'Creating Account...' : 'Get started'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
