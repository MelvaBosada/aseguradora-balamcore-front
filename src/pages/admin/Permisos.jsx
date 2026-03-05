import { useState } from "react";
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon   from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import SearchIcon from "@mui/icons-material/Search";
import PrimaryButton      from "../../components/PrimaryButton";
import TablaForm          from "../../components/TablaForm";
import EditModal          from "../../components/EditModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Paginacion         from "../../components/Paginacion";
import "../../css/Clientes.css";

/* ─── CONFIG ─────────────────────────────────────────────────────── */


const campos   = [ "nombre", "descripcion"];
const columnas = ["Nombre", "Descripción", "Acciones"];

const FORM_CAMPOS = [
  { label: "Nombre del permiso", name: "nombre",      type: "text" },
  { label: "Descripción",        name: "descripcion", type: "text" },
];

const FORM_VACIO = { nombre: "", descripcion: "" };

/* ─── VISTA ──────────────────────────────────────────────────────── */
const Permisos = () => {
  const [permisos, setPermisos] = useState([
    { id: 1,  nombre: "Gestión de clientes",          descripcion: "Crear, editar y eliminar clientes"           },
    { id: 2,  nombre: "Gestión de pólizas",            descripcion: "Administrar pólizas del sistema"             },
    { id: 3,  nombre: "Ver reportes",                  descripcion: "Acceso a reportes y estadísticas"            },
    { id: 4,  nombre: "Gestión de siniestros",         descripcion: "Registrar y gestionar siniestros"            },
    { id: 5,  nombre: "Gestión de indemnizaciones",    descripcion: "Administrar indemnizaciones"                 },
    { id: 6,  nombre: "Administración de usuarios",    descripcion: "Crear y gestionar usuarios del sistema"      },
    { id: 7,  nombre: "Configuración del sistema",     descripcion: "Acceso a configuración general"              },
    { id: 8,  nombre: "Exportar documentos",           descripcion: "Generar y descargar documentos PDF"          },
  ]);

  const [showModal,       setShowModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permisoToDelete, setPermisoToDelete] = useState(null);
  const [editingPermiso,  setEditingPermiso]  = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [formData,        setFormData]        = useState(FORM_VACIO);
  const [searchTerm,      setSearchTerm]      = useState("");
// Cambia la constante por un estado
const [itemsPerPage, setItemsPerPage] = useState(8);


  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevo = () => {
    setEditingPermiso(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (permiso) => {
    setEditingPermiso(permiso);
    setFormData({ nombre: permiso.nombre, descripcion: permiso.descripcion });
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingPermiso) {
      setPermisos(permisos.map(p =>
        p.id === editingPermiso.id ? { ...p, ...formData } : p
      ));
    } else {
      const newId = Math.max(...permisos.map(p => p.id), 0) + 1;
      setPermisos([...permisos, { id: newId, ...formData }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick     = (p) => { setPermisoToDelete(p); setShowDeleteModal(true); };
  const handleConfirmarEliminar = () => {
    setPermisos(permisos.filter(p => p.id !== permisoToDelete.id));
    setShowDeleteModal(false);
    setPermisoToDelete(null);
  };

  const filtered   = permisos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Recalcula con el estado
const totalPages = Math.ceil(filtered.length / itemsPerPage);
const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Permisos</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
         <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar permiso..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <PrimaryButton text="Nuevo permiso" icon={<AddCircleOutlinedIcon />} onClick={handleNuevo} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            { titulo: "Editar",   clase: "tabla-btn-edit", icono: <EditIcon   fontSize="small" />, onClick: handleEditar        },
            { titulo: "Eliminar", clase: "tabla-btn-del",  icono: <DeleteIcon fontSize="small" />, onClick: handleEliminarClick },
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

      {/* Modal nuevo/editar — reutiliza EditModal */}
      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingPermiso}
        titulo={editingPermiso ? "Editar permiso" : "Nuevo permiso"}
        subtitulo={editingPermiso ? "Modifica los datos del permiso" : "Ingresa los datos del nuevo permiso"}
        btnTexto={editingPermiso ? "Guardar cambios" : "Crear permiso"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      {/* Modal eliminar — reutiliza ConfirmDeleteModal */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setPermisoToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar permiso"
        subtitle="¿Deseas eliminar este permiso del sistema?"
      >
        {permisoToDelete && (
          <div>
            <p><strong>{permisoToDelete.nombre}</strong></p>
            <p>ID: {permisoToDelete.id}</p>
            <p>{permisoToDelete.descripcion}</p>
          </div>
        )}
      </ConfirmDeleteModal>
    </div>
  );
};

export default Permisos;
