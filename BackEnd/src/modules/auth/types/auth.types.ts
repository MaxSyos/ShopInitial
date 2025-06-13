import { UserRole } from '@prisma/client';

// Define um tipo personalizado para duração em string
export type DurationString = `${number}${'d' | 'h' | 'm' | 's' | 'ms'}`;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
