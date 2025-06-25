import axios from 'axios';
import store from '../store';
import { userInfoActions } from '../store/user-slice';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

console.log('URL do backend configurada:', baseURL);

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

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se o erro for 401 (Não autorizado) e ainda não tentamos renovar o token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (!refreshToken || !userInfo) {
          throw new Error('Informações da sessão não encontradas');
        }
        
        // Tenta renovar o token
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
          userId: JSON.parse(userInfo)._id
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Atualiza os tokens no localStorage e no Redux
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        store.dispatch(userInfoActions.updateTokens({
          accessToken,
          refreshToken: newRefreshToken || refreshToken
        }));
        
        // Refaz a requisição original com o novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
        
      } catch (refreshError) {
        // Se não conseguir renovar o token, faz logout
        store.dispatch(userInfoActions.userLogout());
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Se o erro não for 401 ou já tentamos renovar o token
    return Promise.reject(error);
  }
);

export const axiosInstance = api;

export default api;
