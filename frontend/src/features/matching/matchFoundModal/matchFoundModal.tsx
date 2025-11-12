import React, { useState, useEffect } from 'react';
import styles from './matchFoundModal.module.css';
import PartnerIcon from '../../../assets/match/match-found.svg';
import DefaultAvatar from '../../../assets/default-profile-icon.svg';
import DeclineConfirmationModal from '../declineConfirmationModal/declineConfirmationModal';

interface PartnerDetails {
  firstName: string;
  lastName: string;
  areaOfStudy: string;
  occupation?: string; // e.g., "Computer Science Student"
  profilePicture?: string;
}

interface MatchFoundModalProps {
  partner: PartnerDetails;
  onAccept: () => void;
  onDecline: () => void;
  criteria: any;
  expiryTimestamp: number;
  countdownDuration?: number;
}

const MatchFoundModal = ({
                           partner,
                           onAccept,
                           onDecline,
                           criteria,
                           expiryTimestamp,
                           countdownDuration = 10,
                         }: MatchFoundModalProps) => {
  const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());
  const [isWaitingForPartner, setIsWaitingForPartner] = useState<boolean>(false);
  const [showDeclineConfirmationModal, setShowDeclineConfirmationModal] = useState<boolean>(false);

  // countdown timer effect
  useEffect(() => {
    if (isWaitingForPartner) {
      return;
    }

    // --- NEW: Synced timer logic (with bug fix) ---
    let timer: NodeJS.Timeout; // Define timer here so it's in scope

    const tick = () => {
      const now = Date.now();
      const remaining = expiryTimestamp - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        onDecline(); // Automatically decline
        if (timer) clearInterval(timer); // Clear the timer
      } else {
        setTimeLeft(remaining);
      }
    };

    tick(); // Run once immediately to get the correct time
    timer = setInterval(tick, 250); // Assign the timer
    // --- END NEW ---

    // cleanup function to clear interval when component unmounts or timer finishes
    return () => clearInterval(timer);
  }, [isWaitingForPartner, expiryTimestamp]);

  // calculate progress for the bar (0-100)
  const progressPercent = Math.max(0, (timeLeft / countdownDuration) * 100);
  // Calculate seconds left, rounding up, and ensure it's not negative
  const countdownSeconds = Math.max(0, Math.ceil(timeLeft / 1000));

  const handleAcceptClick = () => {
    setIsWaitingForPartner(true);
    onAccept();
  };

  const handleDeclineClick = () => {
    setShowDeclineConfirmationModal(true);
  }

  // Format partner's headline
  const formatHeadline = (text: string): string => {
    return text
      .replace('-', ' ') // Replace hypen if there is any
      .replace(/\b\w/g, char => char.toUpperCase()); // Find every word start and capitalize it
  }


  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/*<button className={styles.closeButton} onClick={() => onDecline()} disabled={isWaitingForPartner}>&times;</button>*/}

        <div className={styles.header}>
          <img src={PartnerIcon} alt="Match Found" className={styles.headerIcon} />
          <h2>Match Found!</h2>
        </div>

        <p className={styles.subtitle}>
          We found you a perfect coding partner. Would you like to start practicing together?
        </p>

        <div className={styles.partnerInfo}>
          <img
            src={partner.profilePicture || DefaultAvatar}
            alt={partner.lastName}
            className={styles.avatar}
          />
          <div className={styles.partnerText}>
            <span className={styles.partnerName}>{partner.firstName} {partner.lastName}</span>
            <span className={styles.partnerOccupation}>{formatHeadline(partner.areaOfStudy + ' ' + partner.occupation) || 'PeerPrep User'}</span>
          </div>
        </div>
        <div className={styles.criteriaContainer}>
          <div className={styles.criteriaValueGroup}>
            <span key={criteria.difficulty}
                  className={`${styles.criteriaValue} ${styles.difficulty} ${styles[criteria.difficulty.toLowerCase()]}`}>
               {criteria.difficulty}
            </span>
          </div>
          <div className={styles.criteriaValueGroup}>
            {criteria.topics.slice(0, 3).map(topic => (
              <span key={topic} className={`${styles.criteriaValue} ${styles.topic}`}>
                  {topic}
                </span>
            ))}

            {criteria.topics.length > 3 && (
              <span className={`${styles.criteriaValue} ${styles.moreIndicator}`}>
                      +{criteria.topics.length - 3} more
                    </span>
            )}
          </div>
          <div className={styles.criteriaValueGroup}>
            {criteria.languages.map(language => (
              <span key={language} className={`${styles.criteriaValue} ${styles.language}`}>
               {language}
              </span>
            ))}
          </div>
        </div>


        {isWaitingForPartner
          ? (
            <div className={styles.waitingContainer}>
              <div className={styles.spinner}></div>
              <h2>Waiting for partner...</h2>
              <p className={styles.subtitle}>Your partner has been notified.</p>
            </div>
          ) : (
            <>
              <div className={styles.timerContainer}>
                <div className={styles.progressBarBackground}>
                  <div
                    className={styles.progressBarFill}
                    style={{width: `${progressPercent}%`}}
                  />
                </div>
                <span className={styles.timerText}>{countdownSeconds}s</span>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.declineButton} onClick={() => handleDeclineClick()}>
                  &times; Decline
                </button>
                <button className={styles.acceptButton} onClick={() => handleAcceptClick()}>
                  ✓ Accept & Start
                </button>
              </div>
            </>
          )}
      </div>
      {showDeclineConfirmationModal && (
        <DeclineConfirmationModal onConfirm={onDecline} onCancel={() => setShowDeclineConfirmationModal(false)}/>
      )}
    </div>
  );
    };


export default MatchFoundModal;