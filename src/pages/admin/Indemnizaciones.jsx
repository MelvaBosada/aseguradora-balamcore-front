import { useState, useEffect, useCallback } from "react";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Componentes del proyecto
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import IndemnizacionDocumento from "../../components/IndemnizacionDocumento";
import usePDFExport from "../../components/usePDFExport";
import DescargarModal from "../../components/DescargarModal";

// Estilos
import "../../css/PolizasVencer.css";
import "../../css/IndemnizacionPDF.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${API_BASE}/indemnizaciones`;
const ESTATUS_OPTIONS = ["Todos", "pendiente", "autorizada", "pagada", "rechazada"];

/* ─── CONFIGURACIÓN DE TABLA ───────────────── */
const campos = [
  "nSiniestro",
  "montoAprobado",
  "formaPago",
  "titularCuenta",
  "nEvaluacion",
  "fechaPago",
  "numeroCuenta",
  "estatus",
];

const columnas = [
  "N° Siniestro",
  "Monto aprobado",
  "Forma de pago",
  "Titular de la cuenta",
  "N° Evaluación",
  "Fecha de pago",
  "Número de cuenta",
  "Estatus",
  "Acciones",
];

// Formatea dinero sin romperse si el valor viene vacío
const dinero = (v) => `$${parseFloat(v || 0).toLocaleString()}`;

const Indemnizaciones = () => {
  const [dataIndemnizaciones, setDataIndemnizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estatus, setEstatus] = useState("Todos");
  const [showDescarga, setShowDescarga] = useState(false);

  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [modalData, setModalData] = useState(null);

  // handleDescargar (del hook) genera el PDF de UNA indemnización.
  // No tiene nada que ver con el modal de descarga del listado (showDescarga).
  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Indemnizacion_${modalData.nSiniestro}` : "Indemnizacion"
  );

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, { headers: getHeaders() });

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const json = await response.json();
        // Acepta tanto un arreglo directo como una respuesta paginada { data: [...] }
        const lista = Array.isArray(json) ? json : json.data || [];

        const mapeados = lista.map((i) => ({
          ...i,
          nSiniestro: i.numero_siniestro || `SIN-${String(i.id_siniestro).padStart(6, "0")}`,
          montoAprobado: dinero(i.monto_aprobado),
          formaPago: (i.forma_pago || "").toUpperCase(),
          titularCuenta: i.titular_cuenta || "N/A",
          nEvaluacion: i.id_evaluaciones
            ? `EVA-${String(i.id_evaluaciones).padStart(6, "0")}`
            : "N/A",
          fechaPago: i.fecha_pago ? i.fecha_pago.split(" ")[0] : "Pendiente",
          numeroCuenta: i.cuenta_bancaria || "N/A",
          estatus: i.estatus || "",

          // Mapeo para PDF desde Joins
          aseguradora: "Balamcore Seguros S.A. de C.V.",
          nPoliza: i.poliza_numero ? `POL-${i.poliza_numero}` : "POL-S/N",
          fechaEmision: new Date().toLocaleDateString(),
          nombreAsegurado: i.asegurado_nombre || i.titular_cuenta,
          rfc: "CONSULTAR EXPEDIENTE",
          domicilio: i.lugar || "Mérida, Yucatán",
          telefono: i.asegurado_tel || "N/A",
          tipoSiniestro: (i.tipo_siniestro || "Daños Generales").toUpperCase(),
          fechaOcurrencia: i.fecha_autorizacion || "N/A",
          descripcion: i.observaciones || "Sin descripción adicional.",
          nEvaluacionPDF: `EVA-${i.id_evaluaciones}`,
          ajustador: i.ajustador_nom ? `${i.ajustador_nom} ${i.ajustador_ape}` : "Personal Asignado",
          fechaEvaluacion: i.fecha_dictamen || "N/A",
          resultadoEval: i.resultado_eval || "Procedente conforme a términos de póliza.",
          prioridad: (i.prioridad || "Normal").toUpperCase(),
          banco: i.banco || "N/A",
          titularBanco: i.titular_cuenta,
          cuentaBancaria: i.cuenta_bancaria,
          fechaAutorizacion: i.fecha_autorizacion,
          fechaPagoPDF: i.fecha_pago,
          referencia: i.id ? `REF-${i.id}` : "N/A",
          montoReclamado: `${dinero(i.monto_reclamado)} MXN`,
          montoAprobadoPDF: `${dinero(i.monto_aprobado)} MXN`,
          deducible: `${dinero(i.deducible_aplicado)} MXN`,
          montoTotal: `${dinero(i.monto_aprobado)} MXN`,
          estatusPDF: (i.estatus || "").toUpperCase(),
        }));

        setDataIndemnizaciones(mapeados);
      }
    } catch (error) {
      console.error("Error cargando indemnizaciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── LÓGICA DE FILTRADO Y PAGINACIÓN ─── */
  const filtered = dataIndemnizaciones.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.nSiniestro.toLowerCase().includes(q) ||
      p.titularCuenta.toLowerCase().includes(q) ||
      p.nEvaluacion.toLowerCase().includes(q);
    const matchEstatus = estatus === "Todos" || p.estatus === estatus;
    return matchSearch && matchEstatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pantalla de carga
  if (loading && dataIndemnizaciones.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando indemnizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Indemnizaciones</h1>
      <hr className="mt-2 mb-3" />

      {/* TOOLBAR */}
    <div className="pv-toolbar d-flex align-items-end justify-content-between gap-3 flex-wrap">
        <div className="pv-field">
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input
              type="text"
              className="pv-search"
              placeholder="Buscar por siniestro o titular..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="pv-field">
          <div className="fw-bold mb-2">Estatus</div>
          <select
            className="form-select"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            {ESTATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
  <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
        </div>
      
      </div>

      {/* TABLA */}
      <div className="position-relative">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Ver PDF",
              clase: "tabla-btn-ver",
              icono: <PictureAsPdfIcon fontSize="small" />,
              onClick: setModalData,
            },
            
          ]}
        />
      </div>

      {/* PAGINACIÓN */}
      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* MODAL PDF DE UNA INDEMNIZACIÓN */}
      {modalData && (
        <div className="ipdf-modal-overlay" onClick={() => setModalData(null)}>
          <div className="ipdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ipdf-toolbar">
              <button className="ipdf-back" onClick={() => setModalData(null)}>
                <CloseIcon fontSize="small" /> Cerrar
              </button>
              <button className="ipdf-download" onClick={handleDescargar}>
                <DownloadIcon fontSize="small" /> Descargar PDF
              </button>
            </div>
            <div className="ipdf-wrapper">
              <IndemnizacionDocumento data={modalData} printRef={printRef} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESCARGA DEL LISTADO (PDF / Excel / CSV) */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_BASE}/exportar/indemnizaciones`}
        params={{ search, estatus }}
        nombreArchivo="indemnizaciones"
        titulo="Descargar listado de indemnizaciones"
        nota={
          search || estatus !== "Todos"
            ? `Se exportarán las indemnizaciones con los filtros actuales${search ? ` (búsqueda: "${search}")` : ""}${estatus !== "Todos" ? ` (estatus: ${estatus})` : ""}.`
            : "Se exportarán todas las indemnizaciones."
        }
      />

      <Snackbar
        open={snack}
        autoHideDuration={2500}
        onClose={() => setSnack(false)}
      >
        <Alert severity="success" variant="filled">
          Documento exportado correctamente
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Indemnizaciones;
