import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userInfoActions } from '../store/user-slice';
import tokenStore from '../lib/tokenStore';
import { fetchCart as fetchCartThunk, addToCart as addToCartThunk } from '../store/cart-async-slice';
import { fetchUserAddresses } from '../store/order-slice';
import cartSync from '../lib/cartSync';
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
                    // also fetch user addresses so pages like shipping-address have data
                    dispatch(fetchUserAddresses());

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

                        // Mapear itens locais para o formato esperado pelo endpoint /api/cart/merge
                        const mappedItems = localCart.items.map((it: any) => {
                          const productId = it.id || (it.slug && it.slug.current) || null;
                          const quantity = Number(it.quantity || 0);
                          const unitPrice = Number(it.price ?? (it.totalPrice && it.quantity ? it.totalPrice / it.quantity : 0));
                          return { productId, quantity, unitPrice };
                        }).filter((x: any) => x.productId && x.quantity > 0);

                        if (mappedItems.length === 0) {
                          // nada para mesclar
                        } else {
                          const resp = await fetch('/api/cart/merge', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ items: mappedItems })
                          });


                          if (resp.ok) {
                            // Recarregar o carrinho do servidor para atualizar o estado local
                            dispatch(fetchCartThunk());
                            // Após merge, também disparar sincronização para enviar quaisquer ops pendentes
                            try { cartSync.syncNow().catch(()=>{}); } catch(e) {}
                            // limpar cart local para evitar duplicação futura
                            try { localStorage.removeItem('cart'); } catch(e) {}
                          } else {
                            console.warn('Merge do carrinho retornou não-ok', await resp.text().catch(()=>null));
                          }
                        }
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
                      console.warn('[AuthProvider] ⚠️ Refresh failed, no access token returned');
                      dispatch(userInfoActions.userLogout());
                    }
                  })
                  .catch((e) => {
                    console.error('[AuthProvider] ❌ Refresh failed:', e.message);
                    dispatch(userInfoActions.userLogout());
                  });
              }
            } else {
              console.error('[AuthProvider] ❌ Invalid user data in localStorage');
              dispatch(userInfoActions.userLogout());
              localStorage.clear();
            }
          } else {
          }
        }
      } catch (error) {
        console.error('[AuthProvider] ❌ Error restoring session:', error);
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
