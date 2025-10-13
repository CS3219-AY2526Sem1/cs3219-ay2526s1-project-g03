import API from '../config/apiClient';

export const register = async data => API.post('/auth/register', data);

export const verifyEmail = async verificationCode =>
  API.get(`/auth/email/verify/${verificationCode}`);

export const login = async data => API.post('auth/login', data);
export const logout = async () => API.get('auth/logout');

export const getUser = async () => {
  const response = await API.get('/user', {withCredentials: true});
  return response.data;
};

export const forgotPassword = async data => API.post('/auth/password/forgot', data);
export const resetPassword = async data => API.post('/auth/password/reset', data);
