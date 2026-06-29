import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import SATable from "../../components/SATable";
import SAPagination from "../../components/SAPagination";
import SAModal from "../../components/SAModal";
import SABadge from "../../components/SABadge";

import SuscripcionDetalle from "./SuscripcionDetalle";
import CambiarPlanModal from "./CambiarPlanModal";
import { API_BASE_URL } from "../../config";

import "./SASuscripciones.css";

const API_URL = `${API_BASE_URL}/api/suscripciones`;
const PLANES_URL = `${API_BASE_URL}/api/planes`;

const ESTATUS_VARIANT = {
  activo: "success",
  activa: "success",
  prueba: "warning",
  trial: "warning",
  renovada: "std",
  cancelado: "danger",
  cancelada: "danger",
};

// Umbral de días para marcar una suscripción como "por vencer".
// Ajusta este número si quieres avisar antes o después.
const DIAS_ALERTA_VENCIMIENTO = 7;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function diasParaVencer(fechaFin) {
  if (!fechaFin) return null;
  const hoy = new Date();
  const fin = new Date(fechaFin);
  const diffMs = fin.setHours(0, 0, 0, 0) - hoy.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatFecha(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

export default function SASuscripciones() {
  const [suscripciones, setSuscripciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [soloPorVencer, setSoloPorVencer] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal detalle
  const [detalleTarget, setDetalleTarget] = useState(null);

  // Modal cambio de plan
  const [cambiarPlanTarget, setCambiarPlanTarget] = useState(null);
  const [cambiarPlanError, setCambiarPlanError] = useState(null);
  const [cambiarPlanSaving, setCambiarPlanSaving] = useState(false);

  const cargarTodo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [suscripcionesRes, planesRes] = await Promise.all([
        axios.get(API_URL, { headers: authHeaders() }),
        axios.get(PLANES_URL, { headers: authHeaders() }),
      ]);
      setSuscripciones(suscripcionesRes.data);
      setPlanes(planesRes.data);
    } catch (err) {
      setErrorMsg("No se pudo cargar el listado de suscripciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // ── Filtrado + búsqueda ─────────────────────────────────────────
  const filtradas = useMemo(() => {
    return suscripciones.filter((s) => {
      const coincideBusqueda =
        !busqueda ||
        s.aseguradora?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.plan?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstatus = filtroEstatus === "todos" || s.estatus === filtroEstatus;

      const dias = diasParaVencer(s.fecha_fin);
      const coincidePorVencer = !soloPorVencer || (dias !== null && dias <= DIAS_ALERTA_VENCIMIENTO && dias >= 0);

      return coincideBusqueda && coincideEstatus && coincidePorVencer;
    });
  }, [suscripciones, busqueda, filtroEstatus, soloPorVencer]);

  // ── Paginación ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtradas.length / itemsPerPage));
  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtradas.slice(start, start + itemsPerPage);
  }, [filtradas, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // Conteo para el banner de alerta (sobre el total filtrado por
  // búsqueda/estatus, no solo la página actual)
  const totalPorVencer = useMemo(() => {
    return suscripciones.filter((s) => {
      const dias = diasParaVencer(s.fecha_fin);
      return dias !== null && dias <= DIAS_ALERTA_VENCIMIENTO && dias >= 0 && (s.estatus === "activo" || s.estatus === "activa");
    }).length;
  }, [suscripciones]);

  // ── Datos formateados para la tabla ──────────────────────────────
  const filasTabla = paginadas.map((s) => {
    const dias = diasParaVencer(s.fecha_fin);
    const porVencer = dias !== null && dias <= DIAS_ALERTA_VENCIMIENTO && dias >= 0;
    const vencida = dias !== null && dias < 0;

    return {
      ...s,
      _porVencer: porVencer,
      plan_celda: <span className="sa-susc-plan">{s.plan}</span>,
      fecha_fin_celda: (
        <div className="sa-susc-fecha">
          <span>{formatFecha(s.fecha_fin)}</span>
          {porVencer && (s.estatus === "activo" || s.estatus === "activa") && (
            <span className="sa-susc-alerta">⚠ vence en {dias} día{dias === 1 ? "" : "s"}</span>
          )}
          {vencida && (s.estatus === "activo" || s.estatus === "activa") && (
            <span className="sa-susc-alerta sa-susc-alerta--vencida">⚠ vencida</span>
          )}
        </div>
      ),
      estatus_celda: <SABadge variant={ESTATUS_VARIANT[s.estatus] || "neutral"}>{s.estatus}</SABadge>,
    };
  });

  // ── Handlers: cambio de plan ──────────────────────────────────────
  const abrirCambiarPlan = (suscripcion) => {
    setCambiarPlanTarget(suscripcion);
    setCambiarPlanError(null);
  };

  const cerrarCambiarPlan = () => {
    if (cambiarPlanSaving) return;
    setCambiarPlanTarget(null);
    setCambiarPlanError(null);
  };

  const confirmarCambioPlan = async (idPlan) => {
    setCambiarPlanSaving(true);
    setCambiarPlanError(null);
    try {
      await axios.post(
        `${API_URL}/${cambiarPlanTarget.id_aseguradora}/activar`,
        { id_plan: idPlan },
        { headers: authHeaders() }
      );
      await cargarTodo();
      setCambiarPlanTarget(null);
    } catch (err) {
      setCambiarPlanError(
        err.response?.data?.message || "No se pudo activar el plan. Intenta de nuevo."
      );
    } finally {
      setCambiarPlanSaving(false);
    }
  };

  // ── Handler: cancelar suscripción ────────────────────────────────
  const cancelarSuscripcion = async (suscripcion) => {
    const ok = window.confirm(
      `¿Cancelar la suscripción de "${suscripcion.aseguradora}" al plan "${suscripcion.plan}"?`
    );
    if (!ok) return;
    try {
      await axios.put(`${API_URL}/${suscripcion.id}/cancelar`, {}, { headers: authHeaders() });
      await cargarTodo();
    } catch (err) {
      setErrorMsg("No se pudo cancelar la suscripción.");
    }
  };

  // ── Definición de columnas / acciones de la tabla ────────────────
  const columnas = ["Aseguradora", "Plan", "Vence", "Estatus"];
  const campos = ["aseguradora", "plan_celda", "fecha_fin_celda", "estatus_celda"];

  const acciones = [
    {
      icono: "👁",
      titulo: "Ver detalles",
      onClick: (fila) => setDetalleTarget(fila),
    },
    {
      icono: "↻",
      titulo: "Cambiar / renovar plan",
      clase: "sa-table-btn--accent",
      onClick: (fila) => abrirCambiarPlan(fila),
    },
    {
      icono: "✕",
      titulo: "Cancelar suscripción",
      clase: "sa-table-btn--danger",
      disabled: (fila) =>
        fila.estatus === "cancelado" || fila.estatus === "cancelada" || fila.estatus === "renovada",
      onClick: (fila) => cancelarSuscripcion(fila),
    },
  ];

  const estatusUnicos = useMemo(
    () => [...new Set(suscripciones.map((s) => s.estatus).filter(Boolean))],
    [suscripciones]
  );

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Suscripciones</h1>
          <span className="sa-page__sub">suscripciones de aseguradoras — BalamCore</span>
        </div>
      </div>

      {/* ── Banner de alerta de vencimiento (SCRUM-480) ──────────── */}
      {totalPorVencer > 0 && (
        <button
          className="sa-susc-banner"
          onClick={() => {
            setSoloPorVencer(true);
            setCurrentPage(1);
          }}
          type="button"
        >
          ⚠ {totalPorVencer} suscripción{totalPorVencer === 1 ? "" : "es"} por vencer en los
          próximos {DIAS_ALERTA_VENCIMIENTO} días — click para filtrar
        </button>
      )}

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="sa-aseg-filtros">
        <input
          className="sa-aseg-search"
          type="text"
          placeholder="Buscar por aseguradora o plan..."
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
          {estatusUnicos.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <label className="sa-susc-checkbox">
          <input
            type="checkbox"
            checked={soloPorVencer}
            onChange={(e) => {
              setSoloPorVencer(e.target.checked);
              setCurrentPage(1);
            }}
          />
          Solo por vencer
        </label>
      </div>

      {/* ── Card con tabla ──────────────────────────────────────── */}
      <div className="sa-card sa-card--table">
        {errorMsg && <div className="sa-modal-error" style={{ margin: "16px" }}>{errorMsg}</div>}

        {loading ? (
          <div className="sa-loading">
            <div className="sa-spinner" />
            Cargando suscripciones...
          </div>
        ) : (
          <>
            <SATable
              columnas={columnas}
              data={filasTabla}
              campos={campos}
              acciones={acciones}
              emptyText="No se encontraron suscripciones"
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

      {/* ── Modal detalle ───────────────────────────────────────── */}
      <SAModal
        open={!!detalleTarget}
        onClose={() => setDetalleTarget(null)}
        title="Detalle de suscripción"
        size="md"
      >
        <SuscripcionDetalle suscripcion={detalleTarget} />
      </SAModal>

      {/* ── Modal cambio / renovación de plan ────────────────────── */}
      <SAModal
        open={!!cambiarPlanTarget}
        onClose={cerrarCambiarPlan}
        title="Cambiar / renovar plan"
        size="sm"
      >
        <CambiarPlanModal
          aseguradora={cambiarPlanTarget}
          planes={planes}
          onSubmit={confirmarCambioPlan}
          onCancel={cerrarCambiarPlan}
          errorMsg={cambiarPlanError}
          loading={cambiarPlanSaving}
        />
      </SAModal>
    </div>
  );
}
