import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

import PolicyIcon from "@mui/icons-material/Policy";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PeopleIcon from "@mui/icons-material/People";
import PaymentsIcon from "@mui/icons-material/Payments";

import AvisosPanel from "../../components/Avisospanel";
import "../../css/Dashboard.css";

/* ── DATA ─────────────────────────────────────────── */
const kpis = [
    { label: "Pólizas activas", value: 1284, sub: "+12 este mes", subClass: "kpi-up", icon: <PolicyIcon />, bg: "#dcfce7", color: "#16a34a" },
    { label: "Siniestros activos", value: 38, sub: "-4 este mes", subClass: "kpi-down", icon: <ReportProblemIcon />, bg: "#fee2e2", color: "#dc2626" },
    { label: "Clientes", value: 946, sub: "+8 este mes", subClass: "kpi-up", icon: <PeopleIcon />, bg: "#dbeafe", color: "#2563eb" },
    { label: "Pagos pendientes", value: "$84k", sub: "23 por cobrar", subClass: "", icon: <PaymentsIcon />, bg: "#fef9c3", color: "#ca8a04" },
];

const ingresosData = [
    { mes: "Sep", ingresos: 42000, siniestros: 8000 },
    { mes: "Oct", ingresos: 55000, siniestros: 12000 },
    { mes: "Nov", ingresos: 48000, siniestros: 9000 },
    { mes: "Dic", ingresos: 61000, siniestros: 14000 },
    { mes: "Ene", ingresos: 53000, siniestros: 11000 },
    { mes: "Feb", ingresos: 67000, siniestros: 7000 },
];

const polizasTipo = [
    { name: "Robo", value: 310 },
    { name: "Hogar", value: 280 },
    { name: "Huracanes", value: 190 },
    { name: "Daños Eléctricos", value: 74 },
    { name: "Inundaciones", value: 74 },
];

const PIE_COLORS = ["#0F4C3A", "#295E4E", "#4a9477", "#f59e0b", "#94a3b8"];

const ultimosSiniestros = [
    { id: "S-0091", cliente: "María Méndez", tipo: "Robo", fecha: "24/02/2026", estado: "Pendiente" },
    { id: "S-0090", cliente: "Juan González", tipo: "Hogar", fecha: "22/02/2026", estado: "Activo" },
    { id: "S-0089", cliente: "Jacob Mendoza", tipo: "Daños Eléctricos", fecha: "20/02/2026", estado: "Activo" },
    { id: "S-0088", cliente: "Miguel Torres", tipo: "Robo", fecha: "18/02/2026", estado: "Vencido" },
    { id: "S-0087", cliente: "Ángel Torres", tipo: "Inundaciones", fecha: "15/02/2026", estado: "Pendiente" },
];

const badgeEstado = (estado) => {
    const map = { Activo: "badge-activo", Pendiente: "badge-pendiente", Vencido: "badge-vencido" };
    return <span className={`badge-estado ${map[estado]}`}>{estado}</span>;
};

/* ── TOOLTIP PERSONALIZADO ────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="dash-tooltip">
                <p className="dash-tooltip-label">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color, margin: "2px 0" }}>
                        {entry.name}: <strong>${entry.value.toLocaleString()}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

/* ── COMPONENTE ───────────────────────────────────── */
const Dashboard = () => {
    return (
        <div className="dash-wrapper">

            {/* KPIs */}
            <div className="dash-grid">
                {kpis.map((k, i) => (
                    <div className="kpi-card" key={i}>
                        <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>
                            {k.icon}
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">{k.label}</p>
                            <p className="kpi-value">{k.value}</p>
                            <p className="kpi-sub">
                                <span className={k.subClass}>{k.sub}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* GRÁFICAS */}
            <div className="dash-charts">

                <div className="chart-card">
                    <h3>Ingresos vs Siniestros</h3>
                    <div className="chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ingresosData} barCategoryGap="30%" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#0F4C3A" radius={[5, 5, 0, 0]} />
                                <Bar dataKey="siniestros" name="Siniestros" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Pólizas por tipo</h3>
                    <div className="chart-inner">
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
                                    {polizasTipo.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    wrapperStyle={{ fontSize: "12px", zIndex: 10 }}
                                    isAnimationActive={false}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={9}
                                    wrapperStyle={{ fontSize: "11px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* BOTTOM */}
            <div className="dash-bottom">

                {/* TABLA — sin cambios */}
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
                                {ultimosSiniestros.map((s) => (
                                    <tr key={s.id}>
                                        <td><strong>{s.id}</strong></td>
                                        <td>{s.cliente}</td>
                                        <td>{s.tipo}</td>
                                        <td>{s.fecha}</td>
                                        <td>{badgeEstado(s.estado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TENDENCIA — gráfica igual + stats abajo */}
                <div className="chart-card">
                    <h3>Tendencia de siniestros</h3>
                    <div className="chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={ingresosData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
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
                    </div>

                    {/* STATS MES ALTO / BAJO */}
                    <div className="table-footer-stats">
                        <div className="tfs-item">
                            <div className="tfs-icon-wrap tfs-icon-alto">↑</div>
                            <div className="tfs-info">
                                <span className="tfs-label">Mes más alto</span>
                                <span className="tfs-mes">Diciembre</span>
                            </div>
                            <span className="tfs-val tfs-val-alto">$14,000</span>
                        </div>
                        <div className="tfs-divider" />
                        <div className="tfs-item">
                            <div className="tfs-icon-wrap tfs-icon-bajo">↓</div>
                            <div className="tfs-info">
                                <span className="tfs-label">Mes más bajo</span>
                                <span className="tfs-mes">Septiembre</span>
                            </div>
                            <span className="tfs-val tfs-val-bajo">$8,000</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* PANEL AVISOS — componente separado, sin tocar */}
            <AvisosPanel />

        </div>
    );
};

export default Dashboard;
