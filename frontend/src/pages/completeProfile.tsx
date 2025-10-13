import React, {useState} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import {changePersonalInfo, getUser} from '../lib/api.ts';
import '../../styles/register.css';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy.ts';
import {OCCUPATIONS} from '../constants/occupation.ts';
import useAuth from '../hooks/useAuth.ts';

const CompleteProfile: React.FC = () => {
  const {user, isLoading} = useAuth();

  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [areaOfStudy, setAreaOfStudy] = useState('');

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
          {isError && <div className="error">{error?.message || 'Invalid credentials'}</div>}
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              autoFocus
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
              disabled={isPending}
              onClick={() =>
                updatePersonalInfo({
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  occupation,
                  areaOfStudy,
                })
              }
            >
              {isPending ? 'Creating Account...' : 'Get started'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
