// AI Assistance Disclosure:
// Tool: Auto (Cursor)
// Date: 2025-01-XX
// Scope: Generated comprehensive test cases for QuestionDetailPage component

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionDetail from '../../pages/QuestionDetailPage';
import * as api from '../../lib/api';
import useAuth from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api', () => ({
  getQuestionAttempts: jest.fn(),
  getOtherUser: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ questionId: '123' }),
  useNavigate: () => jest.fn(),
}));

const mockAttempts = [
  {
    participant_id: 'p1',
    session_id: 's1',
    user_id: 'user123',
    partner_id: 'partner1',
    code: 'def solution(nums, target):\n    return []',
    is_solved_successfully: true,
    has_penalty: false,
    time_taken_ms: 1800000,
    is_active_in_history: true,
    started_at: '2023-10-10T10:00:00Z',
    question_title: 'Two Sum',
  },
  {
    participant_id: 'p2',
    session_id: 's2',
    user_id: 'user123',
    partner_id: 'partner2',
    code: 'function solution() { return false; }',
    is_solved_successfully: false,
    has_penalty: false,
    time_taken_ms: 2400000,
    is_active_in_history: true,
    started_at: '2023-10-11T10:00:00Z',
    question_title: 'Two Sum',
  },
];

const renderComponent = (mockUser: any, mockAttemptsData?: any[]) => {
  (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

  if (mockAttemptsData !== undefined) {
    (api.getQuestionAttempts as jest.Mock).mockResolvedValue(mockAttemptsData);
  }

  return render(
    <BrowserRouter>
      <QuestionDetail />
    </BrowserRouter>
  );
};

describe('QuestionDetailPage', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render question details based on URL param', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      expect(screen.getByText(/Your Attempts for "Two Sum"/)).toBeInTheDocument();
    });

    expect(screen.getByText('Attempt 2')).toBeInTheDocument();
    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    (api.getQuestionAttempts as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent({ _id: 'user123' });

    expect(screen.getByText('Loading attempts...')).toBeInTheDocument();
  });

  it('should display "Question not found" when no attempts exist', async () => {
    (api.getQuestionAttempts as jest.Mock).mockResolvedValue([]);

    renderComponent({ _id: 'user123' });

    await waitFor(() => {
      expect(screen.getByText('Question not found or no attempts made.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to History/i })).toBeInTheDocument();
    });
  });

  it('should display status badges correctly', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      expect(screen.getAllByText('Passed').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
    });
  });

  it('should display code with syntax highlighting', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      expect(screen.getByText(/def solution/)).toBeInTheDocument();
      expect(screen.getByText(/function solution/)).toBeInTheDocument();
    });
  });

  it('should fetch and display partner usernames', async () => {
    (api.getOtherUser as jest.Mock)
      .mockResolvedValueOnce({ data: { username: 'alice' } })
      .mockResolvedValueOnce({ data: { username: 'bob' } });

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      expect(screen.getByText(/Partner: alice/)).toBeInTheDocument();
      expect(screen.getByText(/Partner: bob/)).toBeInTheDocument();
    });
  });

  it('should display time taken for each attempt', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      // Time should be formatted and displayed
      expect(screen.getByText(/Time:/)).toBeInTheDocument();
    });
  });

  it('should handle username fetch errors gracefully', async () => {
    (api.getOtherUser as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    renderComponent({ _id: 'user123' }, mockAttempts);

    await waitFor(() => {
      // Should still render attempts, just with partner_id as fallback
      expect(screen.getByText(/Partner: partner1/)).toBeInTheDocument();
    });
  });
});

