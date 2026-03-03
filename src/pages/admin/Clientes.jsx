import { useState } from 'react';
import '../../css/Clientes.css';

import AddIcon from "@mui/icons-material/Add";
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
  const [clientes, setClientes] = useState([
    { id: 1, nombre: "Maria", apellido: "Mendez Gonzales", telefono: "9993456789", curp: "SIE884FGHTI59R3G", rfc: "4DFGT3456JGF", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 2, nombre: "Juan Carlos", apellido: "Gonzales Martinez", telefono: "8994567812", curp: "DHFG5678ORE34RD", rfc: "SGD5651100IUU", domicilio: "Calle 90", correo: "ejemplo@gmail.com" },
    { id: 3, nombre: "Jacob M.", apellido: "Mendoza Torres", telefono: "9993456789", curp: "UY4S322FGHT9670K", rfc: "ILIT5411034", domicilio: "Avenida", correo: "ejemplo@gmail.com" },
    { id: 4, nombre: "Miguel", apellido: "Torres Martinez", telefono: "9993459876", curp: "SDG3456JGHC3456", rfc: "JF5673112DCS", domicilio: "Circuito", correo: "ejemplo@gmail.com" },
    { id: 5, nombre: "Angel", apellido: "Torres Uc", telefono: "9990340567", curp: "SDG456FKH789WSDF", rfc: "DFS234519076", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 6, nombre: "Maria", apellido: "Mendez Gonzales ", telefono: "9993456789", curp: "SIE884FGHTI59R3G", rfc: "4DFGT3456JGF", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 7, nombre: "Juan Carlos", apellido: "Gonzales Gutierrez", telefono: "8994567812", curp: "DHFG5678ORE34RD", rfc: "SGD5651100IUU", domicilio: "Calle 90", correo: "ejemplo@gmail.com" },
    { id: 8, nombre: "Jacob M.", apellido: "Mendoza Navejas", telefono: "9993456789", curp: "UY4S322FGHT9670K", rfc: "ILIT5411034", domicilio: "Avenida", correo: "ejemplo@gmail.com" },
    { id: 9, nombre: "Miguel", apellido: "Torres Gomez", telefono: "9993459876", curp: "SDG3456JGHC3456", rfc: "JF5673112DCS", domicilio: "Circuito", correo: "ejemplo@gmail.com" },
    { id: 10, nombre: "Angel", apellido: "Torres Uc", telefono: "9990340567", curp: "SDG456FKH789WSDF", rfc: "DFS234519076", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 11, nombre: "Angel", apellido: "Torres Tec", telefono: "9990340567", curp: "SDG456FKH789WSDF", rfc: "DFS234519076", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 12, nombre: "Maria", apellido: "Mendez Hernandez", telefono: "9993456789", curp: "SIE884FGHTI59R3G", rfc: "4DFGT3456JGF", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
    { id: 13, nombre: "Juan Carlos", apellido: "Gonzales Lizama", telefono: "8994567812", curp: "DHFG5678ORE34RD", rfc: "SGD5651100IUU", domicilio: "Calle 90", correo: "ejemplo@gmail.com" },
    { id: 14, nombre: "Jacob M.", apellido: "Mendoza Uc", telefono: "9993456789", curp: "UY4S322FGHT9670K", rfc: "ILIT5411034", domicilio: "Avenida", correo: "ejemplo@gmail.com" },
    { id: 15, nombre: "Miguel", apellido: "Torres Uc", telefono: "9993459876", curp: "SDG3456JGHC3456", rfc: "JF5673112DCS", domicilio: "Circuito", correo: "ejemplo@gmail.com" },
    { id: 16, nombre: "Angel", apellido: "Torres Tec", telefono: "9990340567", curp: "SDG456FKH789WSDF", rfc: "DFS234519076", domicilio: "Calle 50", correo: "ejemplo@gmail.com" },
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
  const [itemsPerPage, setItemsPerPage] = useState(8);

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
  const handleVerDetalle = (c) => { setClienteDetalle(c); setShowDetalleModal(true); };

  const filteredClientes = clientes.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.telefono.includes(searchTerm) ||
      c.correo.toLowerCase().includes(q) ||
      c.rfc.toLowerCase().includes(q)
    );
  });

  // Recalcula con el estado
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginated = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const detalleItems = clienteDetalle ? [
    { icon: <PersonIcon />, label: "Nombre completo", value: `${clienteDetalle.nombre} ${clienteDetalle.apellido}` },
    { icon: <PhoneIcon />, label: "Teléfono", value: clienteDetalle.telefono },
    { icon: <EmailIcon />, label: "Correo", value: clienteDetalle.correo },
    { icon: <HomeIcon />, label: "Domicilio", value: clienteDetalle.domicilio },
    { icon: <BadgeIcon />, label: "CURP", value: clienteDetalle.curp },
    { icon: <BadgeIcon />, label: "RFC", value: clienteDetalle.rfc },
  ] : [];

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
        <PrimaryButton text="Nuevo cliente" icon={<AddIcon />} onClick={handleNuevoCliente} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
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
