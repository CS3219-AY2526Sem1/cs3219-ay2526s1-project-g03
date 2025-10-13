import React from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import DefaultProfileIcon from '../assets/default-profile-icon.svg'; // TODO: make this dynamic in future
import NotificationIcon from '../assets/profile/notification-icon.svg';
import EditIcon from '../assets/settings-icon.svg';
import LogoutIcon from '../assets/profile/logout-icon.svg';
import '../../styles/userMenu.css';
import useAuth from '../hooks/useAuth';
import {useMutation} from '@tanstack/react-query';
import {logout} from '../lib/api';
import queryClient from '../config/queryClient';

const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith('/profile'); // TODO: change, hardcoded

  const {user} = useAuth();
  const {username, verified} = user;

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
          {isProfilePage ? (
            <>
              <Link to="/profile/settings" className="settings-link">
                <span className="settings-text">Account Settings</span>
                <button className="icon-button">
                  <img src={EditIcon} alt="Settings" className="settings-icon" />
                </button>
              </Link>
              <button onClick={() => logOut()} className="icon-button">
                <img src={LogoutIcon} alt="Logout" className="exit-icon" />
              </button>
            </>
          ) : (
            <>
              <button className="icon-button">
                <img src={NotificationIcon} alt="Notifications" className="notification-icon" />
              </button>

              {verified ? (
                <Link to="/profile/" className="icon-link">
                  <img
                    src={user.profilePicture || DefaultProfileIcon}
                    alt="User Profile"
                    className="user-profile-icon"
                  />
                  <span className="username-text">&nbsp;{username}</span>
                </Link>
              ) : (
                <div className="icon-link disabled">
                  <img
                    src={user.profilePicture || DefaultProfileIcon}
                    alt="User Profile"
                    className="user-profile-icon"
                  />
                  <span className="username-text">&nbsp;{username}</span>
                </div>
              )}

              <button onClick={() => logOut()} className="icon-button">
                <img src={LogoutIcon} alt="Logout" className="exit-icon" />
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
};

export default UserMenu;
