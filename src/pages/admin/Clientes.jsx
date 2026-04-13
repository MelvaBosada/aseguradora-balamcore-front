import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const campos = ["rfc", "nombre", "apellido", "telefono", "correo"];
const columnas = ["RFC", "Nombre", "Apellido(s)", "Teléfono", "Correo", "Acciones"];

// Campos del formulario — se pasan al EditModal genérico
const FORM_CAMPOS = [
  { label: "RFC", name: "rfc", type: "text" },
  { label: "Nombre", name: "nombre", type: "text" },
  { label: "Apellido", name: "apellido", type: "text" },
  { label: "Teléfono", name: "telefono", type: "text" },
  { label: "Fecha Alta", name: "fechaAlta", type: "date" },
  { label: "Correo", name: "correo", type: "email" },
  { label: "Domicilio", name: "domicilio", type: "text" },
  { label: "CURP", name: "curp", type: "text" },
];

const FORM_VACIO = { nombre: "", apellido: "", telefono: "", curp: "", rfc: "", domicilio: "", correo: "", fechaAlta: "" };

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Configurar headers con token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Cargar clientes desde API
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/clientes`, {
        params: { 
          page: currentPage, 
          search: searchTerm, 
          estatus: estatusFilter, 
          per_page: itemsPerPage 
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setClientes(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      if (error.response?.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes cuando cambien los filtros o la página
  useEffect(() => {
    cargarClientes();
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      curp: cliente.curp,
      rfc: cliente.rfc,
      domicilio: cliente.domicilio,
      correo: cliente.correo,
      fechaAlta: cliente.fechaAlta || ""
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (editingCliente) {
        // Actualizar cliente existente
        await axios.put(`${API_URL}/clientes/${editingCliente.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Crear nuevo cliente
        await axios.post(`${API_URL}/clientes`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      setShowModal(false);
      cargarClientes(); // Recargar lista
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors || 'Error al guardar cliente';
      alert(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleEliminarClick = (c) => { 
    setClienteToDelete(c); 
    setShowDeleteModal(true); 
  };

  const handleConfirmarEliminar = async () => {
    if (clienteToDelete) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/clientes/${clienteToDelete.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setShowDeleteModal(false);
        setClienteToDelete(null);
        cargarClientes();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert(error.response?.data?.message || 'Error al eliminar cliente');
      }
    }
  };

  const handleVerDetalle = (c) => { 
    setClienteDetalle(c); 
    setShowDetalleModal(true); 
  };

  const handleSearch = (e) => { 
    setSearchTerm(e.target.value); 
    setCurrentPage(1); 
  };

  const detalleItems = clienteDetalle ? [
    { icon: <PersonIcon />, label: "Nombre completo", value: `${clienteDetalle.nombre} ${clienteDetalle.apellido}` },
    { icon: <PhoneIcon />, label: "Teléfono", value: clienteDetalle.telefono },
    { icon: <EmailIcon />, label: "Correo", value: clienteDetalle.correo },
    { icon: <HomeIcon />, label: "Domicilio", value: clienteDetalle.domicilio },
    { icon: <BadgeIcon />, label: "CURP", value: clienteDetalle.curp },
    { icon: <BadgeIcon />, label: "RFC", value: clienteDetalle.rfc },
  ] : [];

  if (loading && clientes.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">

      <h1 className="h2 fw-bold mb-3">Clientes</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar cliente..."
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
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>

        <PrimaryButton text="Nuevo cliente" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoCliente} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={clientes}
          campos={campos}
          acciones={[
            { titulo: "Ver", clase: "tabla-btn-ver", icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle },
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

      {/* EditModal genérico — todo viene desde aquí */}
      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingCliente}
        titulo={editingCliente ? "Editar cliente" : "Agregar nuevo cliente"}
        subtitulo={editingCliente ? "Modifica los datos del cliente" : "Ingresa los datos para registrar al cliente"}
        btnTexto={editingCliente ? "Guardar cambios" : "Agregar cliente"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setClienteToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar cliente"
        subtitle="¿Deseas eliminar este cliente del sistema?"
      >
        {clienteToDelete && (
          <div>
            <p><strong>{clienteToDelete.nombre} {clienteToDelete.apellido}</strong></p>
            <p>ID: {clienteToDelete.id}</p>
            <p>Teléfono: {clienteToDelete.telefono}</p>
            <p>Correo: {clienteToDelete.correo}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setClienteDetalle(null); }}
        titulo={clienteDetalle ? `${clienteDetalle.nombre} ${clienteDetalle.apellido}` : ""}
        subtitulo={clienteDetalle ? `ID #${clienteDetalle.id}` : ""}
        avatar={clienteDetalle ? `${clienteDetalle.nombre.charAt(0)}${clienteDetalle.apellido.charAt(0)}` : ""}
        items={detalleItems}
      />

    </div>
  );
};

export default Clientes;