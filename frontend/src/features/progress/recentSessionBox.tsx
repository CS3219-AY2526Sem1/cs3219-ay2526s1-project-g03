import React from 'react';
import styles from './progressCard.module.css';
import UserIcon from '../../assets/match/user-icon-black.svg'
import ClockIcon from '../../assets/match/clock-black.svg';

export interface Session {
  id: number;
  user: string;
  difficulty: string;
  duration: number;
  status: string;
}

interface RecentSessionBoxProps {
  session: Session;
}

const RecentSessionBox = ({ session }: RecentSessionBoxProps) => {

  return (
    <div className={styles.sessionBox}>
      <div>
        <span className={`${styles.difficultyBadge} ${styles[session.difficulty.toLowerCase()]}`}>
                  {session.difficulty}
        </span>
      </div>
      <div className={styles.sessionBoxSecondRow}>
        <div className={styles.userAndDuration}>
         <span className={styles.sessionUser}>
            <img src={UserIcon} alt="User" /> {session.user}
          </span>
          <span className={styles.sessionDuration}>
            <img src={ClockIcon} alt="Duration" /> {session.duration} mins
          </span>
        </div>
        {session.status === 'Passed' && (
          <span className={`${styles.statusBadge} ${styles.passed}`}>Passed</span>
        )}
      </div>
    </div>
  )
    ;

};

export default RecentSessionBox;