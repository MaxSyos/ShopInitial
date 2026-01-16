import type { NextPage } from "next";
import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { toast } from "react-toastify";
import Input from "../components/UI/Input";
import Link from "next/link";
import { authService } from "../lib/authService";

const ForgotPassword: NextPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);

      toast.success(t.resetPasswordEmailSent || "Email de redefinição enviado!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full md:w-[50%] max-w-[500px] border-2 bg-palette-card shadow-lg py-4 px-8 rounded-lg">
        <h2 className="text-lg md:text-2xl font-bold">
          {t.forgotPassword || "Esqueceu a senha?"}
        </h2>
        <p className="mt-4 mb-2">
          {t.forgotPasswordInstructions || "Digite seu email para receber um link de redefinição de senha."}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mt-8">
            <Input
              type="email"
              id="email"
              placeholder="enterYourEmail"
              required={true}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`bg-palette-primary w-full py-4 rounded-lg text-palette-side text-xl shadow-lg mt-4 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Enviando..." : t.sendResetLink || "Enviar link"}
          </button>
        </form>
        <Link href="/login">
          <a className="block my-4 text-center">
            <span className="text-sm text-cyan-500">
              {t.backToLogin || "Voltar ao login"}
            </span>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;