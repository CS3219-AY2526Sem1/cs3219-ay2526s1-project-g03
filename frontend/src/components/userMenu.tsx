import React from 'react';
import {Link} from 'react-router-dom';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import UserProfileIcon from '../assets/github-icon.svg'; // TODO: make this dynamic in future
import NotificationIcon from '../assets/profile/notification-icon.svg';
import LogoutIcon from '../assets/profile/logout-icon.svg';
import '../../styles/userMenu.css';

const UserMenu: React.FC = () => (
  <div className="user-menu-wrapper">
    <header className="user-menu-header">
      <div className="logo-container">
        <img src={PeerPrepIcon} alt="PeerPrep" className="header-logo" />
      </div>
      <div className="header-right">
        <button className="icon-button">
          <img src={NotificationIcon} alt="Notifications" className="notification-icon" />
        </button>
        <Link to="/profile/customize" className="icon-link">
          <img src={UserProfileIcon} alt="User Profile" className="user-profile-icon" />
          <span className="username-text">User</span>
        </Link>
        <Link to="/logout" className="icon-link">
          <img src={LogoutIcon} alt="Logout" className="exit-icon" />
        </Link>
      </div>
    </header>
  </div>
);

export default UserMenu;
