import React from 'react';
import './chip.css'

interface ChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: () => void;
  type?: string; // for difficulties
}

const Chip = ({ label, isSelected, onClick, onRemove, type}: ChipProps) => {
  const chipClasses = `chip ${type ? type : ''} ${isSelected ? 'selected' : ''}`;
  
  return (
    <button className={chipClasses} onClick={onClick}>
      {label}
      {onRemove &&
        <span className="remove-icon"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}> &times; </span>}
    </button>
  );
};

export default Chip;

