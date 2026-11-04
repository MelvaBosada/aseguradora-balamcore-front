export const caja = {
  background: "#fff", border: "1px solid #e3e9e5", borderRadius: 20, padding: 22,
  boxShadow: "0 6px 24px rgba(15,76,58,0.06)",
};

// Solo tamaño y forma. Los colores y hovers viven en miplan-botones.css
export const btn = () => ({
  width: "100%", padding: "12px 16px", borderRadius: 11, fontWeight: 700, fontSize: 13.5,
});

// tipo: "primario" (verde) | "secundario" (dorado) | "peligro" (rojo)
export const cls = (tipo, busy = false) => `mp-btn mp-${tipo}${busy ? " mp-busy" : ""}`;

export const Cargando = ({ children }) => (
  <>
    <span className="mp-spinner" /> {children}
  </>
);

export const Nota = ({ color = "#92400e", fondo = "#fef3c7", borde = "#fcd34d", children }) => (
  <div style={{ background: fondo, border: `1px solid ${borde}`, color, borderRadius: 12, padding: "11px 13px", fontSize: 12.5, lineHeight: 1.55 }}>
    {children}
  </div>
);

export const Encabezado = ({ titulo }) => (
  <>
    <h1 className="h2 fw-bold mb-3">{titulo}</h1>
    <hr className="mt-2 mb-4" />
  </>
);

export const AvisoCerrable = ({ texto, onCerrar, tipo = "ok" }) => {
  if (!texto) return null;
  const c = tipo === "error"
    ? { color: "#991b1b", fondo: "#fef2f2", borde: "#fecaca" }
    : { color: "#065f46", fondo: "#d1fae5", borde: "#6ee7b7" };
  return (
    <div style={{ marginBottom: 16 }}>
      <Nota {...c}>
        {texto}{" "}
        <button className="mp-link" onClick={onCerrar} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", marginLeft: 6 }}>
          Cerrar
        </button>
      </Nota>
    </div>
  );
};

// Devuelve un elemento si hay que mostrar carga o error; si no, null
export const pantallaEstado = ({ loading, error, data }) => {
  if (loading) return <div className="container py-4"><p>Cargando...</p></div>;
  if (error || !data) return <div className="container py-4"><p style={{ color: "#C0392B" }}>{error || "No se encontró información."}</p></div>;
  return null;
};