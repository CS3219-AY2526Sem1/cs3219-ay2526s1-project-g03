import React from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';
import PracticeSessionForm from '../../../features/matching/practiceSessionForm/practiceSessionForm';
import {findMatch, cancelMatch, getOtherUser} from '../../../lib/api';

jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    user: {
      _id: 'user-123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    },
  })),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn((...args) => mockToastSuccess(...args)),
    error: jest.fn((...args) => mockToastError(...args)),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  findMatch: jest.fn(),
  cancelMatch: jest.fn(),
  getOtherUser: jest.fn(),
}));

class WebSocketMock {
  public static OPEN = 1;
  public static instances: WebSocketMock[] = [];
  public readyState = WebSocketMock.OPEN;
  public sentMessages: string[] = [];
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: (() => void) | null = null;
  constructor(public url?: string) {
    WebSocketMock.instances.push(this);
    setTimeout(() => {
      this.onopen?.({} as Event);
    }, 0);
  }
  send(data: string) {
    this.sentMessages.push(data);
  }
  close() {
    this.onclose?.();
  }
  triggerMessage(payload: Record<string, unknown>) {
    this.onmessage?.({data: JSON.stringify(payload)} as MessageEvent);
  }
}

const originalWebSocket = global.WebSocket;

const renderWithProviders = () => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PracticeSessionForm />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

const sendSocketMessage = async (socket: WebSocketMock, payload: Record<string, unknown>) => {
  await act(async () => {
    socket.triggerMessage(payload);
  });
};

