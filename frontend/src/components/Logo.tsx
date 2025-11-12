import React from 'react';
import PeerPrepIcon from '../assets/peerprep-icon.svg';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img src={PeerPrepIcon} alt="PeerPrep" className="h-8 w-8" />
    </div>
  );
};

