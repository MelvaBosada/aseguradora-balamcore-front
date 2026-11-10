import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditAttributesIcon from '@mui/icons-material/EditAttributes';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import EditModal from "../../components/EditModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import AsignarPermisosModal from "../../components/AsignarPermisosModal";
import Paginacion from "../../components/Paginacion";
import "../../css/Clientes.css";

const API = import.meta.env.VITE_API_URL || "/api";

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Extrae un mensaje legible de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const data = error.response.data || {};
  const detalle = data.errors ? Object.values(data.errors).flat().join("\n") : null;
  return detalle || data.message || defecto;
};

const campos = ["nombre"];
const columnas = ["Nombre", "Acciones"];

const FORM_CAMPOS = [
  {
    label: "Nombre del perfil",
    name: "nombre",
    type: "text",
  },
];

const FORM_VACIO = {
  nombre: "",
};

const Perfiles = () => {
  const [perfiles, setPerfiles] = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);

  const [perfilToDelete, setPerfilToDelete] = useState(null);
  const [perfilPermisos, setPerfilPermisos] = useState(null);
  const [permisosDelPerfil, setPermisosDelPerfil] = useState([]);
  const [editingPerfil, setEditingPerfil] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const puedeEditar = (perfil) =>
    perfil?.puede_editar ?? !perfil?.es_base;

  const puedeEliminar = (perfil) =>
    perfil?.puede_eliminar ?? !perfil?.es_base;

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [resRoles, resPermisos] = await Promise.all([
        axios.get(`${API}/roles`),
        axios.get(`${API}/permisos`),
      ]);

      setPerfiles(resRoles.data);
      setPermisosDisponibles(resPermisos.data);
    } catch (error) {
      console.error("Error al cargar perfiles y permisos:", error);
      mostrarAviso(
        "error",
        "No se pudieron cargar los perfiles",
        mensajeError(error, "Ocurrió un error al cargar los perfiles y permisos.")
      );
    } finally {
      setLoading(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const recargarPerfiles = async () => {
    try {
      const response = await axios.get(`${API}/roles`);
      setPerfiles(response.data);
    } catch (error) {
      console.error("Error al recargar perfiles:", error);
      mostrarAviso(
        "error",
        "No se pudo actualizar la lista",
        mensajeError(error, "Ocurrió un error al recargar los perfiles.")
      );
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrores((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleNuevo = () => {
    setEditingPerfil(null);
    setFormData({ ...FORM_VACIO });
    setErrores({});
    setShowModal(true);
  };

  const handleEditar = (perfil) => {
    if (!puedeEditar(perfil)) {
      return;
    }

    setEditingPerfil(perfil);
    setFormData({
      nombre: perfil.nombre,
    });
    setErrores({});
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (editingPerfil && !puedeEditar(editingPerfil)) {
      return;
    }

    if (!formData.nombre || !formData.nombre.trim()) {
      setErrores({ nombre: "Este campo es requerido" });
      mostrarAviso("error", "Faltan campos requeridos", "Escribe el nombre del perfil.");
      return;
    }

    const esEdicion = !!editingPerfil;

    try {
      setLoading(true);

      if (esEdicion) {
        await axios.put(`${API}/roles/${editingPerfil.id}`, formData);
      } else {
        await axios.post(`${API}/roles`, formData);
      }

      await recargarPerfiles();
      setShowModal(false);
      setEditingPerfil(null);
      setFormData({ ...FORM_VACIO });
      setErrores({});
      mostrarAviso(
        "exito",
        esEdicion ? "Perfil actualizado" : "Perfil creado",
        esEdicion
          ? "Los cambios se guardaron correctamente."
          : "El perfil se guardó correctamente."
      );
    } catch (error) {
      console.error("Error al guardar perfil:", error);

      // Marca en el formulario los campos que el servidor rechazó
      const erroresServidor = error.response?.data?.errors;
      if (erroresServidor) {
        setErrores(
          Object.fromEntries(
            Object.entries(erroresServidor).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
          )
        );
      }
      mostrarAviso("error", "No se pudo guardar", mensajeError(error, "No se pudo guardar el perfil."));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (perfil) => {
    if (!puedeEliminar(perfil)) {
      return;
    }

    setPerfilToDelete(perfil);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!perfilToDelete || !puedeEliminar(perfilToDelete)) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(`${API}/roles/${perfilToDelete.id}`);

      await recargarPerfiles();

      setShowDeleteModal(false);
      setPerfilToDelete(null);
      mostrarAviso("exito", "Perfil eliminado", "El perfil se eliminó correctamente.");
    } catch (error) {
      console.error("Error al eliminar perfil:", error);
      setShowDeleteModal(false);
      setPerfilToDelete(null);
      mostrarAviso("error", "No se pudo eliminar", mensajeError(error, "No se pudo eliminar el perfil."));
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarPermisos = async (perfil) => {
    try {
      setLoading(true);

      const response = await axios.get(`${API}/roles/${perfil.id}/permisos`);

      setPermisosDelPerfil(response.data.map((permiso) => permiso.id));

      setPerfilPermisos(perfil);
      setShowPermisosModal(true);
    } catch (error) {
      console.error("Error al cargar permisos del perfil:", error);
      mostrarAviso(
        "error",
        "No se pudieron cargar los permisos",
        mensajeError(error, "No se pudieron cargar los permisos del perfil.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPermisos = async (idsSeleccionados) => {
    if (!perfilPermisos) {
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/roles/${perfilPermisos.id}/permisos`, {
        permisos: idsSeleccionados,
      });

      setShowPermisosModal(false);
      setPerfilPermisos(null);
      setPermisosDelPerfil([]);
      mostrarAviso("exito", "Permisos actualizados", "Los permisos del perfil se guardaron correctamente.");
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      mostrarAviso(
        "error",
        "No se pudieron guardar los permisos",
        mensajeError(error, "No se pudieron guardar los permisos.")
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(perfiles.length / itemsPerPage) || 1;

  const paginated = perfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && perfiles.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Perfiles</h1>

      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-end mb-4">
        <PrimaryButton
          text="Nuevo perfil"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevo}
        />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Asignar permisos",
              clase: "tabla-btn-ver",
              icono: <EditAttributesIcon fontSize="small" />,
              onClick: handleAsignarPermisos,
            },
            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar,
              oculto: (fila) => !puedeEditar(fila),
            },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: handleEliminarClick,
              oculto: (fila) => !puedeEliminar(fila),
            },
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
        editando={Boolean(editingPerfil)}
        titulo={editingPerfil ? "Editar perfil" : "Nuevo perfil"}
        subtitulo={
          editingPerfil
            ? "Modifica el nombre del perfil"
            : "Ingresa el nombre del nuevo perfil"
        }
        btnTexto={editingPerfil ? "Guardar cambios" : "Crear perfil"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
        errores={errores}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPerfilToDelete(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar perfil"
        subtitle="¿Deseas eliminar este perfil del sistema?"
      >
        {perfilToDelete && (
          <div>
            <p>
              <strong>{perfilToDelete.nombre}</strong>
            </p>
            <p>ID: {perfilToDelete.id}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <AsignarPermisosModal
        key={perfilPermisos?.id}
        open={showPermisosModal}
        onClose={() => {
          setShowPermisosModal(false);
          setPerfilPermisos(null);
        }}
        onSave={handleGuardarPermisos}
        perfil={perfilPermisos}
        permisosDisponibles={permisosDisponibles}
        permisosActuales={permisosDelPerfil}
      />

      {/* ---------- Aviso (éxito / error) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className={`evi-aviso-icono ${aviso.tipo}`}>
              {aviso.tipo === "exito"
                ? <CheckCircleIcon style={{ fontSize: 40 }} />
                : <ErrorOutlineIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfiles;