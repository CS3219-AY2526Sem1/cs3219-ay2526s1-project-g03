import React from 'react';
import {render, screen} from '@testing-library/react';
import RecentSessions from '../../../features/progress/recentSessions';
import type {Session} from '../../../features/progress/recentSessionBox';

const sessions: Session[] = [
  {id: 1, user: 'Ada', difficulty: 'Easy', duration: 30, status: 'Completed'},
  {id: 2, user: 'Grace', difficulty: 'Medium', duration: 45, status: 'Passed'},
  {id: 3, user: 'Alan', difficulty: 'Hard', duration: 60, status: 'Incomplete'},
];

describe('features/progress/RecentSessions', () => {
  it('renders recent sessions (limited to two)', () => {
    render(<RecentSessions sessions={sessions} />);

    expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    expect(screen.getByAltText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.queryByText('Alan')).not.toBeInTheDocument();
  });

  it('renders fallback when there are no sessions', () => {
    render(<RecentSessions sessions={[]} />);
    expect(
      screen.getByText('No recent sessions found.'),
    ).toBeInTheDocument();
  });
});

