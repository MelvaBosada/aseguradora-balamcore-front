import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAButton from "../../components/SAButton";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";

import AseguradoraForm from "./AseguradoraForm";
import AseguradoraDetalle from "./AseguradoraDetalle";
import { API_BASE_URL, logoUrl } from "../../config";

import "./SAAseguradoras.css";

const API_URL = `${API_BASE_URL}/api/aseguradoras`;

const ESTATUS_VARIANT = {
  activo: "success",
  inactivo: "neutral",
  suspendido: "danger",
};

// Variant de badge según el nombre del plan. Ajusta los nombres exactos
// a como los tengas guardados en tu tabla `planes` (nombre).
const PLAN_VARIANT = {
  pro: "pro",
  profesional: "pro",
  estandar: "std",
  standard: "std",
  basico: "bas",
  basic: "bas",
};

function planVariant(nombrePlan) {
  if (!nombrePlan) return "neutral";
  const key = nombrePlan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return PLAN_VARIANT[key] || "neutral";
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function SAAseguradoras() {
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal alta/edición
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = alta, objeto = edición
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal detalle
  const [detalleTarget, setDetalleTarget] = useState(null);

  // Toggle estatus (loading puntual por fila)
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const cargarAseguradoras = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await axios.get(API_URL, { headers: authHeaders() });
      setAseguradoras(data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el listado de aseguradoras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAseguradoras();
  }, []);

  // ── Filtrado + búsqueda ─────────────────────────────────────────
  const filtradas = useMemo(() => {
    return aseguradoras.filter((a) => {
      const coincideBusqueda =
        !busqueda ||
        a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.rfc?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.correo?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstatus = filtroEstatus === "todos" || a.estatus === filtroEstatus;

      return coincideBusqueda && coincideEstatus;
    });
  }, [aseguradoras, busqueda, filtroEstatus]);

  // ── Paginación ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtradas.length / itemsPerPage));
  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtradas.slice(start, start + itemsPerPage);
  }, [filtradas, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // ── Datos formateados para la tabla ──────────────────────────────
  const filasTabla = paginadas.map((a) => ({
    ...a,
    nombre_celda: (
      <div className="sa-aseg-cell">
        <div className="sa-aseg-cell__logo">
          {a.logo ? (
            <img
              src={logoUrl(a.logo)}
              alt={a.nombre}
              onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "🏢"; }}
            />
          ) : (
            "🏢"
          )}
        </div>
        <div className="sa-aseg-cell__info">
          <span className="sa-aseg-cell__nombre">{a.nombre}</span>
          <span className="sa-aseg-cell__rfc">{a.rfc}</span>
        </div>
      </div>
    ),
    estatus_celda: <SABadge variant={ESTATUS_VARIANT[a.estatus] || "neutral"}>{a.estatus}</SABadge>,
    plan_celda: a.plan ? (
      <SABadge variant={planVariant(a.plan)}>{a.plan}</SABadge>
    ) : (
      <span className="sa-aseg-sin-plan">Sin suscripción</span>
    ),
  }));

  // ── Handlers: alta / edición ─────────────────────────────────────
  const abrirAlta = () => {
    setEditTarget(null);
    setFormError(null);
    setModalFormOpen(true);
  };

  const abrirEdicion = (aseguradora) => {
    setEditTarget(aseguradora);
    setFormError(null);
    setModalFormOpen(true);
  };

  const cerrarModalForm = () => {
    if (saving) return;
    setModalFormOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const guardarAseguradora = async (formData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        await axios.post(`${API_URL}/${editTarget.id}`, formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(API_URL, formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      }
      await cargarAseguradoras();
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
  const toggleEstatus = async (aseguradora) => {
    const nuevoEstatus = aseguradora.estatus === "activo" ? "inactivo" : "activo";
    setToggleLoadingId(aseguradora.id);
    try {
      await axios.put(
        `${API_URL}/${aseguradora.id}`,
        { estatus: nuevoEstatus },
        { headers: authHeaders() }
      );
      setAseguradoras((prev) =>
        prev.map((a) => (a.id === aseguradora.id ? { ...a, estatus: nuevoEstatus } : a))
      );
    } catch (err) {
      setErrorMsg("No se pudo cambiar el estatus de la aseguradora.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  // ── Handler: eliminar ────────────────────────────────────────────
  const eliminarAseguradora = async (aseguradora) => {
    const ok = window.confirm(`¿Eliminar a "${aseguradora.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/${aseguradora.id}`, { headers: authHeaders() });
      await cargarAseguradoras();
    } catch (err) {
      setErrorMsg("No se pudo eliminar la aseguradora.");
    }
  };

  // ── Definición de columnas / acciones de la tabla ────────────────
  const columnas = ["Aseguradora", "Correo", "Municipio", "Plan", "Estatus"];
  const campos = ["nombre_celda", "correo", "municipio", "plan_celda", "estatus_celda"];

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
      onClick: (fila) => eliminarAseguradora(fila),
    },
  ];

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Aseguradoras</h1>
          <span className="sa-page__sub">gestión de aseguradoras pyme — BalamCore</span>
        </div>
        <SAButton variant="accent" onClick={abrirAlta}>
          + Nueva aseguradora
        </SAButton>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por nombre, RFC o correo..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="sa-aseg-select"
          value={filtroEstatus}
          onChange={(e) => {
            setFiltroEstatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="todos">Todos los estatus</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
        </select>
      </div>

      {/* ── Card con tabla ──────────────────────────────────────── */}
      <div className="sa-card sa-card--table">
        {errorMsg && <div className="sa-modal-error" style={{ margin: "16px" }}>{errorMsg}</div>}

        {loading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando aseguradoras...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No se encontraron aseguradoras"
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
        title={editTarget ? "Editar aseguradora" : "Nueva aseguradora"}
        size="lg"
      >
        <AseguradoraForm
          aseguradora={editTarget}
          onSubmit={guardarAseguradora}
          onCancel={cerrarModalForm}
          errorMsg={formError}
          loading={saving}
        />
      </SAModal>

      {/* ── Modal detalle ───────────────────────────────────────── */}
      <SAModal
        open={!!detalleTarget}
        onClose={() => setDetalleTarget(null)}
        title="Detalle de aseguradora"
        size="md"
      >
        <AseguradoraDetalle aseguradora={detalleTarget} />
      </SAModal>
    </div>
  );
}
