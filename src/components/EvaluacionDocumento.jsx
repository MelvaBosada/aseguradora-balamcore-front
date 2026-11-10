// components/EvaluacionDocumento.jsx
import useMarcaAseguradora from "../hooks/useMarcaAseguradora";
import { EncabezadoDocumento, PieMarca, Fila, mxn, cuentaOculta } from "./EncabezadoDocumento";

const NIVELES = {
  auto: "Automática (dentro del límite del ajustador)",
  supervisor: "Supervisor",
  gerente: "Gerencia",
};

const EvaluacionDocumento = ({ data: d, printRef }) => {
  const marca = useMarcaAseguradora();

  if (!d) return null;

  const nombreAseguradora = marca?.nombre || d.aseguradora;
  const c = d.calculo;
  const topes = (c?.topes || []).filter((t) => t.aplicado).map((t) => t.concepto);

  return (
    <div className="doc" ref={printRef}>

      <EncabezadoDocumento
        titulo="Evaluación de Siniestro"
        marca={marca}
        lineas={[
          `Número de siniestro: ${d.nSiniestro}`,
          `Número de póliza: ${d.nPoliza}`,
          `Fecha de emisión: ${d.fechaEmision}`,
        ]}
      />

      {/* FILA 1: Datos del Asegurado + Siniestro */}
      <div className="grid2">
        <div className="sec">
          <div className="sec-titulo">Datos del Asegurado</div>
          <Fila label="Nombre completo" value={d.nombreAsegurado} />
          <Fila label="RFC" value={d.rfc} />
          <Fila label="Domicilio" value={d.domicilio} />
          <Fila label="Teléfono" value={d.telefono} />
          <Fila label="Correo" value={d.correo} />
        </div>
        <div className="sec">
          <div className="sec-titulo">Datos del Siniestro</div>
          <Fila label="Tipo" value={d.tipoSiniestro} />
          <Fila label="Fecha de ocurrencia" value={d.fechaOcurrencia} />
          <Fila label="Ubicación" value={d.ubicacion} />
          <Fila label="Causas" value={d.causas} />
          <div className="lbl" style={{ marginTop: 6 }}>Descripción:</div>
          <p className="txt">{d.descripcion}</p>
        </div>
      </div>

      {/* FILA 2: Evaluación + Dictamen */}
      <div className="grid2">
        <div className="sec">
          <div className="sec-titulo">Evaluación</div>
          <Fila label="N° de evaluación" value={d.nEvaluacionPDF} />
          <Fila label="Ajustador asignado" value={d.ajustadorPDF} />
          <Fila label="Fecha de inspección" value={d.fechaInspeccion} />
          <Fila label="Fecha de evaluación" value={d.fechaEvaluacion} />
          <Fila label="Prioridad" value={d.prioridadPDF} />
          <div className="lbl" style={{ marginTop: 6 }}>Resultado:</div>
          <p className="txt">{d.resultadoEval}</p>
        </div>
        <div className="sec">
          <div className="sec-titulo">Dictamen</div>
          <Fila label="Dictamen" value={d.dictamen} />
          <Fila label="Monto recomendado" value={d.montoRecomendado} />
          <Fila label="Valor residual" value={d.valorResidual} />
          <Fila label="Costo de reparación" value={d.costoReparacion} />
          <Fila label="Fecha de dictamen" value={d.fechaDictamen} />
          <div className="lbl" style={{ marginTop: 6 }}>Recomendación:</div>
          <p className="txt">{d.recomendacion}</p>
        </div>
      </div>

      {/* CÁLCULO DEL MONTO (lo calcula el sistema) */}
      {c && (
        <div className="grid1">
          <div className="sec">
            <div className="sec-titulo">Cálculo del monto</div>
            <div className="grid3">
              <Fila label="Cobertura aplicada" value={c.cobertura || "Sin cobertura asignada"} />
              <Fila label="Daño evaluado" value={mxn(c.monto_evaluado)} />
              <Fila label="Deducible" value={mxn(c.deducible)} />
              {Number(c.coaseguro) > 0 && (
                <Fila label={`Coaseguro (paga ${c.porcentaje_cobertura}%)`} value={mxn(c.coaseguro)} />
              )}
              {topes.length > 0 && <Fila label="Tope aplicado" value={topes.join("; ")} />}
              {Number(c.pagos_siniestro) > 0 && (
                <Fila label="Ya indemnizado en este siniestro" value={mxn(c.pagos_siniestro)} />
              )}
              <Fila label="Monto a indemnizar" value={mxn(c.monto_final)} />
              {d.nivel_autorizacion && (
                <Fila label="Autorización" value={NIVELES[d.nivel_autorizacion] || d.nivel_autorizacion} />
              )}
            </div>
            {d.motivo_resolucion && (
              <>
                <div className="lbl" style={{ marginTop: 6 }}>Resolución:</div>
                <p className="txt">{d.motivo_resolucion}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* MONTO */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Monto Reclamado</div>
          <div className="grid3">
            <Fila label="Monto reclamado" value={d.montoReclamadoPDF || d.montoReclamado} />
            <Fila label="Monto aprobado" value={d.montoAprobadoPDF} />
            <Fila label="Deducible" value={d.deducible} />
          </div>
          <div className="monto-total">{d.montoTotal}</div>
        </div>
      </div>

      {/* DATOS DE PAGO */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Datos de Pago</div>
          <div className="grid3">
            <Fila label="Forma de pago" value={d.formaPago} />
            <Fila label="Banco" value={d.banco} />
            <Fila label="Titular" value={d.titularBanco} />
            <Fila label="Cuenta" value={cuentaOculta(d.cuentaBancaria)} />
            <Fila label="Fecha autorización" value={d.fechaAutorizacion} />
            <Fila label="Fecha de pago" value={d.fechaPagoPDF} />
            <Fila label="Referencia" value={d.referencia} />
          </div>
        </div>
      </div>

      {/* ESTATUS */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Estatus de la Evaluación</div>
          <span className="lbl">Estatus: </span>
          <span className="badge">{d.estatus}</span>
          <span className="lbl" style={{ marginLeft: 14 }}>Pago: </span>
          <span className="badge">{d.estatusPDF}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div>
          <div>{nombreAseguradora}</div>
          <div>Departamento de Siniestros</div>
          <div>Responsable: {d.ajustadorPDF || "___________________"}</div>
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

export default EvaluacionDocumento;
