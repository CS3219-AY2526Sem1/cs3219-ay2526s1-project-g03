import React, { useState, useEffect } from 'react';
import type { MatchCriteria } from '../../../models/match.model';
import styles from './matchingStatusModal.module.css';
import PartnerIcon from '../../../assets/match/partner-blue-with-circle.svg';
import UsersIcon from '../../../assets/match/partner-blue.svg'; // Example icon
import ClockIcon from '../../../assets/match/clock-blue.svg';   // Example icon

interface MatchingStatusModalProps {
  criteria: MatchCriteria;
  onCancel: () => void;
  disabled: boolean;
  initialCountdown: number;
  usersOnline: number;
  avgWaitTime: number;
}

const MAX_TOPICS_TO_SHOW = 5

const CriteriaDisplay = ({ criteria }: Pick<MatchingStatusModalProps, 'criteria'>) => {
  return (
    <div className={styles.criteriaContainer}>
      <p className={styles.criteriaLabel}>Difficulty</p>
      <div className={styles.criteriaValueGroup}>
        {criteria.difficulties.length == 0
          ? <span className={`${styles.criteriaValue} ${styles.anyValue}`}>Any</span>
          : (
            <>
              {criteria.difficulties.map(difficulty => (
                <span key={difficulty}
                      className={`${styles.criteriaValue} ${styles.difficulty} ${styles[difficulty.toLowerCase()]}`}>
               {difficulty}
             </span>
              ))}
            </>
          )
        }
      </div>

      <p className={styles.criteriaLabel}>Topics</p>
      <div className={styles.criteriaValueGroup}>
        {criteria.topics.length == 0
          ? <span className={`${styles.criteriaValue} ${styles.anyValue}`}>Any</span>
          : (
            <>
              {criteria.topics.slice(0, MAX_TOPICS_TO_SHOW).map(topic => (
                <span key={topic} className={`${styles.criteriaValue} ${styles.topic}`}>
                {topic}
              </span>
              ))}

              {criteria.topics.length > MAX_TOPICS_TO_SHOW && (
                <span className={`${styles.criteriaValue} ${styles.moreIndicator}`}>
                    +{criteria.topics.length - MAX_TOPICS_TO_SHOW} more
                  </span>
              )}
            </>
          )
        }
      </div>

      <p className={styles.criteriaLabel}>Languages</p>
      <div className={styles.criteriaValueGroup}>
        {criteria.languages.length == 0
          ? <span className={`${styles.criteriaValue} ${styles.anyValue}`}>Any</span>
          : (
            <>
              {criteria.languages.map(language => (
                <span key={language} className={`${styles.criteriaValue} ${styles.language}`}>
                {language}
              </span>
              ))}
            </>
          )
        }
      </div>
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // Progress as a percentage (0-100)
}

const ProgressBar = ({progress}: ProgressBarProps) => {
  const clampedProgress = Math.max(0, Math.min(100, progress)); // Ensure it's between 0 and 100
  return (
    <div className={styles.progressBarBackground}>
      <div
        className={styles.progressBarFill}
        style={{width: `${clampedProgress}%`}}
      />
    </div>
  );
};

interface StatsDisplayProps {
  usersOnline: number;
  avgWaitTime: number;
}

const StatsDisplay = ({ usersOnline, avgWaitTime }: StatsDisplayProps) => {
  return (
    <div className={styles.statsContainer}>
      <span><img src={UsersIcon} alt="Users online"/> {usersOnline} users online</span>
      <span><img src={ClockIcon} alt="Average wait time"/> Avg wait: ~{avgWaitTime}s</span>
    </div>
  );
};

interface CancelButtonProps {
  onClick: () => void;
  disabled: boolean;
}
const CancelButton = ({ onClick, disabled }: CancelButtonProps) => {
  return (
    <button className={styles.cancelButton} onClick={onClick} disabled={disabled}>
      <div className={styles.closeSymbol}>
        &times;
      </div>
       Cancel Search
    </button>
  );
};


const MatchingStatusModal = ({
                               criteria,
                               onCancel,
                               disabled,
                               initialCountdown,
                               usersOnline,
                               avgWaitTime,
                             }: MatchingStatusModalProps) => {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    // Only start countdown if initialCountdown is positive
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [countdown]); // Rerun effect if countdown changes (e.g. reset)

  // Calculate progress for the bar
  const progressPercent = ((initialCountdown - countdown) / initialCountdown) * 100;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <img src={PartnerIcon} alt="Finding Partner" className={styles.icon} />
        <h2>Finding Your Perfect Partner</h2>
        <p className={styles.subtitle}>Matching you with someone who shares your preferences</p>

        <CriteriaDisplay criteria={criteria} />

        <ProgressBar progress={progressPercent} />
        <p className={styles.timerText}>Searching... {countdown}s remaining</p>

        <StatsDisplay usersOnline={usersOnline} avgWaitTime={avgWaitTime} />

        <CancelButton onClick={onCancel} disabled={disabled} />
      </div>
    </div>
  );
};

export default MatchingStatusModal;