// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import queryClient from '../../config/queryClient';
import {navigate} from '../../lib/navigation';

jest.mock('../../config/queryClient', () => ({clear: jest.fn()}));
jest.mock('../../lib/navigation', () => ({navigate: jest.fn()}));

let interceptorRejected: any;

const mockPrimaryInstance = {
  interceptors: {
    response: {
      use: (_: any, rejected: any) => {
        interceptorRejected = rejected;
      },
    },
  },
  get: jest.fn(),
  request: jest.fn(),
};

const mockBackupInstance: any = jest.fn();
mockBackupInstance.get = jest.fn();

const mockAxios = {
  create: jest
    .fn()
    .mockReturnValueOnce(mockBackupInstance)
    .mockReturnValueOnce(mockPrimaryInstance),
  isAxiosError: () => false,
};

jest.mock('axios', () => mockAxios);

beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    await import('../../config/apiClient');
  });
});

beforeEach(() => jest.clearAllMocks());

describe('config/apiClient', () => {
  it('refreshes token and retries request on 401 Invalid access token', async () => {
    mockBackupInstance.get.mockResolvedValue({});
    mockBackupInstance.mockResolvedValue('retried');

    const error = {
      config: {url: '/protected'},
      response: {
        status: 401,
        data: {message: 'Invalid access token!'},
      },
    };

    const result = await interceptorRejected(error);

    expect(mockBackupInstance.get).toHaveBeenCalledWith('/auth/refresh');
    expect(mockBackupInstance).toHaveBeenCalledWith(error.config);
    expect(result).toBe('retried');
  });

  it('clears queryClient and navigates when refresh fails', async () => {
    mockBackupInstance.get.mockRejectedValue(new Error('refresh failed'));

    const error = {
      config: {url: '/protected'},
      response: {
        status: 401,
        data: {message: 'Invalid access token!'},
      },
    };

    await expect(interceptorRejected(error)).rejects.toEqual({
      status: 401,
      message: 'Invalid access token!',
    });

    expect(queryClient.clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/home', {
      state: {redirectUrl: window.location.pathname},
    });
  });

  it('rejects other errors unchanged', async () => {
    const error = {
      config: {url: '/protected'},
      response: {status: 500, data: {message: 'Server error'}},
    };

    await expect(interceptorRejected(error)).rejects.toEqual({
      status: 500,
      message: 'Server error',
    });

    expect(mockBackupInstance.get).not.toHaveBeenCalled();
    expect(mockBackupInstance).not.toHaveBeenCalled();
  });
});
