import { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "../css/BalamCoreModal.css";
import "../css/DescargarModal.css";
import logo from "../assets/Logo.png";
import useAccionAsync from "../hooks/useAccionAsync";

const FORMATOS = [
  { id: "pdf",  label: "PDF",   ext: "pdf",  desc: "Documento listo para imprimir o compartir." },
  { id: "xlsx", label: "Excel", ext: "xlsx", desc: "Hoja de Excel con todas las columnas del catálogo." },
  { id: "csv",  label: "CSV",   ext: "csv",  desc: "Archivo plano, útil para importar a otros sistemas." },
];

const VERDE = "#0F4C3A";

/* ───────── helpers ───────── */
const corto = (v, n = 28) => {
  const s = v === null || v === undefined ? "" : String(v);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

const letraColumna = (i) => {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

const csvEscape = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ───────── vistas previas ───────── */
const cellBase = { padding: "5px 10px", whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb" };

function PreviewExcel({ data }) {
  return (
    <div className="balam-dl-preview" style={{ background: "#fff", border: "1px solid #c9d3ce" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "max-content", minWidth: "100%" }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
          <tr>
            <th style={{ ...cellBase, background: "#eef1f0", width: 34 }} />
            {data.columnas.map((_, i) => (
              <th key={i} style={{ ...cellBase, background: "#eef1f0", color: "#8a948f", fontWeight: 500, textAlign: "center", borderLeft: "1px solid #e5e7eb" }}>
                {letraColumna(i)}
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ ...cellBase, background: "#eef1f0", color: "#8a948f", fontWeight: 500, textAlign: "center" }}>1</th>
            {data.columnas.map((c, i) => (
              <th key={i} style={{ ...cellBase, background: "#e3efe8", color: "#0b3a2b", fontWeight: 700, textAlign: "left", borderLeft: "1px solid #e5e7eb" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.filas.map((fila, r) => (
            <tr key={r}>
              <td style={{ ...cellBase, background: "#eef1f0", color: "#8a948f", textAlign: "center" }}>{r + 2}</td>
              {fila.map((v, i) => (
                <td key={i} style={{ ...cellBase, borderLeft: "1px solid #f0f0f0" }}>{corto(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewCsv({ data }) {
  const lineas = [data.columnas, ...data.filas].map((fila) =>
    fila.map((v) => csvEscape(corto(v, 40))).join(",")
  );

  return (
    <pre
      className="balam-dl-preview"
      style={{
        margin: 0,
        padding: 14,
        background: "#14201b",
        color: "#c8f0d8",
        fontSize: 12,
        lineHeight: 1.7,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      {lineas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "pre", color: i === 0 ? "#ffd36b" : undefined }}>{l}</div>
      ))}
    </pre>
  );
}

function PreviewPdf({ data, titulo, total }) {
  return (
    <div className="balam-dl-preview" style={{ background: "#e9eeec", padding: 18 }}>
      <div style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.18)", padding: 18, minWidth: "max-content" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: VERDE }}>{titulo}</div>
        <div style={{ fontSize: 10, color: "#777", marginBottom: 10 }}>
          Generado el {new Date().toLocaleString("es-MX")} · {total} registro(s)
        </div>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10 }}>
          <thead>
            <tr>
              {data.columnas.map((c, i) => (
                <th key={i} style={{ background: VERDE, color: "#fff", textAlign: "left", padding: "5px 8px", whiteSpace: "nowrap" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.filas.map((fila, r) => (
              <tr key={r} style={{ background: r % 2 ? "#f4f8f6" : "#fff" }}>
                {fila.map((v, i) => (
                  <td key={i} style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", whiteSpace: "nowrap" }}>{corto(v, 24)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────── modal ───────── */
export default function DescargarModal({
  open,
  onClose,
  url,                       // endpoint de exportación (…/exportar/clientes)
  params = {},               // filtros activos (search, estatus, etc.)
  nombreArchivo = "listado",
  titulo = "Descargar listado",
  nota = "",                 // texto que explica qué se va a exportar
}) {
  const [tab, setTab] = useState("xlsx");
  const [error, setError] = useState("");
  const [vista, setVista] = useState(null);
  const [cargandoVista, setCargandoVista] = useState(false);
  const [errorVista, setErrorVista] = useState("");

  const actual = FORMATOS.find((f) => f.id === tab);
  const paramsKey = JSON.stringify(params);

  // Vista previa: se pide cada vez que se abre el modal
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setCargandoVista(true);
    setErrorVista("");
    setVista(null);

    axios
      .get(`${url}/vista`, {
        params,
        signal: controller.signal,
        headers: { Accept: "application/json" },
        skipLoader: true,
      })
      .then((res) => setVista(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setErrorVista(err.response?.data?.message || "No se pudo cargar la vista previa.");
      })
      .finally(() => setCargandoVista(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url, paramsKey]);

  const descargar = async () => {
    setError("");
    try {
      const res = await axios.get(url, {
        params: { ...params, formato: actual.ext },
        responseType: "blob",
        headers: { Accept: "application/json" },
      });

      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.${actual.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      let msg = "No se pudo descargar el archivo. Intenta de nuevo.";
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          msg = JSON.parse(await data.text()).message || msg;
        } catch { /* se queda el mensaje por defecto */ }
      }
      setError(msg);
    }
  };

  const [handleDescargar, descargando] = useAccionAsync(descargar);

  if (!open) return null;

  const pdfExcedido = tab === "pdf" && vista && vista.total > vista.limite_pdf;
  const sinRegistros = vista && vista.total === 0;

  const handleClose = () => {
    setError("");
    onClose();
  };

  const renderVista = () => {
    if (cargandoVista) {
      return (
        <div className="balam-dl-estado">
          <CircularProgress size={20} thickness={5} sx={{ color: VERDE }} />
          Cargando vista previa...
        </div>
      );
    }
    if (errorVista) {
      return <div className="balam-dl-estado" style={{ color: "#C0392B" }}>{errorVista}</div>;
    }
    if (!vista) return null;
    if (vista.total === 0) {
      return <div className="balam-dl-estado">No hay registros para exportar con los filtros actuales.</div>;
    }

    if (tab === "xlsx") return <PreviewExcel data={vista.completo} />;
    if (tab === "csv")  return <PreviewCsv data={vista.completo} />;
    return <PreviewPdf data={vista.pdf} titulo={titulo.replace(/^Descargar /i, "")} total={vista.total} />;
  };

  return (
    <div className="balam-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="balam-modal balam-modal-download">

        {/* HEADER */}
        <div className="balam-header">
          <img src={logo} alt="BalamCore" className="balam-logo" />
          <div style={{ flex: 1 }}>
            <h2>{titulo}</h2>
            <p>Elige el formato y revisa la vista previa antes de descargar.</p>
          </div>
          <button type="button" className="balam-close" onClick={handleClose} aria-label="Cerrar">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* TABS */}
        <div className="balam-tabs">
          {FORMATOS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`balam-tab ${tab === f.id ? "active" : ""}`}
              onClick={() => { setTab(f.id); setError(""); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="balam-body-download">
          <div className="balam-section">
            <div>
              <p className="balam-dl-desc">{actual.desc}</p>
              {nota && <p className="balam-dl-nota">{nota}</p>}
            </div>

            <div className="balam-section-title">Vista previa</div>
            {renderVista()}

            {vista && vista.total > 0 && (
              <p className="balam-dl-nota" style={{ margin: 0 }}>
                Mostrando {Math.min(vista.completo.filas.length, vista.total)} de{" "}
                <strong>{vista.total.toLocaleString("es-MX")}</strong> registro(s).
                {tab !== "pdf" && ` El archivo incluye las ${vista.completo.columnas.length} columnas.`}
              </p>
            )}

            {pdfExcedido && (
              <div className="balam-dl-alerta">
                El PDF admite hasta {vista.limite_pdf.toLocaleString("es-MX")} registros y tu listado tiene{" "}
                {vista.total.toLocaleString("es-MX")}. Usa Excel o CSV, o filtra el listado.
              </div>
            )}

            {error && <div className="balam-dl-alerta">{error}</div>}
          </div>
        </div>

        {/* FOOTER */}
        <div className="balam-footer">
          <button className="balam-btn cancel" onClick={handleClose}>Cancelar</button>
          <button
            className="balam-btn save"
            onClick={handleDescargar}
            disabled={cargandoVista || pdfExcedido || sinRegistros || descargando}
            style={{ opacity: cargandoVista || pdfExcedido || sinRegistros || descargando ? 0.55 : 1 }}
          >
            {descargando ? "Descargando..." : `Descargar ${actual.label}`}
          </button>
        </div>

      </div>
    </div>
  );
}
