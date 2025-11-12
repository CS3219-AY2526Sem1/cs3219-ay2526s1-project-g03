import React from 'react';
import {render, screen} from '@testing-library/react';
import StatsGrid from '../../../features/progress/statsGrid';

describe('features/progress/StatsGrid', () => {
  it('renders stat values with labels', () => {
    const stats = {
      totalSessions: 10,
      completed: 8,
      successRate: 80,
      dayStreak: 5,
    };

    render(<StatsGrid stats={stats} />);

    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

