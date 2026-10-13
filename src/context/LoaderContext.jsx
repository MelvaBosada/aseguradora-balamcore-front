import {
  createContext, useCallback, useContext,
  useEffect, useLayoutEffect, useRef, useState,
} from "react";
import axios from "axios";
import SplashScreen from "../components/common/SplashScreen";

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

const DELAY = 500; // ms que debe tardar una petición para que salga el loader

export const LoaderProvider = ({ disabled = false, children }) => {
  const [loading, setLoading] = useState(false);   // hay algo cargando
  const [mounted, setMounted] = useState(false);   // el overlay está en pantalla
  const [overlayKey, setOverlayKey] = useState(0);

  const pending = useRef(0);
  const timer = useRef(null);

  const start = useCallback((immediate = false) => {
    pending.current += 1;
    if (immediate) {
      clearTimeout(timer.current);
      setLoading(true);
    } else if (pending.current === 1) {
      timer.current = setTimeout(() => setLoading(true), DELAY);
    }
  }, []);

  const stop = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) {
      clearTimeout(timer.current);
      setLoading(false);
    }
  }, []);

  const showLoader = useCallback(() => start(true), [start]);
  const hideLoader = useCallback(() => stop(), [stop]);

  // Interceptores de axios (useLayoutEffect para registrarlos antes de que
  // los hijos hagan sus primeras peticiones)
  useLayoutEffect(() => {
    const req = axios.interceptors.request.use((config) => {
      if (!config.skipLoader) {
        config.__loader = true;
        start();
      }
      return config;
    });

    const res = axios.interceptors.response.use(
      (response) => {
        if (response.config?.__loader) stop();
        return response;
      },
      (error) => {
        if (error?.config?.__loader) stop();
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(req);
      axios.interceptors.response.eject(res);
    };
  }, [start, stop]);

  // Monta el overlay (de nuevo) cuando empieza a cargar
  useEffect(() => {
    if (loading && !mounted && !disabled) {
      setOverlayKey((k) => k + 1);
      setMounted(true);
    }
  }, [loading, mounted, disabled]);

  // Seguro: si algo se queda colgado, se quita solo a los 30 s
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      pending.current = 0;
      setLoading(false);
    }, 30000);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {mounted && (
        <SplashScreen
          key={overlayKey}
          ready={!loading}
          minTime={500}
          holdTime={300}
          onFinish={() => setMounted(false)}
        />
      )}
    </LoaderContext.Provider>
  );
};