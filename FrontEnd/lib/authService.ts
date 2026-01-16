import { IUser } from './types/user';
import tokenStore from './tokenStore';

const API_BASE = '/api/auth';

export const authService = {
  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erro no login');

      const userData = {
        _id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        isAdmin: data.user.role === 'ADMIN',
        role: data.user.role,
        accessToken: data.accessToken,
      };
      // Save accessToken in memory and userInfo in localStorage
      console.log('[AuthService] login -> storing token:', data.accessToken.substring(0, 15) + '...');
      tokenStore.setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        console.log('[AuthService] login -> saved userInfo to localStorage');
      }

      return { user: userData, accessToken: data.accessToken };
    } catch (err: any) {
      console.error('Erro no login:', err);
      throw err.message || 'Credenciais inválidas';
    }
  },

  async register(user: { name: string; email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password, name: user.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erro no registro');

      // Save accessToken in memory and userInfo in localStorage
      console.log('[AuthService] register -> storing token:', data.accessToken.substring(0, 15) + '...');
      tokenStore.setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify({ _id: data.user.id, name: data.user.name, email: data.user.email, isAdmin: data.user.role === 'ADMIN', role: data.user.role, accessToken: data.accessToken }));
        console.log('[AuthService] register -> saved userInfo to localStorage');
      }
      return data;
    } catch (err: any) {
      console.error('Erro no registro:', err);
      throw err.message || 'Erro ao criar conta';
    }
  },

  async refreshToken(token?: string) {
    try {
      // For Option A the refresh token is stored in an HttpOnly cookie and will
      // be sent automatically when calling the refresh endpoint with credentials.
      const res = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erro ao atualizar token');

      // update in-memory access token and cached userInfo
      console.log('[AuthService] refreshToken -> storing new token:', data.accessToken.substring(0, 15) + '...');
      tokenStore.setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.accessToken = data.accessToken;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }

      return data;
    } catch (err: any) {
      console.error('Erro ao atualizar token:', err);
      throw err.message || 'Sessão expirada';
    }
  },

  async logout() {
    try {
      // Call logout which will clear refresh token cookie server-side and in DB
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      tokenStore.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userInfo');
      }
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
    }
  },
};
