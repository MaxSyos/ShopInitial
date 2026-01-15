import React from "react";
import Head from "next/head";
import { ThemeProvider } from "next-themes";
import Header from "../header";
import Footer from "../footer";
import { ToastContainer } from "react-toastify";
import { useLanguage } from "../../hooks/useLanguage";
import NextNProgress from "nextjs-progressbar";
import FloatingWhatsAppIcon from "../UI/FloatingWhatsAppIcon";

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { locale } = useLanguage();

  const toastConfig = {
    autoClose: 2000,
    hideProgressBar: true,
    position: "top-left",
    limit: 1
  };

  return (
    <ThemeProvider enableSystem={true} attribute="class">
      <Head>
        <title>Nova</title>
      </Head>
      <div className="flex flex-col min-h-[100vh]">
        <NextNProgress height={7} />
        <Header />
        <main className="flex-grow md:mt-40">{children}</main>
        <Footer />
      </div>
      <ToastContainer {...toastConfig} />
      <FloatingWhatsAppIcon />
    </ThemeProvider>
  );
};

export default Layout;
