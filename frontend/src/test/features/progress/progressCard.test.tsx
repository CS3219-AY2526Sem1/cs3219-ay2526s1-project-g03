import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import ProgressCard from '../../../features/progress/progressCard';

describe('features/progress/ProgressCard', () => {
  it('toggles progress details when header is clicked', () => {
    render(<ProgressCard />);

    expect(screen.queryByText('Recent Sessions')).not.toBeInTheDocument();

    const toggleButton = screen.getByRole('button', {name: /my progress/i});
    expect(screen.getByAltText('Expand')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    expect(screen.getByText('Topic Progress')).toBeInTheDocument();
    expect(screen.getByAltText('Collapse')).toBeInTheDocument();
  });
});

