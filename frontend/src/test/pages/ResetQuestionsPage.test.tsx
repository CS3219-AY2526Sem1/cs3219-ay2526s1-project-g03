// AI Assistance Disclosure:
// Tool: Auto (Cursor)
// Date: 2025-01-XX
// Scope: Generated comprehensive test cases for ResetQuestionsPage component

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ResetQuestions from '../../pages/ResetQuestionsPage';
import * as api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

jest.mock('../../hooks/useAuth');
jest.mock('../../lib/api', () => ({
  getTopics: jest.fn(),
  getActiveAttempts: jest.fn(),
  getAllAttemptSummaries: jest.fn(),
  resetQuestions: jest.fn(),
  getOtherUser: jest.fn(),
}));
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: 'history' } }),
}));

const mockQuestions = [
  {
    question_id: 'q1',
    question_title: 'Two Sum',
    question_topics: ['Array', 'Hash Table'],
    question_difficulty: 'Easy' as const,
    started_at: '2023-10-10T10:00:00Z',
    partner_id: 'partner1',
    time_taken_ms: 1800000,
  },
  {
    question_id: 'q2',
    question_title: 'Valid Palindrome',
    question_topics: ['String'],
    question_difficulty: 'Medium' as const,
    started_at: '2023-10-11T10:00:00Z',
    partner_id: 'partner2',
    time_taken_ms: 2400000,
  },
];

const renderComponent = (mockUser: any, mockSummaries?: any[], mockActiveIds?: string[], mockTopics?: string[]) => {
  (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

  if (mockSummaries !== undefined) {
    (api.getAllAttemptSummaries as jest.Mock).mockResolvedValue(mockSummaries);
  }
  if (mockActiveIds !== undefined) {
    (api.getActiveAttempts as jest.Mock).mockResolvedValue(mockActiveIds);
  }
  if (mockTopics !== undefined) {
    (api.getTopics as jest.Mock).mockResolvedValue(mockTopics);
  }

  return render(
    <BrowserRouter>
      <ResetQuestions />
    </BrowserRouter>
  );
};

describe('ResetQuestionsPage', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the reset confirmation button', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockQuestions, ['q1', 'q2'], ['Array', 'String']);

    await waitFor(() => {
      expect(screen.getByText('Reset Questions')).toBeInTheDocument();
      const resetButton = screen.getByRole('button', { name: /Reset Selected/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toBeDisabled(); // Should be disabled when no questions selected
    });
  });

  it('should call the reset API when button is clicked and confirmed', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (api.resetQuestions as jest.Mock).mockResolvedValue({});
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockQuestions, ['q1', 'q2'], ['Array', 'String']);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    // Select a question
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Click the first question checkbox

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset Selected \(1\)/i });
      expect(resetButton).not.toBeDisabled();
    });

    // Click reset button to open dialog
    const resetButton = screen.getByRole('button', { name: /Reset Selected \(1\)/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText(/Reset Selected Questions\?/i)).toBeInTheDocument();
    });

    // Confirm reset
    const confirmButton = screen.getByRole('button', { name: /Reset Questions/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.resetQuestions).toHaveBeenCalledWith('user123', ['q1']);
    });
  });

  it('should display questions with filters', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockQuestions, ['q1', 'q2'], ['Array', 'String']);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Valid Palindrome')).toBeInTheDocument();
    });

    // Check filters are present
    expect(screen.getByPlaceholderText(/Search questions/i)).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    (api.getAllAttemptSummaries as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (api.getActiveAttempts as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (api.getTopics as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent({ _id: 'user123' });

    expect(screen.getByText('Loading questions...')).toBeInTheDocument();
  });

  it('should show "No questions found" when filtered results are empty', async () => {
    renderComponent({ _id: 'user123' }, mockQuestions, ['q1', 'q2'], ['Array', 'String']);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText(/Search questions/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentQuestion' } });

    await waitFor(() => {
      expect(screen.getByText('No questions found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('should handle select all and deselect all', async () => {
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockQuestions, ['q1', 'q2'], ['Array', 'String']);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    // Click select all
    const selectAllButton = screen.getByRole('button', { name: /Select All Visible/i });
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset Selected \(2\)/i });
      expect(resetButton).not.toBeDisabled();
    });

    // Click deselect all
    const deselectAllButton = screen.getByRole('button', { name: /Deselect All/i });
    fireEvent.click(deselectAllButton);

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset Selected \(0\)/i });
      expect(resetButton).toBeDisabled();
    });
  });

  it('should show error toast when reset fails', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (api.resetQuestions as jest.Mock).mockRejectedValue(new Error('Reset failed'));
    (api.getOtherUser as jest.Mock).mockResolvedValue({ data: { username: 'testuser' } });

    renderComponent({ _id: 'user123' }, mockQuestions, ['q1'], ['Array']);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    // Select and reset
    const checkbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(checkbox);

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset Selected \(1\)/i });
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /Reset Questions/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(api.resetQuestions).toHaveBeenCalled();
    });
  });
});

