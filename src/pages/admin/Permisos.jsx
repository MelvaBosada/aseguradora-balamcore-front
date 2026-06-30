import { useState, useEffect } from "react";
import axios from "axios";
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

const API      = "/api";
const campos   = ["nombre", "descripcion", "clave"];
const columnas = ["Nombre", "Descripción", "Clave", "Acciones"];

const FORM_CAMPOS = [
  { label: "Nombre del permiso", name: "nombre",      type: "text" },
  { label: "Descripción",        name: "descripcion", type: "text" },
  { label: "Clave",              name: "clave",       type: "text" },
];

const FORM_VACIO = { nombre: "", descripcion: "", clave: "" };

const Permisos = () => {
  const [permisos,        setPermisos]        = useState([]);
  const [loading,         setLoading]         = useState(true); // ◄ Estado de carga inicial
  const [showModal,       setShowModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permisoToDelete, setPermisoToDelete] = useState(null);
  const [editingPermiso,  setEditingPermiso]  = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [formData,        setFormData]        = useState(FORM_VACIO);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [itemsPerPage,    setItemsPerPage]    = useState(8);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/permisos`);
        setPermisos(res.data);
      } catch (err) {
        console.error("Error al cargar permisos:", err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const recargarPermisos = async () => {
    try {
      const res = await axios.get(`${API}/permisos`);
      setPermisos(res.data);
    } catch (err) {
      console.error("Error al recargar permisos:", err);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNuevo = () => {
    setEditingPermiso(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const handleEditar = (permiso) => {
    setEditingPermiso(permiso);
    setFormData({
      nombre:      permiso.nombre,
      descripcion: permiso.descripcion,
      clave:       permiso.clave,
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      if (editingPermiso) {
        await axios.put(`${API}/permisos/${editingPermiso.id}`, formData);
      } else {
        await axios.post(`${API}/permisos`, formData);
      }
      await recargarPermisos();
      setShowModal(false);
    } catch (err) {
      console.error("Error al guardar permiso:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (p) => { setPermisoToDelete(p); setShowDeleteModal(true); };

  const handleConfirmarEliminar = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API}/permisos/${permisoToDelete.id}`);
      await recargarPermisos();
      setShowDeleteModal(false);
      setPermisoToDelete(null);
    } catch (err) {
      console.error("Error al eliminar permiso:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered   = permisos.filter(p =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };


  if (loading && permisos.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Permisos</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input type="text" className="search-custom" placeholder="Buscar permiso..."
              value={searchTerm} onChange={handleSearch} />
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

      <Paginacion currentPage={currentPage} totalPages={totalPages}
        onPageChange={setCurrentPage} itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage} />

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