import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAButton from "../../components/SAButton";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";

import ModuloForm from "./ModuloForm";
import { API_BASE_URL } from "../../config";

import "./SAModulos.css";

const API_URL = `${API_BASE_URL}/api/modulos`;

const ESTATUS_VARIANT = {
  activo: "success",
  inactivo: "neutral",
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function SAModulos() {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [busqueda, setBusqueda] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal alta/edición
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = alta, objeto = edición
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargarModulos = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Nota: GET /modulos en tu ModuloController solo regresa los
      // estatus 'activo'. Para que el listado de administración
      // también muestre los inactivos (y puedas reactivarlos), lo ideal
      // es agregar un endpoint que regrese todos. Por ahora se usa el
      // mismo endpoint; si luego agregas ?todos=1 o similar, ajusta aquí.
      const { data } = await axios.get(API_URL, { headers: authHeaders() });
      setModulos(data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el listado de módulos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarModulos();
  }, []);

  // ── Búsqueda ──────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    return modulos.filter((m) => {
      if (!busqueda) return true;
      return (
        m.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.clave?.toLowerCase().includes(busqueda.toLowerCase())
      );
    });
  }, [modulos, busqueda]);

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
  const nombrePadre = (idPadre) => modulos.find((m) => m.id === idPadre)?.nombre || "—";

  const filasTabla = paginados.map((m) => ({
    ...m,
    clave_celda: <span className="sa-modulo-clave">{m.clave}</span>,
    padre_celda: m.id_modulo_padre ? nombrePadre(m.id_modulo_padre) : "—",
    estatus_celda: <SABadge variant={ESTATUS_VARIANT[m.estatus] || "neutral"}>{m.estatus}</SABadge>,
  }));

  // ── Handlers: alta / edición ─────────────────────────────────────
  const abrirAlta = () => {
    setEditTarget(null);
    setFormError(null);
    setModalFormOpen(true);
  };

  const abrirEdicion = (modulo) => {
    setEditTarget(modulo);
    setFormError(null);
    setModalFormOpen(true);
  };

  const cerrarModalForm = () => {
    if (saving) return;
    setModalFormOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const guardarModulo = async (formData) => {
    setSaving(true);
    setFormError(null);
    try {
      // Traducimos el nombre del padre seleccionado de vuelta a su id
      const nombrePadreSeleccionado = formData.get("id_modulo_padre_nombre");
      const padreEncontrado = modulos.find((m) => m.nombre === nombrePadreSeleccionado);

      const payload = {};
      formData.forEach((value, key) => {
        if (key !== "id_modulo_padre_nombre") payload[key] = value;
      });
      payload.id_modulo_padre = padreEncontrado ? padreEncontrado.id : null;

      if (editTarget) {
        await axios.put(`${API_URL}/${editTarget.id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(API_URL, payload, { headers: authHeaders() });
      }
      await cargarModulos();
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

  // ── Handler: activar / desactivar ────────────────────────────────
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const toggleEstatus = async (modulo) => {
    const nuevoEstatus = modulo.estatus === "activo" ? "inactivo" : "activo";
    setToggleLoadingId(modulo.id);
    try {
      await axios.put(`${API_URL}/${modulo.id}`, { estatus: nuevoEstatus }, { headers: authHeaders() });
      setModulos((prev) =>
        prev.map((m) => (m.id === modulo.id ? { ...m, estatus: nuevoEstatus } : m))
      );
    } catch (err) {
      setErrorMsg("No se pudo cambiar el estatus del módulo.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  // ── Handler: eliminar ────────────────────────────────────────────
  const eliminarModulo = async (modulo) => {
    const ok = window.confirm(`¿Eliminar el módulo "${modulo.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/${modulo.id}`, { headers: authHeaders() });
      await cargarModulos();
    } catch (err) {
      setErrorMsg("No se pudo eliminar el módulo. Puede estar asignado a uno o más planes.");
    }
  };

  // ── Definición de columnas / acciones de la tabla ────────────────
  const columnas = ["Nombre", "Clave", "Módulo padre", "Orden", "Estatus"];
  const campos = ["nombre", "clave_celda", "padre_celda", "orden", "estatus_celda"];

  const acciones = [
    {
      icono: "✎",
      titulo: "Editar",
      onClick: (fila) => abrirEdicion(fila),
    },
    {
      icono: (fila) => (fila.estatus === "activo" ? "⏸" : "▶"),
      titulo: (fila) => (fila.estatus === "activo" ? "Desactivar" : "Activar"),
      clase: "sa-table-btn--accent",
      disabled: (fila) => toggleLoadingId === fila.id,
      onClick: (fila) => toggleEstatus(fila),
    },
    {
      icono: "🗑",
      titulo: "Eliminar",
      clase: "sa-table-btn--danger",
      onClick: (fila) => eliminarModulo(fila),
    },
  ];

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Módulos</h1>
          <span className="sa-page__sub">módulos del sistema — BalamCore</span>
        </div>
        <SAButton variant="accent" onClick={abrirAlta}>
          + Nuevo módulo
        </SAButton>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por nombre o clave..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ── Card con tabla ──────────────────────────────────────── */}
      <div className="sa-card sa-card--table">
        {errorMsg && <div className="sa-modal-error" style={{ margin: "16px" }}>{errorMsg}</div>}

        {loading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando módulos...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No se encontraron módulos"
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
        title={editTarget ? "Editar módulo" : "Nuevo módulo"}
        size="md"
      >
        <ModuloForm
          modulo={editTarget}
          modulosDisponibles={modulos}
          onSubmit={guardarModulo}
          onCancel={cerrarModalForm}
          errorMsg={formError}
          loading={saving}
        />
      </SAModal>
    </div>
  );
}
