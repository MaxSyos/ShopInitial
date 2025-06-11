import api from './axiosConfig';
import { IUser } from './types/user';

export const authService = {
  async login(email: string, password: string) {
    try {
      console.log('Tentando fazer login com:', { email });
      
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      console.log('Resposta do login:', response.data);
      
      if (response.data.accessToken) {
        const userData = {
          _id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          isAdmin: response.data.user.role === 'ADMIN',
          role: response.data.user.role,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        };

        // Guarda os tokens e informações do usuário
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        return {
          user: userData,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        };
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      console.error('Erro no login:', error.response?.data || error);
      throw error.response?.data?.message || 'Credenciais inválidas';
    }
  },

  async register(user: Omit<IUser, '_id' | 'isAdmin' | 'token'>) {
    try {
      const response = await api.post('/auth/register', {
        email: user.email,
        password: user.password,
        name: user.name
      });
      
      // Guarda os tokens
      localStorage.setItem('accessToken', response.data.accessToken); 
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error: any) {
      console.error('Erro no registro:', error.response?.data || error);
      throw error.response?.data?.message || 'Erro ao criar conta';
    }
  },

  async refreshToken(token: string) {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: token
      });
      
      // Atualiza o token de acesso
      localStorage.setItem('accessToken', response.data.accessToken);
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar token:', error.response?.data || error);
      throw error.response?.data?.message || 'Sessão expirada';
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error.response?.data || error);
    }
  }
};
