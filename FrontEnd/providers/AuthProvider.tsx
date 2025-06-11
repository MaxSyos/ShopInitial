import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { userInfoActions } from '../store/user-slice';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreUserSession = () => {
      try {
        if (typeof window !== 'undefined') {
          const userInfo = localStorage.getItem('userInfo');
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');

          if (userInfo && accessToken && refreshToken) {
            const userData = JSON.parse(userInfo);
            
            // Validar se todos os campos obrigatórios estão presentes
            if (
              userData._id &&
              userData.name &&
              userData.email &&
              typeof userData.isAdmin === 'boolean' &&
              userData.role &&
              (userData.role === 'USER' || userData.role === 'ADMIN')
            ) {
              dispatch(userInfoActions.userLogin({
                ...userData,
                accessToken,
                refreshToken,
                token: accessToken // Mantém compatibilidade com o campo token
              }));
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
