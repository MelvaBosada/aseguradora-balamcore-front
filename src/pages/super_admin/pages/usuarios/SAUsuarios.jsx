import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAButton from "../../components/SAButton";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";

import UsuarioForm from "./UsuarioForm";
import UsuarioDetalle from "./UsuarioDetalle";
import { API_BASE_URL } from "../../config";

import "./SAUsuarios.css";

const API_URL = `${API_BASE_URL}/api/usuarios`;
const ROLES_URL = `${API_BASE_URL}/api/roles`;
const ASEGURADORAS_URL = `${API_BASE_URL}/api/aseguradoras`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function SAUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal alta/edición
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal detalle
  const [detalleTarget, setDetalleTarget] = useState(null);

  const cargarTodo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [usuariosRes, rolesRes, aseguradorasRes] = await Promise.all([
        axios.get(API_URL, { headers: authHeaders() }),
        axios.get(ROLES_URL, { headers: authHeaders() }),
        axios.get(ASEGURADORAS_URL, { headers: authHeaders() }),
      ]);
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
      setAseguradoras(aseguradorasRes.data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el listado de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // ── Filtrado + búsqueda ─────────────────────────────────────────
  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda = !busqueda || u.correo?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === "todos" || u.rol === filtroRol;
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  // ── Paginación ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtrados.length / itemsPerPage));
  const paginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtrados.slice(start, start + itemsPerPage);
  }, [filtrados, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // ── Datos formateados para la tabla ──────────────────────────────
  const filasTabla = paginados.map((u) => ({
    ...u,
    rol_celda: u.es_superadmin ? (
      <SABadge variant="pro">Super Admin</SABadge>
    ) : (
      <span className="sa-usuario-rol">{u.rol || "—"}</span>
    ),
    aseguradora_celda: u.aseguradora || <span className="sa-usuario-sin-aseg">—</span>,
  }));

  // ── Handlers: alta / edición ─────────────────────────────────────
  const abrirAlta = () => {
    setEditTarget(null);
    setFormError(null);
    setModalFormOpen(true);
  };

  const abrirEdicion = (usuario) => {
    setEditTarget(usuario);
    setFormError(null);
    setModalFormOpen(true);
  };

  const cerrarModalForm = () => {
    if (saving) return;
    setModalFormOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const guardarUsuario = async (formData) => {
    setSaving(true);
    setFormError(null);
    try {
      const rolSeleccionado = roles.find((r) => r.nombre === formData.get("rol_nombre"));
      const aseguradoraSeleccionada = aseguradoras.find((a) => a.nombre === formData.get("aseguradora_nombre"));
      const esSuperadmin = formData.get("es_superadmin_label") === "Sí";
      const password = formData.get("password");

      const payload = {
        correo: formData.get("correo"),
        id_rol: rolSeleccionado ? rolSeleccionado.id : null,
        id_aseguradora: aseguradoraSeleccionada ? aseguradoraSeleccionada.id : null,
        es_superadmin: esSuperadmin,
      };
      if (password) payload.password = password;

      if (editTarget) {
        await axios.put(`${API_URL}/${editTarget.id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(API_URL, payload, { headers: authHeaders() });
      }
      await cargarTodo();
      setModalFormOpen(false);
      setEditTarget(null);
    } catch (err) {
      const apiMsg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : err.response?.data?.message;
      setFormError(apiMsg || "Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ── Handler: eliminar ────────────────────────────────────────────
  const eliminarUsuario = async (usuario) => {
    const ok = window.confirm(`¿Eliminar al usuario "${usuario.correo}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/${usuario.id}`, { headers: authHeaders() });
      await cargarTodo();
    } catch (err) {
      setErrorMsg("No se pudo eliminar el usuario.");
    }
  };

  // ── Definición de columnas / acciones de la tabla ────────────────
  const columnas = ["Correo", "Rol", "Aseguradora"];
  const campos = ["correo", "rol_celda", "aseguradora_celda"];

  const acciones = [
    {
      icono: "👁",
      titulo: "Ver detalles",
      onClick: (fila) => setDetalleTarget(fila),
    },
    {
      icono: "✎",
      titulo: "Editar",
      onClick: (fila) => abrirEdicion(fila),
    },
    {
      icono: "🗑",
      titulo: "Eliminar",
      clase: "sa-table-btn--danger",
      onClick: (fila) => eliminarUsuario(fila),
    },
  ];

  const rolesUnicos = useMemo(() => [...new Set(usuarios.map((u) => u.rol).filter(Boolean))], [usuarios]);

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Usuarios</h1>
          <span className="sa-page__sub">usuarios del sistema — BalamCore</span>
        </div>
        <SAButton variant="accent" onClick={abrirAlta}>
          + Nuevo usuario
        </SAButton>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por correo..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="sa-aseg-select"
          value={filtroRol}
          onChange={(e) => {
            setFiltroRol(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="todos">Todos los roles</option>
          {rolesUnicos.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Card con tabla ──────────────────────────────────────── */}
      <div className="sa-card sa-card--table">
        {errorMsg && <div className="sa-modal-error" style={{ margin: "16px" }}>{errorMsg}</div>}

        {loading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando usuarios...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No se encontraron usuarios"
            />
            <SAPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* ── Modal alta / edición ────────────────────────────────── */}
      <SAModal
        open={modalFormOpen}
        onClose={cerrarModalForm}
        title={editTarget ? "Editar usuario" : "Nuevo usuario"}
        size="md"
      >
        <UsuarioForm
          usuario={editTarget}
          roles={roles}
          aseguradoras={aseguradoras}
          onSubmit={guardarUsuario}
          onCancel={cerrarModalForm}
          errorMsg={formError}
          loading={saving}
        />
      </SAModal>

      {/* ── Modal detalle ───────────────────────────────────────── */}
      <SAModal
        open={!!detalleTarget}
        onClose={() => setDetalleTarget(null)}
        title="Detalle de usuario"
        size="md"
      >
        <UsuarioDetalle usuario={detalleTarget} />
      </SAModal>
    </div>
  );
}
