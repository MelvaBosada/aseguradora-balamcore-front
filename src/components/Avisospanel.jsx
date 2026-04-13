import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NotificationsIcon  from "@mui/icons-material/Notifications";
import CloseIcon          from "@mui/icons-material/Close";
import ChevronRightIcon   from "@mui/icons-material/ChevronRight";
import AccessTimeIcon     from "@mui/icons-material/AccessTime";
import SmsFailedSharpIcon from "@mui/icons-material/SmsFailedSharp";

import { PolizasVencerData } from "../components/PolizasVencerData";

const FILTROS = [
  { label: "Todos",   value: 999 },
  { label: "7 días",  value: 7   },
  { label: "15 días", value: 15  },
  { label: "30 días", value: 30  },
];

const getUrgencia = (dias) => {
  if (dias <= 7)  return "urgente";
  if (dias <= 15) return "proximo";
  return "normal";
};

const AvisosPanel = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [filtro,    setFiltro]    = useState(999);
  const [polizas,   setPolizas]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  // Carga inicial — trae todos para tener el badge correcto
  useEffect(() => {
    PolizasVencerData(999)
      .then(setPolizas)
      .catch(console.error);
  }, []);

  // Recarga cuando cambia el filtro
 useEffect(() => {
  if (!panelOpen) return;

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await PolizasVencerData(filtro);
      setPolizas(data);
    } finally {
      setLoading(false);
    }
  };

  cargar();
}, [filtro, panelOpen]);

  const urgentes          = polizas.filter(p => p.dias <= 7).length;
  const avisosFiltrados   = polizas; // ya viene filtrado del backend

  const handleAvisoClick = () => {
    setPanelOpen(false);
    navigate("/admin/polizasV");
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button className="avisos-trigger" onClick={() => setPanelOpen(true)}>
        <SmsFailedSharpIcon />
        <span className="avisos-trigger-label"></span>
        {urgentes > 0 && <span className="avisos-badge">{urgentes}</span>}
      </button>

      {/* OVERLAY */}
      {panelOpen && (
        <div className="avisos-overlay" onClick={() => setPanelOpen(false)} />
      )}

      {/* PANEL */}
      <div className={`avisos-panel ${panelOpen ? "open" : ""}`}>

        {/* Header */}
        <div className="avisos-panel-header">
          <div className="avisos-header-icon">
            <NotificationsIcon />
          </div>
          <div className="avisos-header-info">
            <h3>Pólizas por vencer</h3>            <p>{polizas.length} pólizas próximas</p>
          </div>
          <button className="avisos-close" onClick={() => setPanelOpen(false)}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Filtros */}
        <div className="avisos-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              className={`filtro-btn ${filtro === f.value ? "active" : ""}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="avisos-list">
          {loading ? (
            <div className="avisos-empty">
              <p>Cargando...</p>
            </div>
          ) : avisosFiltrados.length === 0 ? (
            <div className="avisos-empty">
              <AccessTimeIcon style={{ fontSize: 36, opacity: 0.3, marginBottom: 8 }} />
              <p>Sin pólizas en este rango</p>
            </div>
          ) : (
            avisosFiltrados.map((p) => {
              const urg = getUrgencia(p.dias);
              return (
                <div key={p.id} className={`aviso-item ${urg}`} onClick={handleAvisoClick}>
                  <div className="aviso-top">
                    <div className="aviso-dot" data-urg={urg} />
                    <span className="aviso-nombre">{p.nombre} {p.apellido}</span>
                    <ChevronRightIcon className="aviso-arrow" />
                  </div>
                  <div className="aviso-mid">
                    <span className="aviso-poliza">{p.nPoliza}</span>
                    <span className="aviso-tipo"> · {p.tipo}</span>
                  </div>
                  <div className="aviso-footer">
                    <span className={`aviso-dias ${urg}`}>
                      {p.dias <= 7 ? "⚠ " : ""}{p.dias} días restantes
                    </span>
                    <span className="aviso-fecha">{p.vence}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="avisos-panel-footer">
          <button className="avisos-ver-todo" onClick={handleAvisoClick}>
            Ver todas las pólizas por vencer
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>

      </div>
    </>
  );
};

export default AvisosPanel;