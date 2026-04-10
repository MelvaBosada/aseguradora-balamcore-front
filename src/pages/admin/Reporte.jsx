import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Clientes.css';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import VisibilityIcon from "@mui/icons-material/Visibility";

const campos = ["poliza", "cliente", "siniestro", "estatus"];
const columnas = ["# de Poliza", "Cliente", "# de Siniestro", "Estatus", "Acciones"];

const FORM_CAMPOS = [
  { label: "# de Poliza", name: "poliza", type: "text" },
  { label: "Cliente", name: "cliente", type: "text" },
  { label: "Canal", name: "canal", type: "text" },
  { label: "# de Siniestro", name: "siniestro", type: "text" },
  { label: "Fecha del Reporte", name: "fecha_reporte", type: "date" },
  { label: "Fecha de Actualización", name: "fecha_actualizacion", type: "date" },
  { label: "Empleado que levantó el reporte", name: "empleado", type: "text" },
  { label: "Estatus", name: "estatus", type: "text" }
];

const FORM_VACIO = { poliza: "", cliente: "", canal: "", siniestro: "", fecha_reporte: "", fecha_actualizacion: "", empleado: "", estatus: "" };

const Reportes = () => {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([
    { id: 1, poliza: "POL-2026-0156", cliente: "Juan Pérez", canal: "Agente", siniestro: "SIN-000145", fecha_reporte: "2026-03-02", fecha_actualizacion: "2026-03-04", empleado: "Carlos Méndez", estatus: "Activo" },
    { id: 2, poliza: "POL-2026-0157", cliente: "María González", canal: "Sucursal", siniestro: "SIN-000146", fecha_reporte: "2026-03-01", fecha_actualizacion: "2026-03-03", empleado: "Ana López", estatus: "Pendiente" },
    { id: 3, poliza: "POL-2026-0158", cliente: "Luis Ramírez", canal: "Portal Web", siniestro: "SIN-000147", fecha_reporte: "2026-02-27", fecha_actualizacion: "2026-03-02", empleado: "Pedro Castillo", estatus: "Procesando" },
    { id: 4, poliza: "POL-2026-0159", cliente: "Sofía Martínez", canal: "Agente", siniestro: "SIN-000148", fecha_reporte: "2026-03-05", fecha_actualizacion: "2026-03-05", empleado: "Carlos Méndez", estatus: "Activo" },
    { id: 5, poliza: "POL-2026-0160", cliente: "Diego Torres", canal: "Sucursal", siniestro: "SIN-000149", fecha_reporte: "2026-03-06", fecha_actualizacion: "2026-03-06", empleado: "Ana López", estatus: "Pendiente" },
    { id: 6, poliza: "POL-2026-0161", cliente: "Valeria Ríos", canal: "Portal Web", siniestro: "SIN-000150", fecha_reporte: "2026-03-06", fecha_actualizacion: "2026-03-06", empleado: "Pedro Castillo", estatus: "Cerrado" },
    { id: 7, poliza: "POL-2026-0162", cliente: "Javier Vargas", canal: "Agente", siniestro: "SIN-000151", fecha_reporte: "2026-03-07", fecha_actualizacion: "2026-03-07", empleado: "Carlos Méndez", estatus: "Activo" },
    { id: 8, poliza: "POL-2026-0163", cliente: "Elena Castro", canal: "Sucursal", siniestro: "SIN-000152", fecha_reporte: "2026-03-07", fecha_actualizacion: "2026-03-07", empleado: "Ana López", estatus: "Pendiente" }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (cliente) => {
    setEditingCliente(cliente);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingCliente) {
      setClientes(clientes.map((c) => c.id === editingCliente.id ? { ...formData, id: editingCliente.id } : c));
    } else {
      const newId = Math.max(...clientes.map((c) => c.id), 0) + 1;
      setClientes([...clientes, { ...formData, id: newId }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick = (c) => {
    setClienteToDelete(c);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = () => {
    if (clienteToDelete) {
      setClientes(clientes.filter((c) => c.id !== clienteToDelete.id));
      setShowDeleteModal(false);
      setClienteToDelete(null);
    }
  };

  const handleVerDetalle = (c) => {
    setClienteDetalle(c);
    setShowDetalleModal(true);
  };

  // Función de navegación simplificada
  const handleAgregarSiniestro = () => {
    navigate("/admin/siniestros");
  };

  const filteredClientes = clientes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return c.poliza.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q) || c.siniestro.toLowerCase().includes(q) || c.estatus.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginated = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Reportes</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <PrimaryButton text="Nuevo reporte" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoCliente} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Agregar Siniestro",
              clase: "tabla-btn-agregar", 
              icono: <AddCircleIcon fontSize="small" />,
              // Cambiamos item => handleAgregarSiniestro(item) por una función directa
              onClick: handleAgregarSiniestro 
            },
            {
              titulo: "Ver",
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
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: handleEliminarClick
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

      <EditModal open={showModal} onClose={() => setShowModal(false)} onSave={handleGuardar} editando={!!editingCliente} titulo={editingCliente ? "Editar reporte" : "Agregar nuevo reporte"} subtitulo="Ingresa los datos del reporte" btnTexto={editingCliente ? "Guardar cambios" : "Agregar reporte"} campos={FORM_CAMPOS} formData={formData} onChange={handleInputChange} />
      <ConfirmDeleteModal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setClienteToDelete(null); }} onConfirm={handleConfirmarEliminar} title="Eliminar reporte" subtitle="¿Deseas eliminar este reporte del sistema?">
        {clienteToDelete && (
          <div><p><strong>{clienteToDelete.poliza}</strong></p><p>Cliente: {clienteToDelete.cliente}</p></div>
        )}
      </ConfirmDeleteModal>
      <ClienteDetalleModal open={showDetalleModal} onClose={() => { setShowDetalleModal(false); setClienteDetalle(null); }} titulo={clienteDetalle ? `Reporte ${clienteDetalle.siniestro}` : ""} subtitulo={clienteDetalle ? `ID #${clienteDetalle.id}` : ""} avatar={clienteDetalle ? clienteDetalle.poliza.charAt(0) : ""} items={clienteDetalle ? [{ label: "# de Póliza", value: clienteDetalle.poliza }, { label: "Cliente", value: clienteDetalle.cliente }, { label: "Canal", value: clienteDetalle.canal }, { label: "# de Siniestro", value: clienteDetalle.siniestro }, { label: "Fecha del Reporte", value: clienteDetalle.fecha_reporte }, { label: "Fecha de Actualización", value: clienteDetalle.fecha_actualizacion }, { label: "Empleado", value: clienteDetalle.empleado }, { label: "Estatus", value: clienteDetalle.estatus }] : []} />
    </div>
  );
};

export default Reportes;