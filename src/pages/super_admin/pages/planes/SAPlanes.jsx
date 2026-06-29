import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAButton from "../../components/SAButton";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";

import PlanForm from "./PlanForm";
import PlanDetalle from "./PlanDetalle";
import PlanModulosModal from "./PlanModulosModal";
import { API_BASE_URL } from "../../config";

import "./SAPlanes.css";

const API_URL = `${API_BASE_URL}/api/planes`;
const MODULOS_URL = `${API_BASE_URL}/api/modulos`;

const ESTATUS_VARIANT = {
  activo: "success",
  inactivo: "neutral",
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function moneyMXN(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
}

export default function SAPlanes() {
  const [planes, setPlanes] = useState([]);
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

  // Modal detalle
  const [detalleTarget, setDetalleTarget] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Modal de módulos
  const [modulosTarget, setModulosTarget] = useState(null); // plan al que se le asignan módulos
  const [modulosDisponibles, setModulosDisponibles] = useState([]);
  const [modulosAsignados, setModulosAsignados] = useState([]);
  const [modulosError, setModulosError] = useState(null);
  const [modulosSaving, setModulosSaving] = useState(false);
  const [modulosLoading, setModulosLoading] = useState(false);

  const cargarPlanes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await axios.get(API_URL, { headers: authHeaders() });
      setPlanes(data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el listado de planes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  // ── Búsqueda ──────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    return planes.filter((p) => {
      if (!busqueda) return true;
      return p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    });
  }, [planes, busqueda]);

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
  const filasTabla = paginados.map((p) => ({
    ...p,
    precio_celda: (
      <div className="sa-plan-cell">
        <span className="sa-plan-cell__precio">{moneyMXN(p.precio)}</span>
        <span className="sa-plan-cell__periodo">/ mes</span>
      </div>
    ),
    duracion_celda: `${p.duracion_dias ?? "—"} días`,
    modulos_celda: (
      <span className="sa-plan-modulos-count">
        {p.modulos_count ?? 0} módulo{p.modulos_count === 1 ? "" : "s"}
      </span>
    ),
    estatus_celda: <SABadge variant={ESTATUS_VARIANT[p.estatus] || "neutral"}>{p.estatus}</SABadge>,
  }));

  // ── Handlers: alta / edición ─────────────────────────────────────
  const abrirAlta = () => {
    setEditTarget(null);
    setFormError(null);
    setModalFormOpen(true);
  };

  const abrirEdicion = (plan) => {
    setEditTarget(plan);
    setFormError(null);
    setModalFormOpen(true);
  };

  const cerrarModalForm = () => {
    if (saving) return;
    setModalFormOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  const guardarPlan = async (formData) => {
    setSaving(true);
    setFormError(null);
    try {
      // Traducimos "Sí"/"No" de los selects a boolean real para el backend
      const payload = {};
      formData.forEach((value, key) => {
        if (key === "pdf_ilimitado" || key === "soporte_prioritario") {
          payload[key] = value === "Sí" ? 1 : 0;
        } else {
          payload[key] = value;
        }
      });

      if (editTarget) {
        await axios.put(`${API_URL}/${editTarget.id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(API_URL, payload, { headers: authHeaders() });
      }
      await cargarPlanes();
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

  // ── Handler: ver detalle (pide el plan completo con módulos) ─────
  const abrirDetalle = async (plan) => {
    setDetalleTarget(plan);
    setDetalleLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/${plan.id}`, { headers: authHeaders() });
      setDetalleTarget(data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el detalle del plan.");
    } finally {
      setDetalleLoading(false);
    }
  };

  // ── Handler: eliminar ────────────────────────────────────────────
  const eliminarPlan = async (plan) => {
    const ok = window.confirm(`¿Eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/${plan.id}`, { headers: authHeaders() });
      await cargarPlanes();
    } catch (err) {
      setErrorMsg("No se pudo eliminar el plan.");
    }
  };

  // ── Handlers: asignación de módulos ──────────────────────────────
  const abrirModulos = async (plan) => {
    setModulosTarget(plan);
    setModulosError(null);
    setModulosLoading(true);
    try {
      const [disponiblesRes, asignadosRes] = await Promise.all([
        axios.get(MODULOS_URL, { headers: authHeaders() }),
        axios.get(`${API_URL}/${plan.id}/modulos`, { headers: authHeaders() }),
      ]);
      setModulosDisponibles(disponiblesRes.data);
      setModulosAsignados(asignadosRes.data.map((m) => m.id));
    } catch (err) {
      setModulosError("No se pudieron cargar los módulos.");
    } finally {
      setModulosLoading(false);
    }
  };

  const cerrarModalModulos = () => {
    if (modulosSaving) return;
    setModulosTarget(null);
    setModulosDisponibles([]);
    setModulosAsignados([]);
    setModulosError(null);
  };

  const guardarModulos = async (idsSeleccionados) => {
    setModulosSaving(true);
    setModulosError(null);
    try {
      await axios.post(
        `${API_URL}/${modulosTarget.id}/modulos`,
        { modulos: idsSeleccionados },
        { headers: authHeaders() }
      );
      await cargarPlanes();
      cerrarModalModulos();
    } catch (err) {
      setModulosError("No se pudieron guardar los módulos. Intenta de nuevo.");
    } finally {
      setModulosSaving(false);
    }
  };

  // ── Definición de columnas / acciones de la tabla ────────────────
  const columnas = ["Plan", "Precio", "Duración", "Módulos", "Estatus"];
  const campos = ["nombre", "precio_celda", "duracion_celda", "modulos_celda", "estatus_celda"];

  const acciones = [
    {
      icono: "👁",
      titulo: "Ver detalles",
      onClick: (fila) => abrirDetalle(fila),
    },
    {
      icono: "✎",
      titulo: "Editar",
      onClick: (fila) => abrirEdicion(fila),
    },
    {
      icono: "🧩",
      titulo: "Asignar módulos",
      clase: "sa-table-btn--accent",
      onClick: (fila) => abrirModulos(fila),
    },
    {
      icono: "🗑",
      titulo: "Eliminar",
      clase: "sa-table-btn--danger",
      onClick: (fila) => eliminarPlan(fila),
    },
  ];

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Planes</h1>
          <span className="sa-page__sub">planes de suscripción — BalamCore</span>
        </div>
        <SAButton variant="accent" onClick={abrirAlta}>
          + Nuevo plan
        </SAButton>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por nombre del plan..."
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
            Cargando planes...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No se encontraron planes"
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
        title={editTarget ? "Editar plan" : "Nuevo plan"}
        size="lg"
      >
        <PlanForm
          plan={editTarget}
          onSubmit={guardarPlan}
          onCancel={cerrarModalForm}
          errorMsg={formError}
          loading={saving}
        />
      </SAModal>

      {/* ── Modal detalle ───────────────────────────────────────── */}
      <SAModal
        open={!!detalleTarget}
        onClose={() => setDetalleTarget(null)}
        title="Detalle de plan"
        size="md"
      >
        {detalleLoading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando...
          </div>
        ) : (
          <PlanDetalle plan={detalleTarget} />
        )}
      </SAModal>

      {/* ── Modal asignación de módulos ──────────────────────────── */}
      <SAModal
        open={!!modulosTarget}
        onClose={cerrarModalModulos}
        title={modulosTarget ? `Módulos de "${modulosTarget.nombre}"` : "Módulos"}
        size="lg"
      >
        {modulosLoading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando módulos...
          </div>
        ) : (
          <PlanModulosModal
            modulosDisponibles={modulosDisponibles}
            modulosAsignados={modulosAsignados}
            onSubmit={guardarModulos}
            onCancel={cerrarModalModulos}
            errorMsg={modulosError}
            loading={modulosSaving}
          />
        )}
      </SAModal>
    </div>
  );
}
