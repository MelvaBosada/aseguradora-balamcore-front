import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import logoMarca from "../../assets/flores/diseño4.png";
import logoMarca2 from "../../assets/flores/diseño3.png";
import logoMarca3 from "../../assets/flores/diseño2.png";
import { fmtFecha } from "../../utils/planFormat";

// Mismas dimensiones que TarjetaNegocio: alto 250, ancho máximo 440
const cara = {
  position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
  backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
};

const elipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };

const antiguedad = (fecha) => {
  if (!fecha) return "—";
  const ini = new Date(fecha);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - ini.getFullYear()) * 12 + (hoy.getMonth() - ini.getMonth());
  if (hoy.getDate() < ini.getDate()) meses -= 1;
  if (Number.isNaN(meses) || meses < 0) return "—";
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  if (a > 0) return `${a} ${a === 1 ? "año" : "años"}${m ? ` ${m} m` : ""}`;
  return m > 0 ? `${m} ${m === 1 ? "mes" : "meses"}` : "Nuevo";
};

const Linea = ({ icono, texto, clave, href, copiado, onCopiar }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#1d2b25", minWidth: 0 }}>
    <span style={{ color: "#0F4C3A", display: "flex" }}>{icono}</span>
    {href ? (
      <a href={href} onClick={(ev) => ev.stopPropagation()} title={texto} style={{ color: "inherit", textDecoration: "none", flex: 1, ...elipsis }}>{texto}</a>
    ) : (
      <span title={texto} style={{ flex: 1, ...elipsis }}>{texto}</span>
    )}
    <button
      onClick={(ev) => onCopiar(ev, texto, clave)}
      title="Copiar"
      style={{ background: "none", border: "none", cursor: "pointer", color: copiado === clave ? "#16a34a" : "#94a3b8", display: "flex", padding: 2 }}
    >
      {copiado === clave ? <CheckIcon style={{ fontSize: 16 }} /> : <ContentCopyIcon style={{ fontSize: 15 }} />}
    </button>
  </div>
);

const Dato = ({ label, valor, capitalizar = true }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 8.5, letterSpacing: ".08em", fontWeight: 800, color: "#8a6d1f" }}>{label}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#1d2b25", textTransform: capitalizar ? "capitalize" : "none", ...elipsis }}>
      {valor || "—"}
    </div>
  </div>
);

