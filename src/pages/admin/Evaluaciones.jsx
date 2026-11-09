// pages/admin/Evaluaciones.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Clientes.css";
import "../../css/SiniestroDetalle.css";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import EvaluacionDocumento from "../../components/EvaluacionDocumento";
import usePDFExport from "../../components/usePDFExport";
import "../../css/PolizasVencer.css";
import DescargarModal from "../../components/DescargarModal";
import { tienePermiso } from "../../utils/permisos";
import { dinero } from "../../services/siniestroApi";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Estilos del icono de advertencia (por si el CSS no define .advertencia)
const ESTILO_ICONO_ADVERTENCIA = { background: "#FFF4D6", color: "#9A6B00" };

/* ─── CONFIG TABLA ───────────────────────────── */
const campos = ["nSiniestro", "dictamen", "montoRecomendado", "ajustador", "valorResidual", "fechaInspeccion", "prioridad", "estatus"];
const columnas = ["N° Siniestro", "Dictamen", "Monto recomendado", "Ajustador", "Valor residual", "Fecha de inspección", "Prioridad", "Estatus", "Acciones"];

const camposPendientes = ["nSiniestro", "tipo", "ajustador", "recomendacion", "monto", "nivel", "enviado"];
const columnasPendientes = ["N° Siniestro", "Tipo", "Ajustador", "Recomendación", "Monto", "Nivel", "Enviado", "Acciones"];

const NIVELES = { supervisor: "Supervisor", gerente: "Gerencia" };

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
  },
});

// Mensaje legible a partir de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const errores = error.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join("\n");
  return error.response?.data?.message || defecto || error.message;
};

