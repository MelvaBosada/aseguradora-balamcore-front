import { useState } from 'react';
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


const campos = ["nombre", "descripcion", "monto", "deducible", "estatus"];
const columnas = ["Nombre", "Descripción", "Monto", "Deducible", "Estatus", "Acciones"];

// Campos del formulario — se pasan al EditModal genérico
const FORM_CAMPOS = [
  { label: "Nombre", name: "nombre", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  { label: "Monto", name: "monto", type: "text" },
  { label: "Deducible", name: "deducible", type: "text" },
  { label: "Estatus", name: "estatus", type: "text" },
];

const FORM_VACIO = { nombre: "", descripcion: "", monto: "", deducible: "", estatus: ""};

const Cobertura = () => {
  const [clientes, setClientes] = useState([
    { id: 1, nombre: "Incendio y Rayo", descripcion: "Protección contra daños por fuego.", monto: "$1,500,000", deducible: "5% del valor del daño", estatus: "Activo"},
    { id: 2, nombre: "Responsabilidad Civil", descripcion: "Cubre daños a terceros, incluyendo empleados domésticos.", monto: "$1,000,000", deducible: "Sin deducible o $1,000 – $5,000", estatus: "Activo"},
    { id: 3, nombre: "Robo y Asalto", descripcion: "Protege pertenencias y daños durante el robo.", monto: "$200,000", deducible: "$1,000 – $5,000", estatus: "Activo"},
    { id: 4, nombre: "Daños por Agua", descripcion: "Fugas de agua, tuberías rotas.", monto: "$1,000,000", deducible: "Sin deducible o $1,000 – $5,000", estatus: "Activo"},
    { id: 5, nombre: "Fenómenos Naturales", descripcion: "Terremotos, huracanes, granizo, inundaciones.", monto: "$1,500,000", deducible: "5% – 10% del valor asegurado", estatus: "Activo"},
    { id: 6, nombre: "Cristales", descripcion: "Reposición de vidrios y espejos.", monto: "$30,000", deducible: "$500 – $1,000", estatus: "Activo"},
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
  // Cambia la constante por un estado
  const [itemsPerPage, setItemsPerPage] = useState(5);
 

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const ESTATUS_OPTIONS = ["Todos", "Activo", "Pendiente", "Rechazado", "Procesando", "Cancelado", "Devuelto", "Fallido"];

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
      setClientes(clientes.map(c => c.id === editingCliente.id ? { ...formData, id: editingCliente.id } : c));
    } else {
      const newId = Math.max(...clientes.map(c => c.id), 0) + 1;
      setClientes([...clientes, { ...formData, id: newId }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick = (c) => { setClienteToDelete(c); setShowDeleteModal(true); };
  const handleConfirmarEliminar = () => {
    if (clienteToDelete) {
      setClientes(clientes.filter(c => c.id !== clienteToDelete.id));
      setShowDeleteModal(false);
      setClienteToDelete(null);
    }
  };

  [/*const handleVerDetalle = (c) => { setClienteDetalle(c); setShowDetalleModal(true); };*/]

  const filteredClientes = clientes.filter(c => {
    const q= searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.monto.includes(searchTerm) ||
      c.deducible.toLowerCase().includes(q) ||
      c.estatus.toLowerCase().includes(q)
    );
  });

  // Recalcula con el estado
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginated = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  return (
    <div className="container py-4">

      <h1 className="h2 fw-bold mb-3">Listado de Coberturas</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar cobertura..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <PrimaryButton text="Nueva Cobertura" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoCliente} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
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
        titulo={editingCliente ? "Editar cobertura" : "Agregar nueva cobertura"}
        subtitulo={editingCliente ? "Modifica los datos de la cobertura" : "Ingresa los datos para registrar la cobertura"}
        btnTexto={editingCliente ? "Guardar cambios" : "Agregar cobertura"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setClienteToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar cobertura"
        subtitle="¿Deseas eliminar esta cobertura del sistema?"
      >
        {clienteToDelete && (
          <div>
            <p><strong>{clienteToDelete.nombre}</strong></p>
            <p>Descripción: {clienteToDelete.descripcion}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setClienteDetalle(null); }}
        titulo={clienteDetalle ? `${clienteDetalle.nombre} ${clienteDetalle.apellido}` : ""}
        subtitulo={clienteDetalle ? `ID #${clienteDetalle.id}` : ""}
        avatar={clienteDetalle ? `${clienteDetalle.nombre.charAt(0)}${clienteDetalle.apellido.charAt(0)}` : ""}
      />

    </div>
  );
};

export default Cobertura;
