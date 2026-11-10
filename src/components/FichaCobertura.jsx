// components/FichaCobertura.jsx — cómo se muestra una cobertura (en la póliza y en su ventana de coberturas)

export const NOMBRES_SINIESTRO = {
  robo: "Robo", accidente: "Accidente", incendio: "Incendio", inundacion: "Inundación",
  responsabilidad_civil: "Resp. civil", fallecimiento: "Fallecimiento", invalidez: "Invalidez", otro: "Otro",
};
export const NOMBRES_BIEN = { vehiculo: "Vehículo", inmueble: "Inmueble", electronico: "Electrónico", maquinaria: "Maquinaria", otro: "Otro" };
export const NOMBRES_RAMO = {
  autos: "Autos", hogar: "Hogar", empresarial: "Empresarial", responsabilidad_civil: "Resp. civil",
  vida: "Vida", gastos_medicos: "Gastos médicos", otro: "Otro",
};

const SOBRE = {
  valor_bien: "el valor del bien", suma_asegurada: "la suma asegurada",
  monto_reclamado: "el monto reclamado", costo_reparacion: "el costo de reparación",
};

export const dinero0 = (v) => `$${Number(v || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
const n = (v) => parseFloat(v) || 0;

/** Acepta una cobertura "cruda" (GET /coberturas) o una ficha ya armada (GET /polizas/{id}/coberturas). */
export const aFicha = (c) => {
  if (c.valor_minimo !== undefined) return c; // ya es ficha
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    estatus: c.estatus,
    ramos: c.ramos || [],
    tipos_bien: c.tipos_bien || [],
    tipos_siniestro: c.tipos_siniestro || [],
    tipo_calculo: c.tipo_calculo,
    aplica_sobre: c.aplica_sobre,
    deducible: n(c.deducible),
    porcentaje_deducible: n(c.porcentaje_deducible),
    porcentaje_cobertura: n(c.porcentaje_cobertura) > 0 ? n(c.porcentaje_cobertura) : 100,
    monto_maximo_siniestro: n(c.monto_maximo_siniestro),
    valor_minimo: n(c.monto_minimo) > 0 ? n(c.monto_minimo) : null,
    valor_maximo: n(c.monto_maximo) > 0 ? n(c.monto_maximo) : null,
    primer_riesgo: !!c.primer_riesgo,
  };
};

export const textoDeducible = (f) => {
  const sobre = SOBRE[f.aplica_sobre] || "el daño";
  if (f.tipo_calculo === "porcentaje" && f.porcentaje_deducible > 0) return `${f.porcentaje_deducible}% sobre ${sobre}`;
  if (f.tipo_calculo === "mixto" && (f.deducible > 0 || f.porcentaje_deducible > 0)) {
    return `el mayor entre ${dinero0(f.deducible)} y ${f.porcentaje_deducible}% sobre ${sobre}`;
  }
  return f.deducible > 0 ? `${dinero0(f.deducible)} fijo` : "sin deducible";
};

export default function FichaCobertura({ cobertura, checked = false, onChange, disabled = false, error = "" }) {
  const f = aFicha(cobertura);
  const ampara = f.tipos_siniestro.length ? f.tipos_siniestro.map((t) => NOMBRES_SINIESTRO[t] || t).join(", ") : "todos los tipos de siniestro";

  return (
    <label
      style={{
        display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", marginBottom: 8,
        border: `1px solid ${error ? "#DC2626" : checked ? "#86EFAC" : "#E5E7EB"}`, borderRadius: 8,
        background: error ? "#FEF2F2" : checked ? "#F0FDF4" : "#fff", cursor: onChange && !disabled ? "pointer" : "default",
      }}
    >
      {onChange && (
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} style={{ width: 18, height: 18, marginTop: 2 }} />
      )}
      <div style={{ flex: 1, fontSize: 13 }}>
        <div>
          <strong>{f.nombre}</strong>
          {f.primer_riesgo && (
            <span style={{ marginLeft: 8, background: "#E0F2FE", color: "#075985", padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
              Primer riesgo
            </span>
          )}
        </div>
        {f.descripcion && <div style={{ color: "#6B7280", fontSize: 12 }}>{f.descripcion}</div>}
        <div style={{ fontSize: 12, marginTop: 4 }}>Ampara: {ampara}</div>
        <div style={{ fontSize: 12 }}>
          Deducible: {textoDeducible(f)} · La aseguradora paga el {f.porcentaje_cobertura}% · Tope por siniestro:{" "}
          {f.monto_maximo_siniestro > 0 ? dinero0(f.monto_maximo_siniestro) : "la suma asegurada"}
        </div>
        {(f.valor_minimo || f.valor_maximo) && (
          <div style={{ fontSize: 12 }}>
            Valor asegurable: {f.valor_minimo ? dinero0(f.valor_minimo) : "sin mínimo"} a {f.valor_maximo ? dinero0(f.valor_maximo) : "sin máximo"}
            {f.tipos_bien.length > 0 && ` (${f.tipos_bien.map((t) => NOMBRES_BIEN[t] || t).join(", ")})`}
          </div>
        )}
        {error && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 4 }}>{error}</div>}
      </div>
    </label>
  );
}
