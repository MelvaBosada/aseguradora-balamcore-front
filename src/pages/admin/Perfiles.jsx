import { useState, useEffect } from "react";
import axios from "axios";
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon     from "@mui/icons-material/Edit";
import DeleteIcon   from "@mui/icons-material/Delete";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import PrimaryButton        from "../../components/PrimaryButton";
import TablaForm            from "../../components/TablaForm";
import EditModal            from "../../components/EditModal";
import ConfirmDeleteModal   from "../../components/ConfirmDeleteModal";
import AsignarPermisosModal from "../../components/AsignarPermisosModal";
import Paginacion           from "../../components/Paginacion";
import "../../css/Clientes.css";

const API      = "http://localhost:8000/api";
const campos   = ["nombre"];
const columnas = ["Nombre", "Acciones"];
const FORM_CAMPOS = [{ label: "Nombre del perfil", name: "nombre", type: "text" }];
const FORM_VACIO  = { nombre: "" };

const Perfiles = () => {
  const [perfiles,            setPerfiles]            = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [showModal,           setShowModal]           = useState(false);
  const [showDeleteModal,     setShowDeleteModal]     = useState(false);
  const [showPermisosModal,   setShowPermisosModal]   = useState(false);
  const [perfilToDelete,      setPerfilToDelete]      = useState(null);
  const [perfilPermisos,      setPerfilPermisos]      = useState(null);
  const [permisosDelPerfil,   setPermisosDelPerfil]   = useState([]);
  const [editingPerfil,       setEditingPerfil]       = useState(null);
  const [currentPage,         setCurrentPage]         = useState(1);
  const [formData,            setFormData]            = useState(FORM_VACIO);
  const [itemsPerPage,        setItemsPerPage]        = useState(8);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resRoles, resPermisos] = await Promise.all([
          axios.get(`${API}/roles`),
          axios.get(`${API}/permisos`),
        ]);
        setPerfiles(resRoles.data);
        setPermisosDisponibles(resPermisos.data.map(p => p.nombre));
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    cargar();
  }, []);

  const recargarPerfiles = async () => {
    try {
      const res = await axios.get(`${API}/roles`);
      setPerfiles(res.data);
    } catch (err) {
      console.error("Error al recargar perfiles:", err);
    }
  };

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

  const handleGuardar = async () => {
    try {
      if (editingPerfil) {
        await axios.put(`${API}/roles/${editingPerfil.id}`, formData);
      } else {
        await axios.post(`${API}/roles`, formData);
      }
      await recargarPerfiles();
      setShowModal(false);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    }
  };

  const handleEliminarClick = (p) => { setPerfilToDelete(p); setShowDeleteModal(true); };

  const handleConfirmarEliminar = async () => {
    try {
      await axios.delete(`${API}/roles/${perfilToDelete.id}`);
      await recargarPerfiles();
      setShowDeleteModal(false);
      setPerfilToDelete(null);
    } catch (err) {
      console.error("Error al eliminar perfil:", err);
    }
  };

  const handleAsignarPermisos = async (perfil) => {
    try {
      const res = await axios.get(`${API}/roles/${perfil.id}/permisos`);
      setPermisosDelPerfil(res.data.map(p => p.nombre));
      setPerfilPermisos(perfil);
      setShowPermisosModal(true);
    } catch (err) {
      console.error("Error al cargar permisos del perfil:", err);
    }
  };

  const handleGuardarPermisos = async (nuevosPermisos) => {
    try {
      const resPermisos = await axios.get(`${API}/permisos`);
      const ids = resPermisos.data
        .filter(p => nuevosPermisos.includes(p.nombre))
        .map(p => p.id);

      await axios.post(`${API}/roles/${perfilPermisos.id}/permisos`, { permisos: ids });
      setShowPermisosModal(false);
      setPerfilPermisos(null);
    } catch (err) {
      console.error("Error al guardar permisos:", err);
    }
  };

  const totalPages = Math.ceil(perfiles.length / itemsPerPage);
  const paginated  = perfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Perfiles</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-end mb-4">
        <PrimaryButton text="Nuevo perfil" icon={<AddCircleOutlinedIcon />} onClick={handleNuevo} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            { titulo: "Asignar permisos", clase: "tabla-btn-ver",  icono: <LockOpenIcon fontSize="small" />, onClick: handleAsignarPermisos },
            { titulo: "Editar",           clase: "tabla-btn-edit", icono: <EditIcon     fontSize="small" />, onClick: handleEditar           },
            { titulo: "Eliminar",         clase: "tabla-btn-del",  icono: <DeleteIcon   fontSize="small" />, onClick: handleEliminarClick    },
          ]}
        />
      </div>

      <Paginacion currentPage={currentPage} totalPages={totalPages}
        onPageChange={setCurrentPage} itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage} />

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
          </div>
        )}
      </ConfirmDeleteModal>

      <AsignarPermisosModal
        key={perfilPermisos?.id}
        open={showPermisosModal}
        onClose={() => { setShowPermisosModal(false); setPerfilPermisos(null); }}
        onSave={handleGuardarPermisos}
        perfil={perfilPermisos}
        permisosDisponibles={permisosDisponibles}
        permisosActuales={permisosDelPerfil}
      />
    </div>
  );
};

export default Perfiles;