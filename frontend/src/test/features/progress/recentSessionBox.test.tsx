import React from 'react';
import {render, screen} from '@testing-library/react';
import RecentSessionBox from '../../../features/progress/recentSessionBox';

describe('features/progress/RecentSessionBox', () => {
  it('displays session details and status badge', () => {
    render(
      <RecentSessionBox
        session={{
          id: 1,
          user: 'Terry',
          difficulty: 'Medium',
          duration: 40,
          status: 'Passed',
        }}
      />,
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText(/Terry/)).toBeInTheDocument();
    expect(screen.getByText(/40 mins/)).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });
});

