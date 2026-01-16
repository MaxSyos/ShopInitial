// Token store que mantém access token em memória e localStorage para persistência
// Refresh token é mantido em HttpOnly cookie pelo servidor
let _accessToken: string | null = null;

export const tokenStore = {
  getToken(): string | null {
    // Tentar recuperar de memória primeiro
    if (_accessToken) {
      return _accessToken;
    }
    
    // Tentar recuperar de localStorage (para persistir entre reloads)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('accessToken');
        if (stored) {
          _accessToken = stored;
          return stored;
        }
      } catch (e) {
        console.warn('[TokenStore] Could not access localStorage for token:', e);
      }
    }
    
    console.warn('[TokenStore] getToken -> ⚠️ NO TOKEN FOUND (neither in memory nor in localStorage)');
    return null;
  },
  setToken(token: string | null) {
    if (token) {
    } else {
      console.log('[TokenStore] setToken -> clearing token');
    }
    _accessToken = token;
    
    // Persistir no localStorage
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (e) {
        console.warn('[TokenStore] Could not store token in localStorage:', e);
      }
    }
  },
  clear() {
    _accessToken = null;
    
    // Limpar localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessToken');
      } catch (e) {
        console.warn('Could not clear token from localStorage:', e);
      }
    }
  },
};

export default tokenStore;
