import React from 'react';
import './logoNavbar.css'
import PeerPrepIcon from '../../assets/peerprep-icon.svg';

const LogoNavbar = () => {
  return (
    <nav className="navbar">
      <div className="logo-container">
        <img src={PeerPrepIcon} alt="PeerPrep" className="logo-icon" />
      </div>
    </nav>
  );
};

export default LogoNavbar;