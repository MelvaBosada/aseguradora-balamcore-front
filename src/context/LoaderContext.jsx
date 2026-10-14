import {
  createContext, useCallback, useContext, useEffect,
  useLayoutEffect, useMemo, useRef, useState,
} from "react";
import axios from "axios";
import SplashScreen from "../components/common/SplashScreen";
import LetrasLoader from "../components/common/LetrasLoader";

const LoaderContext = createContext({
  showLoader: () => {},
  hideLoader: () => {},
  beginAccion: () => {},
  endAccion: () => {},
});
export const useLoader = () => useContext(LoaderContext);

const DELAY = 500; // ms que debe tardar una petición para que salga el jaguar
const JAGUAR_URLS = [
  "/login",
  "/enviar-otp",
  "/verificar-otp",
  "/registro",
  "/suscripcion/checkout",
  "/suscripcion/verificar-pago",
  "/suscripcion/actual",
];

export const LoaderProvider = ({ disabled = false, children }) => {
  /* ────────────── JAGUAR (automático con axios) ────────────── */
  const [loading, setLoading] = useState(false);   // hay peticiones en curso
  const [mounted, setMounted] = useState(false);   // el jaguar está en pantalla
  const [overlayKey, setOverlayKey] = useState(0);

  const pending = useRef(0);
  const timer = useRef(null);
  const loadingRef = useRef(false);

  const start = useCallback(() => {
    pending.current += 1;
    if (pending.current === 1) {
      timer.current = setTimeout(() => {
        loadingRef.current = true;
        setLoading(true);
      }, DELAY);
    }
  }, []);

  const stop = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) {
      clearTimeout(timer.current);
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Interceptores de axios (useLayoutEffect para registrarlos antes de que
  // los hijos hagan sus primeras peticiones)
  useLayoutEffect(() => {
    const req = axios.interceptors.request.use((config) => {
      const url = config.url || "";
      const isJaguarRequest =
        config.skipLoader === false ||
        JAGUAR_URLS.some((path) => url.includes(path));

      if (isJaguarRequest) {
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

  // Monta el jaguar (de nuevo) cuando empieza a cargar
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
      loadingRef.current = false;
      setLoading(false);
    }, 30000);
    return () => clearTimeout(t);
  }, [loading]);

  /* ────────────── LETRAS (manual: acciones normales) ────────────── */
  const [letras, setLetras] = useState(0);

  const showLoader = useCallback(() => {
    if (!loadingRef.current) setLetras((c) => c + 1);
  }, []);
  const hideLoader = useCallback(() => setLetras((c) => Math.max(0, c - 1)), []);

  // Seguro: si algo se queda colgado, se quita solo a los 30 s
  useEffect(() => {
    if (letras === 0) return;
    const t = setTimeout(() => setLetras(0), 30000);
    return () => clearTimeout(t);
  }, [letras]);

  /* ────────────── Aviso de botones (compatibilidad del contexto) ────────────── */
  const beginAccion = useCallback(() => {}, []);
  const endAccion = useCallback(() => {}, []);

  const value = useMemo(
    () => ({ showLoader, hideLoader, beginAccion, endAccion }),
    [showLoader, hideLoader, beginAccion, endAccion]
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}

      {/* Jaguar */}
      {mounted && (
        <SplashScreen
          key={overlayKey}
          ready={!loading}
          minTime={500}
          holdTime={300}
          onFinish={() => setMounted(false)}
        />
      )}

      {/* Letras */}
      <LetrasLoader visible={letras > 0} />
    </LoaderContext.Provider>
  );
};