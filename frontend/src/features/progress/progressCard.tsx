import React, { useState } from 'react';
import StatsGrid from './statsGrid';
import RecentSessions from './recentSessions';
import TopicProgress from './topicProgress';
import styles from './progressCard.module.css';
import ArrowDownIcon from '../../assets/arrow-down-icon.svg'; // Example icon
import ArrowUpIcon from '../../assets/arrow-up-icon.svg'; // Example icon
import useAuth from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getAllAttemptSummaries, getHistoryProgress } from '@/lib/api';

const ProgressCard = () => {
  const [isOpen, setIsOpen] = useState(false); // Default to false
  const { user} = useAuth();

  const { data: userProgress, isLoading } = useQuery({
    queryKey: ['userProgress', user?._id],
    queryFn: () => getHistoryProgress(user?._id),
    enabled: !!user?._id,
  });

  const stats = userProgress ? {
    totalSessions: userProgress.total_sessions,
    completed: userProgress.total_sessions_completed,
    successRate: Math.round(userProgress.success_rate * 100), // Decimal to percentage
    dayStreak: userProgress.current_streak,
  } : {
    totalSessions: 0,
    completed: 0,
    successRate: 0,
    dayStreak: 0,
  };

  const { data: allSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['recentSessions', user?._id],
    queryFn: () => getAllAttemptSummaries(user?._id),
    enabled: !!user?._id,
    retry: 1,
  });
  
  const recentSessions = allSessions?.slice(0, 3).map((session, index) => ({
    id: index + 1,
    user: session.partner_id,
    difficulty: session.question_difficulty,
    duration: session.time_taken_ms ? Math.round(session.time_taken_ms / 60000) : 0, // convert ms to minutes
    status: session.is_solved_successfully ? 'Passed' : 'Failed', 
  })) || [];


  const topicProgress = allSessions?.reduce((acc, session) => {
    session.question_topics.forEach(topic => {
      acc[topic] = (acc[topic] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>) || {};

  console.log('🔍 RAW allSessions from API:', allSessions);
if (allSessions && allSessions.length > 0) {
  console.log('🔍 First session question_topics:', allSessions[0].question_topics);
  console.log('🔍 Type of question_topics:', typeof allSessions[0].question_topics);
  console.log('🔍 Is Array?:', Array.isArray(allSessions[0].question_topics));
}

  

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
            <StatsGrid stats={stats} />
            <RecentSessions sessions={recentSessions} />
          </div>
          <TopicProgress progressData={topicProgress} />
        </div>
      )}
    </div>
  );
};

export default ProgressCard;