import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import AppRoutes from './routes/AppRoutes'
import axios from 'axios'

import { PermisosProvider } from "./context/PermisosContext";
import { LoaderProvider } from "./context/LoaderContext";
import SplashScreen from "./components/common/SplashScreen";

// 1. Configura la URL base
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.skipLoader = true;

// Le dice al navegador que permita el intercambio seguro de datos con Render
axios.defaults.withCredentials = true;

// Esto evita que tengas que reiniciar la página cuando el usuario inicia sesión
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Root = () => {
  const [showSplash, setShowSplash] = useState(
    () => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const isReload = navigation?.type === "reload";
      return isReload || sessionStorage.getItem("balam_splash_shown") !== "true";
    }
  );

  const finishSplash = () => {
    sessionStorage.setItem("balam_splash_shown", "true");
    setShowSplash(false);
  };

  return (
    <LoaderProvider disabled={showSplash}>
      {showSplash && <SplashScreen onFinish={finishSplash} />}
      <PermisosProvider>
        <AppRoutes />
      </PermisosProvider>
    </LoaderProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)