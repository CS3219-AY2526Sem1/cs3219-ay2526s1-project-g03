import React from 'react';
import { TOPIC_CATEGORIES } from '../../features/matching/constants/topicCategories'
import styles from './progressCard.module.css';

interface TopicProgressProps {
  progressData: Record<string, number>;
}


const TopicProgress = ({ progressData }: TopicProgressProps) => {

  const structuredProgressData: Record<string, Record<string, number>> = {};

  TOPIC_CATEGORIES.forEach(category => {
    structuredProgressData[category.title] = {}; // Initialize category object
    category.topics.forEach(topic => {
      // Get the count from fetched data, default to 0 if not found
      structuredProgressData[category.title][topic] = progressData[topic] || 0;
    });
  });

  // Find the max value across all topics for scaling the progress bar
  const maxValue = Math.max(
    1, // avoid division by zero if all values are 0
    ...Object.values(structuredProgressData).flatMap(topics => Object.values(topics))
  );

  return (
    <div className={styles.topicProgressContainer}>
      {Object.entries(structuredProgressData).map(([category, topics]) => (
        <div key={category} className={styles.topicCategory}>
          <h5>{category}</h5>
          {Object.entries(topics).map(([topic, count]) => {
            const progressPercent = (count / maxValue) * 100;
            console.log(`Topic: ${topic}, Count: ${count}, Progress: ${progressPercent}%`);
            return (
              <div key={topic} className={styles.topicItem}>
                <span className={styles.topicName}>{topic}</span>
                <div className={styles.topicProgressBarBackground}>
                  <div
                    className={styles.topicProgressBarFill}
                    style={{width: `${progressPercent}%`}}
                  />
                </div>
                <span className={styles.topicCount}>{count}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TopicProgress;