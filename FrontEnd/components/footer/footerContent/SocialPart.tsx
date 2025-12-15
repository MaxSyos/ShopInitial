import React, { useState } from "react";
import { socialMedia } from "../../../mock/footer";
import { useLanguage } from "../../../hooks/useLanguage";
import Link from "next/link";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

const SocialPart = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.warn(t.emailRequired || "Por favor, insira um email", {
        theme: theme === "dark" ? "dark" : "light",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/content/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || t.emailRegisteredSuccess || "Email registrado com sucesso!", {
          theme: theme === "dark" ? "dark" : "light",
        });
        setEmail("");
      } else {
        toast.error(data.error || t.emailRegisteredError || "Erro ao registrar email", {
          theme: theme === "dark" ? "dark" : "light",
        });
      }
    } catch (error) {
      console.error("Error registering email:", error);
      toast.error(t.emailRegisteredError || "Erro ao registrar email", {
        theme: theme === "dark" ? "dark" : "light",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rtl:md:mt-0 ltr:xl:mt-0 rtl:lg:mr-12 ltr:xl:ml-12  ltr:2xl:ml-48">
      <div>
        <h2 className="text-md sm:text-lg">{t.beWithUs}</h2>
        <div className="flex mt-3">
          {socialMedia.map((SocialItem) => {
            return (
              <Link href={SocialItem.href} key={SocialItem.name}>
                <a
                  className="px-2 opacity-60 hover:opacity-100 transition-opacity duration-300 ease-in-out"
                  aria-label={SocialItem.name}
                >
                  <SocialItem.icon
                    style={{
                      fontSize: "2rem",
                      color: "inherit",
                    }}
                  />
                </a>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-md sm:text-lg">{t.emailRegister}</h2>
        <form
          className="flex items-center flex-wrap sm:flex-nowrap mt-4"
          onSubmit={handleEmailSubmit}
        >
          <input
            className="w-full py-3 px-4 outline-none rounded-lg sm:rounded-none ltr:sm:rounded-tl-lg ltr:sm:rounded-bl-lg rtl:sm:rounded-tr-lg rtl:sm:rounded-br-lg shadow-md sm:shadow-none focus:shadow-sm"
            type="email"
            placeholder={t.yourEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button
            className="outline-none py-3 px-4 w-full sm:w-auto mt-2 sm:mt-0 rounded-lg sm:rounded-none md:w-auto bg-palette-primary text-palette-side rtl:sm:rounded-tl-lg rtl:sm:rounded-bl-lg ltr:sm:rounded-tr-lg ltr:sm:rounded-br-lg disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? t.registering || "Registrando..." : t.register}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SocialPart;
