import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Input from "../UI/Input";
import { useLanguage } from "../../hooks/useLanguage";
import { IUser } from "../../lib/types/user";
import { authService } from "../../lib/authService";
import { toast } from 'react-toastify';
import { validatePassword } from './validators';
import PasswordRequirements from './PasswordRequirements';

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
  const [password, setPassword] = useState("");
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

      if (title === "signUp") {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          throw new Error(t[passwordValidation.message] || passwordValidation.message);
        }
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

      if (title === "signUp") {
        // Mostra mensagem de sucesso ao criar conta
        toast.success(t.AccountCreatedSuccessfully || 'Conta criada com sucesso', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Aguarda um momento antes de redirecionar
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } else {
        // Mostra mensagem de sucesso ao fazer login
        toast.success(t.LoginSuccessful || 'Login realizado com sucesso', {
          position: "top-right",
          autoClose: 3000,
        });
      }
      
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      const errorMessage = err.message || err.toString() || t.Invalid_email_or_password;
      setError(errorMessage);
      
      // Mostra mensagem de erro usando toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
              {/* <span className="inline-block text-palette-mute dark:text-palette-base/80 text-[12px] mt-2 bg-palette-fill p-2">
                {t.loginExplanation}
              </span> */}
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
              onChange={(e) => setPassword(e.target.value)}
            />
            {title === "signUp" && <PasswordRequirements password={password} />}
          </div>
          
          {error && (
            <span
              ref={errorMessageRef}
              className="text-rose-600 block -mt-35 mb-4"
            >
              {t[error] ? t[error] : typeof error === 'string' ? error : 'Erro no registro'}
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
