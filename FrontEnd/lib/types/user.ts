export interface IUser {
  _id: string;
  name: string;
  password?: string;
  email: string;
  isAdmin: boolean;
  token: string;
  accessToken: string;
  refreshToken: string;
  role: 'USER' | 'ADMIN';
}

export interface IUserInfo {
  userInformation: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

//RootState interface=> used for state type in useSelector hook

export interface IUserInfoRootState {
  userInfo: IUserInfo;
}
