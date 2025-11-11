import React from 'react';
import styles from './declineConfirmationModal.module.css';
import AlertIcon from '../../../assets/alert-icon.svg'

interface DeclineConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeclineConfirmationModal = ({
                                    onConfirm,
                                    onCancel,
                                  }: DeclineConfirmationModalProps) => {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div className={styles.confirmContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.confirmCloseButton} onClick={onCancel} aria-label="Close"> &times;
        </button>

        <div className={styles.confirmHeader}>
          <img src={AlertIcon} alt="Decline Confirmation" className={styles.confirmImg}/>
          <h3>Are you sure you want to decline?</h3>
        </div>

        <p className={styles.confirmSubtitle}>
          Declining this match will result in a <strong>matchmaking cooldown</strong> before you can find a new match.
        </p>

        <div className={styles.confirmButtonGroup}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel & Go Back
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Decline & Accept Cooldown
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineConfirmationModal;