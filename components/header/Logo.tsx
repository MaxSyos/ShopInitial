import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useTheme } from "next-themes";

const Logo = () => {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc = currentTheme === "dark" ? "/images/Nova clean.png" : "/images/Nova.png";

  return (
    <Link href="/">
      <a className="block md:flex items-center justify-center w-full flex-grow md:flex-grow-0">
        <Image
          src={logoSrc}
          alt="zishop-logo"
          width={120}
          height={100}
          objectFit="contain"
          className="cursor-pointer md:ltr:-mr-3"
        />
      </a>
    </Link>
  );
};

export default Logo;
