

////////////////////////////////landing////////////////////////////////
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LandingPage.css";
import logo from "../assets/LogoA.png";

/* ─── importa tus capturas aquí ─────────────────────────
   Renómbralas como quieras y añade o quita slides en
   el array SLIDES más abajo.
   ──────────────────────────────────────────────────── */
import screenshotDashboard  from "../assets/screenshots/dashboard.png";
import screenshotPolizas    from "../assets/screenshots/polizas.png";
import screenshotSiniestros from "../assets/screenshots/siniestros.png";
import screenshotClientes   from "../assets/screenshots/clientes.png";
import screenshotReportes   from "../assets/screenshots/reportes.png";

/* ─── SVG ICONS ──────────────────────────────────────── */
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
    </svg>
);
const IconDoc = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
);
const IconAlert = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
);
const IconPeople = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);
const IconMoney = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
);
const IconChart = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
);
const IconChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const IconChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

/* ─── SLIDES — edita títulos/subtítulos y reemplaza las imágenes ── */
const SLIDES = [
    {
        img:      screenshotDashboard,
        titulo:   "Dashboard en tiempo real",
        subtitulo: "KPIs, alertas de vencimiento y resumen operativo de un vistazo.",
    },
    {
        img:      screenshotPolizas,
        titulo:   "Gestión de pólizas",
        subtitulo: "Registra, edita y filtra todas las pólizas activas con alertas automáticas.",
    },
    {
        img:      screenshotSiniestros,
        titulo:   "Control de siniestros",
        subtitulo: "Flujo completo desde el reporte hasta la indemnización final.",
    },
    {
        img:      screenshotClientes,
        titulo:   "Expediente de clientes",
        subtitulo: "Bienes, pólizas e historial de siniestros en un solo expediente.",
    },
    {
        img:      screenshotReportes,
        titulo:   "Reportes y exportación",
        subtitulo: "Genera reportes en PDF listos para entregar en segundos.",
    },
];

/* ─── PLAN DATA ───────────────────────────────────────── */
const PLANES_BASE = [
    {
        key: "basico",
        nombre: "Básico",
        desc: "Ideal para comenzar. Funciones esenciales con límites de uso.",
        precioMensual: 1200,
        precioAnual: 12450,
        featured: false,
        modulos: [
            "Clientes, bienes y coberturas",
            "Pólizas y siniestros",
            "Reportes básicos y evaluaciones",
            "Dashboard limitado",
        ],
        limites: [
            { texto: "Hasta 20 pólizas a vencer/día", limitado: true },
            { texto: "Hasta 50 siniestros al mes", limitado: true },
            { texto: "Hasta 10 bienes por cliente", limitado: true },
            { texto: "PDF limitados", limitado: true },
        ],
    },
    {
        key: "estandar",
        nombre: "Estándar",
        desc: "Para despachos en crecimiento. Sin límites estrictos.",
        precioMensual: 3000,
        precioAnual: 30200,
        featured: false,
        modulos: [
            "Todo lo del plan Básico",
            "Dashboard completo",
            "Indemnizaciones",
            "Módulo de empleados",
            "Reportes avanzados",
        ],
        limites: [
            { texto: "Pólizas a vencer sin límite", limitado: false },
            { texto: "Siniestros ilimitados", limitado: false },
            { texto: "Bienes sin límite por cliente", limitado: false },
            { texto: "PDF ilimitados", limitado: false },
        ],
    },
    {
        key: "premium",
        nombre: "Premium",
        desc: "Acceso total sin límites. Automatización y soporte prioritario.",
        precioMensual: 6000,
        precioAnual: 60000,
        featured: true,
        modulos: [
            "Todo lo del plan Estándar",
            "Control de perfiles y permisos",
            "Renovaciones automáticas",
            "Pólizas por vencer avanzadas",
            "Automatizaciones",
        ],
        limites: [
            { texto: "Sin límites en el sistema", limitado: false },
            { texto: "Soporte prioritario", limitado: false },
            { texto: "Funciones premium y futuras", limitado: false },
        ],
    },
];

