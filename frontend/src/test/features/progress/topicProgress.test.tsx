import React from 'react';
import {render, screen} from '@testing-library/react';
import TopicProgress from '../../../features/progress/topicProgress';

describe('features/progress/TopicProgress', () => {
  const progressData = {
    Arrays: 5,
    Strings: 3,
    'Binary Search': 7,
    'Dynamic Programming': 2,
    Design: 1,
    OOP: 4,
  };

  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders topic categories and progress counts', () => {
    const {container} = render(<TopicProgress progressData={progressData} />);

    expect(screen.getByText('Core Data Structure Topics')).toBeInTheDocument();
    expect(screen.getByText('Common Algorithm Topics')).toBeInTheDocument();
    expect(screen.getByText('Advanced Techniques Topics')).toBeInTheDocument();
    expect(screen.getByText('Design & Architecture')).toBeInTheDocument();

    expect(screen.getAllByText('Arrays')[0]).toBeInTheDocument();
    expect(screen.getAllByText('5')[0]).toBeInTheDocument();

    const progressBars = container.querySelectorAll('[class*="topicProgressBarFill"]');
    expect(progressBars.length).toBeGreaterThan(0);
    progressBars.forEach((bar) => {
      expect(bar).toHaveStyle({width: expect.stringMatching(/%$/)});
    });
  });
});

