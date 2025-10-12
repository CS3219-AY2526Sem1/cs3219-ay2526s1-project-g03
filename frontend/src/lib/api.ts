import API from '../config/apiClient';

export const register = async data => API.post('/auth/register', data);

export const verifyEmail = async verificationCode =>
  API.get(`/auth/email/verify/${verificationCode}`);

export const login = async data => API.post('auth/login', data);

export const getUser = async () => {
  const response = await API.get('/user', {withCredentials: true});
  return response.data;
};