/* ─── VISTA PRINCIPAL ─────────────────── */
const Evaluaciones = () => {
  const navigate = useNavigate();
  const puedeAutorizar = tienePermiso("evaluaciones.autorizar") || tienePermiso("evaluaciones.autorizar_alto");

  const [vista, setVista] = useState("todas"); // todas | pendientes
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [modalData, setModalData] = useState(null);
  const [showDescarga, setShowDescarga] = useState(false);

  // Aviso con el diseño del sistema
  // { tipo: 'exito' | 'error' | 'advertencia', titulo, mensaje }
  const [aviso, setAviso] = useState(null);

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Evaluacion_${modalData.nEvaluacion || modalData.id}` : "Evaluacion"
  );

  // El hook avisa con "snack": se convierte en el aviso del sistema
  useEffect(() => {
    if (!snack) return;
    setSnack(false);
    mostrarAviso("exito", "PDF descargado", "El PDF se descargó correctamente.");
  }, [snack, setSnack, mostrarAviso]);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const cargarEvaluaciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/evaluaciones`, {
        params: { page: currentPage, search: searchTerm, estatus: estatusFilter, per_page: itemsPerPage },
        ...authHeaders(),
      });
      setEvaluaciones(response.data.data || response.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error("Error:", error);
      mostrarAviso("error", "No se pudieron cargar las evaluaciones", mensajeError(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage, mostrarAviso]);

  const cargarPendientes = useCallback(async () => {
    if (!puedeAutorizar) return;
    try {
      const response = await axios.get(`${API_URL}/evaluaciones/pendientes-autorizacion`, authHeaders());
      setPendientes(response.data || []);
    } catch (error) {
      console.error("Error:", error);
      mostrarAviso("error", "No se pudieron cargar las evaluaciones por autorizar", mensajeError(error));
    }
  }, [puedeAutorizar, mostrarAviso]);

  const cargarDetalleEvaluacion = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/evaluaciones/${id}`, authHeaders());
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      mostrarAviso("error", "No se pudo abrir la evaluación", mensajeError(error, "No se pudo cargar el detalle de la evaluación."));
      return null;
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, [cargarEvaluaciones]);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleVerPDF = async (fila) => {
    const detalle = await cargarDetalleEvaluacion(fila.id);
    if (detalle) setModalData(detalle);
  };

  const irAlExpediente = (idSiniestro, tab) => navigate(`/admin/siniestros/${idSiniestro}?tab=${tab}`);

  if (loading && evaluaciones.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  const filasPendientes = pendientes.map((p) => ({
    ...p,
    nSiniestro: p.numero_siniestro,
    recomendacion: p.recomendacion,
    monto: dinero(p.monto_recomendado),
    nivel: NIVELES[p.nivel_autorizacion] || p.nivel_autorizacion,
    enviado: p.fecha_envio,
  }));

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Evaluaciones</h1>
      <hr className="mt-2 mb-3" />
      <p className="text-muted" style={{ fontSize: 14 }}>
        Los dictámenes se capturan y se autorizan desde el expediente de cada siniestro. El monto lo calcula el sistema.
      </p>

      {puedeAutorizar && (
        <div className="d-flex gap-2 mb-3">
          <button className={`sd-btn ${vista === "todas" ? "primario" : ""}`} onClick={() => setVista("todas")}>
            Todas
          </button>
          <button className={`sd-btn ${vista === "pendientes" ? "primario" : ""}`} onClick={() => setVista("pendientes")}>
            Por autorizar ({pendientes.length})
          </button>
        </div>
      )}

      {vista === "pendientes" ? (
        <div className="mb-4">
          <TablaForm
            columna={columnasPendientes}
            data={filasPendientes}
            campos={camposPendientes}
            acciones={[
              {
                titulo: "Revisar y autorizar",
                clase: "tabla-btn-edit",
                icono: <FactCheckIcon fontSize="small" />,
                onClick: (fila) => irAlExpediente(fila.id_siniestro, "evaluacion"),
              },
            ]}
          />
        </div>
      ) : (
        <>
          <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
            <div>
              <div className="fw-bold mb-2">Búsqueda</div>
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon" />
                <input type="text" className="search-custom" placeholder="Buscar número de evaluación..." value={searchTerm} onChange={handleSearch} />
              </div>
            </div>

            <div>
              <div className="fw-bold mb-2">Estatus</div>
              <select
                className="form-select"
                style={{ width: "180px" }}
                value={estatusFilter}
                onChange={(e) => {
                  setEstatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Todos">Todos</option>
                <option value="aprobada">Aprobada</option>
                <option value="en_revision">Por autorizar</option>
                <option value="rechazada">Devuelta</option>
                <option value="borrador">Borrador</option>
              </select>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <PrimaryButton text="Descargar" icon={<DownloadIcon />} onClick={() => setShowDescarga(true)} />
            </div>
          </div>

          <div className="mb-4">
            <TablaForm
              columna={columnas}
              data={evaluaciones}
              campos={campos}
              acciones={[
                {
                  titulo: "Ver expediente",
                  clase: "tabla-btn-ver",
                  icono: <FolderSharedIcon fontSize="small" />,
                  oculto: (fila) => !fila.id_siniestro,
                  onClick: (fila) => irAlExpediente(fila.id_siniestro, "evaluacion"),
                },
                {
                  titulo: "Ver PDF",
                  clase: "tabla-btn-ver",
                  icono: <PictureAsPdfIcon fontSize="small" />,
                  onClick: handleVerPDF,
                },
              ]}
            />
          </div>

          <Paginacion
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* MODAL: Ver PDF */}
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
              <EvaluacionDocumento data={modalData} printRef={printRef} />
            </div>
          </div>
        </div>
      )}

      {/* ---------- Aviso (éxito / error / advertencia) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div
              className={`evi-aviso-icono ${aviso.tipo}`}
              style={aviso.tipo === "advertencia" ? ESTILO_ICONO_ADVERTENCIA : undefined}
            >
              {aviso.tipo === "exito" && <CheckCircleIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === "error" && <ErrorOutlineIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === "advertencia" && <WarningAmberIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}

      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_URL}/exportar/evaluaciones`}
        params={{ search: searchTerm, estatus: estatusFilter }}
        nombreArchivo="evaluaciones"
        titulo="Descargar listado de evaluaciones"
        nota={
          searchTerm || estatusFilter !== "Todos"
            ? `Se exportarán las evaluaciones con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatusFilter !== "Todos" ? ` (estatus: ${estatusFilter})` : ""}.`
            : "Se exportarán todas las evaluaciones."
        }
      />
    </div>
  );
};

export default Evaluaciones;