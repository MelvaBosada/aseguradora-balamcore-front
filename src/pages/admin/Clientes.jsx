import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const campos = ["rfc", "nombre", "apellido", "telefono", "correo"];
const columnas = ["RFC", "Nombre", "Apellido(s)", "Teléfono", "Correo", "Acciones"];

// Campos del formulario con valores por defecto
const FORM_CAMPOS = [
  { label: "Nombre", name: "nombre", type: "text", required: true },
  { label: "Apellido", name: "apellido", type: "text", required: true },
  { label: "RFC", name: "rfc", type: "text", required: true },
  { label: "CURP", name: "curp", type: "text", required: true },
  { label: "Teléfono", name: "telefono", type: "text", required: true },
  { label: "Correo", name: "correo", type: "email", required: true },
  { label: "Fecha de nacimiento", name: "fecha_nacimiento", type: "date", required: true },
  { label: "Género", name: "genero", type: "select", options: ["masculino", "femenino", "otro"], required: true, defaultValue: "masculino" },
  { label: "Estado civil", name: "estado_civil", type: "select", options: ["soltero", "casado", "divorciado", "viudo", "union_libre"], required: true, defaultValue: "soltero" },
  { label: "Nacionalidad", name: "nacionalidad", type: "text", defaultValue: "Mexicana" },
  { label: "Tipo identificación", name: "tipo_identificacion", type: "select", options: ["ine", "pasaporte", "cedula_profesional", "licencia"], required: true, defaultValue: "ine" },
  { label: "Número identificación", name: "numero_identificacion", type: "text", required: true },
  { label: "Domicilio", name: "domicilio", type: "text", required: true },
  { label: "Municipio", name: "municipio", type: "text", required: true },
  { label: "Estado", name: "estado", type: "text", required: true },
  { label: "Código postal", name: "codigo_postal", type: "text", required: true },
  { label: "Ocupación", name: "ocupacion", type: "text", required: true },
  { label: "Teléfono alternativo", name: "telefono_alternativo", type: "text" },
];

const FORM_VACIO = { 
  nombre: "", 
  apellido: "", 
  telefono: "", 
  curp: "", 
  rfc: "", 
  domicilio: "", 
  correo: "", 
  fecha_nacimiento: "",
  genero: "masculino",
  estado_civil: "soltero",
  nacionalidad: "Mexicana",
  tipo_identificacion: "ine",
  numero_identificacion: "",
  telefono_alternativo: "",
  municipio: "",
  estado: "",
  codigo_postal: "",
  ocupacion: ""
};

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

  // ✅ CORRECCIÓN: useCallback con las dependencias correctas
  const cargarClientes = useCallback(async () => {
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClientes(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage]); // ✅ mismas deps que el useEffect original

  // ✅ CORRECCIÓN: cargarClientes incluida en el array de dependencias
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setFormData({ ...FORM_VACIO });
    setShowModal(true);
  };

  const handleEditar = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      curp: cliente.curp || "",
      rfc: cliente.rfc || "",
      domicilio: cliente.domicilio || "",
      correo: cliente.correo || "",
      fecha_nacimiento: cliente.fecha_nacimiento || "",
      genero: cliente.genero || "masculino",
      estado_civil: cliente.estado_civil || "soltero",
      nacionalidad: cliente.nacionalidad || "Mexicana",
      tipo_identificacion: cliente.tipo_identificacion || "ine",
      numero_identificacion: cliente.numero_identificacion || "",
      telefono_alternativo: cliente.telefono_alternativo || "",
      municipio: cliente.municipio || "",
      estado: cliente.estado || "",
      codigo_postal: cliente.codigo_postal || "",
      ocupacion: cliente.ocupacion || ""
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar campos requeridos
      const requiredFields = ['nombre', 'apellido', 'rfc', 'curp', 'telefono', 'correo', 'fecha_nacimiento', 'genero', 'estado_civil', 'tipo_identificacion', 'numero_identificacion', 'domicilio', 'municipio', 'estado', 'codigo_postal', 'ocupacion'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        alert(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        return;
      }
      
      const clienteData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        curp: formData.curp,
        rfc: formData.rfc,
        domicilio: formData.domicilio,
        correo: formData.correo,
        fecha_nacimiento: formData.fecha_nacimiento,
        genero: formData.genero,
        estado_civil: formData.estado_civil,
        nacionalidad: formData.nacionalidad || "Mexicana",
        tipo_identificacion: formData.tipo_identificacion,
        numero_identificacion: formData.numero_identificacion,
        telefono_alternativo: formData.telefono_alternativo || null,
        municipio: formData.municipio,
        estado: formData.estado,
        codigo_postal: formData.codigo_postal,
        ocupacion: formData.ocupacion
      };

      if (editingCliente) {
        await axios.put(`${API_URL}/clientes/${editingCliente.id}`, clienteData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/clientes`, clienteData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      cargarClientes();
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
          headers: { Authorization: `Bearer ${token}` }
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

 const handleVerDetalle = (cliente) => { 
  // El cliente ya tiene todos los campos porque vienen del index
  console.log('Cliente completo:', cliente); // Verifica que tenga todos los campos
  setClienteDetalle(cliente); 
  setShowDetalleModal(true); 
};

  const handleSearch = (e) => { 
    setSearchTerm(e.target.value); 
    setCurrentPage(1); 
  };

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
      <h1 className="h2 fw-bold mb-3">Listado clientes</h1>
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
        cliente={clienteDetalle}
    />
    </div>
  );
};

export default Clientes;
