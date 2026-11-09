import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Componentes del proyecto
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import IndemnizacionDocumento from "../../components/IndemnizacionDocumento";
import usePDFExport from "../../components/usePDFExport";
import DescargarModal from "../../components/DescargarModal";
import { EstatusIndemnizacion } from "../../components/siniestro/Badges";
import { ConfirmarPagoModal, RegistrarPagoModal, CancelarIndemnizacionModal } from "../../components/siniestro/IndemnizacionModales";
import { tienePermiso } from "../../utils/permisos";

// Estilos
import "../../css/PolizasVencer.css";
import "../../css/IndemnizacionPDF.css";
import "../../css/SiniestroDetalle.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${API_BASE}/indemnizaciones`;
const ESTATUS_OPTIONS = ["Todos", "pendiente", "autorizada", "pagada", "rechazada"];

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

/* ─── CONFIGURACIÓN DE TABLA ───────────────── */
const campos = [
  "nSiniestro",
  "montoAprobado",
  "formaPago",
  "titularCuenta",
  "nEvaluacion",
  "fechaPago",
  "numeroCuenta",
  "estatus_vista",
];

const columnas = [
  "N° Siniestro",
  "Monto aprobado",
  "Forma de pago",
  "Titular de la cuenta",
  "N° Evaluación",
  "Fecha de pago",
  "Cuenta",
  "Estatus",
  "Acciones",
];

// Formatea dinero sin romperse si el valor viene vacío
const dinero = (v) => `$${parseFloat(v || 0).toLocaleString()}`;

// La cuenta completa solo viaja al PDF; en pantalla se enmascara
const mascara = (c) => (c ? `•••• ${String(c).slice(-4)}` : "N/A");

const Indemnizaciones = () => {
  const navigate = useNavigate();
  const puedeConfirmar = tienePermiso("indemnizaciones.confirmar");
  const puedePagar = tienePermiso("indemnizaciones.pagar");

  const [dataIndemnizaciones, setDataIndemnizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estatus, setEstatus] = useState("Todos");
  const [showDescarga, setShowDescarga] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [modalData, setModalData] = useState(null);
  const [accion, setAccion] = useState(null); // { tipo: "confirmar" | "pagar" | "cancelar", item }
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }

  // handleDescargar (del hook) genera el PDF de UNA indemnización.
  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Indemnizacion_${modalData.nSiniestro}` : "Indemnizacion"
  );

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  // El hook usePDFExport activa `snack` al exportar: lo convertimos en aviso
  useEffect(() => {
    if (!snack) return;
    mostrarAviso("exito", "Documento exportado", "Documento exportado correctamente.");
    setSnack(false);
  }, [snack, setSnack, mostrarAviso]);

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
        const lista = Array.isArray(json) ? json : json.data || [];

        const mapeados = lista.map((i) => ({
          ...i,
          nSiniestro: i.numero_siniestro || `SIN-${String(i.id_siniestro).padStart(6, "0")}`,
          montoAprobado: dinero(i.monto_aprobado),
          formaPago: (i.forma_pago || "POR DEFINIR").toUpperCase(),
          titularCuenta: i.titular_cuenta || "N/A",
          nEvaluacion: i.id_evaluaciones ? `EVA-${String(i.id_evaluaciones).padStart(6, "0")}` : "N/A",
          fechaPago: i.fecha_pago ? i.fecha_pago.split(" ")[0] : "Pendiente",
          numeroCuenta: mascara(i.cuenta_bancaria),
          estatus: i.estatus || "",
          estatus_vista: <EstatusIndemnizacion valor={i.estatus} />,

          // Mapeo para PDF desde Joins
          aseguradora: "Balamcore Seguros S.A. de C.V.",
          nPoliza: i.poliza_numero || "POL-S/N",
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
          referencia: i.referencia_pago || (i.id ? `REF-${i.id}` : "N/A"),
          montoReclamado: `${dinero(i.monto_reclamado)} MXN`,
          montoAprobadoPDF: `${dinero(i.monto_aprobado)} MXN`,
          deducible: `${dinero(i.deducible_aplicado)} MXN`,
          montoTotal: `${dinero(i.monto_aprobado)} MXN`,
          estatusPDF: (i.estatus || "").toUpperCase(),
        }));

        setDataIndemnizaciones(mapeados);
      } else {
        const data = await response.json().catch(() => ({}));
        const detalle = data.errors ? Object.values(data.errors).flat().join("\n") : null;
        mostrarAviso(
          "error",
          "No se pudieron cargar las indemnizaciones",
          detalle || data.message || "Ocurrió un error al cargar las indemnizaciones."
        );
      }
    } catch (error) {
      console.error("Error cargando indemnizaciones:", error);
      mostrarAviso("error", "No se pudieron cargar las indemnizaciones", SIN_CONEXION);
    } finally {
      setLoading(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Se llama desde los modales de acciones. Si pasan un mensaje, se muestra como aviso de éxito.
  const hecho = (mensaje) => {
    setAccion(null);
    fetchData();
    if (typeof mensaje === "string" && mensaje) {
      mostrarAviso("exito", "Operación realizada", mensaje);
    }
  };

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <p className="text-muted" style={{ fontSize: 14 }}>
        Las indemnizaciones las genera el sistema al aprobarse el dictamen. El monto no se captura ni se modifica.
      </p>

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
          <PrimaryButton text="Descargar" icon={<DownloadIcon />} onClick={() => setShowDescarga(true)} />
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
              titulo: "Confirmar datos de pago",
              clase: "tabla-btn-edit",
              icono: <AccountBalanceIcon fontSize="small" />,
              oculto: (f) => f.estatus !== "pendiente" || !puedeConfirmar,
              onClick: (item) => setAccion({ tipo: "confirmar", item }),
            },
            {
              titulo: "Registrar pago",
              clase: "tabla-btn-agregar",
              icono: <PaymentsIcon fontSize="small" />,
              oculto: (f) => f.estatus !== "autorizada" || !puedePagar,
              onClick: (item) => setAccion({ tipo: "pagar", item }),
            },
            {
              titulo: "Cancelar indemnización",
              clase: "tabla-btn-del",
              icono: <CancelIcon fontSize="small" />,
              oculto: (f) => !["pendiente", "autorizada"].includes(f.estatus) || !puedePagar,
              onClick: (item) => setAccion({ tipo: "cancelar", item }),
            },
            {
              titulo: "Ver expediente",
              clase: "tabla-btn-ver",
              icono: <FolderSharedIcon fontSize="small" />,
              onClick: (item) => navigate(`/admin/siniestros/${item.id_siniestro}?tab=indemnizacion`),
            },
            {
              titulo: "Ver PDF",
              clase: "tabla-btn-edit",
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

      {accion?.tipo === "confirmar" && <ConfirmarPagoModal indemnizacion={accion.item} onClose={() => setAccion(null)} onHecho={hecho} />}
      {accion?.tipo === "pagar" && <RegistrarPagoModal indemnizacion={accion.item} onClose={() => setAccion(null)} onHecho={hecho} />}
      {accion?.tipo === "cancelar" && <CancelarIndemnizacionModal indemnizacion={accion.item} onClose={() => setAccion(null)} onHecho={hecho} />}

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

      {/* ---------- Aviso (éxito / error) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className={`evi-aviso-icono ${aviso.tipo}`}>
              {aviso.tipo === "exito"
                ? <CheckCircleIcon style={{ fontSize: 40 }} />
                : <ErrorOutlineIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indemnizaciones;