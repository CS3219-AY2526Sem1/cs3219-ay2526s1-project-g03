import React from 'react';
import {render, screen} from '@testing-library/react';
import Dashboard from '../../pages/dashboard/dashboard';

jest.mock('../../features/matching/practiceSessionForm/practiceSessionForm', () => ({
  __esModule: true,
  default: () => <div data-testid="practice-session-form" />,
}));

describe('pages/dashboard', () => {
  it('renders dashboard header, progress card, and practice form', () => {
    render(<Dashboard />);

    expect(screen.getByText(/ready to practice\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/find a coding partner and solve problem together/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('practice-session-form')).toBeInTheDocument();
    expect(screen.getByText('My Progress')).toBeInTheDocument();
  });
});

