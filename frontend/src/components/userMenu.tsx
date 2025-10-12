import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import UserProfileIcon from '../assets/github-icon.svg'; // TODO: make this dynamic in future
import NotificationIcon from '../assets/profile/notification-icon.svg';
import LogoutIcon from '../assets/profile/logout-icon.svg';
import '../../styles/userMenu.css';
import useAuth from '../hooks/useAuth';
import {useMutation} from '@tanstack/react-query';
import {logout} from '../lib/api';
import queryClient from '../config/queryClient';

const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const {user} = useAuth();
  const {username} = user;

  const {mutate: logOut} = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
    onSettled: () => {
      navigate('/home', {replace: true});
    },
  });

  return (
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
            <span className="username-text">&nbsp;{username}</span>
          </Link>
          <button onClick={() => logOut()} className="icon-button">
            <img src={LogoutIcon} alt="Logout" className="exit-icon" />
          </button>
        </div>
      </header>
    </div>
  );
};

export default UserMenu;
