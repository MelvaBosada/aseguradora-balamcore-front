import { useCallback, useEffect, useState } from "react";
import "../../css/SiniestroDetalle.css";
import { EstatusIndemnizacion } from "./Badges";
import DesgloseCalculo from "./DesgloseCalculo";
import { ConfirmarPagoModal, RegistrarPagoModal, CancelarIndemnizacionModal } from "./IndemnizacionModales";
import { api, dinero, fmtFecha, mensajeError } from "../../services/siniestroApi";
import { tienePermiso } from "../../utils/permisos";

const mascara = (c) => (c ? `•••• ${String(c).slice(-4)}` : "—");

export default function TabIndemnizacion({ detalle, onCambio }) {
  const id = detalle.id;
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState(null); // "confirmar" | "pagar" | "cancelar"

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}/indemnizaciones`);
      setLista(r.data);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hecho = async () => {
    setModal(null);
    await cargar();
    onCambio && onCambio();
  };

  const generar = async () => {
    setOcupado(true);
    setError("");
    try {
      await api.post(`/siniestros/${id}/indemnizacion/generar`);
      await hecho();
    } catch (e) {
      setError(mensajeError(e));
      await cargar();
      onCambio && onCambio();
    } finally {
      setOcupado(false);
    }
  };

  if (!lista) return <div className="sd-card sd-vacio">{error || "Cargando…"}</div>;

  const vigente = lista.find((i) => i.estatus !== "rechazada");
  const anuladas = lista.filter((i) => i.estatus === "rechazada");
  const puedeConfirmar = tienePermiso("indemnizaciones.confirmar");
  const puedePagar = tienePermiso("indemnizaciones.pagar");

  return (
    <>
      {error && <div className="sd-alerta error">{error}</div>}

      {!vigente ? (
        <div className="sd-card">
          <div className="sd-vacio">
            {detalle.estatus_valor === "autorizado"
              ? "El dictamen está aprobado pero aún no hay indemnización generada."
              : "Este siniestro no tiene una indemnización vigente. Se genera sola cuando se aprueba el dictamen."}
          </div>
          {detalle.estatus_valor === "autorizado" && puedePagar && (
            <div style={{ textAlign: "center" }}>
              <button className="sd-btn primario" disabled={ocupado} onClick={generar}>
                Generar indemnización
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="sd-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>
                {dinero(vigente.monto_aprobado)} <EstatusIndemnizacion valor={vigente.estatus} />
              </h3>
              <div className="sd-gris">El monto lo calculó el sistema a partir del dictamen y no se puede modificar.</div>
            </div>
            <div className="sd-acciones">
              {vigente.estatus === "pendiente" && puedeConfirmar && (
                <button className="sd-btn primario" onClick={() => setModal("confirmar")}>
                  Confirmar datos de pago
                </button>
              )}
              {vigente.estatus === "autorizada" && puedePagar && (
                <button className="sd-btn primario" onClick={() => setModal("pagar")}>
                  Registrar pago
                </button>
              )}
              {["pendiente", "autorizada"].includes(vigente.estatus) && puedePagar && (
                <button className="sd-btn peligro" onClick={() => setModal("cancelar")}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="sd-grid" style={{ marginBottom: 14 }}>
            <div className="sd-dato"><span>Forma de pago</span><div>{vigente.forma_pago || "Por definir"}</div></div>
            <div className="sd-dato"><span>Titular / beneficiario</span><div>{vigente.titular_cuenta || "—"}</div></div>
            <div className="sd-dato"><span>Banco</span><div>{vigente.banco || "—"}</div></div>
            <div className="sd-dato"><span>Cuenta</span><div>{mascara(vigente.cuenta_bancaria)}</div></div>
            <div className="sd-dato"><span>Dictamen autorizado</span><div>{fmtFecha(vigente.fecha_autorizacion)}</div></div>
            <div className="sd-dato"><span>Fecha de pago</span><div>{vigente.fecha_pago ? fmtFecha(vigente.fecha_pago) : "Pendiente"}</div></div>
            {vigente.referencia_pago && <div className="sd-dato"><span>Referencia</span><div>{vigente.referencia_pago}</div></div>}
          </div>

          {vigente.estatus === "pendiente" && !puedeConfirmar && (
            <div className="sd-alerta info">Falta confirmar la forma y los datos de pago. Lo hace quien tenga el permiso correspondiente.</div>
          )}

          <DesgloseCalculo calculo={vigente.desglose} />
        </div>
      )}

      {anuladas.length > 0 && (
        <div className="sd-card">
          <h3>Indemnizaciones anuladas</h3>
          <table className="sd-tabla">
            <tbody>
              {anuladas.map((i) => (
                <tr key={i.id}>
                  <td>{dinero(i.monto_aprobado)}</td>
                  <td className="sd-gris">{i.motivo_cancelacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "confirmar" && <ConfirmarPagoModal indemnizacion={vigente} onClose={() => setModal(null)} onHecho={hecho} />}
      {modal === "pagar" && <RegistrarPagoModal indemnizacion={vigente} onClose={() => setModal(null)} onHecho={hecho} />}
      {modal === "cancelar" && <CancelarIndemnizacionModal indemnizacion={vigente} onClose={() => setModal(null)} onHecho={hecho} />}
    </>
  );
}
