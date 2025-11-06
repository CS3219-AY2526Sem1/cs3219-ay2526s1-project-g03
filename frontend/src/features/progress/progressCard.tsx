import React, { useState } from 'react';
import StatsGrid from './statsGrid';
import RecentSessions from './recentSessions';
import TopicProgress from './topicProgress';
import styles from './progressCard.module.css';
import ArrowDownIcon from '../../assets/arrow-down-icon.svg'; // Example icon
import ArrowUpIcon from '../../assets/arrow-up-icon.svg'; // Example icon

// Placeholder data TODO: replace with data fetched from API
const placeholderStats = {
  totalSessions: 24,
  completed: 18,
  successRate: 75,
  dayStreak: 24,
};

const placeholderRecentSessions = [
  { id: 1, user: 'Jane', difficulty: 'Easy', duration: 45, status: 'Completed' },
  { id: 2, user: 'Thomas', difficulty: 'Medium', duration: 60, status: 'Passed' }, // Assuming 'Passed' is a status
  { id: 3, user: 'Alex', difficulty: 'Hard', duration: 500, status: 'Incomplete'},
];

const placeholderTopicProgress = {
  'Arrays': 4,
  'Strings': 6,
  'Binary Search': 18,
  'Trees & Graphs': 2,
  'Linked Lists': 3,
  'Stack & Queue': 1,
  'Hash Tables': 2,
};


const ProgressCard = () => {
  const [isOpen, setIsOpen] = useState(true); // Default to open

  return (
    <div className={styles.progressCard}>
      <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}> 📊</span>
          My Progress
        </div>
        <img
          src={isOpen ? ArrowUpIcon : ArrowDownIcon}
          alt={isOpen ? 'Collapse' : 'Expand'}
          className={styles.toggleIcon}
        />
      </button>

      {isOpen && (
        <div className={styles.content}>
          <div className={styles.topRow}>
            <StatsGrid stats={placeholderStats} />
            <RecentSessions sessions={placeholderRecentSessions} />
          </div>
          <TopicProgress progressData={placeholderTopicProgress} />
        </div>
      )}
    </div>
  );
};

export default ProgressCard;