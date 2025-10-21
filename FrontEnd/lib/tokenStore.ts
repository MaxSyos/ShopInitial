// Simple in-memory token store used by axios interceptor and auth flows.
// Keeps access token only in memory; refresh token is stored in HttpOnly cookie.
let _accessToken: string | null = null;

export const tokenStore = {
  getToken(): string | null {
    return _accessToken;
  },
  setToken(token: string | null) {
    _accessToken = token;
  },
  clear() {
    _accessToken = null;
  },
};

export default tokenStore;
