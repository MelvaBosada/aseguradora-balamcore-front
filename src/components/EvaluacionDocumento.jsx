// components/EvaluacionDocumento.jsx
import logo from "../assets/Logo.png";

const Fila = ({ label, value }) => (
  <div className="fila">
    <span className="lbl">{label}</span>
    <span className="val">{value || "—"}</span>
  </div>
);

const EvaluacionDocumento = ({ data: d, printRef }) => {
  if (!d) return null;

  return (
    <div className="doc" ref={printRef}>

      {/* HEADER */}
      <div className="top">
        <div>
          <div className="titulo">Evaluación de Siniestro</div>
          <div className="sub">Aseguradora: {d.aseguradora}</div>
          <div className="sub">Número de siniestro: {d.nSiniestro}</div>
          <div className="sub">Número de póliza: {d.nPoliza}</div>
          <div className="sub">Fecha de emisión: {d.fechaEmision}</div>
        </div>
        <img src={logo} alt="Logo" className="logo" />
      </div>

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

      {/* MONTO */}
      <div className="grid1">
        <div className="sec">
          <div className="sec-titulo">Monto Reclamado</div>
          <div className="grid3">
            <Fila label="Monto reclamado" value={d.montoReclamado} />
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
            <Fila label="Cuenta" value={d.cuentaBancaria} />
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
          <span className="badge">{d.estatusPDF}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div>
          <div>{d.aseguradora}</div>
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

    </div>
  );
};

export default EvaluacionDocumento;