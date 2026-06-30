import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import logoImg from "../../../../src/assets/LogoA.png";
import "./SuperAdminLayout.css";

const NAV_ITEMS = [
  { to: "/superadmin/dashboard",    icon: "⬡", label: "Dashboard"    },
  { to: "/superadmin/suscripciones",  icon: "▣", label: "Suscripciones"  }, 
  { to: "/superadmin/aseguradoras", icon: "◈", label: "Aseguradoras" },
  { to: "/superadmin/planes",       icon: "◆", label: "Planes"       },
  { to: "/superadmin/modulos",      icon: "⊞", label: "Módulos"      }, 
  { to: "/superadmin/usuarios",       icon: "◉", label: "Usuarios"       }, 
];

export default function SuperAdminLayout() {
  const navigate  = useNavigate();
  const isMobile  = () => window.innerWidth <= 768;

  const [collapsed,    setCollapsed]    = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [mobile,       setMobile]       = useState(isMobile());

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    document.body.className             = "";
    document.body.style.cssText         = "";
    document.documentElement.style.cssText = "";
  }, []);

  useEffect(() => {
    const onResize = () => {
      const m = isMobile();
      setMobile(m);
      if (!m) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    localStorage.clear();
    navigate("/login");
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className={`sa-shell ${!mobile && collapsed ? "sa-shell--collapsed" : ""}`}>

      {/* ── OVERLAY móvil ─────────────────────────────────── */}
      {mobile && drawerOpen && (
        <div className="sa-overlay" onClick={closeDrawer} />
      )}

      {/* ── BOTÓN HAMBURGUESA móvil ───────────────────────── */}
      {mobile && (
        <button
          className="sa-hamburger"
          onClick={() => setDrawerOpen((p) => !p)}
          aria-label="Abrir menú"
        >
          <span /><span /><span />
        </button>
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className={`sa-sidebar ${mobile ? (drawerOpen ? "sa-sidebar--open" : "sa-sidebar--hidden") : ""}`}>

        <div className="sa-sidebar__top">
          <div className="sa-logo">
            <img src={logoImg} alt="BalamCore" className="sa-logo__img" />
            {(!collapsed || mobile) && (
              <div className="sa-logo__text">
                <span className="sa-logo__name">BalamCore</span>
                <span className="sa-logo__role">Super Admin</span>
              </div>
            )}
          </div>
          {/* Colapsar solo en desktop */}
          {!mobile && (
            <button
              className="sa-collapse-btn"
              onClick={() => setCollapsed((p) => !p)}
              aria-label="Colapsar sidebar"
            >
              {collapsed ? "›" : "‹"}
            </button>
          )}
          {/* Cerrar drawer en móvil */}
          {mobile && (
            <button className="sa-collapse-btn" onClick={closeDrawer} aria-label="Cerrar menú">
              ✕
            </button>
          )}
        </div>

        <nav className="sa-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sa-nav__item ${isActive ? "sa-nav__item--active" : ""}`
              }
              title={collapsed && !mobile ? item.label : undefined}
              onClick={mobile ? closeDrawer : undefined}
            >
              <span className="sa-nav__icon">{item.icon}</span>
              {(!collapsed || mobile) && (
                <span className="sa-nav__label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sa-sidebar__bottom">
          {(!collapsed || mobile) && (
            <div className="sa-user">
              <div className="sa-user__avatar">
                {(usuario.correo || "S")[0].toUpperCase()}
              </div>
              <div className="sa-user__info">
                <span className="sa-user__email">{usuario.correo || "superadmin"}</span>
                <span className="sa-user__tag">superadmin</span>
              </div>
            </div>
          )}
          <button
            className="sa-logout-btn"
            onClick={handleLogout}
            title={collapsed && !mobile ? "Salir" : undefined}
          >
            <span>⎋</span>
            {(!collapsed || mobile) && <span>Salir</span>}
          </button>
        </div>

      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="sa-main">
        <Outlet />
      </main>

    </div>
  );
}
