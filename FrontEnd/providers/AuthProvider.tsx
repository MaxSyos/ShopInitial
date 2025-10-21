import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { userInfoActions } from '../store/user-slice';
import tokenStore from '../lib/tokenStore';

const API_BASE = '/api/auth';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreUserSession = () => {
      try {
        if (typeof window !== 'undefined') {
          const userInfo = localStorage.getItem('userInfo');

          if (userInfo) {
            const userData = JSON.parse(userInfo);

            // Basic validation
            if (
              userData._id &&
              userData.name &&
              userData.email &&
              typeof userData.isAdmin === 'boolean' &&
              userData.role &&
              (userData.role === 'USER' || userData.role === 'ADMIN')
            ) {
              // If cached accessToken exists, restore it in-memory; otherwise try refresh endpoint
              if (userData.accessToken) {
                tokenStore.setToken(userData.accessToken);
                dispatch(userInfoActions.userLogin({ ...userData, accessToken: userData.accessToken }));
              } else {
                // Try to refresh using HttpOnly cookie
                fetch(`${API_BASE}/refresh`, { method: 'POST', credentials: 'include' })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data?.accessToken) {
                      tokenStore.setToken(data.accessToken);
                      dispatch(userInfoActions.userLogin({ ...userData, accessToken: data.accessToken }));
                      // update cached userInfo
                      userData.accessToken = data.accessToken;
                      localStorage.setItem('userInfo', JSON.stringify(userData));
                    } else {
                      dispatch(userInfoActions.userLogout());
                    }
                  })
                  .catch((e) => {
                    console.error('Refresh falhou ao restaurar sessão:', e);
                    dispatch(userInfoActions.userLogout());
                  });
              }
            } else {
              console.error('Dados do usuário inválidos no localStorage');
              dispatch(userInfoActions.userLogout());
              localStorage.clear();
            }
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        dispatch(userInfoActions.userLogout());
        localStorage.clear();
      }
    };

    restoreUserSession();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
