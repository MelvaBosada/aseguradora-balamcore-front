import "../../css/SiniestroDetalle.css";

const EVENTOS = {
  reasignacion: (h) => `Ajustador: ${h.metadata?.ajustador_anterior?.nombre || "Sin asignar"} → ${h.metadata?.ajustador_nuevo?.nombre}`,
  arribo: () => "Arribo del ajustador al sitio",
  edicion: () => "Datos del siniestro modificados",
  dictamen_creado: (h) => `Dictamen #${h.metadata?.id_evaluacion} creado (borrador)`,
  dictamen_editado: (h) => `Dictamen #${h.metadata?.id_evaluacion} editado`,
  indemnizacion_cancelada: () => "Indemnización anulada",
};

export default function TabHistorial({ detalle }) {
  const historial = [...(detalle.historial || [])].reverse();

  return (
    <div className="sd-card">
      <h3>Historial del caso</h3>
      {historial.length === 0 ? (
        <div className="sd-vacio">Sin movimientos registrados.</div>
      ) : (
        <ul className="sd-timeline">
          {historial.map((h, i) => {
            const titulo = EVENTOS[h.evento]?.(h) ?? (h.de ? `${h.de} → ${h.a}` : h.a);

            return (
              <li key={i}>
                <div><strong>{titulo}</strong></div>
                {h.motivo && h.evento !== "reasignacion" && <div>{h.motivo}</div>}
                {h.evento === "reasignacion" && h.motivo && <div>Motivo: {h.motivo}</div>}
                {h.evento === "edicion" && Object.entries(h.metadata?.cambios || {}).map(([campo, v]) => (
                  <div key={campo} className="sd-gris">{campo}: {String(v.antes ?? "—")} → {String(v.despues ?? "—")}</div>
                ))}
                <div className="fecha">{h.fecha} · {h.por}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
