import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../css/SelectBalam.css";

const normalizar = (opts = []) =>
  opts.map((o) =>
    typeof o === "string"
      ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, " ") }
      : { value: String(o.value), label: String(o.label) }
  );

const sinAcentos = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function SelectBalam({
  name,
  value,
  options,
  onChange,
  placeholder = "Selecciona...",
  disabled = false,
  buscable,
  error = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [activo, setActivo] = useState(0);
  const [pos, setPos] = useState(null);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listaRef = useRef(null);
  const buscadorRef = useRef(null);

  const opts = useMemo(() => normalizar(options), [options]);
  const val = String(value ?? "");
  const conBuscador = buscable ?? opts.length > 6;

  // Si existe una opción con value "" (p. ej. "Auto-asignar"), esa es la que se muestra cuando no hay valor
  const seleccionada = opts.find((o) => o.value === val);
  const textoMostrado = seleccionada ? seleccionada.label : placeholder;
  const esPlaceholder = !seleccionada;

  const filtradas = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    return q ? opts.filter((o) => sinAcentos(o.label).includes(q)) : opts;
  }, [opts, busqueda]);

  // ── Posición: fija respecto a la ventana, se abre hacia arriba si abajo no cabe ──
  const calcular = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margen = 8;

    const abajo = vh - r.bottom - margen;
    const arriba = r.top - margen;
    const haciaArriba = abajo < 220 && arriba > abajo;

    const ancho = Math.min(Math.max(r.width, 220), vw - margen * 2);
    const left = Math.max(margen, Math.min(r.left, vw - ancho - margen));
    const maxH = Math.max(140, Math.min(320, (haciaArriba ? arriba : abajo) - 4));

    setPos({
      left,
      width: ancho,
      maxH,
      top: haciaArriba ? undefined : r.bottom + 4,
      bottom: haciaArriba ? vh - r.top + 4 : undefined,
    });
  }, []);

  const abrir = () => {
    if (disabled) return;
    calcular();
    setBusqueda("");
    const i = opts.findIndex((o) => o.value === val);
    setActivo(i >= 0 ? i : 0);
    setAbierto(true);
  };

  const cerrar = useCallback(() => {
    setAbierto(false);
    setBusqueda("");
  }, []);

  const elegir = (op) => {
    onChange?.({ target: { name, value: op.value } });
    cerrar();
    triggerRef.current?.focus();
  };

  // Recalcula al hacer scroll (en cualquier contenedor) o cambiar el tamaño
  useLayoutEffect(() => {
    if (!abierto) return;
    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, true);
    return () => {
      window.removeEventListener("resize", calcular);
      window.removeEventListener("scroll", calcular, true);
    };
  }, [abierto, calcular]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      cerrar();
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, [abierto, cerrar]);

  // Foco en el buscador al abrir
  useEffect(() => {
    if (abierto && conBuscador) buscadorRef.current?.focus({ preventScroll: true });
  }, [abierto, conBuscador]);

  // Al filtrar, vuelve al primer resultado
  useEffect(() => {
    setActivo(0);
  }, [busqueda]);

  // Mantiene visible la opción activa
  useEffect(() => {
    if (!abierto) return;
    listaRef.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activo, abierto, filtradas]);

  const teclado = (e) => {
    if (!abierto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtradas[activo]) elegir(filtradas[activo]);
    } else if (e.key === "Tab") {
      cerrar();
    }
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`sb-trigger${abierto ? " abierto" : ""}${error ? " con-error" : ""}`}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclado}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <span className={`sb-texto${esPlaceholder ? " sb-placeholder" : ""}`}>{textoMostrado}</span>
        <svg className="sb-flecha" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M7 10l5 5 5-5z" fill="currentColor" />
        </svg>
      </button>

      {abierto &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="sb-menu"
            style={{
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxH,
            }}
            onKeyDown={teclado}
          >
            {conBuscador && (
              <div className="sb-buscador">
                <input
                  ref={buscadorRef}
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar..."
                  autoComplete="off"
                />
              </div>
            )}

            <div className="sb-lista" ref={listaRef} role="listbox">
              {filtradas.length === 0 && <div className="sb-vacio">Sin resultados</div>}

              {filtradas.map((op, i) => {
                const sel = op.value === val;
                return (
                  <div
                    key={op.value === "" ? "__vacio" : op.value}
                    role="option"
                    aria-selected={sel}
                    data-activo={i === activo}
                    className={`sb-opcion${sel ? " seleccionada" : ""}${i === activo ? " activa" : ""}`}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => elegir(op)}
                  >
                    <span className="sb-opcion-texto">{op.label}</span>
                    {sel && (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}