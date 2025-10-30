import React from 'react';
import styles from './progressCard.module.css';

interface StatBoxProps {
  label: string;
  value: string | number;
}

const StatBox = ({ label, value }: StatBoxProps) => {
  return (
    <div className={styles.statBox}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
};

export default StatBox;