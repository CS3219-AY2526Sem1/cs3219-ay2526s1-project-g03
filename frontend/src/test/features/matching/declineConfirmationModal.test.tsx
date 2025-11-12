import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import DeclineConfirmationModal from '../../../features/matching/declineConfirmationModal/declineConfirmationModal';

describe('features/matching/DeclineConfirmationModal', () => {
  it('calls cancel when overlay or close button is clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(<DeclineConfirmationModal onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls confirm handler when decline is confirmed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(<DeclineConfirmationModal onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', {name: /decline & accept cooldown/i}));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

