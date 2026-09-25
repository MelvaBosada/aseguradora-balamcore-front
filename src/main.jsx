import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import AppRoutes from './routes/AppRoutes'
import axios from 'axios'

import { PermisosProvider } from "./context/PermisosContext";

// 1. Configura la URL base
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PermisosProvider>
      <AppRoutes />
    </PermisosProvider>
  </StrictMode>
)