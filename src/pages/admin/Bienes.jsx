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


const campos = ["numerop", "tipo", "modelo", "descripcion", "estatus"];
const columnas = ["# de Poliza", "Tipo", "Modelo",  "Descripción","Estatus",  "Acciones"];

// Campos del formulario — se pasan al EditModal genérico
const FORM_CAMPOS = [
  { label: "# de Poliza", name: "numerop", type: "text" },
  { label: "Tipo", name: "tipo", type: "text" },
  { label: "Marca", name: "marca", type: "text" },
  { label: "Modelo", name: "modelo", type: "text" },
  { label: "# de Serie", name: "serie", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  { label: "Valor", name: "valor", type: "number" },
  { label: "Fecha Adquisición", name: "fecha_adquisicion", type: "date" },
  { label: "Estatus", name: "estatus", type: "text" },
];

const FORM_VACIO = { numerop: "", tipo: "", marca: "", modelo: "", serie: "", descripcion: "", valor: "",fecha_adquisicion:"", estatus: ""};

const Bienes = () => {
  const [clientes, setClientes] = useState([
  { id: 1, numerop: "POL-2026-0156", tipo: "Electronico", marca: "Samsung", modelo: "QN55/X13", serie: "AB123CDE67", descripcion:"Televisor Samsung de 50''", valor:"$7,499", fecha_adquisicion:"05-04-2025", estatus:"Activo"},

  { id: 2, numerop: "POL-2026-0157", tipo: "Electrodoméstico", marca: "LG", modelo: "WM4000HWA", serie: "LG5678ZXCV", descripcion:"Lavadora automática LG 22kg", valor:"$12,300", fecha_adquisicion:"18-06-2024", estatus:"Activo"},

  { id: 3, numerop: "POL-2026-0158", tipo: "Electrónico", marca: "Sony", modelo: "PS5 Digital", serie: "SN9987PLMK", descripcion:"Consola Sony PlayStation 5 edición digital", valor:"$13,999", fecha_adquisicion:"12-11-2024", estatus:"Activo"},

  { id: 4, numerop: "POL-2026-0159", tipo: "Equipo de cómputo", marca: "Dell", modelo: "XPS 15 9520", serie: "DL7788XPS1", descripcion:"Laptop Dell XPS 15 con 16GB RAM", valor:"$35,500", fecha_adquisicion:"02-02-2025", estatus:"Pendiente"},

  { id: 5, numerop: "POL-2026-0160", tipo: "Electrónico", marca: "Apple", modelo: "iPhone 14 Pro", serie: "APL4455IP14", descripcion:"Teléfono inteligente Apple iPhone 14 Pro 256GB", valor:"$24,999", fecha_adquisicion:"28-09-2024", estatus:"Activo"},

  { id: 6, numerop: "POL-2026-0166", tipo: "Inmueble", marca: "Casa Habitación", modelo: "2 plantas", serie: "INM001234", descripcion:"Casa habitación de 2 plantas con 3 recámaras", valor:"$1,850,000", fecha_adquisicion:"14-02-2020", estatus:"Activo"},

  { id: 7, numerop: "POL-2026-0167", tipo: "Inmueble", marca: "Departamento", modelo: "Condominio", serie: "INM005678", descripcion:"Departamento en condominio con 2 recámaras", valor:"$1,200,000", fecha_adquisicion:"30-09-2021", estatus:"Activo"},

  { id: 8, numerop: "POL-2026-0168", tipo: "Vehículo", marca: "Toyota", modelo: "Corolla 2022", serie: "JTDBR32E720123456", descripcion:"Automóvil Toyota Corolla modelo 2022", valor:"$420,000", fecha_adquisicion:"18-05-2022", estatus:"Activo"},

  { id: 9, numerop: "POL-2026-0169", tipo: "Equipo de cómputo", marca: "Lenovo", modelo: "ThinkPad T14", serie: "LN8899TP14", descripcion:"Laptop Lenovo ThinkPad T14 para uso empresarial", valor:"$28,500", fecha_adquisicion:"11-10-2024", estatus:"Pendiente"},

  { id: 10, numerop: "POL-2026-0170", tipo: "Inmueble", marca: "Local Comercial", modelo: "Planta baja", serie: "INM009999", descripcion:"Local comercial en plaza con área de 60m2", valor:"$2,300,000", fecha_adquisicion:"03-06-2019", estatus:"Activo"},
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
      c.numerop.toLowerCase().includes(q) ||
      c.tipo.toLowerCase().includes(q) ||
      c.marca.includes(searchTerm) ||
      c.modelo.toLowerCase().includes(q) ||
      c.serie.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.valor.toLowerCase().includes(q) ||
      c.fecha_adquisicion.toLowerCase().includes(q) ||
      c.estatus.toLowerCase().includes(q)
    );
  });

  // Recalcula con el estado
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginated = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleVerDetalle = (c) => { setClienteDetalle(c); setShowDetalleModal(true); };

  const detalleItems = clienteDetalle
  ? [
      {label: "# de Póliza", value: clienteDetalle.numerop },
      {label: "Tipo", value: clienteDetalle.tipo },
      {label: "Marca", value: clienteDetalle.marca },
      {label: "Modelo", value: clienteDetalle.modelo },
      {label: "# de Serie", value: clienteDetalle.serie },
      {label: "Descripción", value: clienteDetalle.descripcion },
      {label: "Valor", value: clienteDetalle.valor },
      { label: "Fecha de adquisición", value: clienteDetalle.fecha_adquisicion },
      { label: "Estatus", value: clienteDetalle.estatus }
    ]
  : [];

  return (
    <div className="container py-4">

      <h1 className="h2 fw-bold mb-3">Bienes asegurados</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar bienes asegrados..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <PrimaryButton text="Nuevo bien asegurado" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoCliente} />
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

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingCliente}
        titulo={editingCliente ? "Editar bien asegurado" : "Agregar nuevo bien asegurado"}
        subtitulo={editingCliente ? "Modifica los datos del bien asegurado" : "Ingresa los datos para registrar bien asegurado"}
        btnTexto={editingCliente ? "Guardar cambios" : "Agregar bien asegurado"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setClienteToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar bien asegurado"
        subtitle="¿Deseas eliminar este bien asegurado del sistema?"
      >
        {clienteToDelete && (
          <div>
            <p><strong>{clienteToDelete.numerop}</strong></p>
            <p>Descripción: {clienteToDelete.descripcion}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setClienteDetalle(null); }}
        titulo={clienteDetalle ? `Póliza ${clienteDetalle.numerop}` : ""}
        subtitulo={clienteDetalle ? `ID #${clienteDetalle.id}` : ""}
        avatar={clienteDetalle ? clienteDetalle.numerop.charAt(0) : ""}
        items={detalleItems}
      /> 
    </div>
  );
};

export default Bienes;
