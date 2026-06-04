import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Chart,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "./SuperAdminDashboard.css";

Chart.register(
  DoughnutController, ArcElement,
  BarController, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend
);

const API = "http://localhost:8000/api/superadmin/dashboard";

const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n) => new Intl.NumberFormat("es-MX").format(n);

const ESTATUS_LABELS = {
  en_proceso:    "En proceso",
  en_evaluacion: "En evaluación",
  resuelto:      "Resuelto",
  cerrado:       "Cerrado",
};

const ESTATUS_COLORS = {
  en_proceso:    "#7c6af7",
  en_evaluacion: "#f5a623",
  resuelto:      "#3ecf8e",
  cerrado:       "#6b6d7a",
};

const PLAN_COLORS = ["#7c6af7", "#4fa3e0", "#3ecf8e", "#f5a623", "#e05252"];

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className={`sa-kpi ${accent ? "sa-kpi--accent" : ""}`}>
      <span className="sa-kpi__label">{label}</span>
      <span className="sa-kpi__value">{value ?? "—"}</span>
      {sub && <span className="sa-kpi__sub">{sub}</span>}
    </div>
  );
}

function StatusBadge({ estatus }) {
  const map = {
    activa:          { label: "Activa",          cls: "badge--success" },
    activo:          { label: "Activa",           cls: "badge--success" },
    trial:           { label: "Trial",            cls: "badge--warning" },
    prueba:          { label: "Trial",            cls: "badge--warning" },
    vencida:         { label: "Vencida",          cls: "badge--expired" },
    cancelada:       { label: "Cancelada",        cls: "badge--danger"  },
    suspendida:      { label: "Suspendida",       cls: "badge--danger"  },
    suspendido:      { label: "Suspendida",       cls: "badge--danger"  },
    inactivo:        { label: "Inactiva",         cls: "badge--danger"  },
    sin_suscripcion: { label: "Sin suscripción",  cls: "badge--neutral" },
  };
  const info = map[estatus] || { label: estatus ?? "—", cls: "" };
  return <span className={`sa-badge ${info.cls}`}>{info.label}</span>;
}

function PlanBadge({ plan }) {
  const map = {
    "Pro":      "badge--pro",
    "Estándar": "badge--std",
    "Básico":   "badge--bas",
  };
  return (
    <span className={`sa-badge ${map[plan] || ""}`}>{plan || "—"}</span>
  );
}

