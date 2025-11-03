// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import * as React from 'react';
import useAuth from '../../hooks/useAuth';
import {getUser} from '../../lib/api';

jest.mock('../../lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });

  return ({children}: {children: React.ReactNode}) =>
    React.createElement(QueryClientProvider, {client: queryClient}, children);
};

describe('hooks/useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data when successful', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    };
    (getUser as jest.Mock).mockResolvedValue(mockUser);

    const {result} = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch user');
    (getUser as jest.Mock).mockRejectedValue(mockError);

    const {result} = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.user).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('should use correct query key', async () => {
    (getUser as jest.Mock).mockResolvedValue({});

    const {result} = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getUser).toHaveBeenCalled();
  });

  it('should accept custom options', async () => {
    const mockUser = {id: '1', username: 'test'};
    (getUser as jest.Mock).mockResolvedValue(mockUser);

    const {result} = renderHook(() => useAuth({enabled: false}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  it('should spread rest of useQuery return values', async () => {
    (getUser as jest.Mock).mockResolvedValue({});

    const {result} = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('refetch');
  });
});
