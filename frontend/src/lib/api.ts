import API from '../config/apiClient';

export const register = async data => API.post('/auth/register', data);
