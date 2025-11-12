import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import MatchFoundModal from '../../../features/matching/matchFoundModal/matchFoundModal';

const partnerDetails = {
  firstName: 'Katherine',
  lastName: 'Johnson',
  areaOfStudy: 'applied mathematics',
  occupation: 'scientist',
  profilePicture: '',
};

const criteria = {
  difficulty: 'Easy',
  topics: ['Arrays', 'Graphs', 'DP', 'Math'],
  languages: ['Python'],
};

describe('features/matching/MatchFoundModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.useRealTimers();
    (Date.now as jest.Mock).mockRestore?.();
  });

  it('renders partner details and handles accept flow', () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();

    render(
      <MatchFoundModal
        partner={partnerDetails}
        onAccept={onAccept}
        onDecline={onDecline}
        criteria={criteria}
        expiryTimestamp={1_000_000 + 10_000}
        countdownDuration={10_000}
      />,
    );

    expect(screen.getByText(/katherine johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/applied mathematics scientist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /✓ Accept & Start/i})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /✓ Accept & Start/i}));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/waiting for partner/i)).toBeInTheDocument();
  });

  it('confirms decline via modal', () => {
    const onDecline = jest.fn();

    render(
      <MatchFoundModal
        partner={partnerDetails}
        onAccept={jest.fn()}
        onDecline={onDecline}
        criteria={criteria}
        expiryTimestamp={1_000_000 + 10_000}
        countdownDuration={10_000}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: /× Decline/i}));
    expect(
      screen.getByText(/are you sure you want to decline\?/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /decline & accept cooldown/i}));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('auto-declines when timer runs out', () => {
    const onDecline = jest.fn();

    render(
      <MatchFoundModal
        partner={partnerDetails}
        onAccept={jest.fn()}
        onDecline={onDecline}
        criteria={criteria}
        expiryTimestamp={1_000_000 - 1_000}
        countdownDuration={10_000}
      />,
    );

    jest.runOnlyPendingTimers();
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

