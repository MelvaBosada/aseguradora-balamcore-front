import { useState } from "react";
import axios from "axios";

import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const OPCIONES_HOJA = [
  { valor: 2, texto: "2 por hoja", detalle: "Grandes" },
  { valor: 4, texto: "4 por hoja", detalle: "Recomendado" },
  { valor: 6, texto: "6 por hoja", detalle: "Compacto" }
];

// Cuando la respuesta es un blob, el mensaje de error también llega como blob.
const mensajeErrorBlob = async (error, defecto) => {
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      if (json.errors) return Object.values(json.errors).flat().join("\n");
      return json.message || defecto;
    } catch {
      return defecto;
    }
  }
  return data?.message || defecto;
};

/**
 * Props:
 *  - Miniatura: componente de miniatura que ya existe en Evidencias.jsx
 *  - getAuthHeaders: función de headers con token (la misma de Evidencias.jsx)
 *  - onAviso(tipo, titulo, mensaje): usa tu mostrarAviso
 */
const ReporteEvidencias = ({ Miniatura, getAuthHeaders, onAviso }) => {
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null); // { siniestro, evidencias, otros_archivos }
  const [coincidencias, setCoincidencias] = useState([]);
  const [seleccion, setSeleccion] = useState(new Set());
  const [formato, setFormato] = useState("pdf");
  const [porHoja, setPorHoja] = useState(4);
  const [generando, setGenerando] = useState(false);

  const buscar = async (valor = numero) => {
    if (!valor.trim()) return;
    setBuscando(true);
    setCoincidencias([]);

    try {
      const res = await axios.get(`${API_URL}/evidencias/reporte/buscar`, {
        params: { numero: valor.trim() },
        ...getAuthHeaders()
      });

      if (res.data.coincidencias) {
        setResultado(null);
        setCoincidencias(res.data.coincidencias);
        return;
      }

      setResultado(res.data);
      setSeleccion(new Set(res.data.evidencias.map((e) => e.id)));
    } catch (error) {
      setResultado(null);
      const msg = error.response?.data?.message || "No se pudo realizar la búsqueda.";
      onAviso("error", "Sin resultados", msg);
    } finally {
      setBuscando(false);
    }
  };

  const alternar = (id) =>
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });

  const seleccionarTodas = () => setSeleccion(new Set(resultado.evidencias.map((e) => e.id)));
  const seleccionarValidadas = () =>
    setSeleccion(new Set(resultado.evidencias.filter((e) => e.estatus_validacion === "validada").map((e) => e.id)));
  const limpiar = () => setSeleccion(new Set());

  const generar = async () => {
    if (!resultado || seleccion.size === 0) return;
    setGenerando(true);

    try {
      const res = await axios.post(
        `${API_URL}/evidencias/reporte/generar`,
        {
          id_siniestro: resultado.siniestro.id,
          formato,
          fotos_por_hoja: porHoja,
          ids: Array.from(seleccion)
        },
        { ...getAuthHeaders(), responseType: "blob" }
      );

      const ext = formato === "pdf" ? "pdf" : "docx";
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_fotografico_${resultado.siniestro.numero_siniestro}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onAviso("exito", "Reporte generado", `Se descargó el reporte con ${seleccion.size} foto(s).`);
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      onAviso("error", "No se pudo generar el reporte", await mensajeErrorBlob(error, "Ocurrió un error al generar el documento."));
    } finally {
      setGenerando(false);
    }
  };

  const paginas = Math.ceil(seleccion.size / porHoja);

  return (
    <div>
      <p className="text-muted mb-3">
        Escribe el número de siniestro, elige las fotos y descarga el reporte fotográfico en PDF o Word.
      </p>

      {/* Búsqueda */}
      <div className="d-flex align-items-end gap-2 flex-wrap mb-3">
        <div>
          <div className="fw-bold mb-2">N° de siniestro</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Ej. 1519530"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
          </div>
        </div>
        <button className="btn btn-success" onClick={() => buscar()} disabled={buscando || !numero.trim()}>
          {buscando ? "Buscando…" : "Buscar fotos"}
        </button>
      </div>

      {/* Varias coincidencias */}
      {coincidencias.length > 0 && (
        <div className="mb-3">
          <div className="fw-bold mb-2">Hay varios siniestros parecidos, elige uno:</div>
          <div className="d-flex gap-2 flex-wrap">
            {coincidencias.map((c) => (
              <button
                key={c.id}
                className="btn btn-outline-success btn-sm"
                onClick={() => { setNumero(c.numero_siniestro); buscar(c.numero_siniestro); }}
              >
                {c.numero_siniestro}{c.cliente ? ` · ${c.cliente}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div>
              <strong>Siniestro {resultado.siniestro.numero_siniestro}</strong>
              {resultado.siniestro.cliente ? ` · ${resultado.siniestro.cliente}` : ""}
              <div className="text-muted" style={{ fontSize: 13 }}>
                {resultado.evidencias.length} foto(s) disponibles · {seleccion.size} seleccionada(s)
                {resultado.otros_archivos > 0 && ` · ${resultado.otros_archivos} archivo(s) que no son foto o están rechazados (no entran al reporte)`}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={seleccionarTodas}>Todas</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={seleccionarValidadas}>Solo validadas</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={limpiar}>Ninguna</button>
            </div>
          </div>

          {resultado.evidencias.length === 0 ? (
            <div className="alert alert-warning">Este siniestro no tiene fotos disponibles.</div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: 12,
                  maxHeight: 360,
                  overflowY: "auto",
                  padding: 4,
                  marginBottom: 20
                }}
              >
                {resultado.evidencias.map((e, i) => {
                  const marcada = seleccion.has(e.id);
                  return (
                    <label
                      key={e.id}
                      style={{
                        cursor: "pointer",
                        textAlign: "center",
                        opacity: marcada ? 1 : 0.45,
                        position: "relative"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => alternar(e.id)}
                        style={{ position: "absolute", top: 4, left: 8, zIndex: 1 }}
                      />
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <Miniatura evidencia={e} size={96} />
                      </div>
                      <div style={{ fontSize: 11, color: "#777" }}>
                        Foto {i + 1} · {e.estatus_validacion}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Opciones del documento */}
              <div className="d-flex gap-4 flex-wrap align-items-start mb-3">
                <div>
                  <div className="fw-bold mb-2">Formato</div>
                  <div className="btn-group">
                    <button
                      className={`btn ${formato === "pdf" ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => setFormato("pdf")}
                    >
                      <PictureAsPdfIcon fontSize="small" /> PDF
                    </button>
                    <button
                      className={`btn ${formato === "docx" ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => setFormato("docx")}
                    >
                      <DescriptionIcon fontSize="small" /> Word
                    </button>
                  </div>
                </div>

                <div>
                  <div className="fw-bold mb-2">Fotos por hoja</div>
                  <div className="btn-group">
                    {OPCIONES_HOJA.map((o) => (
                      <button
                        key={o.valor}
                        className={`btn ${porHoja === o.valor ? "btn-success" : "btn-outline-success"}`}
                        onClick={() => setPorHoja(o.valor)}
                        title={o.detalle}
                      >
                        {o.texto}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-success"
                onClick={generar}
                disabled={generando || seleccion.size === 0}
              >
                <DownloadIcon fontSize="small" />{" "}
                {generando
                  ? "Generando documento…"
                  : `Descargar ${formato === "pdf" ? "PDF" : "Word"} (${seleccion.size} foto${seleccion.size === 1 ? "" : "s"} · ${paginas} hoja${paginas === 1 ? "" : "s"})`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReporteEvidencias;
