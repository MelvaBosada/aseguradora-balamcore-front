import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import EditModal from "../../components/EditModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import AsignarPermisosModal from "../../components/AsignarPermisosModal";
import Paginacion from "../../components/Paginacion";
import "../../css/Clientes.css";

/* ─── CONFIG ─────────────────────────────────────────────────────── */

const campos = ["id", "nombre"];
const columnas = ["ID", "Nombre", "Acciones"];

const FORM_CAMPOS = [
  { label: "Nombre del perfil", name: "nombre", type: "text" },
];

const FORM_VACIO = { nombre: "" };

/* Lista de permisos del sistema — en producción viene de la vista Permisos */
const PERMISOS_DISPONIBLES = [
  "Gestión de clientes",
  "Gestión de pólizas",
  "Ver reportes",
  "Gestión de siniestros",
  "Gestión de indemnizaciones",
  "Administración de usuarios",
  "Configuración del sistema",
  "Exportar documentos",
];

/* ─── VISTA ──────────────────────────────────────────────────────── */
const Perfiles = () => {
  const [perfiles, setPerfiles] = useState([
    { id: 1, nombre: "Administrador", permisos: ["Gestión de clientes", "Gestión de pólizas", "Administración de usuarios"] },
    { id: 2, nombre: "Ajustador", permisos: ["Gestión de siniestros", "Gestión de indemnizaciones", "Ver reportes"] },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState(null);
  const [perfilPermisos, setPerfilPermisos] = useState(null);
  const [editingPerfil, setEditingPerfil] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  // Cambia la constante por un estado
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevo = () => {
    setEditingPerfil(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (perfil) => {
    setEditingPerfil(perfil);
    setFormData({ nombre: perfil.nombre });
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingPerfil) {
      setPerfiles(perfiles.map(p =>
        p.id === editingPerfil.id ? { ...p, nombre: formData.nombre } : p
      ));
    } else {
      const newId = Math.max(...perfiles.map(p => p.id), 0) + 1;
      setPerfiles([...perfiles, { id: newId, nombre: formData.nombre, permisos: [] }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick = (p) => { setPerfilToDelete(p); setShowDeleteModal(true); };
  const handleConfirmarEliminar = () => {
    setPerfiles(perfiles.filter(p => p.id !== perfilToDelete.id));
    setShowDeleteModal(false);
    setPerfilToDelete(null);
  };

  const handleAsignarPermisos = (perfil) => { setPerfilPermisos(perfil); setShowPermisosModal(true); };
  const handleGuardarPermisos = (nuevosPermisos) => {
    setPerfiles(perfiles.map(p =>
      p.id === perfilPermisos.id ? { ...p, permisos: nuevosPermisos } : p
    ));
    setShowPermisosModal(false);
    setPerfilPermisos(null);
  };

  // Recalcula con el estado — reemplaza las dos líneas con filtered
const totalPages = Math.ceil(perfiles.length / itemsPerPage);
const paginated  = perfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Perfiles</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-end mb-4">
        <PrimaryButton text="Nuevo perfil" icon={<AddIcon />} onClick={handleNuevo} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            { titulo: "Asignar permisos", clase: "tabla-btn-ver", icono: <LockOpenIcon fontSize="small" />, onClick: handleAsignarPermisos },
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
        editando={!!editingPerfil}
        titulo={editingPerfil ? "Editar perfil" : "Nuevo perfil"}
        subtitulo={editingPerfil ? "Modifica el nombre del perfil" : "Ingresa el nombre del nuevo perfil"}
        btnTexto={editingPerfil ? "Guardar cambios" : "Crear perfil"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setPerfilToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar perfil"
        subtitle="¿Deseas eliminar este perfil del sistema?"
      >
        {perfilToDelete && (
          <div>
            <p><strong>{perfilToDelete.nombre}</strong></p>
            <p>ID: {perfilToDelete.id}</p>
            <p>Permisos asignados: {perfilToDelete.permisos?.length || 0}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <AsignarPermisosModal
        key={perfilPermisos?.id}
        open={showPermisosModal}
        onClose={() => { setShowPermisosModal(false); setPerfilPermisos(null); }}
        onSave={handleGuardarPermisos}
        perfil={perfilPermisos}
        permisosDisponibles={PERMISOS_DISPONIBLES}
      />
    </div>
  );
};

export default Perfiles;
