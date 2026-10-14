import { useCallback, useEffect, useRef, useState } from "react";
import { useLoader } from "../context/LoaderContext";

// Cuánto tiene que tardar (ms) para que salga el loader de letras
const OVERLAY_DELAY = 2000;

export default function useAccionAsync(handler) {
  const { showLoader, hideLoader, beginAccion, endAccion } = useLoader();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(
    async (...args) => {
      if (busyRef.current) return; // evita doble clic

      // Conserva el estado de acción sin bloquear el loader de Axios.
      beginAccion();

      let result;
      try {
        result = handlerRef.current?.(...args);
      } catch (err) {
        endAccion();
        throw err;
      }

      // Si el handler no es async, no hay nada que esperar
      if (!result || typeof result.then !== "function") {
        endAccion();
        return result;
      }

      busyRef.current = true;
      setBusy(true);

      let overlay = false;
      const timer = setTimeout(() => {
        overlay = true;
        showLoader();
      }, OVERLAY_DELAY);

      try {
        return await result;
      } finally {
        clearTimeout(timer);
        if (overlay) hideLoader();
        endAccion();
        busyRef.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [showLoader, hideLoader, beginAccion, endAccion]
  );

  return [run, busy];
}