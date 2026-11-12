import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../css/SiniestroDetalle.css";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CancelIcon from "@mui/icons-material/Cancel";

import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ReplayIcon from "@mui/icons-material/Replay";

import PrimaryButton from "../../components/PrimaryButton";
import OutlineButton from "../../components/OutlineButton";
import useAccionAsync from "../../hooks/useAccionAsync";
import Modal, { PieAcciones } from "../../components/siniestro/Modal";
import { EstatusSiniestro } from "../../components/siniestro/Badges";
import TabDatos from "../../components/siniestro/TabDatos";
import TabDocumentos from "../../components/siniestro/TabDocumentos";
import TabEvidencias from "../../components/siniestro/TabEvidencias";
import TabEvaluacion from "../../components/siniestro/TabEvaluacion";
import TabIndemnizacion from "../../components/siniestro/TabIndemnizacion";
import TabHistorial from "../../components/siniestro/TabHistorial";
import { api, dinero, mensajeError } from "../../services/siniestroApi";

const AVISO_EXITO_MS = 3500;
const MOTIVO_MIN = 5;

// Estilos del icono de advertencia (por si el CSS no define .advertencia)
const ESTILO_ICONO_ADVERTENCIA = { background: "#FFF4D6", color: "#9A6B00" };

// Colores de los botones de acción
const COLOR_NORMAL = { color: "#295E4E", hover: "#357564" };
const COLOR_PELIGRO = { color: "#C0392B", hover: "#A33025" };

// Pasos que una persona puede dar a mano. Los demás los mueve el sistema.
// contorno: true -> botón blanco con borde de color que se invierte al pasar el mouse
const ACCIONES = {
  rechazado: { texto: "Rechazar siniestro", icono: <RemoveCircleIcon />, peligro: true, contorno: true, motivo: true, exito: "El siniestro se rechazó." },
  cancelado: { texto: "Cancelar siniestro", icono: <CancelIcon />, peligro: true, motivo: true, exito: "El siniestro se canceló." },
  reabierto: { texto: "Reabrir", icono: <LockOpenIcon />, motivo: true, exito: "El siniestro se reabrió." },
  cerrado: { texto: "Cerrar", icono: <LockOutlinedIcon />, motivo: false, exito: "El siniestro se cerró." },
  en_evaluacion: { texto: "Reconsiderar (volver a evaluación)", icono: <ReplayIcon />, motivo: true, exito: "El siniestro volvió a evaluación." },
};

const TABS = [
  ["datos", "Datos"],
  ["documentos", "Documentos"],
  ["evidencias", "Evidencias"],
  ["evaluacion", "Evaluación"],
  ["indemnizacion", "Indemnización"],
  ["historial", "Historial"],
];

