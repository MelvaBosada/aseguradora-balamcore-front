import { useState, useEffect } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

import PolicyIcon from "@mui/icons-material/Policy";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PeopleIcon from "@mui/icons-material/People";

import AvisosPanel from "../../components/Avisospanel";
import ModalPlanes from "../../components/ModalPlanes";
import "../../css/Dashboard.css";
import usePermisos from "../../hooks/usePermisos";

const API = import.meta.env.VITE_API_URL || '/api';
const PIE_COLORS = ["#0F4C3A", "#295E4E", "#4a9477", "#f59e0b", "#94a3b8"];

const toArray = (data) => Array.isArray(data) ? data : (data && typeof data === "object" ? Object.values(data) : []);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="dash-tooltip">
            <p className="dash-tooltip-label">{label}</p>
            {payload.map((entry, i) => (
                <p key={`tooltip-${i}`} style={{ color: entry.color, margin: "2px 0" }}>
                    {entry.name}: <strong>
                        {typeof entry.value === "number" && entry.name.toLowerCase().includes("ingreso")
                            ? `$${entry.value.toLocaleString()}`
                            : entry.value?.toLocaleString() ?? 0}
                    </strong>
                </p>
            ))}
        </div>
    );
};

const badgeEstado = (estado) => {
    const map = {
        abierto:       "badge-activo",
        en_proceso:    "badge-activo",
        en_evaluacion: "badge-pendiente",
        resuelto:      "badge-pendiente",
        cerrado:       "badge-vencido",
        rechazado:     "badge-vencido",
    };
    return <span className={`badge-estado ${map[estado] ?? ""}`}>{estado}</span>;
};

const FiltroBtn = ({ valor, actual, onChange }) => (
    <button
        className={actual === valor ? "filtro-btn active" : "filtro-btn"}
        onClick={() => onChange(valor)}
    >
        {valor.charAt(0).toUpperCase() + valor.slice(1)}
    </button>
);

