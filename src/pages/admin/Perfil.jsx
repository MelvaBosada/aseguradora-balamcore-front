import { useEffect, useRef, useState } from "react";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import usePermisos from "../../context/PermisosContext";
import TarjetaNegocio from "../../components/miplan/TarjetaNegocio";
import TarjetaEmpleado from "../../components/miplan/TarjetaEmpleado";
import { caja, btn, cls, Cargando, Nota, Encabezado, AvisoCerrable, pantallaEstado } from "../../components/miplan/ui";
import useMiPlan from "../../hooks/useMiPlan";
import { fmtFecha } from "../../utils/planFormat";
import "../../css/miplan-botones.css";

const API = import.meta.env.VITE_API_URL || "/api";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const SEGUNDOS_VISIBLE = 20; // tiempo que CURP y NSS se quedan a la vista

const CAMPOS_ASEG = [
  ["nombre", "Nombre comercial"], ["razon_social", "Razón social"],
  ["correo", "Correo", "email"], ["telefono", "Teléfono"],
  ["sitio_web", "Sitio web"], ["domicilio", "Domicilio"],
  ["municipio", "Municipio"], ["estado", "Estado"],
  ["codigo_postal", "Código postal"], ["pais", "País"],
];

// Lo único que el empleado puede cambiar por su cuenta
const CAMPOS_EMP = [
  "numero_de_telefono", "telefono_alternativo", "estado_civil",
  "domicilio", "municipio", "estado", "codigo_postal",
  "contacto_emergencia_nombre", "contacto_emergencia_parentesco", "contacto_emergencia_telefono",
];

const ESTADOS_CIVILES = [
  ["soltero", "Soltero(a)"], ["casado", "Casado(a)"],
  ["divorciado", "Divorciado(a)"], ["viudo", "Viudo(a)"],
];

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e3e9e5",
  fontSize: 14, outline: "none", background: "#fff",
};

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 };

const botonOjo = {
  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 4,
};

// Campo de texto. Si es type="password" trae su propio ojo para mostrar/ocultar.
const Campo = ({ label, name, value, onChange, type = "text", readOnly = false }) => {
  const [ver, setVer] = useState(false);
  const esPass = type === "password";

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={esPass && ver ? "text" : type} name={name} value={value ?? ""} onChange={onChange} readOnly={readOnly}
          autoComplete="off"
          style={{
            ...inputStyle,
            background: readOnly ? "#f1f5f9" : "#fff",
            color: readOnly ? "#64748b" : "inherit",
            paddingRight: esPass ? 42 : 12,
          }}
        />
        {esPass && (
          <button type="button" onClick={() => setVer((v) => !v)} title={ver ? "Ocultar" : "Mostrar"} style={botonOjo}>
            {ver ? <VisibilityOffIcon style={{ fontSize: 20 }} /> : <VisibilityIcon style={{ fontSize: 20 }} />}
          </button>
        )}
      </div>
    </div>
  );
};

// Dato de solo lectura que se muestra oculto hasta que se pulsa el ojo
const CampoSecreto = ({ label, oculto, completo, visible, cargando, onAlternar }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ position: "relative" }}>
      <input
        type="text" readOnly autoComplete="off"
        value={(visible ? completo : oculto) ?? ""}
        style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b", paddingRight: 42 }}
      />
      <button
        type="button" onClick={onAlternar} disabled={cargando}
        title={visible ? "Ocultar" : "Mostrar"} style={{ ...botonOjo, opacity: cargando ? 0.5 : 1 }}
      >
        {visible ? <VisibilityOffIcon style={{ fontSize: 20 }} /> : <VisibilityIcon style={{ fontSize: 20 }} />}
      </button>
    </div>
  </div>
);

