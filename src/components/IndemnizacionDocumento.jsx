import useMarcaAseguradora from "../hooks/useMarcaAseguradora";
import { EncabezadoDocumento, PieMarca, Fila, mxn, cuentaOculta } from "./EncabezadoDocumento";

/**
 * Documento de indemnización (se genera en el navegador a partir de lo que ya muestra la pantalla).
 * Ajustado a los campos de la migración de la base de datos.
 */
const ETIQUETA_ESTATUS = {
  pendiente: "PENDIENTE DE DATOS DE PAGO",
  autorizada: "LISTA PARA PAGAR",
  pagada: "PAGADA",
  rechazada: "ANULADA",
};

const IndemnizacionDocumento = ({ data: d, printRef }) => {
  const marca = useMarcaAseguradora();

  if (!d) return null;

  const nombreAseguradora = marca?.nombre || d.aseguradora;
  const g = d.desglose || null;
  const topes = (g?.topes || []).filter((t) => t.aplicado).map((t) => t.concepto);

  return (
    <div className="doc" ref={printRef}>

      <EncabezadoDocumento
        titulo="Indemnización por Siniestro"
        marca={marca}
        lineas={[
          `Número de siniestro: ${d.nSiniestro}`,
          `Número de póliza: ${d.nPoliza || "S/N"}`,
          `Fecha de emisión: ${d.fechaEmision}`,
        ]}
      />

      {/* FILA 1: Asegurado + Siniestro */}
      <div className="grid2">
        <div className="sec">
          <div className="sec-titulo">Datos del Asegurado</div>
          <Fila label="Nombre / Razón social" value={d.nombreAsegurado || d.titular_cuenta} />
          <Fila label="RFC"                   value={d.rfc}             />
          <Fila label="Domicilio"              value={d.domicilio}       />
          <Fila label="Teléfono"               value={d.telefono}        />
          <Fila label="Correo electrónico"     value={d.correo}          />
        </div>
        <div className="sec">
          <div className="sec-titulo">Datos del Siniestro</div>
          <Fila label="Tipo de siniestro"   value={d.tipoSiniestro}   />
          <Fila label="Fecha de ocurrencia" value={d.fechaOcurrencia} />
          <Fila label="Ubicación"           value={d.lugar}           />
          <div className="lbl" style={{ marginTop: 6 }}>Descripción:</div>
          <p className="txt">{d.observaciones || "Sin observaciones registradas."}</p>
        </div>
      </div>

      {/* FILA 2: Evaluación + Pago */}
      <div className="grid2">
        <div className="sec">
          <div className="sec-titulo">Evaluación del Siniestro</div>
          <Fila label="N° de evaluación"   value={d.nEvaluacionPDF}  />
          <Fila label="Ajustador asignado" value={d.ajustador || "Asignado por Sistema"} />
          <Fila label="Fecha evaluación"   value={d.fechaEvaluacion} />
          <Fila label="Prioridad"           value={d.prioridad || "Media"} />
          <div className="lbl" style={{ marginTop: 6 }}>Resultado:</div>
          <p className="txt">{d.resultadoEval || "Procedente según evaluación técnica de daños."}</p>
        </div>
        <div className="sec">
          <div className="sec-titulo">Datos de Pago</div>
          <Fila label="Forma de pago"      value={d.forma_pago?.toUpperCase()} />
          <Fila label="Banco"              value={d.banco}              />
          <Fila label="Titular"            value={d.titular_cuenta}     />
          <Fila label="Cuenta bancaria"    value={cuentaOculta(d.cuenta_bancaria)} />
          <Fila label="Dictamen autorizado" value={d.fecha_autorizacion} />
          <Fila label="Fecha de pago"      value={d.fecha_pago ? String(d.fecha_pago).split(" ")[0] : "Pendiente"} />
          <Fila label="Referencia de pago" value={d.referencia_pago}    />
        </div>
      </div>

      {/* CÁLCULO */}
      {g && (
        <div className="grid1">
          <div className="sec">
            <div className="sec-titulo">Cálculo de la indemnización</div>
            <div className="grid3">
              <Fila label="Cobertura aplicada" value={g.cobertura || "Sin cobertura asignada"} />
              <Fila label="Daño evaluado" value={mxn(g.monto_evaluado)} />
              <Fila label="Deducible" value={mxn(g.deducible)} />
              {Number(g.coaseguro) > 0 && (
                <Fila label={`Coaseguro (paga ${g.porcentaje_cobertura}%)`} value={mxn(g.coaseguro)} />
              )}
              {topes.length > 0 && <Fila label="Tope aplicado" value={topes.join("; ")} />}
              {Number(g.pagos_siniestro) > 0 && (
                <Fila label="Ya indemnizado antes" value={mxn(g.pagos_siniestro)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MONTO */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Liquidación de Siniestro</div>
          <div className="grid3">
            <Fila label="Monto reclamado"    value={d.montoReclamado}   />
            <Fila label="Monto aprobado"     value={d.montoAprobadoPDF} />
            <Fila label="Deducible aplicado" value={d.deducible || "$0.00 MXN"} />
          </div>
          <div className="monto-total">{d.montoTotal}</div>
        </div>
      </div>

      {/* ESTATUS */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Estatus de la Indemnización</div>
          <span className="lbl">Estatus: </span>
          <span className="badge">{ETIQUETA_ESTATUS[d.estatus] || d.estatus?.toUpperCase()}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div>
          <div>{nombreAseguradora}</div>
          <div>Departamento de Siniestros</div>
          <div>Responsable: {d.ajustador || "___________________"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>Firma y sello</div>
          <div style={{ marginTop: 32, borderTop: "1px solid #ccc", paddingTop: 4 }}>
            ___________________
          </div>
        </div>
      </div>

      <PieMarca />

    </div>
  );
};

export default IndemnizacionDocumento;
