// pages/admin/Evaluaciones.jsx
import { useState } from "react";
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

/* ─── ARRAY DE DATOS PARA EVALUACIONES ───────────────── */
const evaluacionesData = [
  {
    id: 1,
    nSiniestro: "SIN-2025-000123",
    dictamen: "Aprobado",
    montoRecomendado: "$30,000",
    ajustador: "Juan Mendez",
    valorResidual: "$10,000",
    fechaInspeccion: "12-03-2025",
    prioridad: "Media",
    estatus: "Activo",
    nEvaluacion: "EV-001",
    
    // Datos para el PDF
    aseguradora: "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza: "POL-2026-000146",
    fechaEmision: "23 de mayo de 2026",
    nombreAsegurado: "Juan Méndez González",
    rfc: "MEGJ850101ABC",
    domicilio: "Calle 50 No. 100, Col. Centro, Mérida, Yucatán",
    telefono: "999 345 6789",
    correo: "juan.mendez@ejemplo.com",
    nEvaluacionPDF: "EV-001",
    ajustadorPDF: "Carlos Ruiz",
    fechaEvaluacion: "15 de marzo de 2025",
    resultadoEval: "El siniestro es procedente. Se aprueba el monto recomendado.",
    prioridadPDF: "Media",
    tipoSiniestro: "Robo",
    fechaOcurrencia: "10 de marzo de 2025",
    ubicacion: "Domicilio del asegurado",
    descripcion: "Robo de vehículo en estacionamiento del domicilio.",
    montoReclamado: "$35,000",
    montoAprobadoPDF: "$30,000",
    deducible: "$5,000",
    montoTotal: "$30,000 (Treinta mil pesos 00/100 M.N.)",
    estatusPDF: "Pagada",
    causas: "Robo de vehículo en estacionamiento",
    recomendacion: "Proceder con el pago",
    costoReparacion: "$25,000",
    fechaDictamen: "15-03-2025",
    reporte: "REP-2024-0156",
    empleadoAjustador: "Carlos Ruiz",
    formaPago: "Transferencia",
    banco: "BBVA",
    titularBanco: "Juan Méndez González",
    cuentaBancaria: "**** **** **** 4521",
    fechaAutorizacion: "14 de marzo de 2025",
    fechaPagoPDF: "16 de marzo de 2025",
    referencia: "SPEI-88924307"
  },
  {
    id: 2,
    nSiniestro: "SIN-2026-000003",
    dictamen: "No aprobado",
    montoRecomendado: "$40,000",
    ajustador: "Angel Real",
    valorResidual: "$20,000",
    fechaInspeccion: "12-04-2025",
    prioridad: "Alta",
    estatus: "Activo",
    nEvaluacion: "EV-002",
    
    aseguradora: "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza: "POL-2026-000200",
    fechaEmision: "10 de abril de 2026",
    nombreAsegurado: "Angel Real Torres",
    rfc: "RETA900101AB1",
    domicilio: "Calle 60 No. 100, Col. Centro, Mérida, Yucatán",
    telefono: "999 111 2222",
    correo: "angel.real@ejemplo.com",
    nEvaluacionPDF: "EV-002",
    ajustadorPDF: "Ana López",
    fechaEvaluacion: "15 de abril de 2025",
    resultadoEval: "El siniestro no es procedente. Falta de documentación.",
    prioridadPDF: "Alta",
    tipoSiniestro: "Incendio",
    fechaOcurrencia: "11 de abril de 2025",
    ubicacion: "Domicilio del asegurado",
    descripcion: "Incendio en vivienda que dañó estructura y mobiliario.",
    montoReclamado: "$150,000",
    montoAprobadoPDF: "$40,000",
    deducible: "$110,000",
    montoTotal: "$40,000 (Cuarenta mil pesos 00/100 M.N.)",
    estatusPDF: "Pagada",
    causas: "Incendio en vivienda",
    recomendacion: "Rechazar por falta de documentación",
    costoReparacion: "$150,000",
    fechaDictamen: "15-04-2025",
    reporte: "REP-2024-0157",
    empleadoAjustador: "Ana López",
    formaPago: "Efectivo",
    banco: "Banamex",
    titularBanco: "Angel Real Torres",
    cuentaBancaria: "**** **** **** 9988",
    fechaAutorizacion: "9 de abril de 2025",
    fechaPagoPDF: "10 de abril de 2025",
    referencia: "EFE-00291837"
  },
  {
    id: 3,
    nSiniestro: "SIN-2026-000004",
    dictamen: "Aprobado",
    montoRecomendado: "$50,000",
    ajustador: "Maria Ana",
    valorResidual: "$5,000",
    fechaInspeccion: "22-05-2025",
    prioridad: "Baja",
    estatus: "En proceso",
    nEvaluacion: "EV-003",
    
    aseguradora: "Aseguradora Integral del Sureste S.A. de C.V.",
    nPoliza: "POL-2026-000301",
    fechaEmision: "20 de mayo de 2026",
    nombreAsegurado: "Maria Ana Ruiz López",
    rfc: "RULM850202CD3",
    domicilio: "Av. Itzáes No. 200, Col. García Ginerés, Mérida, Yucatán",
    telefono: "999 333 4444",
    correo: "maria.ana@ejemplo.com",
    nEvaluacionPDF: "EV-003",
    ajustadorPDF: "Julian Chas",
    fechaEvaluacion: "25 de mayo de 2025",
    resultadoEval: "El siniestro es procedente parcialmente.",
    prioridadPDF: "Baja",
    tipoSiniestro: "Robo",
    fechaOcurrencia: "20 de mayo de 2025",
    ubicacion: "Domicilio del asegurado",
    descripcion: "Robo de pertenencias del hogar.",
    montoReclamado: "$55,000",
    montoAprobadoPDF: "$50,000",
    deducible: "$5,000",
    montoTotal: "$50,000 (Cincuenta mil pesos 00/100 M.N.)",
    estatusPDF: "Pagada",
    causas: "Robo de pertenencias",
    recomendacion: "Proceder con el pago parcial",
    costoReparacion: "$8,000",
    fechaDictamen: "25-05-2025",
    reporte: "REP-2024-0158",
    empleadoAjustador: "Julian Chas",
    formaPago: "Transferencia",
    banco: "HSBC",
    titularBanco: "Maria Ana Ruiz López",
    cuentaBancaria: "**** **** **** 1234",
    fechaAutorizacion: "19 de mayo de 2025",
    fechaPagoPDF: "22 de mayo de 2025",
    referencia: "SPEI-77651234"
  }
];

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

