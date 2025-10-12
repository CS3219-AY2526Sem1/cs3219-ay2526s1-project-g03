import React from 'react';
import FlagIcon from '../assets/profile/flag-icon.svg';
import TargetIcon from '../assets/profile/green-target-icon.svg';
import TrendUpIcon from '../assets/profile/trend-up-icon.svg';
import TimeIcon from '../assets/profile/yellow-clock-icon.svg';
import MatchIcon from '../assets/profile/users-icon.svg';
import QuestionSettingIcon from '../assets/profile/setting-icon.svg';
import '../../styles/profile.css';

const Profile: React.FC = () => (
  <div className="profile-wrapper">
    <main className="profile-main">
      <section className="welcome-section">
        <h1 className="welcome-title">
          Welcome back,
          <span className="welcome-username-highlight">User</span>!
        </h1>
        <p className="welcome-subtitle">Ready to sharpen your coding skills today?</p>
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
            <button className="action-button start-button">Start</button>
          </div>
          <div className="action-card">
            <img src={QuestionSettingIcon} alt="Settings" className="action-icon" />
            <div className="action-content">
              <h3 className="action-title">Question Settings</h3>
              <p className="action-description">Reset questions</p>
            </div>
            <button className="action-button reset-button">Reset</button>
          </div>
        </div>

        <div className="recent-activity-container">
          <h2 className="section-title">Recent Activity</h2>
        </div>
      </section>
    </main>
  </div>
);

export default Profile;
