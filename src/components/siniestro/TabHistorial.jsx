import "../../css/SiniestroDetalle.css";

export default function TabHistorial({ detalle }) {
  const historial = [...(detalle.historial || [])].reverse();

  return (
    <div className="sd-card">
      <h3>Historial de estatus</h3>
      {historial.length === 0 ? (
        <div className="sd-vacio">Sin movimientos registrados.</div>
      ) : (
        <ul className="sd-timeline">
          {historial.map((h, i) => (
            <li key={i}>
              <div>
                <strong>{h.de ? `${h.de} → ${h.a}` : h.a}</strong>
              </div>
              {h.motivo && <div>{h.motivo}</div>}
              <div className="fecha">
                {h.fecha} · {h.por}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
