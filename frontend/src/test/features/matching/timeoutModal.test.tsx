import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import TimeoutModal from '../../../features/matching/timeoutModal/timeoutModal';

const criteria = {
  difficulties: ['Easy'],
  topics: ['Arrays'],
  languages: ['Python'],
};

describe('features/matching/TimeoutModal', () => {
  it('renders timeout message and triggers callbacks', () => {
    const onKeepWaiting = jest.fn();
    const onChangeCriteria = jest.fn();
    const onStopSearching = jest.fn();

    render(
      <TimeoutModal
        criteria={criteria}
        waitedDuration={30}
        onKeepWaiting={onKeepWaiting}
        onChangeCriteria={onChangeCriteria}
        onStopSearching={onStopSearching}
      />,
    );

    expect(screen.getByText(/no match found yet/i)).toBeInTheDocument();
    expect(screen.getByText(/30 seconds/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /keep waiting/i}));
    expect(onKeepWaiting).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', {name: /change criteria/i}));
    expect(onChangeCriteria).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', {name: /stop searching/i}));
    expect(onStopSearching).toHaveBeenCalledTimes(1);
  });
});

