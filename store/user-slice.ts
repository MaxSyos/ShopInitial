import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser, IUserInfo } from "../lib/types/user";
import tokenStore from "../lib/tokenStore";

const initialState: IUserInfo = {
  userInformation: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  accessToken: null,
  refreshToken: null, // kept for type compatibility but not persisted
};

const userInfoSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    userLogin(
      state,
      action: PayloadAction<IUser & { accessToken: string }>
    ) {
      // populate required IUser fields; fill missing fields with sensible defaults
      state.userInformation = {
        _id: action.payload._id,
        name: action.payload.name,
        email: action.payload.email,
        isAdmin: action.payload.isAdmin,
        password: undefined,
        token: action.payload.accessToken || '',
        accessToken: action.payload.accessToken,
        refreshToken: '',
        role: (action.payload as any).role || 'USER',
      } as IUser;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.error = null;

      // Save access token in memory only
      tokenStore.setToken(action.payload.accessToken);
    },

    userLogout(state) {
      state.userInformation = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      // Limpa endereços ao deslogar
      if (typeof window !== "undefined") {
        localStorage.removeItem("userInfo");
      }
      tokenStore.clear();
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    updateTokens(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken;
      tokenStore.setToken(action.payload.accessToken);
      if (typeof window !== 'undefined') {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.accessToken = action.payload.accessToken;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
    },

    updateUserInfo(state, action: PayloadAction<Partial<IUser>>) {
      if (state.userInformation) {
        state.userInformation = { ...state.userInformation, ...action.payload };
        // Atualizar localStorage também
        if (typeof window !== 'undefined') {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const updated = { ...userInfo, ...action.payload };
          localStorage.setItem('userInfo', JSON.stringify(updated));
        }
      }
    },
  },
});

export const userInfoActions = userInfoSlice.actions;
export default userInfoSlice.reducer;
