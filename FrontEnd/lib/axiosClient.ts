import axios from 'axios';
import tokenStore from './tokenStore';

const baseURL = '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

console.log('[AxiosClient] Initializing axiosClient with baseURL:', baseURL);

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getToken();
    console.log('[Axios Request] Token from store:', token ? `present (${token.substring(0, 15)}...)` : 'MISSING');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = `Bearer ${token}`;
      console.log('[Axios Request] Authorization header added:', `Bearer ${token.substring(0, 15)}...`);
      console.log('[Axios Request] Config URL:', config.url);
    } else {
      console.warn('[Axios Request] ⚠️ No token found in tokenStore for URL:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.log('\n===== [Axios] 401 Unauthorized - Attempting refresh =====');
      console.log('[Axios] Original URL:', originalRequest.url);
      
      if (isRefreshing) {
        console.log('[Axios] Refresh already in progress, queuing request...');
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            console.log('[Axios] Request dequeued, retrying with new token');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[Axios] Calling /api/auth/refresh...');
        const resp = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (!resp.ok) throw new Error('Refresh failed');
        const data = await resp.json();
        const newAccessToken = data.accessToken;
        console.log('[Axios] ✅ Refresh successful, new token received');
        
        if (newAccessToken) {
          tokenStore.setToken(newAccessToken);
          console.log('[Axios] ✅ New token stored in tokenStore');
        }
        processQueue(null, newAccessToken);
        isRefreshing = false;

        console.log('[Axios] ✅ Retrying original request with new token');
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(originalRequest);
      } catch (err) {
        console.error('===== [Axios] ❌ Refresh failed:', err);
        processQueue(err, null);
        isRefreshing = false;
        try { tokenStore.clear(); } catch (e) {}
        console.log('[Axios] Cleared token, user needs to login again');
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const axiosInstance = api;
export default api;
