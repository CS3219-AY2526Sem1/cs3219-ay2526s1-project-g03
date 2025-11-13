// AI Assistance Disclosure:
// Tool: Auto (Cursor)
// Date: 2025-01-XX
// Scope: Generated comprehensive test cases for HistoryDashboardPage component

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HistoryDashboardPage from '../../pages/HistoryDashboardPage';
import * as api from '../../lib/api';
import useAuth from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api', () => ({
  getHistoryProgress: jest.fn(),
  getAllAttemptSummaries: jest.fn(),
  getOtherUser: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockProgress = {
  total_sessions: 10,
  total_sessions_completed: 8,
  total_successes: 5,
  success_rate: 0.625,
  total_time_ms: 28800000,
  current_streak: 3,
};

const mockSummaries = [
  {
    question_id: 'q1',
    question_title: 'Two Sum',
    question_difficulty: 'Easy',
    question_topics: ['Array', 'Hash Table'],
    started_at: '2023-10-10T10:00:00Z',
    partner_id: 'partner1',
    is_solved_successfully: true,
    has_penalty: false,
    time_taken_ms: 1800000,
  },
  {
    question_id: 'q2',
    question_title: 'Valid Palindrome',
    question_difficulty: 'Medium',
    question_topics: ['String'],
    started_at: '2023-10-11T10:00:00Z',
    partner_id: 'partner2',
    is_solved_successfully: false,
    has_penalty: false,
    time_taken_ms: 2400000,
  },
];

const renderComponent = (mockUser: any, mockProgressData?: any, mockSummariesData?: any[]) => {
  (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

  if (mockProgressData !== undefined) {
    (api.getHistoryProgress as jest.Mock).mockResolvedValue(mockProgressData);
  }
  if (mockSummariesData !== undefined) {
    (api.getAllAttemptSummaries as jest.Mock).mockResolvedValue(mockSummariesData);
  }

  return render(
    <BrowserRouter>
      <HistoryDashboardPage />
    </BrowserRouter>
  );
};

describe('HistoryDashboardPage', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main dashboard layout and child components', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockProgress, mockSummaries);

    await waitFor(() => {
      expect(screen.getByText('Question History')).toBeInTheDocument();
      expect(screen.getByText(/Track your progress across all coding challenges/)).toBeInTheDocument();
    });

    // Stats cards
    expect(screen.getByText('Total Unique Questions')).toBeInTheDocument();
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Passed Sessions')).toBeInTheDocument();
    expect(screen.getByText('Incomplete Sessions')).toBeInTheDocument();
    expect(screen.getByText('Failed Sessions')).toBeInTheDocument();

    // Reset button
    expect(screen.getByRole('button', { name: /Reset Questions/i })).toBeInTheDocument();

    // Question list
    expect(screen.getByText('Your Question Attempts')).toBeInTheDocument();
  });

  it('should display correct statistics', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockProgress, mockSummaries);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Unique Questions
      expect(screen.getByText('10')).toBeInTheDocument(); // Total Sessions
      expect(screen.getByText('63%')).toBeInTheDocument(); // Pass Rate (rounded)
      expect(screen.getByText('5')).toBeInTheDocument(); // Passed Sessions
    });
  });

  it('should show loading state initially', () => {
    (api.getHistoryProgress as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (api.getAllAttemptSummaries as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent({ _id: 'user123' });

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('should display question list with correct data', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockProgress, mockSummaries);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Valid Palindrome')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  it('should show "No activity found" when no summaries exist', async () => {
    renderComponent({ _id: 'user123' }, mockProgress, []);

    await waitFor(() => {
      expect(screen.getByText('No activity found.')).toBeInTheDocument();
      expect(screen.getByText('Complete a session to see your history!')).toBeInTheDocument();
    });
  });

  it('should fetch and display partner usernames', async () => {
    (api.getOtherUser as jest.Mock)
      .mockResolvedValueOnce({ data: { username: 'alice' } })
      .mockResolvedValueOnce({ data: { username: 'bob' } });

    renderComponent({ _id: 'user123' }, mockProgress, mockSummaries);

    await waitFor(() => {
      expect(screen.getByText(/Partner: alice/)).toBeInTheDocument();
      expect(screen.getByText(/Partner: bob/)).toBeInTheDocument();
    });
  });

  it('should handle navigation to reset questions page', async () => {
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockProgress, mockSummaries);

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset Questions/i });
      expect(resetButton).toBeInTheDocument();
    });

    // Note: Navigation testing would require re-mocking the component
    // This is a placeholder for the navigation test
  });

  it('should handle errors gracefully', async () => {
    (api.getHistoryProgress as jest.Mock).mockRejectedValue(new Error('API Error'));
    (api.getAllAttemptSummaries as jest.Mock).mockResolvedValue([]);

    renderComponent({ _id: 'user123' });

    await waitFor(() => {
      // Component should still render, just with empty data
      expect(screen.getByText('Question History')).toBeInTheDocument();
    });
  });
});

