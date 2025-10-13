import API from '../config/apiClient';

export const register = async data => API.post('/auth/register', data);

export const login = async data => API.post('auth/login', data);
export const logout = async () => API.get('auth/logout');

export const verifyEmail = async verificationCode =>
  API.get(`/auth/email/verify/${verificationCode}`);
export const resendEmail = async data => API.post('auth/email/resend', data);

export const forgotPassword = async data => API.post('/auth/password/forgot', data);
export const resetPassword = async data => API.post('/auth/password/reset', data);

export const getUser = async () => {
  const response = await API.get('/user', {withCredentials: true});
  return response.data;
};
export const changeUsernameOrEmail = async data => API.patch('/user/profile/usernameoremail', data);
export const changeProfilePic = async (formData: FormData) =>
  API.patch('/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
export const changePassword = async data => API.patch('/user/profile/password', data);
export const changePersonalInfo = async data => API.patch('/user/profile/personalinfo', data);
