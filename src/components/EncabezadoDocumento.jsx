import logoBalam from "../assets/Logo.png";

/** Renglón "etiqueta ... valor" de los documentos PDF. */
export const Fila = ({ label, value }) => (
  <div className="fila">
    <span className="lbl">{label}</span>
    <span className="val">{value || "—"}</span>
  </div>
);

export const mxn = (v) =>
  `$${Number(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

/** Encabezado: título y datos a la izquierda; logo y nombre de la ASEGURADORA a la derecha. */
export const EncabezadoDocumento = ({ titulo, lineas = [], marca }) => (
  <div className="top">
    <div>
      <div className="titulo">{titulo}</div>
      {lineas.filter(Boolean).map((l, i) => (
        <div className="sub" key={i}>{l}</div>
      ))}
    </div>

    <div style={{ textAlign: "right" }}>
      {marca?.logo && (
        <img
          src={marca.logo}
          alt={marca.nombre || "Aseguradora"}
          style={{ maxHeight: 64, maxWidth: 200, width: "auto", height: "auto", objectFit: "contain", display: "inline-block" }}
        />
      )}
      {marca?.nombre && (
        <div style={{ fontWeight: 700, fontSize: 14, marginTop: marca.logo ? 4 : 0 }}>{marca.nombre}</div>
      )}
    </div>
  </div>
);

/** El logo de BalamCore va aquí, discreto, al final del documento. */
export const PieMarca = () => (
  <div
    style={{
      marginTop: 18,
      paddingTop: 8,
      borderTop: "1px solid #e5e5e5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontSize: 10,
      color: "#8a8a8a",
    }}
  >
    <span>Documento generado con</span>
    <img src={logoBalam} alt="BalamCore" style={{ height: 14, width: "auto" }} />
    <span style={{ fontWeight: 600 }}>BalamCore</span>
  </div>
);

/** Muestra solo los últimos 4 dígitos de una cuenta. */
export const cuentaOculta = (c) => (c && c !== "No especificado" && c !== "N/A" ? `•••• ${String(c).slice(-4)}` : "—");