export default function SuperAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const mrrChartRef = useRef(null);
  const sinChartRef = useRef(null);
  const mrrInstance = useRef(null);
  const sinInstance = useRef(null);

  // ── Fetch datos ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error al cargar datos");
        setLoading(false);
      });
  }, []);

  // ── Inicializar charts cuando lleguen los datos ────────────────────────
  useEffect(() => {
    if (!data) return;

    mrrInstance.current?.destroy();
    sinInstance.current?.destroy();

    // ── Donut MRR por plan ─────────────────────────────────────────────
    if (mrrChartRef.current && data.mrr_por_plan?.length) {
      mrrInstance.current = new Chart(mrrChartRef.current, {
        type: "doughnut",
        data: {
          labels: data.mrr_por_plan.map((p) => p.plan),
          datasets: [{
            data: data.mrr_por_plan.map((p) => p.total),
            backgroundColor: PLAN_COLORS.slice(0, data.mrr_por_plan.length),
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)}`,
              },
            },
          },
        },
      });
    }

    // ── Barras siniestros por estatus ──────────────────────────────────
    if (sinChartRef.current) {
      const estatusData = data.siniestros_por_estatus || {};
      const keys   = Object.keys(ESTATUS_LABELS);
      const labels = keys.map((k) => ESTATUS_LABELS[k]);
      const values = keys.map((k) => estatusData[k]?.total || 0);
      const colors = keys.map((k) => ESTATUS_COLORS[k]);

      sinInstance.current = new Chart(sinChartRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderRadius: 5,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: "#6b6d7a", font: { size: 11 } },
              grid: { display: false },
              border: { display: false },
            },
            y: {
              ticks: { color: "#6b6d7a", font: { size: 11 } },
              grid: { color: "rgba(255,255,255,0.05)" },
              border: { display: false },
            },
          },
        },
      });
    }

    return () => {
      mrrInstance.current?.destroy();
      sinInstance.current?.destroy();
    };
  }, [data]);

  // ── Loading / error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sa-page">
        <div className="sa-loading">
          <div className="sa-spinner" />
          <span>Cargando métricas…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sa-page">
        <div className="sa-error">{error}</div>
      </div>
    );
  }

  const { kpis, mrr_por_plan, aseguradoras, planes } = data;

  return (
    <div className="sa-page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sa-page__header">
        <div>
          <h1 className="sa-page__title">Dashboard</h1>
          <p className="sa-page__sub">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="sa-header-tag">
          <span className="dot" />
          superadmin
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <section className="sa-section">
        <p className="sa-section__label">Métricas SaaS</p>
        <div className="sa-kpi-grid">
          <KpiCard
            label="MRR"
            value={fmt(kpis.mrr)}
            sub={`${kpis.suscripciones_activas} pagada${kpis.suscripciones_activas !== 1 ? "s" : ""} · ${kpis.suscripciones_trial} trial`}
            accent
          />
          <KpiCard
            label="Tasa de conversión"
            value={`${kpis.tasa_conversion}%`}
            sub="Trial → plan pagado"
          />
          <KpiCard
            label="Churn rate"
            value={`${kpis.churn_rate}%`}
            sub="Cancelaciones este mes"
          />
          <KpiCard
            label="LTV estimado"
            value={fmt(kpis.ltv)}
            sub="Por aseguradora"
          />
          <KpiCard
            label="Aseguradoras activas"
            value={fmtNum(kpis.total_aseguradoras)}
            sub={`${kpis.suscripciones_trial} en trial`}
          />
          <KpiCard
            label="Siniestros este mes"
            value={fmtNum(kpis.siniestros_mes)}
            sub="Uso del sistema"
          />
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="sa-charts-row">
        <div className="sa-card">
          <p className="sa-card__title">MRR por plan</p>
          <div className="sa-legend">
            {mrr_por_plan?.map((p, i) => (
              <span key={p.plan} className="sa-legend__item">
                <span
                  className="sa-legend__dot"
                  style={{ background: PLAN_COLORS[i] }}
                />
                {p.plan} — {fmt(p.total)}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: "180px" }}>
            <canvas
              ref={mrrChartRef}
              role="img"
              aria-label={`MRR por plan: ${mrr_por_plan?.map((p) => `${p.plan} ${fmt(p.total)}`).join(", ")}`}
            />
          </div>
        </div>

        <div className="sa-card">
          <p className="sa-card__title">Siniestros por estatus</p>
          <div className="sa-legend">
            {Object.entries(ESTATUS_LABELS).map(([k, label]) => (
              <span key={k} className="sa-legend__item">
                <span className="sa-legend__dot" style={{ background: ESTATUS_COLORS[k] }} />
                {label}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: "180px" }}>
            <canvas
              ref={sinChartRef}
              role="img"
              aria-label="Siniestros agrupados por estatus"
            />
          </div>
        </div>
      </div>

      {/* ── Tabla aseguradoras ───────────────────────────────────────────── */}
      <section className="sa-section">
        <p className="sa-section__label">Aseguradoras registradas</p>
        <div className="sa-card sa-card--table">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Aseguradora</th>
                  <th>Plan</th>
                  <th>Suscripción</th>
                  <th>Usuarios</th>
                  <th>Clientes</th>
                  <th>Siniestros</th>
                  <th>Pólizas</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {aseguradoras?.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="sa-cell-name">{a.nombre}</div>
                      <div className="sa-cell-email">{a.correo}</div>
                    </td>
                    <td><PlanBadge plan={a.plan} /></td>
                    <td>
                      {a.precio_plan
                        ? fmt(a.precio_plan) + "/mes"
                        : "—"}
                    </td>
                    <td>{fmtNum(a.total_usuarios)}</td>
                    <td>{fmtNum(a.total_clientes)}</td>
                    <td>{fmtNum(a.total_siniestros)}</td>
                    <td>{fmtNum(a.total_polizas)}</td>
                    <td>
                      <StatusBadge estatus={a.estatus_display || a.estatus_suscripcion || a.estatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Planes ──────────────────────────────────────────────────────── */}
      <section className="sa-section">
        <p className="sa-section__label">Planes del sistema</p>
        <div className="sa-planes-grid">
          {planes?.map((plan, i) => {
            const maxSubs = Math.max(...(planes.map((p) => p.suscriptores || 0)), 1);
            const pct = Math.round(((plan.suscriptores || 0) / maxSubs) * 100);
            return (
              <div key={plan.id} className="sa-plan-card">
                <div className="sa-plan-card__top">
                  <span
                    className="sa-plan-card__dot"
                    style={{ background: PLAN_COLORS[i] }}
                  />
                  <span className="sa-plan-card__name">{plan.nombre}</span>
                  <span
                    className={`sa-badge ${plan.estatus === "activo" ? "badge--success" : "badge--danger"}`}
                  >
                    {plan.estatus}
                  </span>
                </div>
                <div className="sa-plan-card__price">
                  {fmt(plan.precio)}<span>/mes</span>
                </div>
                {plan.precio_anual && (
                  <div className="sa-plan-card__annual">
                    {fmt(plan.precio_anual)}/año
                  </div>
                )}
                <div className="sa-plan-card__bar-label">
                  <span>Suscriptores activos</span>
                  <span>{plan.suscriptores || 0}</span>
                </div>
                <div className="sa-plan-card__track">
                  <div
                    className="sa-plan-card__fill"
                    style={{ width: `${pct}%`, background: PLAN_COLORS[i] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
