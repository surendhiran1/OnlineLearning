import axios from 'axios';
import { store } from '../store/store';
import { logout, setCredentials } from '../store/slices/authSlice';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        store.dispatch(logout());
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('http://localhost:8080/api/v1/auth/refresh-token', { refreshToken });
        
        store.dispatch(setCredentials({
          accessToken: data.accessToken,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          refreshToken: data.refreshToken
        }));
        
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        processQueue(null, data.accessToken);
        isRefreshing = false;
        return api(originalRequest);
        
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
