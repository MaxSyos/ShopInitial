import type { AppProps } from "next/app";
import { Provider } from 'react-redux';
import Layout from "../components/layout/Layout";
import store from '../store';
import AuthProvider from '../providers/AuthProvider';
import { ToastContainer } from 'react-toastify';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
          <ToastContainer />
        </Layout>
      </AuthProvider>
    </Provider>
  );
}

export default MyApp;