export default function SiniestroDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : "datos";

  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // { tipo: 'exito' | 'error' | 'advertencia', titulo, mensaje }
  const [aviso, setAviso] = useState(null);

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}`);
      setDetalle(r.data);
      setError("");
    } catch (e) {
      setError(e.response?.status === 404 ? "No se encontró el siniestro, o no es uno de tus casos." : mensajeError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarAccion = () => {
    if (ocupado) return;
    setAccion(null);
    setMotivo("");
  };

  const cambiarEstatus = async () => {
    const info = ACCIONES[accion];

    if (info?.motivo && motivo.trim().length < MOTIVO_MIN) {
      mostrarAviso(
        "error",
        "Falta el motivo",
        `Describe el motivo con al menos ${MOTIVO_MIN} caracteres (${motivo.trim().length}/${MOTIVO_MIN}).`
      );
      return;
    }

    setOcupado(true);
    try {
      await api.post(`/siniestros/${id}/estatus`, { estatus: accion, motivo });
      setAccion(null);
      setMotivo("");
      await cargar();
      mostrarAviso("exito", "Estatus actualizado", info?.exito || "El estatus se actualizó correctamente.");
    } catch (e) {
      console.error("Error al cambiar el estatus:", e);
      mostrarAviso("error", "No se pudo cambiar el estatus", mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  // Si tarda más de 2 s sale el loader de letras de BalamCore
  const [confirmarEstatus, enviando] = useAccionAsync(cambiarEstatus);

  if (error) {
    return (
      <div className="container py-4">
        <nav className="sd-crumbs" aria-label="Ruta de navegación">
          <button className="sd-crumb-link" onClick={() => navigate("/admin/siniestros")}>Siniestros</button>
          <span className="sd-crumb-sep">/</span>
          <span className="sd-crumb-actual">Expediente</span>
        </nav>
        <div className="sd-alerta error">{error}</div>
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  const faltantes = detalle.documentos?.faltantes || 0;
  const info = accion ? ACCIONES[accion] : null;

  return (
    <div className="container py-4">
      <div className="sd-header">
        <div>
          <nav className="sd-crumbs" aria-label="Ruta de navegación">
            <button className="sd-crumb-link" onClick={() => navigate("/admin/siniestros")}>Siniestros</button>
            <span className="sd-crumb-sep">/</span>
            <span className="sd-crumb-actual">Expediente</span>
          </nav>
          <h1 className="sd-title">
            {detalle.numero_siniestro} <EstatusSiniestro valor={detalle.estatus_valor} />
          </h1>
          <div className="sd-sub">
            {detalle.cliente} · póliza {detalle.poliza}
          </div>
        </div>
        <div className="sd-acciones">
          {(detalle.transiciones || []).filter((t) => ACCIONES[t]).map((t) => {
            const a = ACCIONES[t];
            const paleta = a.peligro ? COLOR_PELIGRO : COLOR_NORMAL;
            const abrir = () => {
              setAccion(t);
              setMotivo("");
            };

            return a.contorno ? (
              <OutlineButton key={t} text={a.texto} icon={a.icono} color={paleta.color} onClick={abrir} />
            ) : (
              <PrimaryButton key={t} text={a.texto} icon={a.icono} color={paleta.color} hover={paleta.hover} onClick={abrir} />
            );
          })}
        </div>
      </div>

      <div className="sd-resumen">
        <div className="sd-kpi"><span>Monto reclamado</span><strong>{dinero(detalle.monto_reclamado)}</strong></div>
        <div className="sd-kpi"><span>Ajustador</span><strong>{detalle.ajustador}</strong></div>
        <div className="sd-kpi"><span>Prioridad</span><strong>{detalle.prioridad}</strong></div>
        <div className="sd-kpi">
          <span>Documentos</span>
          <strong>{detalle.documentos ? `${detalle.documentos.resueltos}/${detalle.documentos.obligatorios}` : "—"}</strong>
        </div>
        {detalle.evaluacion && (
          <div className="sd-kpi"><span>Monto recomendado</span><strong>{dinero(detalle.evaluacion.monto_recomendado)}</strong></div>
        )}
        {detalle.indemnizacion && (
          <div className="sd-kpi"><span>Indemnización</span><strong>{dinero(detalle.indemnizacion.monto_aprobado)}</strong></div>
        )}
      </div>

      <div className="sd-tabs">
        {TABS.map(([k, t]) => (
          <button key={k} className={`sd-tab ${tab === k ? "activa" : ""}`} onClick={() => setParams({ tab: k })}>
            {t}
            {k === "documentos" && faltantes > 0 && <span className="sd-punto">{faltantes}</span>}
          </button>
        ))}
      </div>

      {tab === "datos" && <TabDatos detalle={detalle} onCambio={cargar} onAviso={mostrarAviso} />}
      {tab === "documentos" && <TabDocumentos detalle={detalle} onCambio={cargar} onAviso={mostrarAviso} />}
      {tab === "evidencias" && <TabEvidencias detalle={detalle} onAviso={mostrarAviso} />}
      {tab === "evaluacion" && <TabEvaluacion detalle={detalle} onCambio={cargar} onAviso={mostrarAviso} />}
      {tab === "indemnizacion" && <TabIndemnizacion detalle={detalle} onCambio={cargar} onAviso={mostrarAviso} />}
      {tab === "historial" && <TabHistorial detalle={detalle} />}

      <Modal
        open={!!accion}
        titulo={info?.texto || ""}
        subtitulo={detalle.numero_siniestro}
        onClose={cerrarAccion}
        pie={
          <PieAcciones
            onCancelar={cerrarAccion}
            onConfirmar={confirmarEstatus}
            ocupado={ocupado || enviando}
            peligro={info?.peligro}
            textoConfirmar="Confirmar"
          />
        }
      >
        <div className="sd-form-grid">
          <div className="completo">
            <label>{info?.motivo ? "Motivo (mínimo 5 caracteres, queda en el historial)" : "Comentario (opcional)"}</label>
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} />
          </div>
        </div>
      </Modal>

      {/* ---------- Aviso (éxito / error / advertencia) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div
              className={`evi-aviso-icono ${aviso.tipo}`}
              style={aviso.tipo === "advertencia" ? ESTILO_ICONO_ADVERTENCIA : undefined}
            >
              {aviso.tipo === "exito" && <CheckCircleIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === "error" && <ErrorOutlineIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === "advertencia" && <WarningAmberIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}