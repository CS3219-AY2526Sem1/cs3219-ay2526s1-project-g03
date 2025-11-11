import { userApi, matchingApi, historyApi, questionApi } from '../config/apiClient';

export const register = async data => userApi.post('/auth/register', data);

export const login = async data => userApi.post('auth/login', data);
export const logout = async () => userApi.get('auth/logout');

export const verifyEmail = async verificationCode =>
  userApi.get(`/auth/email/verify/${verificationCode}`);
export const resendEmail = async data => userApi.post('auth/email/resend', data);

export const forgotPassword = async data => userApi.post('/auth/password/forgot', data);
export const resetPassword = async data => userApi.post('/auth/password/reset', data);

export const getUser = async () => {
  const response = await userApi.get('/user', {withCredentials: true});
  return response.data;
};
export const changeUsernameOrEmail = async data => userApi.patch('/user/profile/usernameoremail', data);
export const changeProfilePic = async (formData: FormData) =>
  userApi.patch('/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);

export const deleteProfilePic = async () => {
  return userApi.patch('/user/profile/picture', {delete: 'true'});
};

export const changePassword = async data => userApi.patch('/user/profile/password', data);
export const changePersonalInfo = async data => userApi.patch('/user/profile/personalinfo', data);

export const deleteAccount = async (data: {password: string}) => userApi.delete('/user/delete', {data});

export const unlinkOAuthProvider = async (provider: 'google' | 'github') =>
  userApi.delete(`/user/oauth/${provider}`);

export const changeUserRole = async (username, role) =>
  userApi.patch(`/admin/users/${username}/role`, {role});

export const createAdminAccount = async data => userApi.post('/admin/users', data);


// matching-service
export const findMatch = async data => matchingApi.post('/matches/', data);

// question-service
export const getTopics = async () => {
  const response = await questionApi.get('/api/topics');
  return response.data;
};

// history-service
/**
 * Fetches the aggregated progress stats for a user.
 * (For the stat bars on Home and Profile)
 */
export const getHistoryProgress = async (userId: string) => {
  const response = await historyApi.get(`/api/history/progress/${userId}`);
  return response.data;
};

/**
 * Fetches the summary list of all unique, most-recent attempts.
 * (For the main lists on Home and History Dashboard)
 */
export const getAllAttemptSummaries = async (userId: string) => {
  const response = await historyApi.get(`/api/history/all-summaries/${userId}`);
  return response.data;
};

/**
 * Fetches ALL attempts for a SINGLE question.
 * (For the "Question Detail" page - Pic 3)
 */
export const getQuestionAttempts = async (userId: string, questionId: string) => {
  const response = await historyApi.get(`/api/history/question-attempts/${userId}/${questionId}`);
  return response.data;
};

/**
 * Fetches the list of "active" question IDs for the reset page.
 */
export const getActiveAttempts = async (userId: string) => {
  const response = await historyApi.get(`/api/history/active-attempts/${userId}`);
  return response.data;
};

/**
 * Resets a list of questions, making them available for matching again.
 */
export const resetQuestions = async (userId: string, questionIds: string[]) => {
  const response = await historyApi.post(`/api/history/reset-questions/${userId}`, { questionIds });
  return response.data;
};
export const cancelMatch = async data => matchingApi.delete(`/matches/${data.userId}`, data);
