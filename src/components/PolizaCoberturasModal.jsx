import { useEffect, useState } from "react";
import Modal, { PieAcciones } from "./siniestro/Modal";
import { api, mensajeError } from "../services/siniestroApi";

/**
 * Coberturas contratadas de una póliza. La API sigue siendo la fuente de
 * verdad; el estado evita habilitar acciones que el negocio no permite.
 */
export default function PolizaCoberturasModal({ open, poliza, onClose, onGuardado, onAgregarEndoso }) {
  const [datos, setDatos] = useState(null);
  const [marcadas, setMarcadas] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open || !poliza?.id) return;
    setError("");
    setDatos(null);
    api
      .get(`/polizas/${poliza.id}/coberturas`)
      .then((r) => {
        setDatos(r.data);
        setMarcadas((r.data.coberturas || []).filter((c) => c.asignada).map((c) => c.id));
      })
      .catch((e) => setError(mensajeError(e)));
  }, [open, poliza?.id]);

  if (!open) return null;

  const estado = String(datos?.estatus || poliza?.estatus || "").toLowerCase();
  const esBorrador = ["borrador", "draft"].includes(estado);
  const esCancelada = estado === "cancelada" || estado === "cancelado";
  const esVencida = estado.includes("vencid");
  const editable = !esCancelada && (esBorrador || (estado === "" && datos?.editable === true));
  // Solo se puede endosar una póliza emitida/activa (no borrador, cancelada ni vencida)
  const puedeEndosar = !editable && !esCancelada && !esVencida && !!onAgregarEndoso;
  const lista = datos?.coberturas || [];
  const mostradas = editable ? lista : lista.filter((c) => c.asignada);

  const alternar = (id) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const guardar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.put(`/polizas/${poliza.id}/coberturas`, { ids: marcadas });
      onGuardado && onGuardado();
      onClose();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async () => {
    setError("");
    try {
      const r = await api.get(`/polizas/${poliza.id}/documento`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${poliza?.nPoliza || "poliza"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e?.response?.status === 404) setError("Esta póliza no tiene un documento PDF cargado.");
      else setError(mensajeError(e));
    }
  };

  const agregarEndoso = () => {
    onClose();
    onAgregarEndoso && onAgregarEndoso(poliza);
  };

  const btnDescargar = (
    <button className="balam-btn cancel" onClick={descargar}>Descargar póliza</button>
  );

  return (
    <Modal
      open
      titulo="Coberturas de la póliza"
      subtitulo={poliza?.nPoliza ? `${poliza.nPoliza}${datos?.ramo ? ` · ${datos.ramo}` : ""}` : ""}
      onClose={onClose}
      pie={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
          {btnDescargar}
          {editable ? (
            <PieAcciones onCancelar={onClose} onConfirmar={guardar} ocupado={ocupado} deshabilitado={marcadas.length === 0} />
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="balam-btn cancel" onClick={onClose}>Cerrar</button>
              {puedeEndosar && (
                <button className="balam-btn save" onClick={agregarEndoso}>Agregar endoso</button>
              )}
            </div>
          )}
        </div>
      }
    >
      <div style={{ gridColumn: "1 / -1", width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {error && <div className="sd-alerta error">{error}</div>}
      {!datos && !error && <div className="sd-vacio">Cargando…</div>}

      {datos && editable && (
        <div className="sd-alerta aviso">
          La póliza está en borrador. Puedes agregar o quitar coberturas antes de emitirla.
        </div>
      )}
      {datos && !editable && !esCancelada && (
        <div className="sd-alerta info">
          La póliza está emitida o activa. Para cambiar sus coberturas, agrega un endoso.
        </div>
      )}
      {datos && esCancelada && (
        <div className="sd-alerta info">
          La póliza está cancelada. Puedes consultar sus coberturas históricas, pero no modificarlas.
        </div>
      )}

      {datos && mostradas.length === 0 && (
        <div className="sd-vacio">No hay coberturas para este ramo. Créalas en el módulo Coberturas.</div>
      )}

      {mostradas.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
          {mostradas.map((c, i) => {
            const activa = marcadas.includes(c.id);
            return (
              <li
                key={c.id}
                style={{ borderTop: i === 0 ? "none" : "1px solid #E5E7EB", background: activa ? "#F0FDF4" : "#fff" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    cursor: editable ? "pointer" : "default",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activa}
                    disabled={!editable}
                    onChange={() => alternar(c.id)}
                    style={{ width: 16, height: 16, accentColor: "#14573A", flexShrink: 0 }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>{c.nombre}</span>
                    {c.descripcion && (
                      <span style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{c.descripcion}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {datos && (
        <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#14573A", fontSize: 13 }}>
          <strong>{marcadas.length} cobertura(s) asignada(s)</strong>
          {marcadas.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {lista.filter((c) => marcadas.includes(c.id)).map((c) => <li key={c.id}>{c.nombre}</li>)}
            </ul>
          )}
        </div>
      )}
      </div>
    </Modal>
  );
}