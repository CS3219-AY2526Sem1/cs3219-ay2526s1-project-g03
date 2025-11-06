import React from 'react';
import RecentSessionBox from './recentSessionBox';
import styles from './progressCard.module.css';
import RefreshIcon from '../../assets/match/refresh-icon.svg';
import type {Session} from './recentSessionBox';

interface RecentSessionsProps {
  sessions: Session[];
}

const RecentSessions = ({ sessions }: RecentSessionsProps) => {

  return (
    <div className={styles.recentSessions}>
      <div className={styles.recentHeader}>
        <h4>Recent Sessions</h4>
        <img src={RefreshIcon} alt="Refresh" />
      </div>
      <ul className={styles.sessionList}>
        {sessions.length > 0 ? (sessions.slice(0, 2).map(session => (
            <RecentSessionBox session={session} />
          )))
          : (
            <li className={styles.noSessions}>No recent sessions found.</li>
          )}
      </ul>
    </div>
  );
};

export default RecentSessions;