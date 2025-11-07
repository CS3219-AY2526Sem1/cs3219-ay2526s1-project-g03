import React from 'react';
import type { MatchCriteria } from '../../../models/match.model';
import ClockIcon from '../../../assets/match/clock-blue.svg';
import ContinueSearchIcon from '../../../assets/match/clock-white.svg';
import styles from './timeoutModal.module.css'

interface TimeoutModalProps {
  criteria: MatchCriteria;
  waitedDuartion: number;
  onKeepWaiting: () => void;
  onChangeCriteria: () => void;
  onStopSearching: () => void;
}

const TimeoutModal = ({
                                  criteria,
                                  waitedDuration,
                                  onKeepWaiting,
                                  onChangeCriteria,
                                  onStopSearching,
                                }: TimeoutModalProps) => {

  const currentPrefs = [
    ...criteria.difficulties,
    ...criteria.topics,
    ...criteria.languages,
  ];

  return (
    <div className={styles.timeoutOverlay}>
      <div className={styles.timeoutContent}>
        <button className={styles.closeButton} onClick={onStopSearching} aria-label="Close"> &times;
        </button>

        <div className={styles.header}>
          <img src={ClockIcon} alt="No Match Found Yet"/>
          <h3>No Match Found Yet</h3>
        </div>
        <p className={styles.subtitle}>
          We haven't found a match in {waitedDuration} seconds. Would you like to
          extend your search, change your criteria, or stop?
        </p>

        { /* TODO: optional*/}
        {/*<div className={styles.currentPrefs}>*/}
        {/*  <p className={styles.prefLabel}>Current Preferences:</p>*/}
        {/*  <div className={styles.chipGroup}>*/}
        {/*    /!*{currentPrefs.length > 0 ? (*!/*/}
        {/*    /!*  currentPrefs.map(pref => <CriteriaChip key={pref} label={pref} />)*!/*/}
        {/*    /!*) : (*!/*/}
        {/*    /!*  <span style={{ fontSize: '14px', color: '#64748b' }}>Any Difficulty, Any Topic, Any Language</span>*!/*/}
        {/*    /!*)}*!/*/}
        {/*  </div>*/}
        {/*</div>*/}


        <div className={styles.buttonGroup}>
          <button className={styles.keepWaitingButton} onClick={onKeepWaiting}>
            <img src={ContinueSearchIcon} alt="Continue Searching"/>
            Keep Waiting (1 min)
          </button>
          <div className={styles.bottomButtons}>
            <button className={styles.criteriaButton} onClick={onChangeCriteria}>
              Change Criteria
            </button>
            <button className={styles.stopButton} onClick={onStopSearching}>
              Stop Searching
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TimeoutModal;
