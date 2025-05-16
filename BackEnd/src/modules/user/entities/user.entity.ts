export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class UserEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}
