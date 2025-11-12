import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import MatchingStatusModal from '../../../features/matching/matchingStatusModal/matchingStatusModal';

const baseCriteria = {
  difficulties: [],
  topics: [],
  languages: [],
};

describe('features/matching/MatchingStatusModal', () => {
  it('renders fallback values when no criteria selected', () => {
    render(
      <MatchingStatusModal
        criteria={baseCriteria}
        onCancel={jest.fn()}
        disabled={false}
        countdown={30}
        timer={30}
        usersOnline={123}
        avgWaitTime={45}
      />,
    );

    expect(screen.getByText('Finding Your Perfect Partner')).toBeInTheDocument();
    expect(screen.getAllByText('Any')).toHaveLength(3);
    expect(screen.getByText('Searching... 30s remaining')).toBeInTheDocument();
    expect(screen.getByText(/123 users online/)).toBeInTheDocument();
    expect(screen.getByText(/Avg wait: ~45s/)).toBeInTheDocument();
  });

  it('renders selected criteria and triggers cancel', () => {
    const onCancel = jest.fn();
    const criteria = {
      difficulties: ['Easy', 'Hard'],
      topics: ['Arrays', 'Graphs', 'DP', 'Trie', 'Math', 'Geometry'],
      languages: ['Python'],
    };

    render(
      <MatchingStatusModal
        criteria={criteria}
        onCancel={onCancel}
        disabled={false}
        countdown={60}
        timer={15}
        usersOnline={50}
        avgWaitTime={30}
      />,
    );

    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /cancel search/i}));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clamps progress bar to valid range', () => {
    const {container} = render(
      <MatchingStatusModal
        criteria={baseCriteria}
        onCancel={jest.fn()}
        disabled={true}
        countdown={60}
        timer={-10}
        usersOnline={10}
        avgWaitTime={5}
      />,
    );

    const progressBar = container.querySelector('[class*="progressBarFill"]') as HTMLElement;
    expect(progressBar.style.width).toBe('0%');
  });
});