const SERVICIOS = [
    { icon: IconDoc,    title: "Gestión de pólizas",      desc: "Registra, edita y da seguimiento a todas las pólizas activas. Alertas automáticas de vencimiento para nunca perder una renovación." },
    { icon: IconAlert,  title: "Control de siniestros",   desc: "Flujo completo de reporte, evaluación e indemnización. Asigna ajustadores, sube evidencias y cierra casos eficientemente." },
    { icon: IconPeople, title: "Gestión de clientes",     desc: "Expediente completo de cada cliente con sus bienes, pólizas y siniestros en un solo lugar. Búsqueda y filtros avanzados." },
    { icon: IconMoney,  title: "Indemnizaciones y pagos", desc: "Autoriza montos, registra formas de pago y genera documentos PDF profesionales listos para entregar al cliente." },
    { icon: IconChart,  title: "Dashboard y reportes",    desc: "Visualiza KPIs en tiempo real: pólizas activas, siniestros por mes, ingresos vs egresos. Exporta reportes cuando los necesites." },
    { icon: IconLock,   title: "Roles y permisos",        desc: "Control total sobre quién ve qué. Crea roles personalizados para ajustadores, peritos, agentes y administrativos." },
];

const PLAN_BTN_LABEL = {
    basico:   "Probar el plan Básico",
    estandar: "Probar el plan Estándar",
    premium:  "Activar plan Premium",
};

/* ══════════════════════════════════════════════════════════
   CARRUSEL COMPONENT
   ══════════════════════════════════════════════════════════ */
function Carrusel() {
    const [current, setCurrent]   = useState(0);
    const [paused,  setPaused]    = useState(false);
    const [animDir, setAnimDir]   = useState("next"); // "next" | "prev"
    const [animating, setAnimating] = useState(false);

    const goTo = useCallback((idx, dir = "next") => {
        if (animating) return;
        setAnimDir(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrent(idx);
            setAnimating(false);
        }, 380);
    }, [animating]);

    const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length, "prev");
    const next = useCallback(() => goTo((current + 1) % SLIDES.length, "next"), [current, goTo]);

    /* auto-avance cada 4.5 s */
    useEffect(() => {
        if (paused) return;
        const id = setInterval(next, 4500);
        return () => clearInterval(id);
    }, [paused, next]);

    /* swipe táctil */
    const touchStart = useRef(null);
    const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const onTouchEnd   = (e) => {
        if (touchStart.current === null) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
        touchStart.current = null;
    };

    const slide = SLIDES[current];

    return (
        <section
            className="lp-carrusel fade-up"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label="Capturas del sistema"
        >
            {/* encabezado */}
            <div className="carrusel-header">
                <div className="section-eyebrow">El sistema en acción</div>
                <h2 className="section-title">Mira lo que verás al entrar</h2>
                <p className="section-sub">
                    Capturas reales del sistema. Sin mockups, sin demos infladas.
                </p>
            </div>

            {/* slide */}
            <div className={`carrusel-stage carrusel-anim-${animDir}${animating ? " animating" : ""}`}>
                <img
                    src={slide.img}
                    alt={slide.titulo}
                    className="carrusel-img"
                    draggable="false"
                />

                {/* overlay de texto */}
                <div className="carrusel-overlay">
                    <p className="carrusel-slide-titulo">{slide.titulo}</p>
                    <p className="carrusel-slide-sub">{slide.subtitulo}</p>
                </div>

                {/* botones prev / next */}
                <button className="carrusel-btn carrusel-btn-prev" onClick={prev} aria-label="Anterior">
                    <IconChevronLeft />
                </button>
                <button className="carrusel-btn carrusel-btn-next" onClick={next} aria-label="Siguiente">
                    <IconChevronRight />
                </button>
            </div>

            {/* dots */}
            <div className="carrusel-dots" role="tablist">
                {SLIDES.map((s, i) => (
                    <button
                        key={i}
                        className={`carrusel-dot${i === current ? " active" : ""}`}
                        onClick={() => goTo(i, i > current ? "next" : "prev")}
                        aria-label={`Ir a ${s.titulo}`}
                        role="tab"
                        aria-selected={i === current}
                    />
                ))}
            </div>

            {/* barra de progreso */}
            <div className="carrusel-progress-bar" key={`${current}-${paused}`}>
                <div className={`carrusel-progress-fill${paused ? " paused" : ""}`} />
            </div>
        </section>
    );
}

