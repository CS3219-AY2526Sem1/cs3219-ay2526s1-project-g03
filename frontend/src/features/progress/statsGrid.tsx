import React from 'react';
import StatBox from './statBox';
import styles from './progressCard.module.css';

interface StatsGridProps {
  stats: {
    totalSessions: number;
    completed: number;
    successRate: number;
    dayStreak: number;
  };
}

const StatsGrid = ({ stats }: StatsGridProps) => {
  return (
    <div className={styles.statsGrid}>
      <StatBox label="Total Sessions" value={stats.totalSessions} />
      <StatBox label="Completed" value={stats.completed} />
      <StatBox label="Success Rate" value={`${stats.successRate}%`} />
      <StatBox label="Day Streak" value={stats.dayStreak} />
    </div>
  );
};

export default StatsGrid;