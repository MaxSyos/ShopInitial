import { useRouter } from "next/router";
import en from "../locales/en";
import fa from "../locales/fa";
import br from "../locales/br";

export const useLanguage = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? en : locale === "br" ? br : fa;
  return { t, locale };
};
