import axios from 'axios';
import queryClient from './queryClient';
import {navigate} from '../lib/navigation';

const HTTP_UNAUTHORIZED = 401;
const INVALID_ACCESS_TOKEN = 'Invalid access token!';

const userApiOptions = {
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
  withCredentials: true,
};

const BackupApi = axios.create(userApiOptions);
export const userApi = axios.create(userApiOptions);

userApi.interceptors.response.use(
  response => response,
  async error => {
    const {config, response} = error;
    const status = response?.status;
    const data = response?.data;
    if (status === HTTP_UNAUTHORIZED && data?.message === INVALID_ACCESS_TOKEN) {
      try {
        await BackupApi.get('/auth/refresh');
        return BackupApi(config);
      } catch (error) {
        queryClient.clear();
        navigate('/home', {
          state: {
            redirectUrl: window.location.pathname,
          },
        });
      }
    }
    return Promise.reject({status, ...data});
  }
);


export const matchingApi = axios.create({
  baseURL: import.meta.env.VITE_MATCHING_SERVICE_URL,
  withCredentials: true,
});
