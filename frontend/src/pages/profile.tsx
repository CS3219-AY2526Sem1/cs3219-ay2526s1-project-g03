import React from 'react';
import FlagIcon from '../assets/profile/flag-icon.svg';
import LockIcon from '../assets/lock-icon.svg';
import ErrorIcon from '../assets/alert-icon.svg';
import TargetIcon from '../assets/profile/green-target-icon.svg';
import TrendUpIcon from '../assets/profile/trend-up-icon.svg';
import TimeIcon from '../assets/profile/yellow-clock-icon.svg';
import MatchIcon from '../assets/profile/users-icon.svg';
import QuestionSettingIcon from '../assets/profile/setting-icon.svg';
import '../../styles/profile.css';
import useAuth from '../hooks/useAuth';
import {Link, useNavigate} from 'react-router-dom';
import {resendEmail} from '../lib/api';

const Profile: React.FC = () => {
  const {user} = useAuth();
  const navigate = useNavigate(); 
  const {username, email, verified, googleOAuthVerified, githubOAuthVerified} = user;
  const isVerified = verified || googleOAuthVerified || githubOAuthVerified;

  const handleResendEmail = async () => {
    try {
      await resendEmail({email});
      alert('Verification email resent! Please check your inbox');
    } catch (error) {
      console.error('Failed to resend email:', error);
      alert(error?.message || 'Failed to resend email. Please try again.');
    }
  };

  if (!isVerified) {
    return (
      <div className="verify-prompt-wrapper">
        <div className="verify-prompt-container">
          <div className="alert alert-warning">
            <img src={ErrorIcon} alt="Warning" className="alert-icon" />
            <span className="alert-text">Email verification required</span>
          </div>
        </div>

        <div className="verify-prompt-content">
          <h2 className="verify-prompt-title">Please verify your email!</h2>
          <p className="verify-prompt-message">
            We've sent a verification link to <strong>{email}</strong>
            <br />
            Please check your inbox and click on the link to access your profile.
          </p>
        </div>

        <div className="verify-prompt-actions">
          <p className="verify-prompt-note">
            Didn't receive the email?{' '}
            <button onClick={handleResendEmail} className="link-button">
              Resend verification
            </button>
          </p>
          <Link to="/Home" className="back-link">
            <span className="back-arrow" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <main className="profile-main">
        <section className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, &nbsp;
              <span className="welcome-username-highlight">{username}</span>!
            </h1>
            <p className="welcome-subtitle">Ready to sharpen your coding skills today?</p>
          </div>

          {user.role === 'admin' && (
            <Link to="/admin/manage" className="admin-link">
              <button className="admin-manage-button">
                <img src={LockIcon} alt="Sessions" className="lock-icon" />
                Manage Admins
              </button>
            </Link>
          )}
        </section>

        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-info">
              <p className="stat-value">0</p>
              <p className="stat-label">Sessions Completed</p>
            </div>
            <img src={FlagIcon} alt="Sessions" className="stat-icon" />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <p className="stat-value">0</p>
              <p className="stat-label">Problems Solved</p>
            </div>
            <img src={TargetIcon} alt="Problems" className="stat-icon" />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <p className="stat-value">0</p>
              <p className="stat-label">Hours Practiced</p>
            </div>
            <img src={TimeIcon} alt="Hours" className="stat-icon" />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <p className="stat-value">0</p>
              <p className="stat-label">Current Streak</p>
            </div>
            <img src={TrendUpIcon} alt="Streak" className="stat-icon" />
          </div>
        </section>

        <section className="actions-activity-section">
          <div className="quick-actions-container">
            <h2 className="section-title">Quick Actions</h2>
            <div className="action-card">
              <img src={MatchIcon} alt="Find Match" className="action-icon" />
              <div className="action-content">
                <h3 className="action-title">Find Match</h3>
                <p className="action-description">Find a partner instantly</p>
              </div>
              <button 
                className="action-button start-button"
                onClick={() => navigate('/dashboard')}
              >
                Start
              </button>
            </div>
            <div className="action-card">
              <img src={QuestionSettingIcon} alt="Settings" className="action-icon" />
              <div className="action-content">
                <h3 className="action-title">Question Settings</h3>
                <p className="action-description">Reset questions</p>
              </div>
              <button 
                className="action-button reset-button"
                onClick={() => navigate('/history/reset', { state: { from: 'home' } })}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="recent-activity-container">
            <h2 className="section-title">Recent Activity</h2>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
