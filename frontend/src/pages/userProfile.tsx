import React from 'react';
import DefaultProfileIcon from '../assets/default-profile-icon.svg';
import TrophyIcon from '../assets/user-profile/trophy-icon.svg';
import TargetIcon from '../assets/user-profile/green-target-icon.svg';
import TimeIcon from '../assets/user-profile/blue-clock-icon.svg';
import TrendUpIcon from '../assets/user-profile/trend-up-icon.svg';
import OccupationIcon from '../assets/user-profile/work-case-icon.svg';
import AreaOfStudyIcon from '../assets/user-profile/graduation-hat-icon.svg';
import '../../styles/userProfile.css';
import useAuth from '../hooks/useAuth';
import {OCCUPATIONS} from '../constants/occupation';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy';
import {Link} from 'react-router-dom';

const UserProfile: React.FC = () => {
  const {user} = useAuth();
  const {username, email, occupation, areaOfStudy, googleOAuthEmail, githubOAuthEmail} = user;
  const displayEmail = email ?? googleOAuthEmail ?? githubOAuthEmail;
  const occupationLabel = OCCUPATIONS.find(o => o.value === occupation)?.label || '';
  const areaOfStudyLabel = AREAS_OF_STUDY.find(o => o.value === areaOfStudy)?.label || '';

  return (
    <div className="user-profile-wrapper">
      <div className="user-profile-container">
        <Link to="/" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>
        <div className="profile-header">
          <img
            src={user.profilePicture || DefaultProfileIcon}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-hori">
            <div className="profile-info">
              <h2 className="profile-username">{username}</h2>
              <p className="profile-email">{displayEmail}</p>
              <span className="member-label">
                Member since{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="profile-dets">
              <span className="occupation">
                <img src={OccupationIcon} alt="Occupation" className="occupation-picture" />
                {occupationLabel}
              </span>
              <span className="area-of-study">
                <img src={AreaOfStudyIcon} alt="Area Of study" className="study-picture" />
                {areaOfStudyLabel}
              </span>
            </div>
          </div>
        </div>

        {/* TODO: Make this dynamic in future */}
        <div className="profile-content">
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-info">
                <p className="stat-value">0</p>
                <p className="stat-label">Sessions Completed</p>
              </div>
              <img src={TrophyIcon} alt="Sessions" className="stat-icon" />
            </div>

            <div className="stat-item">
              <div className="stat-info">
                <p className="stat-value">0</p>
                <p className="stat-label">Problems Solved</p>
              </div>
              <img src={TargetIcon} alt="Problems" className="stat-icon" />
            </div>

            <div className="stat-item">
              <div className="stat-info">
                <p className="stat-value">0</p>
                <p className="stat-label">Hours Practiced</p>
              </div>
              <img src={TimeIcon} alt="Hours" className="stat-icon" />
            </div>

            <div className="stat-item">
              <div className="stat-info">
                <p className="stat-value">0</p>
                <p className="stat-label">Current Streak</p>
              </div>
              <img src={TrendUpIcon} alt="Streak" className="stat-icon" />
            </div>
          </div>

          {/* TODO: Question Service */}
          <div className="reset-questions-card">
            <h3 className="card-title">Placeholder for future components</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