const Dashboard = () => {
    const { verificarPagoStripe, vencida } = usePermisos();

    const [openPlanes, setOpenPlanes]               = useState(false);
    const [kpis, setKpis]                           = useState(null);
    const [ingresos, setIngresos]                   = useState([]);
    const [polizasTipo, setPolizasTipo]             = useState([]);
    const [tendencia, setTendencia]                 = useState([]);
    const [ultimosSiniestros, setUltimosSiniestros] = useState([]);

    const [filtroIngresos, setFiltroIngresos]   = useState("mensual");
    const [filtroTendencia, setFiltroTendencia] = useState("mensual");

    const [loadingKpis, setLoadingKpis]           = useState(true);
    const [loadingIngresos, setLoadingIngresos]   = useState(true);
    const [loadingTendencia, setLoadingTendencia] = useState(true);

    // Abrir modal si la suscripción está vencida
    useEffect(() => {
        if (vencida) setOpenPlanes(true);
    }, [vencida]);

    // Verificar pago de Stripe al retornar a la pantalla
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("pago") === "exitoso") {
            verificarPagoStripe().then((res) => {
                if (res) window.location.reload();
            });
        }
    }, [verificarPagoStripe]);

    // Carga inicial de datos estáticos
    useEffect(() => {
        const controller = new AbortController();

        const fetchInicial = async () => {
            try {
                const [kpisRes, polizasRes, siniestrosRes] = await Promise.all([
                    axios.get(`${API}/dashboard/kpis`, { signal: controller.signal }),
                    axios.get(`${API}/dashboard/polizas-por-tipo`, { signal: controller.signal }),
                    axios.get(`${API}/dashboard/ultimos-siniestros`, { signal: controller.signal })
                ]);

                setKpis(kpisRes.data ?? null);
                setPolizasTipo(toArray(polizasRes.data));
                setUltimosSiniestros(toArray(siniestrosRes.data));
            } catch (err) {
                if (axios.isCancel(err)) return;
                if (err.response?.status === 403) setOpenPlanes(true);
            } finally {
                setLoadingKpis(false);
            }
        };

        fetchInicial();
        return () => controller.abort();
    }, []);

    // Carga de Ingresos por filtro
    useEffect(() => {
        const controller = new AbortController();
        setLoadingIngresos(true);

        axios.get(`${API}/dashboard/ingresos?filtro=${filtroIngresos}`, { signal: controller.signal })
            .then(res => setIngresos(toArray(res.data)))
            .catch(err => {
                if (!axios.isCancel(err) && err.response?.status === 403) setOpenPlanes(true);
            })
            .finally(() => setLoadingIngresos(false));

        return () => controller.abort();
    }, [filtroIngresos]);

    // Carga de Tendencia por filtro
    useEffect(() => {
        const controller = new AbortController();
        setLoadingTendencia(true);

        axios.get(`${API}/dashboard/tendencia-siniestros?filtro=${filtroTendencia}`, { signal: controller.signal })
            .then(res => setTendencia(toArray(res.data)))
            .catch(err => {
                if (!axios.isCancel(err) && err.response?.status === 403) setOpenPlanes(true);
            })
            .finally(() => setLoadingTendencia(false));

        return () => controller.abort();
    }, [filtroTendencia]);

    // KPI Cards
    const kpiCards = kpis ? [
        {
            label: "Pólizas activas en total",
            value: kpis.polizas_activas ?? 0,
            sub: `${kpis.polizas_este_mes ?? 0} este mes`,
            subClass: "kpi-up",
            icon: <PolicyIcon />,
            bg: "#dcfce7", color: "#16a34a",
        },
        {
            label: "Siniestros activos",
            value: kpis.siniestros_activos ?? 0,
            sub: `${kpis.siniestros_este_mes ?? 0} este mes`,
            subClass: (kpis.siniestros_este_mes ?? 0) > 0 ? "kpi-down" : "kpi-up",
            icon: <ReportProblemIcon />,
            bg: "#fee2e2", color: "#dc2626",
        },
        {
            label: "Clientes",
            value: kpis.clientes ?? 0,
            sub: `+${kpis.clientes_este_mes ?? 0} este mes`,
            subClass: "kpi-up",
            icon: <PeopleIcon />,
            bg: "#dbeafe", color: "#2563eb",
        },
    ] : [];

    const tendenciaValida = tendencia.filter(t => t && typeof t.siniestros === "number");
    const mesAlto = tendenciaValida.length
        ? tendenciaValida.reduce((a, b) => a.siniestros > b.siniestros ? a : b)
        : null;
    const mesBajo = tendenciaValida.length
        ? tendenciaValida.reduce((a, b) => a.siniestros < b.siniestros ? a : b)
        : null;

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <div className="dash-wrapper">
            <ModalPlanes
                open={openPlanes}
                onClose={() => setOpenPlanes(false)}
                onLogout={handleLogout}
            />

            {/* KPIs */}
            <div className="dash-grid">
                {loadingKpis
                    ? Array(3).fill(0).map((_, i) => (
                        <div key={`skeleton-${i}`} className="kpi-card kpi-skeleton" />
                    ))
                    : kpiCards.map((k, i) => (
                        <div className="kpi-card" key={`kpi-${i}`}>
                            <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>
                                {k.icon}
                            </div>
                            <div className="kpi-info">
                                <p className="kpi-label">{k.label}</p>
                                <p className="kpi-value">{k.value}</p>
                                <p className="kpi-sub"><span className={k.subClass}>{k.sub}</span></p>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* GRÁFICAS */}
            <div className="dash-charts">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Ingresos vs Siniestros</h3>
                        <div className="chart-filtros">
                            <FiltroBtn valor="mensual" actual={filtroIngresos} onChange={setFiltroIngresos} />
                            <FiltroBtn valor="anual"   actual={filtroIngresos} onChange={setFiltroIngresos} />
                        </div>
                    </div>
                    <div className="chart-inner">
                        {loadingIngresos
                            ? <div className="chart-loading">Cargando...</div>
                            : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ingresos} barCategoryGap="30%" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                                        <Bar dataKey="ingresos"   name="Ingresos"   fill="#0F4C3A" radius={[5, 5, 0, 0]} />
                                        <Bar dataKey="siniestros" name="Siniestros" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )
                        }
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Pólizas por tipo</h3>
                    </div>
                    <div className="chart-inner">
                        {polizasTipo.length === 0
                            ? <div className="chart-loading">Sin datos</div>
                            : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={polizasTipo}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="42%"
                                            innerRadius="38%"
                                            outerRadius="62%"
                                            paddingAngle={3}
                                        >
                                            {polizasTipo.map((entry, i) => (
                                                <Cell key={`cell-${entry.name ?? i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [value, name]}
                                            wrapperStyle={{ fontSize: "12px", zIndex: 10 }}
                                            isAnimationActive={false}
                                        />
                                        <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: "11px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )
                        }
                    </div>
                </div>
            </div>

            {/* SECCIÓN INFERIOR */}
            <div className="dash-bottom">
                <div className="chart-card">
                    <h3>Últimos siniestros</h3>
                    <div className="dash-table-wrapper">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ultimosSiniestros.map((s, i) => (
                                    <tr key={s.id ?? `sin-${i}`}>
                                        <td><strong>{s.id}</strong></td>
                                        <td>{s.cliente}</td>
                                        <td>{s.tipo}</td>
                                        <td>{s.fecha ? new Date(s.fecha).toLocaleDateString("es-MX") : "-"}</td>
                                        <td>{badgeEstado(s.estado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Tendencia de siniestros</h3>
                        <div className="chart-filtros">
                            <FiltroBtn valor="mensual" actual={filtroTendencia} onChange={setFiltroTendencia} />
                            <FiltroBtn valor="anual"   actual={filtroTendencia} onChange={setFiltroTendencia} />
                        </div>
                    </div>
                    <div className="chart-inner">
                        {loadingTendencia
                            ? <div className="chart-loading">Cargando...</div>
                            : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={tendencia} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="siniestros"
                                            name="Siniestros"
                                            stroke="#dc2626"
                                            strokeWidth={2.5}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )
                        }
                    </div>

                    <div className="table-footer-stats">
                        <div className="tfs-item">
                            <div className="tfs-icon-wrap tfs-icon-alto">↑</div>
                            <div className="tfs-info">
                                <span className="tfs-label">Periodo más alto</span>
                                <span className="tfs-mes">{mesAlto?.periodo ?? "-"}</span>
                            </div>
                            <span className="tfs-val tfs-val-alto">
                                {mesAlto ? (mesAlto.siniestros ?? 0).toLocaleString() : 0}
                            </span>
                        </div>
                        <div className="tfs-divider" />
                        <div className="tfs-item">
                            <div className="tfs-icon-wrap tfs-icon-bajo">↓</div>
                            <div className="tfs-info">
                                <span className="tfs-label">Periodo más bajo</span>
                                <span className="tfs-mes">{mesBajo?.periodo ?? "-"}</span>
                            </div>
                            <span className="tfs-val tfs-val-bajo">
                                {mesBajo ? (mesBajo.siniestros ?? 0).toLocaleString() : 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AvisosPanel />
        </div>
    );
};

export default Dashboard;