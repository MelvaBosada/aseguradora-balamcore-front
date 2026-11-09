import "../../css/SiniestroDetalle.css";
import { dinero } from "../../services/siniestroApi";

export const TEXTO_NIVEL = {
  auto: "Autorización automática (dentro del límite del ajustador)",
  supervisor: "Requiere autorización de un supervisor",
  gerente: "Requiere autorización de gerencia",
};

/** Muestra, paso a paso, cómo el sistema calculó el monto del dictamen. */
export default function DesgloseCalculo({ calculo, nivel }) {
  if (!calculo) return null;

  const topes = (calculo.topes || []).filter((t) => t.aplicado);
  const rechaza = calculo.recomendacion === "rechazar";

  return (
    <div>
      {calculo.sin_cobertura && !rechaza && (
        <div className="sd-alerta aviso">La póliza no tiene cobertura asignada: se calculó sin deducible ni topes de cobertura.</div>
      )}

      {rechaza ? (
        <div className="sd-alerta info">El dictamen recomienda rechazar el siniestro: no se calcula indemnización.</div>
      ) : (
        <table className="sd-calculo">
          <tbody>
            {calculo.cobertura && (
              <tr>
                <td>Cobertura aplicada</td>
                <td>{calculo.cobertura}</td>
              </tr>
            )}
            <tr>
              <td>Daño evaluado</td>
              <td>{dinero(calculo.monto_evaluado)}</td>
            </tr>
            <tr>
              <td className="menos">(−) Deducible</td>
              <td className="menos">{dinero(calculo.deducible)}</td>
            </tr>
            {Number(calculo.coaseguro) > 0 && (
              <tr>
                <td className="menos">(−) Coaseguro (la aseguradora paga {calculo.porcentaje_cobertura}%)</td>
                <td className="menos">{dinero(calculo.coaseguro)}</td>
              </tr>
            )}
            {topes.map((t, i) => (
              <tr key={i}>
                <td>Tope aplicado: {t.concepto}</td>
                <td>{dinero(t.limite)}</td>
              </tr>
            ))}
            {Number(calculo.pagos_siniestro) > 0 && (
              <tr>
                <td className="menos">(−) Ya indemnizado en este siniestro</td>
                <td className="menos">{dinero(calculo.pagos_siniestro)}</td>
              </tr>
            )}
            <tr className="total">
              <td>Monto a indemnizar</td>
              <td>{dinero(calculo.monto_final)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {calculo.suma_asegurada > 0 && !rechaza && (
        <div className="sd-gris" style={{ marginTop: 6 }}>
          Suma asegurada {dinero(calculo.suma_asegurada)} · comprometido en otros siniestros {dinero(calculo.pagos_previos)} · disponible{" "}
          {dinero(calculo.disponible)}
        </div>
      )}

      {nivel && (
        <div className="sd-alerta info" style={{ marginTop: 10 }}>
          {TEXTO_NIVEL[nivel] || nivel}
        </div>
      )}

      {calculo.advertencias?.length > 0 && (
        <div className="sd-alerta aviso">
          Alertas para quien autoriza:
          <ul>
            {calculo.advertencias.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
