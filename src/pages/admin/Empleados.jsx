import { useState } from 'react';
import '../../css/Clientes.css';

import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import BadgeIcon from "@mui/icons-material/Badge";

const campos = ["nombre", "apellido","curp", "telefono", "correo"];
const columnas = ["Nombre(s)", "Apellido(s)","CURP","Telefono", "Correo", "Acciones"];

const FORM_CAMPOS = [
  { label: "Nombre", name: "nombre", type: "text" },
  { label: "Apellido", name: "apellido", type: "text" },
  { label: "Fecha de nacimiento", name: "fecha_nacimiento", type: "date" },
  { label: "CURP", name: "curp", type: "text" },
  { label: "NSS", name: "nss", type: "text" },
  { label: "RFC", name: "rfc", type: "text" },
  { label: "Telefono", name: "telefono", type: "text" },
  { label: "Direccion", name: "direccion", type: "text" },
  { label: "Correo", name: "correo", type: "email" },
];

const FORM_VACIO = { nombre: "", apellido: "", fecha_nacimiento: "", curp: "", nss: "", rfc: "", telefono: "", direccion: "", correo: "" };

const Empleados = () => {
  const [clientes, setClientes] = useState([
    { id: 1, nombre: "Julian", apellido: "Chas", fecha_nacimiento: "11-09-2000", curp: "2RWTYH", nss: "345678", rfc: "DFRT56789", telefono: "9996184111", direccion: "Avenida 200", correo: "juliancito@gmail.com" },
    { id: 2, nombre: "Luis Humberto", apellido: "Navejas", fecha_nacimiento: "14-05-1990", curp: "FG567H11", nss: "345098", rfc: "W3ETYUGTF", telefono: "9991234567", direccion: "Circuito", correo: "thebestmejorxd@gmail.com" },
    { id: 3, nombre: "Ana", apellido: "García", fecha_nacimiento: "22-03-1995", curp: "GARC950322", nss: "112233", rfc: "GAA950322XYZ", telefono: "9998765432", direccion: "Calle 50", correo: "ana.garcia@gmail.com" },
    { id: 4, nombre: "Carlos", apellido: "López", fecha_nacimiento: "05-11-1988", curp: "LOPC881105", nss: "445566", rfc: "LOC881105ABC", telefono: "9992345678", direccion: "Calle 10", correo: "carlos.lopez@yahoo.com" },
    { id: 5, nombre: "María", apellido: "Rodríguez", fecha_nacimiento: "30-07-1992", curp: "RODM920730", nss: "778899", rfc: "ROM920730DEF", telefono: "9993456789", direccion: "Avenida 30", correo: "maria.rod@hotmail.com" },
    { id: 6, nombre: "Jorge", apellido: "Martínez", fecha_nacimiento: "12-01-1998", curp: "MARJ980112", nss: "990011", rfc: "MAJ980112GHI", telefono: "9994567890", direccion: "Calle 80", correo: "jorge.mtz@gmail.com" },
    { id: 7, nombre: "Elena", apellido: "Sánchez", fecha_nacimiento: "19-06-1993", curp: "SAEE930619", nss: "223344", rfc: "SAE930619JKL", telefono: "9995678901", direccion: "Calle 25", correo: "elena.sanchez@outlook.com" },
    { id: 8, nombre: "Ricardo", apellido: "Díaz", fecha_nacimiento: "08-04-1985", curp: "DIAR850408", nss: "556677", rfc: "DIR850408MNO", telefono: "9996789012", direccion: "Avenida 100", correo: "richi.diaz@gmail.com" },
    { id: 9, nombre: "Sofía", apellido: "Ramírez", fecha_nacimiento: "27-09-1996", curp: "RASO960927", nss: "889900", rfc: "SAR960927PQR", telefono: "9997890123", direccion: "Calle 15", correo: "sofia.ram@gmail.com" },
    { id: 10, nombre: "Fernando", apellido: "Pérez", fecha_nacimiento: "15-12-1991", curp: "PEAF911215", nss: "334455", rfc: "PEF911215STU", telefono: "9998901234", direccion: "Calle 40", correo: "fer.perez@live.com" }
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const filteredClientes = clientes.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.curp.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginated = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleVerDetalle = (c) => { setClienteDetalle(c); setShowDetalleModal(true); };

  const detalleItems = clienteDetalle
    ? [
        {icon: <PersonIcon />, label: "Nombre", value: clienteDetalle.nombre },
        {icon: <PersonIcon />, label: "Apellido", value: clienteDetalle.apellido },
        {icon: <PersonIcon />, label: "Fecha de nacimiento", value: clienteDetalle.fecha_nacimiento },
        {icon: <BadgeIcon />, label: "CURP", value: clienteDetalle.curp },
        {icon: <BadgeIcon />, label: "NSS", value: clienteDetalle.nss },
        {icon: <BadgeIcon />, label: "RFC", value: clienteDetalle.rfc },
        {icon: <PhoneIcon />, label: "Telefono", value: clienteDetalle.telefono },
        {icon: <HomeIcon />,  label: "Direccion", value: clienteDetalle.direccion },
        {icon: <EmailIcon />, label: "Correo", value: clienteDetalle.correo }
      ]
    : [];

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Empleados</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input type="text" className="search-custom" placeholder="Buscar empleados..." value={searchTerm} onChange={handleSearch} />
          </div>
        </div>
        <PrimaryButton text="Nuevo empleado" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoCliente} />
      </div>

      <div className="mb-4">
        <TablaForm columna={columnas} data={paginated} campos={campos} acciones={[{ titulo: "Ver", clase: "tabla-btn-ver", icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle }, { titulo: "Editar", clase: "tabla-btn-edit", icono: <EditIcon fontSize="small" />, onClick: handleEditar }, { titulo: "Eliminar", clase: "tabla-btn-del", icono: <DeleteIcon fontSize="small" />, onClick: handleEliminarClick }]} />
      </div>

      <Paginacion currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />

      <EditModal open={showModal} onClose={() => setShowModal(false)} onSave={handleGuardar} editando={!!editingCliente} titulo={editingCliente ? "Editar empleado" : "Agregar nuevo empleado"} subtitulo={editingCliente ? "Modifica los datos del empleado" : "Ingresa los datos para registrar empleado"} btnTexto={editingCliente ? "Guardar cambios" : "Agregar empleado"} campos={FORM_CAMPOS} formData={formData} onChange={handleInputChange} />

      <ConfirmDeleteModal open={showDeleteModal} onClose={() => { 
        setShowDeleteModal(false);
         setClienteToDelete(null);
        }}
         onConfirm={handleConfirmarEliminar} title="Eliminar empleado" subtitle="¿Deseas eliminar este empleado del sistema?">
        {clienteToDelete && (
            <div>
                <p><strong>{clienteToDelete.nombre}{clienteToDelete.apellido}</strong></p>
                <p>ID: #{clienteToDelete.id}</p>
                <p>Teléfono: {clienteToDelete.telefono}</p>
                <p>Correo: {clienteToDelete.correo}</p>
            </div>

            )}
        
      </ConfirmDeleteModal>

      <ClienteDetalleModal open={showDetalleModal} onClose={() => { setShowDetalleModal(false); setClienteDetalle(null); }} titulo={clienteDetalle ? `Empleado ${clienteDetalle.nombre}` : ""} subtitulo={clienteDetalle ? `ID #${clienteDetalle.id}` : ""} avatar={clienteDetalle ? clienteDetalle.nombre.charAt(0) : ""} items={detalleItems} />
    </div>
  );
};

export default Empleados;