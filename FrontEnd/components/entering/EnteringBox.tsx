import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Input from "../UI/Input";
import { useLanguage } from "../../hooks/useLanguage";
import { IUser } from "../../lib/types/user";
import { authService } from "../../lib/authService";

interface Props {
  title: string;
  submitHandler: (user: IUser) => void;
  errorMessage: string;
}

const EnteringBox: React.FC<Props> = ({
  title,
  submitHandler,
  errorMessage,
}) => {
  const userNameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const errorMessageRef = useRef<HTMLSpanElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
      if (title === "signUp") {
        userNameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
    }
  }, [errorMessage, title]);

  async function onSubmitHandler(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validação dos campos
      const email = emailRef.current?.value?.trim();
      const password = passwordRef.current?.value?.trim();

      if (!email || !password) {
        throw new Error(t.EmailAndPasswordRequired || 'Email e senha são obrigatórios');
      }

      if (password.length < 6) {
        throw new Error(t.PasswordMinLength || 'A senha deve ter no mínimo 6 caracteres');
      }

      let userData: IUser;

      if (title === "signUp") {
        const name = userNameRef.current?.value?.trim();
        if (!name) {
          throw new Error(t.NameRequired || 'Nome é obrigatório');
        }

        const registerData = { name, email, password };
        const response = await authService.register(registerData);

        if (!response.user) {
          throw new Error('Dados do usuário não encontrados na resposta');
        }

        userData = {
          ...response.user,
          token: response.accessToken,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        };
      } else {
        const response = await authService.login(email, password);
        
        if (!response.user) {
          throw new Error('Dados do usuário não encontrados na resposta');
        }

        userData = {
          ...response.user,
          token: response.accessToken,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        };
      }

      // Chama o submitHandler apenas uma vez com os dados completos
      submitHandler(userData);
      
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      setError(err.message || t.Invalid_email_or_password);
    } finally {
      setLoading(false);
    }
  }

  const linkHref = title === "login" ? "signUp" : "login";

  return (
    <div className="flex flex-col items-center justify-center mt-8">
      <div className="w-full md:w-[50%] max-w-[500px] border-2 bg-palette-card shadow-lg py-4 px-8 rounded-lg">
        <h2 className="text-lg md:text-2xl font-bold">{t[`${title}`]}</h2>
        <p className="mt-4 mb-2">
          {t.hi}
          {title === "login" && (
            <>
              <br />
              <span className="inline-block text-palette-mute dark:text-palette-base/80 text-[12px] mt-2 bg-palette-fill p-2">
                {t.loginExplanation}
              </span>
            </>
          )}
        </p>
        <form onSubmit={onSubmitHandler}>
          <div className="mt-8">
            {title === "signUp" && (
              <Input
                ref={userNameRef}
                type="text"
                id="userName"
                placeholder="enterYourUserName"
                required={true}
              />
            )}

            <Input
              ref={emailRef}
              type="email"
              id="email"
              placeholder="enterYourEmail"
              required={true}
            />

            <Input
              ref={passwordRef}
              type="password"
              id="password"
              placeholder="enterYourPassword"
              required={true}
            />
          </div>
          
          {error && (
            <span
              ref={errorMessageRef}
              className="text-rose-600 block -mt-4 mb-4"
            >
              {t[error] ? t[error] : error}
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`bg-palette-primary w-full py-4 rounded-lg text-palette-side text-xl shadow-lg ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Carregando..." : t[`${title}`]}
          </button>
        </form>
        <Link href={`/${linkHref}`}>
          <a className="block my-4">
            <span className="text-sm text-palette-mute">
              {title === "login" ? t.doHaveAnAccount : t.alreadyHaveAnAccount}
            </span>
            <span className="text-cyan-500">{t[`${linkHref}`]}</span>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default EnteringBox;
