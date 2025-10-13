import axios from 'axios';
import queryClient from './queryClient';
import {navigate} from '../lib/navigation';

const HTTP_UNAUTHORIZED = 401;
const INVALID_ACCESS_TOKEN = 'Invalid access token!';

const options = {
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
  withCredentials: true,
};

const BackupAPI = axios.create(options);
const API = axios.create(options);

API.interceptors.response.use(
  response => response,
  async error => {
    const {config, response} = error;
    const status = response?.status;
    const data = response?.data;
    if (status === HTTP_UNAUTHORIZED && data?.message === INVALID_ACCESS_TOKEN) {
      try {
        await BackupAPI.get('/auth/refresh');
        return BackupAPI(config);
      } catch (error) {
        queryClient.clear();
        navigate('/login', {
          state: {
            redirectUrl: window.location.pathname,
          },
        });
      }
    }
    return Promise.reject({status, ...data});
  }
);

export default API;
