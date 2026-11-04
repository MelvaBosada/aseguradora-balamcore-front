import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import logoMarca from "../../assets/flores/diseño4.png";
import logoMarca2 from "../../assets/flores/diseño3.png";
import logoMarca3 from "../../assets/flores/diseño2.png";

import AutorenewIcon from "@mui/icons-material/Autorenew";

import { fmtFecha } from "../../utils/planFormat";

const cara = {
  position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
  backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
};

export default function TarjetaNegocio({ aseguradora: a, plan }) {
  const [volteada, setVolteada] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copiado, setCopiado] = useState("");

  const iniciales = (a.nombre || "BC").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const direccion = [a.domicilio, a.municipio, a.estado, a.codigo_postal, a.pais].filter(Boolean).join(", ");

  const copiar = async (e, texto, clave) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(""), 1600);
    } catch {
      /* sin permiso del navegador */
    }
  };

  const guardarContacto = (e) => {
    e.stopPropagation();
    const esc = (v) => String(v || "").replace(/([,;])/g, "\\$1");
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${esc(a.nombre)}`,
      `ORG:${esc(a.razon_social || a.nombre)}`,
      a.correo && `EMAIL;TYPE=WORK:${a.correo}`,
      a.telefono && `TEL;TYPE=WORK,VOICE:${a.telefono}`,
      direccion && `ADR;TYPE=WORK:;;${esc(a.domicilio)};${esc(a.municipio)};${esc(a.estado)};${esc(a.codigo_postal)};${esc(a.pais)}`,
      a.sitio_web && `URL:${a.sitio_web}`,
      "END:VCARD",
    ].filter(Boolean).join("\r\n");

    const url = URL.createObjectURL(new Blob([vcf], { type: "text/vcard" }));
    const link = document.createElement("a");
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -9,
      y: ((e.clientX - r.left) / r.width - 0.5) * 11,
    });
  };

  const Linea = ({ icono, texto, clave, href }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#1d2b25", minWidth: 0 }}>
      <span style={{ color: "#0F4C3A", display: "flex" }}>{icono}</span>
      {href ? (
        <a href={href} onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{texto}</a>
      ) : (
        <span style={{ flex: 1, lineHeight: 1.35 }}>{texto}</span>
      )}
      <button onClick={(e) => copiar(e, texto, clave)} title="Copiar" style={{ background: "none", border: "none", cursor: "pointer", color: copiado === clave ? "#16a34a" : "#94a3b8", display: "flex", padding: 2 }}>
        {copiado === clave ? <CheckIcon style={{ fontSize: 16 }} /> : <ContentCopyIcon style={{ fontSize: 15 }} />}
      </button>
    </div>
  );

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
            background: "linear-gradient(135deg, #071a14 0%, #071a14 60%, #071a14 100%)",
            boxShadow: "0 22px 50px rgba(7,26,20,0.35)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <img src={logoMarca3} alt="" style={{ position: "absolute", right: -20, bottom: 240, width: 130, opacity: 0.3, pointerEvents: "none" }} />
            <img src={logoMarca3} alt="" style={{ position: "absolute", right: 85, bottom: 150, width: 130, opacity: 0.2, pointerEvents: "none" }} />
            <img src={logoMarca2} alt="" style={{ position: "absolute", right: -20, bottom: -50, width: 220, opacity: 0.4, pointerEvents: "none" }} />
            <img src={logoMarca3} alt="" style={{ position: "absolute", right: -20, bottom: 145, width: 95, opacity: 0.23, pointerEvents: "none" }} />
            <img src={logoMarca2} alt="" style={{ position: "absolute", right: 180, bottom: -20, width: 280, opacity: 0.25, pointerEvents: "none" }} />
            
           
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "linear-gradient(180deg,#f0d060,#D4AF37)" }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              {a.logo_url ? (
                <img src={a.logo_url} alt="" style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover", background: "#fff" }}
                     onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <div style={{
                  width: 54, height: 54, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(212,175,55,0.16)", border: "1px solid rgba(212,175,55,0.45)", color: "#D4AF37", fontWeight: 900, fontSize: 18,
                }}>{iniciales}</div>
              )}
              {plan && (
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20, padding: "4px 11px" }}>
                  PLAN {String(plan.nombre).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ position: "relative", marginTop: 26 }}>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{a.nombre}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{a.razon_social}</div>
            </div>

            <div style={{ position: "absolute", left: 26, right: 26, bottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <div>
                <div style={{ letterSpacing: ".08em", fontSize: 9.5 }}>RFC</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: ".04em" }}>{a.rfc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <AutorenewIcon style={{ fontSize: 14 }} /> Toca para voltear
              </div>
            </div>
          </div>

          {/* REVERSO */}
          <div style={{
            ...cara, transform: "rotateY(180deg)", padding: "20px 22px",
            background: "linear-gradient(160deg, #fbf7ec, #f3ecd8)", border: "1px solid #e6dcc0",
            boxShadow: "0 22px 50px rgba(7,26,20,0.25)", display: "flex", flexDirection: "column", gap: 9,
          }}>
            <div style={{ fontSize: 10, letterSpacing: ".12em", fontWeight: 800, color: "#8a6d1f" }}>CONTACTO</div>
            {a.correo && <Linea icono={<MailOutlineIcon style={{ fontSize: 17 }} />} texto={a.correo} clave="correo" href={`mailto:${a.correo}`} />}
            {a.telefono && <Linea icono={<PhoneIcon style={{ fontSize: 17 }} />} texto={a.telefono} clave="tel" href={`tel:${a.telefono}`} />}
            {direccion && <Linea icono={<PlaceOutlinedIcon style={{ fontSize: 17 }} />} texto={direccion} clave="dir" />}
            {a.sitio_web && <Linea icono={<LanguageIcon style={{ fontSize: 17 }} />} texto={a.sitio_web} clave="web" href={a.sitio_web} />}

            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10.5, color: "#8a6d1f" }}>
                Cliente desde {a.desde ? fmtFecha(a.desde) : "—"}
              </span>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}