<<<<<<< HEAD
=======


>>>>>>> origin/equipo
/* ─── VISTA PRINCIPAL ─────────────────── */
const Evaluaciones = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [modalData, setModalData] = useState(null);

  // Hook reutilizable de exportación PDF
  const { printRef, snack, setSnack, handleDescargar } = usePDFExport(
    modalData ? `Evaluacion_${modalData.nEvaluacion}` : "Evaluacion"
  );

  /* ── Filtro ── */
  const filteredEvaluaciones = evaluacionesData.filter((e) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.nSiniestro.toLowerCase().includes(q) ||
      e.ajustador.toLowerCase().includes(q) ||
      e.dictamen.toLowerCase().includes(q);
    const matchesEstatus = estatusFilter === "Todos" || e.estatus === estatusFilter;
    return matchesSearch && matchesEstatus;
  });

  const totalPages = Math.ceil(filteredEvaluaciones.length / itemsPerPage);
  const paginated = filteredEvaluaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  /* ── Acciones de tabla ── */
  const handleVerPDF = (fila) => setModalData(fila);
  
  const handleDescargarPDF = (fila) => {
    setModalData(fila);
    setTimeout(() => handleDescargar(), 100);
  };

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
            <option value="Activo">Activo</option>
            <option value="En proceso">En proceso</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
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