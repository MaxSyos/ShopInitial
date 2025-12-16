import type { NextPage } from "next";
import { useDispatch, useSelector } from "react-redux";
import { userInfoActions } from "../store/user-slice";
import jsCookie from "js-cookie";
import EnteringBox from "../components/entering/EnteringBox";
import { IUser } from "../lib/types/user";
import axios from "axios";
import { getError } from "../utilities/error";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IUserInfoRootState } from "../lib/types/user";
import tokenStore from "../lib/tokenStore";

const SignUp: NextPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const { redirect } = router.query;
  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );
  useEffect(() => {
    if (userInfo) {
      router.push((redirect as string) || "/");
    }
  }, [userInfo, redirect, router]);
  async function signUpHandler(user: IUser) {
    // ✅ Armazenar token no tokenStore para que o axiosClient consiga acessar
    if (user.accessToken) {
      console.log('[SignUp Page] signUpHandler -> storing token:', user.accessToken.substring(0, 15) + '...');
      tokenStore.setToken(user.accessToken);
      console.log('[SignUp Page] Token stored in tokenStore');
    } else {
      console.warn('[SignUp Page] ⚠️ user.accessToken is empty!');
    }

    // Atualiza estado de usuário e cache local
    dispatch(userInfoActions.userLogin(user));
    jsCookie.set("userInfo", JSON.stringify(user));
  }
  return (
    <EnteringBox
      title="signUp"
      submitHandler={signUpHandler}
      errorMessage={errorMessage}
    />
  );
};

export default SignUp;
