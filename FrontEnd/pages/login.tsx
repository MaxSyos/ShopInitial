import axios from "axios";
import type { NextPage } from "next";
import { useDispatch } from "react-redux";
import { fetchCart } from "../store/cart-async-slice";
import { useRouter } from "next/router";
import jsCookie from "js-cookie";
import EnteringBox from "../components/entering/EnteringBox";
import { IUser, IUserInfoRootState } from "../lib/types/user";
import { userInfoActions } from "../store/user-slice";
import { getError } from "../utilities/error";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { authService } from "../lib/authService";
import tokenStore from "../lib/tokenStore";

const Login: NextPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const userInfo = useSelector((state: IUserInfoRootState) => {
    return state.userInfo.userInformation;
  });
  useEffect(() => {
    if (userInfo) {
      const rawRedirect = (router.query.redirect as string) || '/';
      // Se o redirect vier como uma rota dinâmica template (ex: /payment/[id])
      // não tentar interpolar — fallback para raiz
      const redirect = rawRedirect.includes('[') || rawRedirect.includes(']') ? '/' : rawRedirect;
      router.push(redirect);
    }
  }, [userInfo, router]);
  async function LoginHandler(userData: IUser) {
    try {
      // ✅ Armazenar token no tokenStore para que o axiosClient consiga acessar
      if (userData.accessToken) {
        console.log('[Login Page] LoginHandler -> storing token:', userData.accessToken.substring(0, 15) + '...');
        tokenStore.setToken(userData.accessToken);
        console.log('[Login Page] Token stored in tokenStore');
      } else {
        console.warn('[Login Page] ⚠️ userData.accessToken is empty!');
      }

      // Atualiza estado de usuário e cache local
      dispatch(userInfoActions.userLogin(userData));
      jsCookie.set("userInfo", JSON.stringify(userData));

      // Tentar atualizar/refresh do carrinho do servidor antes do redirect para garantir
      // que o estado do carrinho esteja sincronizado na página inicial.
      try {
        // dispatch retorna uma Promise quando é um thunk
        // @ts-ignore
        await dispatch(fetchCart());
      } catch (e) {
        console.warn('fetchCart after login falhou:', e);
      }

      const rawRedirect = (router.query.redirect as string) || '/';
      const redirect = rawRedirect.includes('[') || rawRedirect.includes(']') ? '/' : rawRedirect;
      await router.push(redirect);
    } catch (err: any) {
      setErrorMessage(getError(err));
      console.log(getError(err));
    }
  }
  return (
    <EnteringBox
      title="login"
      submitHandler={LoginHandler}
      errorMessage={errorMessage}
    />
  );
};

export default Login;
