export const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : "";

export const fmtMonto = (n) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;