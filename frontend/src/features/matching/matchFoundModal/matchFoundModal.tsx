import React, { useState, useEffect } from 'react';
import styles from './matchFoundModal.module.css';
import PartnerIcon from '../../../assets/match/match-found.svg';
import DefaultAvatar from '../../../assets/default-profile-icon.svg';

interface PartnerDetails {
  id: string;
  name: string;
  occupation?: string; // e.g., "Computer Science Student"
  avatarUrl?: string;
}

interface MatchFoundModalProps {
  partner: PartnerDetails;
  onAccept: () => void;
  onDecline: () => void;
  countdownDuration?: number;
}

const MatchFoundModal = ({
                           partner,
                           onAccept,
                           onDecline,
                           countdownDuration = 10,
                         }: MatchFoundModalProps) => {
  const [countdown, setCountdown] = useState(countdownDuration);
  const [isWaitingForPartner, setIsWaitingForPartner] = useState<boolean>(false);

  // countdown timer effect
  useEffect(() => {
    if (countdown <= 0) {
      // automatically decline if timer runs out
      if (!isWaitingForPartner) {
        onDecline();
      }
      return; // stop the timer
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, countdownDuration * 100);

    // cleanup function to clear interval when component unmounts or timer finishes
    return () => clearInterval(timer);
  }, [countdown, onDecline, partner.id]);

  // calculate progress for the bar (0-100)
  const progressPercent = (countdown / countdownDuration) * 100;

  const handleAcceptClick = () => {
    setIsWaitingForPartner(true);
    onAccept();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={() => onDecline()}>&times;</button>

        <div className={styles.header}>
          <img src={PartnerIcon} alt="Match Found" className={styles.headerIcon} />
          <h2>Match Found!</h2>
        </div>

        <p className={styles.subtitle}>
          We found you a perfect coding partner. Would you like to start practicing together?
        </p>

        <div className={styles.partnerInfo}>
          <img
            src={partner.avatarUrl || DefaultAvatar}
            alt={partner.name}
            className={styles.avatar}
          />
          <div className={styles.partnerText}>
            <span className={styles.partnerName}>{partner.name}</span>
            <span className={styles.partnerOccupation}>{partner.occupation || 'PeerPrep User'}</span>
          </div>
        </div>

        { isWaitingForPartner
          ? (
            <div className={styles.waitingContainer}>
              <div className={styles.spinner}></div>
              <h2>Waiting for partner...</h2>
              <p className={styles.subtitle}>Your partner has been notified.</p>
            </div>
          ): (
            <>
              <div className={styles.timerContainer}>
                <div className={styles.progressBarBackground}>
                  <div
                    className={styles.progressBarFill}
                    style={{width: `${progressPercent}%`}}
                  />
                </div>
                <span className={styles.timerText}>{countdown}s</span>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.declineButton} onClick={() => onDecline()}>
                  &times; Decline
                </button>
                <button className={styles.acceptButton} onClick={() => handleAcceptClick()}>
                  ✓ Accept & Start
                </button>
              </div>
            </>
            )}
            </div>
          </div>
          );
        };

        export default MatchFoundModal;