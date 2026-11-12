import { useState, useEffect, useRef } from "react";
import "../../css/SiniestroDetalle.css";
import Modal, { PieAcciones } from "./Modal";
import { EstatusSiniestro, PrioridadSiniestro } from "./Badges";
import OutlineButton from "../OutlineButton";
import useAccionAsync from "../../hooks/useAccionAsync";
import { api, dinero, mensajeError } from "../../services/siniestroApi";

const TIPOS = [
  ["robo", "Robo"], ["accidente", "Accidente"], ["incendio", "Incendio"], ["inundacion", "Inundación"],
  ["responsabilidad_civil", "Responsabilidad civil"], ["fallecimiento", "Fallecimiento"], ["invalidez", "Invalidez"], ["otro", "Otro"],
];
const PRIORIDADES = [["baja", "Baja"], ["media", "Media"], ["alta", "Alta"], ["urgente", "Urgente"]];
const NO_EDITABLES = ["dictaminado", "autorizado", "en_pago", "pagado", "cerrado", "cancelado"];

// Convierte una dirección en "lat, lng" usando Nominatim (OpenStreetMap)
const obtenerCoordenadas = async (direccion) => {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=mx&q=${encodeURIComponent(direccion)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return `${Number(data[0].lat).toFixed(6)}, ${Number(data[0].lon).toFixed(6)}`;
  } catch (error) {
    console.error("Error al geocodificar:", error);
    return null;
  }
};

const Dato = ({ titulo, children }) => (
  <div className="sd-dato">
    <span>{titulo}</span>
    <div>{children || "—"}</div>
  </div>
);

export default function TabDatos({ detalle, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({});
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const timerGeoRef = useRef(null);

  // Limpia el temporizador de la geocodificación al desmontar
  useEffect(() => () => clearTimeout(timerGeoRef.current), []);

  const editable = !NO_EDITABLES.includes(detalle.estatus_valor);

  const abrir = () => {
    setF({
      tipo: detalle.tipo_raw || "",
      prioridad: detalle.prioridad_raw || "",
      monto_reclamado: detalle.monto_reclamado ?? "",
      ubicacion_siniestro: detalle.ubicacion_siniestro ?? "",
      coordenadas: detalle.coordenadas ?? "",
    });
    setError("");
    setAbierto(true);
  };

  const cerrar = () => {
    clearTimeout(timerGeoRef.current);
    setAbierto(false);
  };

  // Al escribir la ubicación, se buscan las coordenadas en línea
  const cambiarUbicacion = (valor) => {
    setF((prev) => ({ ...prev, ubicacion_siniestro: valor }));

    clearTimeout(timerGeoRef.current);
    const direccion = valor.trim();

    if (direccion.length >= 8) {
      timerGeoRef.current = setTimeout(async () => {
        const coords = await obtenerCoordenadas(direccion);
        if (coords) {
          setF((prev) => ({ ...prev, coordenadas: coords }));
        }
      }, 1000);
    }
  };

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.put(`/siniestros/${detalle.id}`, {
        tipo: f.tipo,
        prioridad: f.prioridad,
        monto_reclamado: parseFloat(f.monto_reclamado),
        ubicacion_siniestro: f.ubicacion_siniestro || null,
        coordenadas: f.coordenadas || null,
      });
      cerrar();
      onCambio && onCambio();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  // Si tarda más de 2 s sale el loader de letras de BalamCore
  const [guardarAsync, guardando] = useAccionAsync(guardar);

  return (
    <>
      <div className="sd-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Datos del siniestro</h3>
         {editable && <OutlineButton text="Editar" compact square onClick={abrir} />}
        </div>
        <div className="sd-grid">
          <Dato titulo="N° de siniestro">{detalle.numero_siniestro}</Dato>
          <Dato titulo="Estatus">
            <EstatusSiniestro valor={detalle.estatus_valor} />
          </Dato>
          <Dato titulo="Tipo">{detalle.tipo}</Dato>
          <Dato titulo="Prioridad">
            <PrioridadSiniestro valor={detalle.prioridad_raw} />
          </Dato>
          <Dato titulo="Monto reclamado">{dinero(detalle.monto_reclamado)}</Dato>
          <Dato titulo="Deducible aplicado (lo calcula el sistema)">
            {detalle.deducible_aplicado != null ? dinero(detalle.deducible_aplicado) : "Aún sin calcular"}
          </Dato>
          <Dato titulo="Ubicación del siniestro">{detalle.ubicacion_siniestro}</Dato>
          <Dato titulo="Coordenadas">{detalle.coordenadas}</Dato>
          <Dato titulo="Fecha de apertura">{detalle.fecha_creacion}</Dato>
          <Dato titulo="Fecha de arribo">{detalle.fecha_arribo}</Dato>
          <Dato titulo="Última actualización">{detalle.fecha_actualizacion}</Dato>
          <Dato titulo="Ajustador">{detalle.ajustador}</Dato>
          {detalle.fecha_cierre && <Dato titulo="Fecha de cierre">{detalle.fecha_cierre}</Dato>}
          {detalle.motivo_cierre && <Dato titulo="Motivo de cierre">{detalle.motivo_cierre}</Dato>}
        </div>
      </div>

      <div className="sd-card">
        <h3>Asegurado y póliza</h3>
        <div className="sd-grid">
          <Dato titulo="Cliente">{detalle.cliente}</Dato>
          <Dato titulo="Póliza">{detalle.poliza}</Dato>
          <Dato titulo="Reporte">{detalle.id_reporte ? `REP-${String(detalle.id_reporte).padStart(6, "0")}` : ""}</Dato>
        </div>
      </div>

      <Modal
        open={abierto}
        titulo="Editar datos del siniestro"
        subtitulo="El deducible y el monto a pagar los calcula el sistema en el dictamen."
        onClose={cerrar}
        pie={<PieAcciones onCancelar={cerrar} onConfirmar={guardarAsync} ocupado={ocupado || guardando} />}
      >
        {error && <div className="sd-alerta error">{error}</div>}
        <div className="sd-form-grid">
          <div>
            <label>Tipo</label>
            <select value={f.tipo || ""} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              {TIPOS.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Prioridad</label>
            <select value={f.prioridad || ""} onChange={(e) => setF({ ...f, prioridad: e.target.value })}>
              {PRIORIDADES.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Monto reclamado</label>
            <input type="number" min="0" step="0.01" value={f.monto_reclamado ?? ""} onChange={(e) => setF({ ...f, monto_reclamado: e.target.value })} />
          </div>
          <div className="completo">
            <label>Ubicación del siniestro</label>
            <input type="text" maxLength={255} value={f.ubicacion_siniestro ?? ""} onChange={(e) => cambiarUbicacion(e.target.value)} />
          </div>
          <div className="completo">
            <label>Coordenadas (se llenan solas, lat, lng)</label>
            <input type="text" maxLength={100} value={f.coordenadas ?? ""} onChange={(e) => setF({ ...f, coordenadas: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}