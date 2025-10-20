import { IUser } from './types/user';

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
        refreshToken: data.refreshToken,
      };

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(userData));

      return { user: userData, accessToken: data.accessToken, refreshToken: data.refreshToken };
    } catch (err: any) {
      console.error('Erro no login:', err);
      throw err.message || 'Credenciais inválidas';
    }
  },

  async register(user: Omit<IUser, '_id' | 'isAdmin' | 'token'>) {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password, name: user.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erro no registro');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    } catch (err: any) {
      console.error('Erro no registro:', err);
      throw err.message || 'Erro ao criar conta';
    }
  },

  async refreshToken(token?: string) {
    try {
      const refreshToken = token || (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
      if (!refreshToken) throw new Error('Refresh token ausente');

      const res = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erro ao atualizar token');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userInfo.accessToken = data.accessToken;
      userInfo.refreshToken = data.refreshToken;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      return data;
    } catch (err: any) {
      console.error('Erro ao atualizar token:', err);
      throw err.message || 'Sessão expirada';
    }
  },

  async logout() {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
    }
  },
};
