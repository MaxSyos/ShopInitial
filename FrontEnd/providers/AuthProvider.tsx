import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userInfoActions } from '../store/user-slice';
import tokenStore from '../lib/tokenStore';
import { fetchCart as fetchCartThunk, addToCart as addToCartThunk } from '../store/cart-async-slice';
import type { ICart } from '../lib/types/cart';

const API_BASE = '/api/auth';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // use any to permitir dispatch de thunks sem operações adicionais de tipagem aqui
  const dispatch: any = useDispatch();

  useEffect(() => {
  const restoreUserSession = async () => {
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

                // Após restaurar sessão, sincroniza o carrinho local com o backend
                try {
                  // Primeiro busca o carrinho do servidor
                  dispatch(fetchCartThunk());

                  // Tentar mesclar itens locais (se existirem) enviando todos em um único request
                  if (typeof window !== 'undefined') {
                    const localCart: ICart | null = JSON.parse(localStorage.getItem('cart') || 'null');
                    if (localCart && Array.isArray(localCart.items) && localCart.items.length > 0) {
                      try {
                        let token = '';
                        try {
                          const ui = localStorage.getItem('userInfo');
                          if (ui) token = JSON.parse(ui).accessToken || '';
                        } catch (e) {}
                        await fetch('/api/cart/merge', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ items: localCart.items })
                        });
                        // opcional: limpar cart local para evitar duplicação
                        // localStorage.removeItem('cart');
                      } catch (e) {
                        console.error('Erro ao mesclar carrinho via endpoint:', e);
                      }
                    }
                  }
                } catch (e) {
                  console.error('Erro ao sincronizar carrinho após login:', e);
                }
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

  // chamar a função async; não precisamos await aqui no useEffect
  restoreUserSession();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
