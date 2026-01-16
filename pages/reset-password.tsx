import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useLanguage } from "../hooks/useLanguage";
import { toast } from "react-toastify";
import Input from "../components/UI/Input";
import { authService } from "../lib/authService";

const ResetPassword: NextPage = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Espera o router estar pronto antes de verificar o token
    if (!router.isReady) return;
    
    if (!token) {
      router.push('/login');
    }
  }, [token, router, router.isReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token as string, password);
      toast.success("Senha redefinida com sucesso!");
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full md:w-[50%] max-w-[500px] border-2 bg-palette-card shadow-lg py-4 px-8 rounded-lg">
        <h2 className="text-lg md:text-2xl font-bold">
          {t.resetPassword || "Redefinir Senha"}
        </h2>
        <p className="mt-4 mb-2">
          {t.enterNewPassword || "Digite sua nova senha."}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mt-8">
            <Input
              type="password"
              id="password"
              placeholder="novaSenha"
              required={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              id="confirmPassword"
              placeholder="confirmarSenha"
              required={true}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`bg-palette-primary w-full py-4 rounded-lg text-palette-side text-xl shadow-lg mt-4 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Redefinindo..." : t.resetPassword || "Redefinir Senha"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;