export default function TarjetaEmpleado({ empleado: e, sensibles = null, cargandoSensibles = false, onAlternarSensibles }) {
  const [volteada, setVolteada] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copiado, setCopiado] = useState("");

  const nombreCompleto = `${e.nombre || ""} ${e.apellidos || ""}`.trim();
  const iniciales = `${e.nombre?.[0] || ""}${e.apellidos?.[0] || ""}`.toUpperCase() || "BC";
  const direccion = [e.domicilio, e.municipio, e.estado, e.codigo_postal].filter(Boolean).join(", ");

  const emergencia = [
    e.contacto_emergencia_nombre,
    e.contacto_emergencia_parentesco && `(${e.contacto_emergencia_parentesco})`,
    e.contacto_emergencia_telefono && `· ${e.contacto_emergencia_telefono}`,
  ].filter(Boolean).join(" ");

  const copiar = async (ev, texto, clave) => {
    ev.stopPropagation();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(""), 1600);
    } catch {
      /* sin permiso del navegador */
    }
  };

  const onMove = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((ev.clientY - r.top) / r.height - 0.5) * -9,
      y: ((ev.clientX - r.left) / r.width - 0.5) * 11,
    });
  };

  const alternar = (ev) => {
    ev.stopPropagation();
    onAlternarSensibles?.();
  };

  return (
    <div>
      <div
        onClick={() => setVolteada((v) => !v)}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ perspective: 1200, cursor: "pointer", height: 250, maxWidth: 440 }}
      >
        <div style={{
          position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
          transition: "transform .55s cubic-bezier(.2,.8,.2,1)",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (volteada ? 180 : 0)}deg)`,
        }}>
          {/* FRENTE */}
          <div style={{
            ...cara, color: "#fff", padding: "24px 26px",
            background: "linear-gradient(135deg, #071a14 0%, #071a14 60%, #1c2a26 100%)",
            boxShadow: "0 22px 50px rgba(7,26,20,0.35)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <img src={logoMarca} alt="" style={{ position: "absolute", right: 250, bottom: -30, width: 220, opacity: 0.2, pointerEvents: "none" }} />
             <img src={logoMarca2} alt="" style={{ position: "absolute", right: -30, bottom: -50, width: 220, opacity: 0.5, pointerEvents: "none" }} />
              <img src={logoMarca3} alt="" style={{ position: "absolute", right: -20, bottom: 145, width: 95, opacity: 0.4, pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "linear-gradient(180deg,#f0d060,#D4AF37)" }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{
                width: 54, height: 54, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(212,175,55,0.16)", border: "1px solid rgba(212,175,55,0.45)", color: "#D4AF37", fontWeight: 900, fontSize: 18,
              }}>{iniciales}</div>
              {e.rol && (
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20, padding: "4px 11px" }}>
                  {String(e.rol).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ position: "relative", marginTop: 22 }}>
              <div style={{
                fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.15,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{nombreCompleto}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 4, textTransform: "capitalize", ...elipsis }}>{e.puesto}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 1, textTransform: "capitalize", ...elipsis }}>{e.departamento}</div>
            </div>

            <div style={{ position: "absolute", left: 26, right: 26, bottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <div>
                <div style={{ letterSpacing: ".08em", fontSize: 9.5 }}>No. EMPLEADO</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: ".04em" }}>{e.numero_empleado || "—"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <AutorenewIcon style={{ fontSize: 14 }} /> Toca para voltear
              </div>
            </div>
          </div>

          {/* REVERSO */}
          <div style={{
            ...cara, transform: "rotateY(180deg)", padding: "18px 22px",
            background: "linear-gradient(160deg, #fbf7ec, #f3ecd8)", border: "1px solid #e6dcc0",
            boxShadow: "0 22px 50px rgba(7,26,20,0.25)", display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, letterSpacing: ".12em", fontWeight: 800, color: "#8a6d1f" }}>
              <span>FICHA DE EMPLEADO</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {e.numero_empleado}
                {onAlternarSensibles && (
                  <button
                    onClick={alternar}
                    disabled={cargandoSensibles}
                    title={sensibles ? "Ocultar CURP y NSS" : "Mostrar CURP y NSS"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#0F4C3A", display: "flex", padding: 2, opacity: cargandoSensibles ? 0.5 : 1 }}
                  >
                    {sensibles ? <VisibilityOffIcon style={{ fontSize: 17 }} /> : <VisibilityIcon style={{ fontSize: 17 }} />}
                  </button>
                )}
              </span>
            </div>

            {e.correo && <Linea icono={<MailOutlineIcon style={{ fontSize: 16 }} />} texto={e.correo} clave="correo" href={`mailto:${e.correo}`} copiado={copiado} onCopiar={copiar} />}
            {e.numero_de_telefono && <Linea icono={<PhoneIcon style={{ fontSize: 16 }} />} texto={e.numero_de_telefono} clave="tel" href={`tel:${e.numero_de_telefono}`} copiado={copiado} onCopiar={copiar} />}
            {direccion && <Linea icono={<PlaceOutlinedIcon style={{ fontSize: 16 }} />} texto={direccion} clave="dir" copiado={copiado} onCopiar={copiar} />}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.5fr) minmax(0,1fr)", gap: "6px 10px", marginTop: 2 }}>
              <Dato label="INGRESO" valor={e.fecha_ingreso ? fmtFecha(e.fecha_ingreso) : ""} capitalizar={false} />
              <Dato label="ANTIGÜEDAD" valor={antiguedad(e.fecha_ingreso)} capitalizar={false} />
              <Dato label="HORARIO" valor={e.horario} />
              <Dato label="TIPO" valor={e.tipo_empleado} />
              <Dato label="CURP" valor={sensibles ? sensibles.curp : e.curp_mask} capitalizar={false} />
              <Dato label="NSS" valor={sensibles ? sensibles.nss : e.nss_mask} capitalizar={false} />
            </div>

            <div style={{
              marginTop: "auto", background: "rgba(15,76,58,0.08)", borderRadius: 8, padding: "5px 9px",
              fontSize: 11, color: "#1d2b25", display: "flex", gap: 6, minWidth: 0,
            }}>
              <span style={{ fontSize: 8.5, letterSpacing: ".08em", fontWeight: 800, color: "#8a6d1f", alignSelf: "center" }}>EMERGENCIA</span>
              <span title={emergencia} style={{ flex: 1, ...elipsis }}>{emergencia || "Sin registrar"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
