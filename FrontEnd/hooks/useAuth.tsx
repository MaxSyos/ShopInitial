import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { IUserInfoRootState } from '../lib/types/user';
import { userInfoActions } from '../store/user-slice';

export const useAuth = (requireAuth = false, redirectTo = '/login') => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userInformation, isAuthenticated, loading } = useSelector(
    (state: IUserInfoRootState) => state.userInfo
  );

  useEffect(() => {
    if (requireAuth && !loading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [requireAuth, isAuthenticated, loading, router, redirectTo]);

  const logout = () => {
    dispatch(userInfoActions.userLogout());
    router.push('/login');
  };

  return {
    user: userInformation,
    isAuthenticated,
    loading,
    logout
  };
};
