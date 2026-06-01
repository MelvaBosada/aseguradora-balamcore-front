import { useState, useEffect, useCallback } from "react";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Componentes del proyecto
import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import IndemnizacionDocumento from "../../components/IndemnizacionDocumento";
import usePDFExport from "../../components/usePDFExport";

// Estilos
import "../../css/PolizasVencer.css";
import "../../css/IndemnizacionPDF.css";

const API_URL = "http://localhost:8000/api/indemnizaciones";
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

const Indemnizaciones = () => {
  const [dataIndemnizaciones, setDataIndemnizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estatus, setEstatus] = useState("Todos");

  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [modalData, setModalData] = useState(null);

  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Indemnizacion_${modalData.nSiniestro}` : "Indemnizacion"
  );

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ✅ useCallback para evitar el warning de useEffect
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();

        const mapeados = data.map((i) => ({
          ...i,
          nSiniestro: i.numero_siniestro || `SIN-${String(i.id_siniestro).padStart(6, "0")}`,
          montoAprobado: `$${parseFloat(i.monto_aprobado).toLocaleString()}`,
          formaPago: i.forma_pago.toUpperCase(),
          titularCuenta: i.titular_cuenta || "N/A",
          nEvaluacion: `EVA-${String(i.id_evaluaciones).padStart(6, "0")}`,
          fechaPago: i.fecha_pago ? i.fecha_pago.split(" ")[0] : "Pendiente",
          numeroCuenta: i.cuenta_bancaria || "N/A",
          estatus: i.estatus,

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
          montoReclamado: `$${parseFloat(i.monto_reclamado || 0).toLocaleString()} MXN`,
          montoAprobadoPDF: `$${parseFloat(i.monto_aprobado).toLocaleString()} MXN`,
          deducible: `$${parseFloat(i.deducible_aplicado || 0).toLocaleString()} MXN`,
          montoTotal: `$${parseFloat(i.monto_aprobado).toLocaleString()} MXN`,
          estatusPDF: i.estatus.toUpperCase(),
        }));

        setDataIndemnizaciones(mapeados);
      }
    } catch (error) {
      console.error("Error cargando:", error);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ arreglo vacío porque API_URL es constante externa

  // ✅ fetchData ya no genera warning
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

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Indemnizaciones</h1>
      <hr className="mt-2 mb-3" />

      {/* TOOLBAR */}
      <div className="pv-toolbar">
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
            {
              titulo: "Descargar PDF",
              clase: "tabla-btn-edit",
              icono: <DownloadIcon fontSize="small" />,
              onClick: (fila) => {
                setModalData(fila);
                setTimeout(handleDescargar, 300);
              },
            },
          ]}
        />
        {loading && <p className="text-center mt-3">Cargando...</p>}
      </div>

      {/* PAGINACIÓN CON SELECTOR DE ITEMS POR PÁGINA */}
      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* MODAL PDF */}
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
