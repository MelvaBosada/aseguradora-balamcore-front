import logo from "../assets/Logo.png";

/**
 * Componente reutilizable que renderiza el documento de indemnización.
 * Ajustado a los campos de la migración de la base de datos.
 */
const Fila = ({ label, value }) => (
  <div className="fila">
    <span className="lbl">{label}</span>
    <span className="val">{value || "—"}</span>
  </div>
);

const IndemnizacionDocumento = ({ data: d, printRef }) => {
  if (!d) return null;

  return (
    <div className="doc" ref={printRef}>

      {/* HEADER */}
      <div className="top">
        <div>
          <div className="titulo">Indemnización por Siniestro</div>
          <div className="sub">Aseguradora: {d.aseguradora || "Balamcore"}</div>
          <div className="sub">Número de siniestro: {d.nSiniestro}</div>
          <div className="sub">Número de póliza: {d.nPoliza || "S/N"}</div>
          <div className="sub">Fecha de emisión: {d.fechaEmision}</div>
        </div>
        <img src={logo} alt="Logo" className="logo" />
      </div>

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
          <Fila label="Ubicación"           value={d.domicilio}       />
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
          <Fila label="Fecha evaluación"   value={d.fecha_autorizacion} />
          <Fila label="Prioridad"           value={d.prioridad || "Media"} />
          <div className="lbl" style={{ marginTop: 6 }}>Resultado:</div>
          <p className="txt">{d.resultadoEval || "Procedente según evaluación técnica de daños."}</p>
        </div>
        <div className="sec">
          <div className="sec-titulo">Datos de Pago</div>
          <Fila label="Forma de pago"      value={d.forma_pago?.toUpperCase()} />
          <Fila label="Banco"              value={d.banco}              />
          <Fila label="Titular"            value={d.titular_cuenta}     />
          <Fila label="Cuenta bancaria"    value={d.cuenta_bancaria}    />
          <Fila label="Fecha autorización" value={d.fecha_autorizacion}  />
          <Fila label="Fecha de pago"      value={d.fecha_pago || "Pendiente"} />
          <Fila label="Referencia"         value={d.referencia}         />
        </div>
      </div>

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
          <span className="badge">{d.estatus?.toUpperCase()}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div>
          <div>{d.aseguradora || "Balamcore Insurance"}</div>
          <div>Departamento de Siniestros</div>
          <div>Responsable: ___________________</div>
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

export default IndemnizacionDocumento;