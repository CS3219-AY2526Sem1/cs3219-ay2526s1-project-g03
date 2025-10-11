import axios from 'axios';

const options = {
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
  withCredentials: true,
};

const API = axios.create(options);

export default API;
