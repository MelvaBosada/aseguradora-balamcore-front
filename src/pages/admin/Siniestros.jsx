// pages/admin/Siniestros.jsx
import { useState } from "react";
import "../../css/Clientes.css";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import InfoIcon from "@mui/icons-material/Info";
import ReportIcon from "@mui/icons-material/Report";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';

/* COLUMNAS SIMPLIFICADAS */
const campos = [
  "nSiniestro",
  "tipo",
  "cliente",
  "estatus",
  "prioridad"
];

const columnas = [
  "N° Siniestro",
  "Tipo",
  "Cliente",
  "Estatus",
  "Prioridad",
  "Acciones"
];

/* DATA */
const siniestrosData = [
  {
    id: 1,
    nSiniestro: "SIN-2025-000123",
    tipo: "Robo",
    nReporte: "REP-2024-0156",
    cliente: "Juan Mendez",
    ubicacion: "Lugar del evento",
    fechaCreacion: "12-03-2025",
    prioridad: "Media",
    estatus: "Activo",
    descripcion: "Robo de vehículo en estacionamiento",
    fechaOcurrencia: "10-03-2025",
    ajustador: "Carlos Ruiz",
    montoReclamado: "$25,000"
  },
  {
    id: 2,
    nSiniestro: "SIN-2026-000003",
    tipo: "Incendio",
    nReporte: "REP-2024-0156",
    cliente: "Angel Real",
    ubicacion: "Lugar del evento",
    fechaCreacion: "12-04-2025",
    prioridad: "Alta",
    estatus: "Activo",
    descripcion: "Incendio en vivienda",
    fechaOcurrencia: "11-04-2025",
    ajustador: "Ana López",
    montoReclamado: "$150,000"
  },
  {
    id: 3,
    nSiniestro: "SIN-2026-000004",
    tipo: "Robo",
    nReporte: "REP-2024-0156",
    cliente: "Maria Ana",
    ubicacion: "Lugar del evento",
    fechaCreacion: "22-05-2025",
    prioridad: "Baja",
    estatus: "En proceso",
    descripcion: "Robo de pertenencias",
    fechaOcurrencia: "20-05-2025",
    ajustador: "Julian Chas",
    montoReclamado: "$8,000"
  }
];

/* BADGES */
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
    case "Activo":
      return "badge-activa";
    case "En proceso":
      return "badge-proxima";
    case "Cerrado":
      return "badge-vencida";
    default:
      return "";
  }
};

