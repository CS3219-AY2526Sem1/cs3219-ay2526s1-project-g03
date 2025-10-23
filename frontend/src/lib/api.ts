import API from '../config/apiClient';

export const register = async data => API.post('/auth/register', data);
export const findMatch = async data => API.post('/api/matches/', data);