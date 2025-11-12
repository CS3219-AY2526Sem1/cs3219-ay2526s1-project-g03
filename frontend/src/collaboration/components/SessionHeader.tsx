import {useEffect, useState} from 'react';
import PeerPrepIcon from '../../assets/peerprep-icon.svg';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const INITIAL_PENALTY_TIME = MINUTE * 10;

export default function SessionHeader({
  sessionStartTime,
  handlePenaltyOver,
}: {
  sessionStartTime: number | null;
  handlePenaltyOver: () => void;
}) {
  const [time, setTime] = useState(0);
  const [penaltyTime, setPenaltyTime] = useState(INITIAL_PENALTY_TIME);

  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      setTime(Date.now() - sessionStartTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const newPenaltyTime = INITIAL_PENALTY_TIME - (Date.now() - sessionStartTime);
      if (newPenaltyTime <= 0) {
        setPenaltyTime(0);
        handlePenaltyOver();
        clearInterval(interval);
      } else {
        setPenaltyTime(newPenaltyTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <img src={PeerPrepIcon} alt="PeerPrep" className="w-48" />

      <div className="text-right">
        <div className="flex items-center space-x-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium">You</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-sm font-medium">Alex</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">
              Session{` `}
              {/* {`${Math.floor((time / DAY) % 24)}`.padStart(2, '0')}:
          {`${Math.floor((time / HOUR) % 60)}`.padStart(2, '0')}: */}
              {`${Math.floor((time / MINUTE) % 60)}`.padStart(2, '0')}:
              {`${Math.floor((time / SECOND) % 60)}`.padStart(2, '0')}
            </div>
            {penaltyTime > 0 && (
              <div className="text-sm text-red-400">
                Penaly Timer{` `}
                {`${Math.floor((penaltyTime / MINUTE) % 60)}`.padStart(2, '0')}:
                {`${Math.floor((penaltyTime / SECOND) % 60)}`.padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
