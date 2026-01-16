export interface ServerUser {
  _id: string;
  id?: string; // alguns endpoints podem retornar id ao invés de _id
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface ServerAuthResponse {
  user: ServerUser;
  accessToken: string;
  refreshToken: string;
}
