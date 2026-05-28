// pages/admin/Evaluaciones.jsx
import { useState, useEffect } from "react";
import axios from 'axios';
import "../../css/Clientes.css";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import TablaForm from "../../components/TablaForm";
import Paginacion from "../../components/Paginacion";
import EvaluacionDocumento from "../../components/EvaluacionDocumento";
import usePDFExport from "../../components/usePDFExport";
import "../../css/PolizasVencer.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/* ─── CONFIG TABLA ───────────────────────────── */
const campos = [
  "id", 
  "nSiniestro", 
  "dictamen", 
  "montoRecomendado", 
  "ajustador", 
  "valorResidual", 
  "fechaInspeccion", 
  "prioridad", 
  "estatus"
];

const columnas = [
  "Id",
  "N° Siniestro",
  "Dictamen",
  "Monto recomendado",
  "Ajustador",
  "Valor residual",
  "Fecha de inspección",
  "Prioridad",
  "Estatus",
  "Acciones"
];

/* ─── FUNCIÓN PARA BADGES ─────────────────────── */
const getPrioridadClass = (prioridad) => {
  switch (prioridad) {
    case "Alta":
      return "badge-prioridad-alta";
    case "Media":
      return "badge-prioridad-media";
    case "Baja":
      return "badge-prioridad-baja";
    default:
      return "";
  }
};

const getEstatusClass = (estatus) => {
  switch (estatus) {
    case "Aprobada":
      return "badge-aprobado";
    case "En revisión":
      return "badge-proxima";
    case "Rechazada":
      return "badge-vencida";
    case "Borrador":
      return "badge-pendiente";
    default:
      return "";
  }
};

const getDictamenClass = (dictamen) => {
  switch (dictamen) {
    case "Aprobado":
      return "badge-aprobado";
    case "No aprobado":
      return "badge-no-aprobado";
    case "Pendiente":
      return "badge-pendiente";
    default:
      return "";
  }
};

/* ─── VISTA PRINCIPAL ─────────────────── */
const Evaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [modalData, setModalData] = useState(null);

  // Hook reutilizable de exportación PDF
  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Evaluacion_${modalData.nEvaluacion}` : "Evaluacion"
  );

  const cargarEvaluaciones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/evaluaciones`, {
        params: { 
          page: currentPage, 
          search: searchTerm, 
          estatus: estatusFilter,
          per_page: itemsPerPage 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvaluaciones(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalleEvaluacion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/evaluaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]);

  /* ── Filtro ── */
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  /* ── Acciones de tabla ── */
  const handleVerPDF = async (fila) => {
    const detalle = await cargarDetalleEvaluacion(fila.id);
    if (detalle) {
      setModalData(detalle);
    }
  };
  
  const handleDescargarPDF = async (fila) => {
    const detalle = await cargarDetalleEvaluacion(fila.id);
    if (detalle) {
      setModalData(detalle);
      setTimeout(() => handleDescargar(), 100);
    }
  };

  if (loading && evaluaciones.length === 0) {
    return <div className="container py-4"><div className="text-center py-5"><div className="spinner-border text-success"></div><p>Cargando evaluaciones...</p></div></div>;
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Evaluaciones</h1>
      <hr className="mt-2 mb-3" />

      {/* BUSCADOR + FILTRO */}
      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar número de evaluación..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div>
          <div className="fw-bold mb-2">Estatus</div>
          <select
            className="form-select"
            style={{ width: "180px" }}
            value={estatusFilter}
            onChange={(e) => setEstatusFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="aprobada">Aprobada</option>
            <option value="en_revision">En revisión</option>
            <option value="rechazada">Rechazada</option>
            <option value="borrador">Borrador</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={evaluaciones}
          campos={campos}
          acciones={[
            {
              titulo: "Ver PDF",
              clase: "tabla-btn-ver",
              icono: <PictureAsPdfIcon fontSize="small" />,
              onClick: handleVerPDF,
            },
            {
              titulo: "Descargar PDF",
              clase: "tabla-btn-edit",
              icono: <DownloadIcon fontSize="small" />,
              onClick: handleDescargarPDF,
            }
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

      {/* MODAL: Ver PDF */}
      {modalData && (
        <div className="ipdf-modal-overlay" onClick={() => setModalData(null)}>
          <div className="ipdf-modal" onClick={(e) => e.stopPropagation()}>

            {/* Toolbar del modal */}
            <div className="ipdf-toolbar">
              <button className="ipdf-back" onClick={() => setModalData(null)}>
                <CloseIcon fontSize="small" /> Cerrar
              </button>
              <button className="ipdf-download" onClick={handleDescargar}>
                <DownloadIcon fontSize="small" /> Descargar PDF
              </button>
            </div>

            {/* Documento reutilizable */}
            <div className="ipdf-wrapper">
              <EvaluacionDocumento data={modalData} printRef={printRef} />
            </div>

          </div>
        </div>
      )}

      {/* Snackbar de confirmación */}
      <Snackbar
        open={snack}
        autoHideDuration={2500}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnack(false)}>
          PDF descargado exitosamente
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Evaluaciones;