const Selector = ({ label, name, value, onChange, opciones }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <select name={name} value={value ?? ""} onChange={onChange} style={inputStyle}>
      <option value="">Selecciona...</option>
      {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  </div>
);

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const titulo = { fontWeight: 800, color: "#0F4C3A", fontSize: 16, marginBottom: 14 };
const subtitulo = { fontSize: 11, fontWeight: 800, color: "#8a6d1f", letterSpacing: ".1em", textTransform: "uppercase", margin: "20px 0 10px" };

const mayuscula = (t) => (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : "");

export default function Perfil() {
  const { esAdmin, usuario, sincronizarSesion } = usePermisos();
  const { data, loading, error, cargar } = useMiPlan();

  const [formAseg, setFormAseg] = useState({});
  const [logo, setLogo]         = useState(null);
  // undefined = cargando | null = sin ficha de empleado | objeto = datos
  const [empleado, setEmpleado] = useState(undefined);
  const [formEmp, setFormEmp]   = useState({});
  const [pass, setPass]         = useState({ actual: "", nueva: "", repetir: "" });
  const [guardando, setGuardando]         = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [aviso, setAviso]       = useState({ texto: "", tipo: "ok" });

  // CURP / RFC / NSS completos: null = ocultos
  const [sensibles, setSensibles]         = useState(null);
  const [cargandoSens, setCargandoSens]   = useState(false);
  const temporizadorSens                  = useRef(null);

  // Mensaje fijo cuando se agotan los intentos de contraseña
  const [bloqueoPass, setBloqueoPass] = useState("");
  const temporizadorBloqueo           = useRef(null);

  const mostrar = (texto, tipo = "ok") => setAviso({ texto, tipo });

  useEffect(() => {
    if (data?.aseguradora) setFormAseg(data.aseguradora);
  }, [data]);

  // Ficha de empleado: la pueden tener todos los roles, incluido el administrador
  useEffect(() => {
    axios.get(`${API}/perfil`, auth())
      .then((r) => {
        setEmpleado(r.data.empleado || null);
        setFormEmp(r.data.empleado || {});
      })
      .catch(() => {
        setEmpleado(null);
        mostrar("No se pudieron cargar tus datos.", "error");
      });
  }, []);

  // Limpia los temporizadores al salir de la pantalla
  useEffect(() => () => {
    clearTimeout(temporizadorSens.current);
    clearTimeout(temporizadorBloqueo.current);
  }, []);

  const cambiarAseg = (e) => setFormAseg((p) => ({ ...p, [e.target.name]: e.target.value }));
  const cambiarEmp  = (e) => setFormEmp((p) => ({ ...p, [e.target.name]: e.target.value }));

  const mensajeError = (e, defecto) => {
    const errores = e.response?.data?.errors;
    if (errores) return Object.values(errores).flat()[0];
    return e.response?.data?.message || defecto;
  };

  const alternarSensibles = async () => {
    if (sensibles) {
      clearTimeout(temporizadorSens.current);
      setSensibles(null);
      return;
    }

    setCargandoSens(true);
    try {
      const r = await axios.get(`${API}/perfil/sensibles`, auth());
      setSensibles(r.data);
      clearTimeout(temporizadorSens.current);
      temporizadorSens.current = setTimeout(() => setSensibles(null), SEGUNDOS_VISIBLE * 1000);
    } catch (e) {
      mostrar(mensajeError(e, "No se pudieron mostrar los datos."), "error");
    } finally {
      setCargandoSens(false);
    }
  };

  const guardarAseguradora = async () => {
    setGuardando(true);
    try {
      const fd = new FormData();
      CAMPOS_ASEG.forEach(([k]) => fd.append(k, formAseg[k] ?? ""));
      if (logo) fd.append("logo", logo);
      fd.append("_method", "PUT");

      await axios.post(`${API}/aseguradoras/${usuario.id_aseguradora}`, fd, auth());

      const u = JSON.parse(localStorage.getItem("usuario") || "{}");
      localStorage.setItem("usuario", JSON.stringify({ ...u, aseguradora: formAseg.nombre }));
      sincronizarSesion();

      setLogo(null);
      await cargar();
      mostrar("Datos de la aseguradora actualizados.");
    } catch (e) {
      mostrar(mensajeError(e, "No se pudieron guardar los cambios."), "error");
    } finally {
      setGuardando(false);
    }
  };

  const guardarEmpleado = async () => {
    setGuardando(true);
    try {
      const payload = {};
      CAMPOS_EMP.forEach((k) => { payload[k] = formEmp[k] ?? ""; });
      await axios.put(`${API}/perfil`, payload, auth());
      setEmpleado((p) => ({ ...p, ...payload }));
      mostrar("Tus datos se actualizaron.");
    } catch (e) {
      mostrar(mensajeError(e, "No se pudieron guardar los cambios."), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async () => {
    if (pass.nueva.length < 8) return mostrar("La nueva contraseña debe tener al menos 8 caracteres.", "error");
    if (pass.nueva === pass.actual) return mostrar("La nueva contraseña debe ser distinta a la actual.", "error");
    if (pass.nueva !== pass.repetir) return mostrar("Las contraseñas nuevas no coinciden.", "error");

    setCambiandoPass(true);
    try {
      await axios.post(`${API}/perfil/password`, { actual: pass.actual, nueva: pass.nueva }, auth());
      setPass({ actual: "", nueva: "", repetir: "" });
      mostrar("Contraseña actualizada. Tus otras sesiones abiertas se cerraron.");
    } catch (e) {
      if (e.response?.status === 429) {
        // Se agotaron los 3 intentos: mensaje fijo y botón bloqueado hasta que pase la espera
        setBloqueoPass(e.response.data?.message || "Demasiados intentos. Contacta a tu administrador.");
        mostrar("");
        const seg = e.response.data?.espera_segundos || 900;
        clearTimeout(temporizadorBloqueo.current);
        temporizadorBloqueo.current = setTimeout(() => setBloqueoPass(""), seg * 1000);
      } else {
        mostrar(mensajeError(e, "No se pudo cambiar la contraseña."), "error");
      }
    } finally {
      setCambiandoPass(false);
    }
  };

  const estadoPantalla = pantallaEstado({ loading, error, data });
  if (estadoPantalla) return estadoPantalla;

  const ce = (name, label) => (
    <Campo key={name} label={label} name={name} value={formEmp[name]} onChange={cambiarEmp} />
  );

  return (
    <div className="container py-4" style={{ maxWidth: 960 }}>
      <Encabezado titulo="Mi perfil" />
      <AvisoCerrable texto={aviso.texto} tipo={aviso.tipo} onCerrar={() => mostrar("")} />

      {/* ───────── TARJETAS ───────── */}
      {esAdmin && !empleado ? (
        // Administrador sin ficha de empleado: solo la tarjeta de la empresa, sin segundo título ni notas
        <div>
          <div style={titulo}>Identificación corporativa</div>
          <TarjetaNegocio aseguradora={data.aseguradora} plan={data.plan} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
          <div>
            <div style={titulo}>Identificación corporativa</div>
            <TarjetaNegocio aseguradora={data.aseguradora} plan={esAdmin ? data.plan : null} />
          </div>
          <div>
            <div style={titulo}>Identificación empresarial</div>
            {empleado ? (
              <TarjetaEmpleado
                empleado={empleado}
                sensibles={sensibles}
                cargandoSensibles={cargandoSens}
                onAlternarSensibles={alternarSensibles}
              />
            ) : empleado === null ? (
              <Nota color="#475569" fondo="#f1f5f9" borde="#cbd5e1">
                Tu cuenta todavía no tiene una ficha de empleado. Pídele al administrador que la registre en Empleados.
              </Nota>
            ) : (
              <p style={{ fontSize: 13, color: "#64748b" }}>Cargando tus datos...</p>
            )}
          </div>
        </div>
      )}

      {/* ───────── DATOS DE LA ASEGURADORA (solo administrador) ───────── */}
      {esAdmin && (
        <div style={{ ...caja, marginTop: 28 }}>
          <div style={titulo}>Datos de la aseguradora</div>
          <div style={grid}>
            <Campo label="RFC" value={formAseg.rfc} readOnly />
            {CAMPOS_ASEG.map(([k, label, type]) => (
              <Campo key={k} name={k} label={label} type={type} value={formAseg[k]} onChange={cambiarAseg} />
            ))}
            <div>
              <label style={labelStyle}>Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: 7 }} />
            </div>
          </div>
          <div style={{ marginTop: 18, maxWidth: 260 }}>
            <button className={cls("primario", guardando)} style={btn()} disabled={guardando} onClick={guardarAseguradora}>
              {guardando ? <Cargando>Guardando...</Cargando> : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ───────── MIS DATOS (cualquier rol con ficha de empleado) ───────── */}
      {empleado && (
        <div style={{ ...caja, marginTop: 28 }}>
          <div style={titulo}>Mis datos personales</div>

          <div style={{ ...subtitulo, marginTop: 0 }}>Contacto</div>
          <div style={grid}>
            {ce("numero_de_telefono", "Teléfono")}
            {ce("telefono_alternativo", "Teléfono alternativo")}
            <Selector label="Estado civil" name="estado_civil" value={formEmp.estado_civil} onChange={cambiarEmp} opciones={ESTADOS_CIVILES} />
          </div>

          <div style={subtitulo}>Domicilio</div>
          <div style={grid}>
            {ce("domicilio", "Domicilio")}
            {ce("municipio", "Municipio")}
            {ce("estado", "Estado")}
            {ce("codigo_postal", "Código postal")}
          </div>

          <div style={subtitulo}>Contacto de emergencia</div>
          <div style={grid}>
            {ce("contacto_emergencia_nombre", "Nombre")}
            {ce("contacto_emergencia_parentesco", "Parentesco")}
            {ce("contacto_emergencia_telefono", "Teléfono de emergencia")}
          </div>

          <div style={{ marginTop: 18, maxWidth: 260 }}>
            <button className={cls("primario", guardando)} style={btn()} disabled={guardando} onClick={guardarEmpleado}>
              {guardando ? <Cargando>Guardando...</Cargando> : "Guardar cambios"}
            </button>
          </div>

          <div style={subtitulo}>Datos laborales</div>

          <div style={grid}>
            <Campo label="Nombre completo" value={`${empleado.nombre || ""} ${empleado.apellidos || ""}`.trim()} readOnly />
            <Campo label="Correo de acceso" value={empleado.correo} readOnly />
            <Campo label="Puesto" value={mayuscula(empleado.puesto)} readOnly />
            <Campo label="Departamento" value={mayuscula(empleado.departamento)} readOnly />
            <Campo label="Tipo de empleado" value={mayuscula(empleado.tipo_empleado)} readOnly />
            <Campo label="Horario" value={mayuscula(empleado.horario)} readOnly />
            <Campo label="Fecha de ingreso" value={empleado.fecha_ingreso ? fmtFecha(empleado.fecha_ingreso) : ""} readOnly />
            <CampoSecreto label="CURP" oculto={empleado.curp_mask} completo={sensibles?.curp} visible={!!sensibles} cargando={cargandoSens} onAlternar={alternarSensibles} />
            <CampoSecreto label="NSS" oculto={empleado.nss_mask} completo={sensibles?.nss} visible={!!sensibles} cargando={cargandoSens} onAlternar={alternarSensibles} />
          </div>
        </div>
      )}

      {/* ───────── CONTRASEÑA (todos los roles) ───────── */}
      <div style={{ ...caja, marginTop: 22 }}>
        <div style={titulo}>Cambiar contraseña</div>

        {bloqueoPass && (
          <div style={{ marginBottom: 14 }}>
            <Nota color="#991b1b" fondo="#fef2f2" borde="#fecaca">{bloqueoPass}</Nota>
          </div>
        )}

        <div style={grid}>
          <Campo label="Contraseña actual" type="password" value={pass.actual} onChange={(e) => setPass({ ...pass, actual: e.target.value })} />
          <Campo label="Nueva contraseña (mínimo 8 caracteres)" type="password" value={pass.nueva} onChange={(e) => setPass({ ...pass, nueva: e.target.value })} />
          <Campo label="Repetir nueva contraseña" type="password" value={pass.repetir} onChange={(e) => setPass({ ...pass, repetir: e.target.value })} />
        </div>
        <div style={{ marginTop: 18, maxWidth: 260 }}>
          <button
            className={cls("primario", cambiandoPass)} style={btn()}
            disabled={cambiandoPass || !!bloqueoPass || !pass.actual || !pass.nueva}
            onClick={cambiarPassword}
          >
            {cambiandoPass ? <Cargando>Actualizando...</Cargando> : "Actualizar contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