/* FORMULARIO PARA SINIESTROS */
const FORM_CAMPOS_SINIESTRO = [
  { label: "N° Siniestro", name: "nSiniestro", type: "text" },
  { label: "Tipo", name: "tipo", type: "text" },
  { label: "N° Reporte", name: "nReporte", type: "text" },
  { label: "Cliente", name: "cliente", type: "text" },
  { label: "Ubicación", name: "ubicacion", type: "text" },
  { label: "Fecha de creación", name: "fechaCreacion", type: "date" },
  { label: "Prioridad", name: "prioridad", type: "text" },
  { label: "Estatus", name: "estatus", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  { label: "Fecha de ocurrencia", name: "fechaOcurrencia", type: "date" },
  { label: "Ajustador asignado", name: "ajustador", type: "text" },
  { label: "Monto reclamado", name: "montoReclamado", type: "text" }
];

const FORM_VACIO_SINIESTRO = {
  nSiniestro: "",
  tipo: "",
  nReporte: "",
  cliente: "",
  ubicacion: "",
  fechaCreacion: "",
  prioridad: "",
  estatus: "",
  descripcion: "",
  fechaOcurrencia: "",
  ajustador: "",
  montoReclamado: ""
};

/* FORMULARIO PARA EVALUACIÓN - CON TODOS LOS CAMPOS DE LA IMAGEN */
const FORM_CAMPOS_EVALUACION = [
  // Primera fila: Fecha de inspección y Dictamen
  { label: "Fecha de inspección", name: "fechaInspeccion", type: "date" },
  { label: "Dictamen", name: "dictamen", type: "select", options: ["Favorable", "Desfavorable", "Pendiente"] },
  
  // Segunda fila: N° Siniestro y Cliente
  { label: "N° Siniestro", name: "nSiniestro", type: "text", readOnly: true },
  { label: "Cliente", name: "cliente", type: "text", readOnly: true },
  
  // Tercera fila: Dropdown de reporte
  { label: "Escoge el reporte", name: "reporte", type: "select", options: ["REP-2024-0156", "REP-2024-0157", "REP-2024-0158"] },
  
  // Cuarta fila: Causas y Recomendación
  { label: "Causas", name: "causas", type: "textarea" },
  { label: "Recomendación", name: "recomendacion", type: "textarea" },
  
  // Quinta fila: Monto recomendado
  { label: "Monto recomendado", name: "montoRecomendado", type: "text" },
  
  // Sexta fila: Costo de reparación y Prioridad
  { label: "Costo de reparación", name: "costoReparacion", type: "text" },
  { label: "Prioridad", name: "prioridad", type: "select", options: ["Alta", "Media", "Baja"] },
  
  // Séptima fila: Estado
  { label: "Escoge el estado", name: "estado", type: "select", options: ["Activo", "En proceso", "Cerrado"] },
  
  // Octava fila: Fecha de dictamen y Empleado Ajustador
  { label: "Fecha de dictamen", name: "fechaDictamen", type: "date" },
  { label: "Empleado Ajustador", name: "empleadoAjustador", type: "select", options: ["Carlos Ruiz", "Ana López", "Julian Chas", "María García", "Pedro Martínez"] }
];

const FORM_VACIO_EVALUACION = {
  fechaInspeccion: "",
  dictamen: "",
  nSiniestro: "",
  cliente: "",
  reporte: "",
  causas: "",
  recomendacion: "",
  montoRecomendado: "",
  costoReparacion: "",
  prioridad: "",
  estado: "",
  fechaDictamen: "",
  empleadoAjustador: ""
};

const Siniestros = () => {
  const [siniestros, setSiniestros] = useState(siniestrosData);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showEvaluacionModal, setShowEvaluacionModal] = useState(false);
  const [siniestroToDelete, setSiniestroToDelete] = useState(null);
  const [siniestroDetalle, setSiniestroDetalle] = useState(null);
  const [siniestroEvaluacion, setSiniestroEvaluacion] = useState(null);
  const [editingSiniestro, setEditingSiniestro] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO_SINIESTRO);
  const [evaluacionData, setEvaluacionData] = useState(FORM_VACIO_EVALUACION);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEvaluacionChange = (e) =>
    setEvaluacionData({ ...evaluacionData, [e.target.name]: e.target.value });

  const handleNuevoSiniestro = () => {
    setEditingSiniestro(null);
    setFormData(FORM_VACIO_SINIESTRO);
    setShowModal(true);
  };

  const handleEditar = (s) => {
    setEditingSiniestro(s);
    setFormData(s);
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingSiniestro) {
      setSiniestros(
        siniestros.map((s) =>
          s.id === editingSiniestro.id
            ? { ...formData, id: editingSiniestro.id }
            : s
        )
      );
    } else {
      const newId = Math.max(...siniestros.map((s) => s.id), 0) + 1;
      setSiniestros([...siniestros, { ...formData, id: newId }]);
    }
    setShowModal(false);
  };

  const handleGuardarEvaluacion = () => {
    console.log("Evaluación guardada:", evaluacionData);
    // Aquí iría la lógica para guardar la evaluación
    setShowEvaluacionModal(false);
    setEvaluacionData(FORM_VACIO_EVALUACION);
    setSiniestroEvaluacion(null);
  };

  const handleEliminarClick = (s) => {
    setSiniestroToDelete(s);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = () => {
    if (siniestroToDelete) {
      setSiniestros(
        siniestros.filter((s) => s.id !== siniestroToDelete.id)
      );
      setShowDeleteModal(false);
      setSiniestroToDelete(null);
    }
  };

  const handleVerDetalle = (s) => {
    setSiniestroDetalle(s);
    setShowDetalleModal(true);
  };

  const handleNuevaEvaluacion = (s) => {
    setSiniestroEvaluacion(s);
    setEvaluacionData({
      ...FORM_VACIO_EVALUACION,
      nSiniestro: s.nSiniestro,
      cliente: s.cliente,
      reporte: s.nReporte || ""
    });
    setShowEvaluacionModal(true);
  };

  /* FILTRO */
  const filteredSiniestros = siniestros.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.nSiniestro.toLowerCase().includes(q) ||
      s.cliente.toLowerCase().includes(q) ||
      s.tipo.toLowerCase().includes(q);
    const matchesEstatus =
      estatusFilter === "Todos" || s.estatus === estatusFilter;
    return matchesSearch && matchesEstatus;
  });

  const totalPages = Math.ceil(filteredSiniestros.length / itemsPerPage);
  const paginated = filteredSiniestros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  /* DETALLE */
  const detalleItems = siniestroDetalle
    ? [
        { icon: <AssignmentIcon />, label: "N° Siniestro", value: siniestroDetalle.nSiniestro },
        { icon: <ReportIcon />, label: "Tipo", value: siniestroDetalle.tipo },
        { icon: <AssessmentIcon />, label: "N° Reporte", value: siniestroDetalle.nReporte },
        { icon: <PersonIcon />, label: "Cliente", value: siniestroDetalle.cliente },
        { icon: <LocationOnIcon />, label: "Ubicación", value: siniestroDetalle.ubicacion },
        { icon: <DateRangeIcon />, label: "Fecha de creación", value: siniestroDetalle.fechaCreacion },
        { icon: <DateRangeIcon />, label: "Fecha de ocurrencia", value: siniestroDetalle.fechaOcurrencia || "—" },
        { icon: <PriorityHighIcon />, label: "Prioridad", value: siniestroDetalle.prioridad },
        { icon: <InfoIcon />, label: "Estatus", value: siniestroDetalle.estatus },
        { icon: <PersonIcon />, label: "Ajustador", value: siniestroDetalle.ajustador || "—" },
        { icon: <AssignmentIcon />, label: "Monto", value: siniestroDetalle.montoReclamado || "—" },
        { icon: <AssignmentIcon />, label: "Descripción", value: siniestroDetalle.descripcion || "—" }
      ]
    : [];

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Siniestros</h1>
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
              placeholder="Buscar número de siniestro..."
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

        <PrimaryButton
          text="Nuevo siniestro"
          icon={<AddIcon />}
          onClick={handleNuevoSiniestro}
        />
      </div>

      {/* TABLA */}
      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Ver detalle",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle
            },
            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar
            },
            {
              titulo: "Nueva evaluación",
              clase: "tabla-btn-ver", // Misma clase que "Ver detalle"
              icono: <AssignmentAddIcon fontSize="small" />, // Mismo ícono
              onClick: handleNuevaEvaluacion
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

      {/* MODAL PARA SINIESTROS (CREAR/EDITAR) */}
      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingSiniestro}
        titulo={editingSiniestro ? "Editar siniestro" : "Agregar nuevo siniestro"}
        subtitulo={editingSiniestro ? "Modifica los datos del siniestro" : "Ingresa los datos para registrar el siniestro"}
        btnTexto={editingSiniestro ? "Guardar cambios" : "Agregar siniestro"}
        campos={FORM_CAMPOS_SINIESTRO}
        formData={formData}
        onChange={handleInputChange}
      />

      {/* MODAL PARA EVALUACIÓN - CON TODOS LOS CAMPOS DE LA IMAGEN */}
      <EditModal
        open={showEvaluacionModal}
        onClose={() => {
          setShowEvaluacionModal(false);
          setEvaluacionData(FORM_VACIO_EVALUACION);
          setSiniestroEvaluacion(null);
        }}
        onSave={handleGuardarEvaluacion}
        editando={false}
        titulo="Agregar una nueva evaluación"
        subtitulo="Ingresa todos los datos para continuar con el proceso"
        btnTexto="Agregar Evaluación"
        campos={FORM_CAMPOS_EVALUACION}
        formData={evaluacionData}
        onChange={handleEvaluacionChange}
      />

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSiniestroToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar siniestro"
        subtitle="¿Deseas eliminar este siniestro del sistema?"
      >
        {siniestroToDelete && (
          <div>
            <p><strong>Siniestro #{siniestroToDelete.nSiniestro}</strong></p>
            <p>Cliente: {siniestroToDelete.cliente}</p>
            <p>Tipo: {siniestroToDelete.tipo}</p>
            <p>Estatus: {siniestroToDelete.estatus}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      {/* MODAL DE DETALLE */}
      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setSiniestroDetalle(null); }}
        titulo={siniestroDetalle ? `Siniestro #${siniestroDetalle.nSiniestro}` : ""}
        subtitulo={siniestroDetalle ? siniestroDetalle.cliente : ""}
        avatar={siniestroDetalle ? "S" : ""}
        items={detalleItems}
      />
    </div>
  );
};

export default Siniestros;