// pages/admin/Polizas.jsx
import { useState } from 'react';
import '../../css/Clientes.css';

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon from "@mui/icons-material/Notes";
import InfoIcon from "@mui/icons-material/Info";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import Paginacion from "../../components/Paginacion";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";

// Campos para la tabla principal - SOLO 3 COLUMNAS
const campos = ["nPoliza", "cliente", "estatus"];
const columnas = [
  "N° Póliza",
  "Cliente",
  "Estatus",
  "Acciones"
];

// Datos de ejemplo para pólizas
const polizasData = [
  { id: 1, nPoliza: "183", cliente: "María Mendez", fechaInicio: "11-6-2026", fechaFinal: "11-9-2030", estatus: "Activa", sumaAsegurada: "$40 000", formaPago: "mensual", tipoPago: "efectivo", montoPrima: "$200", observaciones: "Observación 1" },
  { id: 2, nPoliza: "219", cliente: "Juan Carlos", fechaInicio: "14-7-2025", fechaFinal: "14-5-22025", estatus: "Por vencer", sumaAsegurada: "$50 000", formaPago: "trimestral", tipoPago: "transferencia", montoPrima: "$300", observaciones: "Observación 2" },
  { id: 3, nPoliza: "657", cliente: "Jacob M.", fechaInicio: "21-8-2027", fechaFinal: "11-9-2027", estatus: "Vencida", sumaAsegurada: "$30 000", formaPago: "anual", tipoPago: "credito", montoPrima: "$500", observaciones: "Observación 3" },
  { id: 4, nPoliza: "175", cliente: "Miguel Torres", fechaInicio: "30-9-2025", fechaFinal: "11-9-2040", estatus: "Renovada", sumaAsegurada: "$2000", formaPago: "mensual", tipoPago: "efectivo", montoPrima: "$600", observaciones: "Observación 4" },
  { id: 5, nPoliza: "185", cliente: "Angel Torres", fechaInicio: "30-9-2025", fechaFinal: "11-9-2040", estatus: "Cancelado", sumaAsegurada: "$50 000", formaPago: "mensual", tipoPago: "efectivo", montoPrima: "$800", observaciones: "Observaciones 5" }
];


// Campos del formulario para pólizas
const FORM_CAMPOS = [
  { label: "N° Póliza", name: "nPoliza", type: "text" },
  { label: "Cliente", name: "cliente", type: "text" },
  { label: "Fecha de inicio", name: "fechaInicio", type: "date" },
  { label: "Fecha final", name: "fechaFinal", type: "date" },
  { label: "Estatus", name: "estatus", type: "text" },
  { label: "Suma asegurada", name: "sumaAsegurada", type: "text" },
  { label: "Forma de pago", name: "formaPago", type: "text" },
  { label: "Tipo de pago", name: "tipoPago", type: "text" },
  { label: "Monto prima", name: "montoPrima", type: "text" },
  { label: "Observaciones", name: "observaciones", type: "text" }
];

const FORM_VACIO = {
  nPoliza: "",
  cliente: "",
  fechaInicio: "",
  fechaFinal: "",
  estatus: "",
  sumaAsegurada: "",
  formaPago: "",
  tipoPago: "",
  montoPrima: "",
  observaciones: ""
};

const Polizas = () => {
  const [polizas, setPolizas] = useState(polizasData);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [polizaToDelete, setPolizaToDelete] = useState(null);
  const [polizaDetalle, setPolizaDetalle] = useState(null);
  const [editingPoliza, setEditingPoliza] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevaPoliza = () => {
    setEditingPoliza(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (poliza) => {
    setEditingPoliza(poliza);
    setFormData(poliza);
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingPoliza) {
      setPolizas(polizas.map(p => p.id === editingPoliza.id ? { ...formData, id: editingPoliza.id } : p));
    } else {
      const newId = Math.max(...polizas.map(p => p.id), 0) + 1;
      setPolizas([...polizas, { ...formData, id: newId }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick = (p) => { setPolizaToDelete(p); setShowDeleteModal(true); };
  
  const handleConfirmarEliminar = () => {
    if (polizaToDelete) {
      setPolizas(polizas.filter(p => p.id !== polizaToDelete.id));
      setShowDeleteModal(false);
      setPolizaToDelete(null);
    }
  };
  
  const handleVerDetalle = (p) => { setPolizaDetalle(p); setShowDetalleModal(true); };

  const filteredPolizas = polizas.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.nPoliza.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      p.estatus.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredPolizas.length / itemsPerPage);
  const paginated = filteredPolizas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const detalleItems = polizaDetalle ? [
    { icon: <AssignmentIcon />, label: "N° Póliza", value: polizaDetalle.nPoliza },
    { icon: <PersonIcon />, label: "Cliente", value: polizaDetalle.cliente },
    { icon: <DateRangeIcon />, label: "Fecha de inicio", value: polizaDetalle.fechaInicio },
    { icon: <DateRangeIcon />, label: "Fecha final", value: polizaDetalle.fechaFinal },
    { icon: <InfoIcon />, label: "Estatus", value: polizaDetalle.estatus },
    { icon: <AttachMoneyIcon />, label: "Suma asegurada", value: polizaDetalle.sumaAsegurada },
    { icon: <PaymentIcon />, label: "Forma de pago", value: polizaDetalle.formaPago },
    { icon: <ReceiptIcon />, label: "Tipo de pago", value: polizaDetalle.tipoPago },
    { icon: <MonetizationOnIcon />, label: "Monto prima", value: polizaDetalle.montoPrima },
    { icon: <NotesIcon />, label: "Observaciones", value: polizaDetalle.observaciones }
  ] : [];

  return (
    <div className="container py-4">

      <h1 className="h2 fw-bold mb-3">Pólizas</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar número de póliza..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <PrimaryButton text="Nueva póliza" icon={<AddCircleRoundedIcon />} onClick={handleNuevaPoliza} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            { titulo: "Ver detalle", clase: "tabla-btn-ver", icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle },
            { titulo: "Editar", clase: "tabla-btn-edit", icono: <EditIcon fontSize="small" />, onClick: handleEditar },
            { titulo: "Eliminar", clase: "tabla-btn-del", icono: <DeleteIcon fontSize="small" />, onClick: handleEliminarClick },
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

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingPoliza}
        titulo={editingPoliza ? "Editar póliza" : "Agregar nueva póliza"}
        subtitulo={editingPoliza ? "Modifica los datos de la póliza" : "Ingresa los datos para registrar la póliza"}
        btnTexto={editingPoliza ? "Guardar cambios" : "Agregar póliza"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setPolizaToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar póliza"
        subtitle="¿Deseas eliminar esta póliza del sistema?"
      >
        {polizaToDelete && (
          <div>
            <p><strong>Póliza #{polizaToDelete.nPoliza}</strong></p>
            <p>Cliente: {polizaToDelete.cliente}</p>
            <p>Estatus: {polizaToDelete.estatus}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setPolizaDetalle(null); }}
        titulo={polizaDetalle ? `Póliza #${polizaDetalle.nPoliza}` : ""}
        subtitulo={polizaDetalle ? polizaDetalle.cliente : ""}
        avatar={polizaDetalle ? "P" : ""}
        items={detalleItems}
      />

    </div>
  );
};

export default Polizas;