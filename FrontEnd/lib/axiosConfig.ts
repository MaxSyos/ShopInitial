import axios from 'axios';

// Use internal Next.js API by default when running in monolito
const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

console.log('URL do backend configurada (axios):', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para CORS com credenciais
  timeout: 15000,
});

// Interceptor para incluir o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas (apenas rejeita, sem lógica de refresh)
// --- Refresh token handling for 401 responses ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error: any) => void;
  config: any;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(prom.config);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // enqueue request and return a promise that resolves when token is refreshed
        return new Promise<any>((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        }).then((cfg: any) => api.request(cfg));
      }

      isRefreshing = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      try {
        const resp = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!resp.ok) throw new Error('Refresh failed');

        const data = await resp.json();
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // update original request header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api.request(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        // clear tokens on refresh failure
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userInfo');
        } catch (e) {
          // ignore
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const axiosInstance = api;

export default api;