describe('features/matching/PracticeSessionForm', () => {
  beforeAll(() => {
    // @ts-expect-error -- override global WebSocket for tests
    global.WebSocket = WebSocketMock;
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    WebSocketMock.instances = [];
    mockNavigate.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders default sections and toggles difficulty selection', () => {
    renderWithProviders();

    expect(screen.getByText('Question Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Language Preference')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();

    const easyChip = screen.getByRole('button', {name: 'Easy'});
    expect(easyChip).not.toHaveClass('selected');

    fireEvent.click(easyChip);
    expect(easyChip).toHaveClass('selected');
  });

  it('calls findMatch and shows waiting modal when API returns waiting', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});
    (cancelMatch as jest.Mock).mockResolvedValue({data: {success: true}});

    renderWithProviders();

    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));

    await waitFor(() => {
      expect(findMatch).toHaveBeenCalled();
    });
    const [payload] = (findMatch as jest.Mock).mock.calls[0];
    expect(payload).toEqual({
        userId: 'user-123',
        criteria: {difficulties: [], languages: [], topics: []},
    });

    await waitFor(() => {
      expect(screen.getByText('Finding Your Perfect Partner')).toBeInTheDocument();
    });

    expect(WebSocketMock.instances).toHaveLength(1);
    const registerPayload = JSON.parse(WebSocketMock.instances[0].sentMessages[0]);
    expect(registerPayload).toEqual({type: 'register', userId: 'user-123'});

    fireEvent.click(screen.getByRole('button', {name: /cancel search/i}));
    await waitFor(() => expect(cancelMatch).toHaveBeenCalled());
    const [cancelPayload] = (cancelMatch as jest.Mock).mock.calls[0];
    expect(cancelPayload).toEqual({userId: 'user-123'});
  });

  it('shows match modal immediately when API returns matched', async () => {
    const now = Date.now();
    (findMatch as jest.Mock).mockResolvedValueOnce({
      data: {
        status: 'matched',
        partnerId: 'partner-321',
        matchId: 'match-123',
        criteria: {
          difficulty: 'Easy',
          topics: ['Arrays'],
          languages: ['Python'],
        },
        expiryTimestamp: now + 10_000,
        totalDuration: 10_000,
      },
    });
    (getOtherUser as jest.Mock).mockResolvedValueOnce({
      data: {
        firstName: 'Grace',
        lastName: 'Hopper',
        areaOfStudy: 'computer science',
        occupation: 'engineer',
      },
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));

    await waitFor(() => expect(findMatch).toHaveBeenCalled());
    await waitFor(() =>
      expect(getOtherUser).toHaveBeenCalledWith('partner-321', expect.anything()),
    );

    expect(await screen.findByText('Match Found!')).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();

    const acceptButton = screen.getByRole('button', {name: /accept & start/i});
    fireEvent.click(acceptButton);

    expect(WebSocketMock.instances[0].sentMessages).toContainEqual(
      JSON.stringify({type: 'accept_match', matchId: 'match-123'}),
    );
  });

  it('handles decline path via confirmation modal', async () => {
    const now = Date.now();
    (findMatch as jest.Mock).mockResolvedValueOnce({
      data: {
        status: 'matched',
        partnerId: 'partner-999',
        matchId: 'match-9999',
        criteria: {
          difficulty: 'Medium',
          topics: ['Graphs'],
          languages: ['Java'],
        },
        expiryTimestamp: now + 10_000,
        totalDuration: 10_000,
      },
    });
    (getOtherUser as jest.Mock).mockResolvedValueOnce({
      data: {
        firstName: 'Alan',
        lastName: 'Turing',
        areaOfStudy: 'mathematician',
        occupation: 'researcher',
      },
    });

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));

    expect(await screen.findByText('Match Found!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /decline/i}));
    await waitFor(() =>
      expect(screen.getByText(/are you sure you want to decline/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', {name: /decline & accept cooldown/i}));

    const declineMessage = JSON.parse(
      WebSocketMock.instances[0].sentMessages.find((msg) => msg.includes('decline_match'))!,
    );
    expect(declineMessage.type).toBe('decline_match');
    expect(declineMessage.matchId).toBe('match-9999');
  });

  it('navigates to collaboration room when match_confirmed message arrives', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});
    (getOtherUser as jest.Mock).mockResolvedValue({
      data: {
        firstName: 'Pat',
        lastName: 'Lee',
        areaOfStudy: 'cs',
        occupation: 'student',
      },
    });

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    const socketInstance = WebSocketMock.instances[0];
    await sendSocketMessage(socketInstance, {
        type: 'match_found',
        payload: {
          partnerId: 'partner-abc',
          matchId: 'match-ws',
          criteria: {
            difficulty: 'Easy',
            topics: ['Arrays'],
            languages: ['Python'],
          },
          expiryTimestamp: Date.now() + 10_000,
          totalDuration: 10_000,
        },
    });

    await screen.findByText('Match Found!');

    await sendSocketMessage(socketInstance, {
        type: 'match_confirmed',
        payload: {
          sessionId: 'session-987',
        },
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/room/session-987'));
  });

  it('shows toast when partner accepts via WebSocket', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    await sendSocketMessage(WebSocketMock.instances[0], {type: 'partner_accepted'});

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Your partner has accepted'),
      ),
    );
  });

  it('requeues when partner declines through WebSocket', async () => {
    (findMatch as jest.Mock)
      .mockResolvedValueOnce({data: {status: 'waiting'}})
      .mockResolvedValueOnce({data: {status: 'waiting'}});
    (getOtherUser as jest.Mock).mockResolvedValue({data: {firstName: 'Pat', lastName: 'Lee'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    const socket = WebSocketMock.instances[0];
    await sendSocketMessage(socket, {
      type: 'match_found',
      payload: {
        partnerId: 'partner-abc',
        matchId: 'match-decline',
        criteria: {
          difficulty: 'Easy',
          topics: ['Arrays'],
          languages: ['Python'],
        },
        expiryTimestamp: Date.now() + 10_000,
        totalDuration: 10_000,
      },
    });

    await screen.findByText('Match Found!');

    await sendSocketMessage(socket, {type: 'partner_declined'});

    await waitFor(() => expect(findMatch).toHaveBeenCalledTimes(2));
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Match Declined'));
  });

  it('requeues when partner times out via WebSocket', async () => {
    (findMatch as jest.Mock)
      .mockResolvedValueOnce({data: {status: 'waiting'}})
      .mockResolvedValueOnce({data: {status: 'waiting'}});
    (getOtherUser as jest.Mock).mockResolvedValue({data: {firstName: 'Pat', lastName: 'Lee'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    const socket = WebSocketMock.instances[0];
    await sendSocketMessage(socket, {
      type: 'match_found',
      payload: {
        partnerId: 'partner-abc',
        matchId: 'match-timeout',
        criteria: {
          difficulty: 'Easy',
          topics: ['Arrays'],
          languages: ['Python'],
        },
        expiryTimestamp: Date.now() + 10_000,
        totalDuration: 10_000,
      },
    });

    await screen.findByText('Match Found!');

    await sendSocketMessage(socket, {type: 'partner_timed_out'});

    await waitFor(() => expect(findMatch).toHaveBeenCalledTimes(2));
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('timed out'));
  });

  it('shows penalty toast on match_penalty message', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    await sendSocketMessage(WebSocketMock.instances[0], {
      type: 'match_penalty',
      payload: {message: 'Cooldown applied', cooldown: 60},
    });

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Cooldown applied'),
    );
  });

  it('handles match_timed_out message by hiding modal', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});
    (getOtherUser as jest.Mock).mockResolvedValue({data: {firstName: 'Pat', lastName: 'Lee'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    const socket = WebSocketMock.instances[0];
    await sendSocketMessage(socket, {
      type: 'match_found',
      payload: {
        partnerId: 'partner-abc',
        matchId: 'match-timeout-user',
        criteria: {
          difficulty: 'Easy',
          topics: ['Arrays'],
          languages: ['Python'],
        },
        expiryTimestamp: Date.now() + 10_000,
        totalDuration: 10_000,
      },
    });

    await screen.findByText('Match Found!');
    await sendSocketMessage(socket, {type: 'match_timed_out'});

    await waitFor(() =>
      expect(screen.queryByText('Match Found!')).not.toBeInTheDocument(),
    );
    expect(mockToastError).toHaveBeenCalledWith('You did not accept the match in time.');
  });

  it('handles room creation failure message', async () => {
    (findMatch as jest.Mock).mockResolvedValueOnce({data: {status: 'waiting'}});
    (getOtherUser as jest.Mock).mockResolvedValue({data: {firstName: 'Pat', lastName: 'Lee'}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    const socket = WebSocketMock.instances[0];
    await sendSocketMessage(socket, {
      type: 'match_found',
      payload: {
        partnerId: 'partner-abc',
        matchId: 'match-room-failure',
        criteria: {
          difficulty: 'Easy',
          topics: ['Arrays'],
          languages: ['Python'],
        },
        expiryTimestamp: Date.now() + 10_000,
        totalDuration: 10_000,
      },
    });

    await screen.findByText('Match Found!');
    await sendSocketMessage(socket, {type: 'room_creation_failed'});

    await waitFor(() =>
      expect(screen.queryByText('Match Found!')).not.toBeInTheDocument(),
    );
    expect(mockToastError).toHaveBeenCalledWith(
      'Match failed: Could not create the collaboration room. Please try again.',
    );
  });

  it('shows cooldown toast when findMatch returns 429', async () => {
    (findMatch as jest.Mock).mockRejectedValueOnce({
      response: {status: 429, data: {cooldown: 45}},
    });

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'You are on a cooldown. Please try again in 45 seconds.',
      ),
    );
  });

  it('allows extending search from timeout modal', async () => {
    jest.useFakeTimers();
    (findMatch as jest.Mock)
      .mockResolvedValueOnce({data: {status: 'waiting'}})
      .mockResolvedValueOnce({data: {status: 'waiting'}});
    (cancelMatch as jest.Mock).mockResolvedValue({data: {success: true}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    await act(async () => {
      jest.advanceTimersByTime(31_000);
    });

    await screen.findByText('No Match Found Yet');

    fireEvent.click(screen.getByRole('button', {name: /keep waiting/i}));

    await waitFor(() => expect(findMatch).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('No Match Found Yet')).not.toBeInTheDocument();
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  });

  it('allows changing criteria from timeout modal', async () => {
    jest.useFakeTimers();
    (findMatch as jest.Mock).mockResolvedValue({data: {status: 'waiting'}});
    (cancelMatch as jest.Mock).mockResolvedValue({data: {success: true}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    await act(async () => {
      jest.advanceTimersByTime(31_000);
    });

    await screen.findByText('No Match Found Yet');

    fireEvent.click(screen.getByRole('button', {name: /change criteria/i}));
    await waitFor(() => expect(cancelMatch).toHaveBeenCalled());
    expect(screen.queryByText('No Match Found Yet')).not.toBeInTheDocument();
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  });

  it('stops searching from timeout modal', async () => {
    jest.useFakeTimers();
    (findMatch as jest.Mock).mockResolvedValue({data: {status: 'waiting'}});
    (cancelMatch as jest.Mock).mockResolvedValue({data: {success: true}});

    renderWithProviders();
    fireEvent.click(screen.getByRole('button', {name: /find a partner/i}));
    await waitFor(() => expect(WebSocketMock.instances).toHaveLength(1));

    await act(async () => {
      jest.advanceTimersByTime(31_000);
    });

    await screen.findByText('No Match Found Yet');

    fireEvent.click(screen.getByRole('button', {name: /stop searching/i}));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  });
});