/* necesitamos useRef dentro del componente — lo importamos aquí */
import { useRef } from "react";

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const navigate = useNavigate();
    const [anual, setAnual] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "auto";
        document.body.style.height   = "auto";

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.10 }
        );
        document.querySelectorAll(".fade-up, .stagger-item").forEach((el) => observer.observe(el));

        return () => {
            document.body.style.overflow = "hidden";
            document.body.style.height   = "100vh";
            observer.disconnect();
        };
    }, []);

    const irLogin    = () => navigate("/login");
    const irRegistro = () => navigate("/login");
    const irPlanes   = () => {
        const el = document.getElementById("planes");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const fmt = (n) => `$${Number(n).toLocaleString("es-MX")}`;

    return (
        <div className="lp">

            {/* NAV */}
            <nav className="lp-nav">
                <a className="nav-logo" href="#">
                    <img src={logo} alt="BalamCore Logo" className="logo-img" />
                    <span className="nav-logo-text">BalamCore</span>
                </a>
                <div className="nav-btns">
                    <button className="btn-ghost" onClick={irLogin}>Iniciar sesión</button>
                    <button className="btn-solid" onClick={irRegistro}>Ver precios</button>
                </div>
            </nav>

            {/* HERO */}
            <section className="lp-hero">
                <div className="hero-badge"><IconShield />Sistema de gestión para aseguradoras</div>
                <h1 className="hero-title">
                    Gestiona tu aseguradora <span>de forma inteligente</span>
                </h1>
                <p className="hero-sub">
                    BalamCore centraliza pólizas, siniestros, clientes y pagos en un solo
                    sistema diseñado especialmente para despachos ajustadores.
                </p>
                <div className="hero-btns">
                    <button className="btn-hero-primary"   onClick={irRegistro}>Empezar — 15 días de prueba</button>
                    <button className="btn-hero-secondary" onClick={irPlanes}>Ver planes y precios</button>
                </div>
            </section>

            {/* STATS */}
            <div className="lp-stats">
                {[
                    { num: "15 días", label: "Período de prueba" },
                    { num: "3 planes", label: "Para todo tamaño" },
                    { num: "100%",    label: "En la nube" },
                    { num: "MXN",     label: "Precios en pesos" },
                ].map((s) => (
                    <div className="stat" key={s.label}>
                        <div className="stat-num">{s.num}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* SERVICIOS */}
            <section className="lp-section">
                <div className="section-eyebrow fade-up">Servicios</div>
                <h2 className="section-title fade-up">Todo lo que necesita tu despacho</h2>
                <p className="section-sub fade-up">
                    Desde el primer reporte hasta la indemnización final, BalamCore cubre cada etapa del proceso asegurador.
                </p>
                <div className="services-grid">
                    {SERVICIOS.map((svc, i) => {
                        const SvcIcon = svc.icon;
                        return (
                            <div className="service-card stagger-item" key={svc.title} style={{ "--stagger-delay": `${i * 80}ms` }}>
                                <div className="service-icon"><SvcIcon /></div>
                                <h3>{svc.title}</h3>
                                <p>{svc.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CÓMO FUNCIONA */}
            <section className="lp-section lp-section-white">
                <div className="section-eyebrow fade-up">Cómo funciona</div>
                <h2 className="section-title fade-up">En marcha en minutos</h2>
                <p className="section-sub fade-up">
                    Sin instalaciones, sin servidores propios. Solo regístrate y empieza a operar tu despacho desde el navegador.
                </p>
                <div className="steps-grid">
                    {[
                        { n: 1, title: "Regístrate",             desc: "Crea tu cuenta e inicia tu período de prueba de 15 días con acceso completo al sistema." },
                        { n: 2, title: "Configura tu despacho",  desc: "Agrega empleados, define roles y permisos. El sistema se adapta a la estructura de tu organización." },
                        { n: 3, title: "Importa tus datos",      desc: "Registra clientes, pólizas y bienes. El flujo guiado hace el proceso sencillo desde el primer día." },
                        { n: 4, title: "Opera con eficiencia",   desc: "Gestiona siniestros, envía avisos automáticos y genera reportes sin salir del sistema." },
                    ].map(({ n, title, desc }, i) => (
                        <div className="step stagger-item" key={n} style={{ "--stagger-delay": `${i * 100}ms` }}>
                            <div className="step-num">{n}</div>
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CARRUSEL ── justo aquí, entre pasos y planes ── */}
            <Carrusel />

            {/* PLANES */}
            <section className="lp-plans" id="planes">
                <div className="section-eyebrow fade-up">Planes</div>
                <h2 className="section-title fade-up">Elige el plan que se adapta a tu despacho</h2>
                <p className="section-sub fade-up">
                    Prueba cualquier plan 15 días sin costo. Al vencer, elige el que mejor
                    se adapte a tu despacho y actívalo con pago mensual o anual.
                </p>

                <div className="plans-toggle fade-up">
                    <button className={`ptbtn ${!anual ? "active" : "inactive"}`} onClick={() => setAnual(false)}>Mensual</button>
                    <button className={`ptbtn ${anual  ? "active" : "inactive"}`} onClick={() => setAnual(true)}>Anual — Ahorra</button>
                </div>

                <div className="plans-grid">
                    {PLANES_BASE.map((plan, i) => {
                        const precio   = anual ? plan.precioAnual : plan.precioMensual;
                        const periodo  = anual ? "/año" : "/mes";
                        const equivMes = anual ? `Equivale a ${fmt(Math.round(plan.precioAnual / 12))}/mes` : null;
                        return (
                            <div key={plan.key} className={`plan-card stagger-item${plan.featured ? " featured" : ""}`} style={{ "--stagger-delay": `${i * 120}ms` }}>
                                {plan.featured && <div className="plan-badge">⭐ Más completo</div>}
                                <div className="plan-name">{plan.nombre}</div>
                                <div className="plan-desc">{plan.desc}</div>
                                <div className="plan-price">
                                    <span className="plan-amount">{fmt(precio)}</span>
                                    <span className="plan-period">{periodo}</span>
                                    {equivMes && <div className="plan-equiv">{equivMes}</div>}
                                </div>
                                <div className="plan-features">
                                    <div className="plan-feat-section-label">Módulos incluidos</div>
                                    {plan.modulos.map((m) => (
                                        <div className="plan-feature" key={m}><span className="chk">✓</span> {m}</div>
                                    ))}
                                    <hr className="plan-divider" />
                                    <div className="plan-feat-section-label">Características</div>
                                    {plan.limites.map((l) => (
                                        <div className="plan-feature" key={l.texto}>
                                            <span className={l.limitado ? "lim" : "chk"}>{l.limitado ? "⊘" : "✓"}</span> {l.texto}
                                        </div>
                                    ))}
                                </div>
                                <button className={`plan-btn ${plan.featured ? "plan-btn-featured" : "plan-btn-default"}`} onClick={irRegistro}>
                                    {PLAN_BTN_LABEL[plan.key]}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA */}
            <section className="lp-cta">
                <h2 className="fade-up">Activa tu período de prueba hoy</h2>
                <p className="fade-up">
                    15 días de acceso completo para que evalúes el sistema sin compromiso.
                    Al finalizar, elige el plan que mejor se adapte a tu despacho.
                </p>
                <div className="cta-btns fade-up">
                    <button className="btn-hero-primary"   onClick={irRegistro}>Ver planes y registrarse</button>
                    <button className="btn-hero-secondary" onClick={irLogin}>Iniciar sesión</button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="lp-footer">
                <div className="footer-logo">BalamCore</div>
                <div className="footer-copy">© 2026 BalamCore · Sistema de Gestión de Aseguradoras</div>
            </footer>
        </div>
    );
}