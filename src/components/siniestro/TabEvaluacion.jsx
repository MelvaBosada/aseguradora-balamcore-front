import { useCallback, useEffect, useState } from "react";
import "../../css/Clientes.css";
import "../../css/SiniestroDetalle.css";
import Modal, { PieAcciones } from "./Modal";
import DesgloseCalculo from "./DesgloseCalculo";
import { EstatusEvaluacion } from "./Badges";
import PrimaryButton from "../PrimaryButton";
import { api, dinero, fmtFecha, mensajeError } from "../../services/siniestroApi";
import { obtenerUsuario, puedeAutorizarNivel } from "../../utils/permisos";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";

const AVISO_EXITO_MS = 3500;

const RECOMENDACIONES = [
  ["reparar", "Reparar"],
  ["reemplazar", "Reemplazar"],
  ["indemnizar", "Indemnizar (pérdida total)"],
  ["rechazar", "Rechazar el siniestro"],
];

const hoy = () => new Date().toISOString().slice(0, 10);

const RAMOS_PERSONAS = ["vida", "gastos_medicos"];
const RAMOS_PROPORCIONAL = ["hogar", "empresarial"];
const esPersonas = (ramo) => RAMOS_PERSONAS.includes(ramo);
const esTotal = (f, ramo) => !esPersonas(ramo) && ["reemplazar", "indemnizar"].includes(f.recomendacion);

const formVacio = (ramo) => ({
  fecha_inspeccion: hoy(),
  recomendacion: esPersonas(ramo) ? "indemnizar" : "reparar",
  dictamen: "", causas: "", responsable: "",
  costo_reparacion: "", costo_remplazo: "", valor_residual: "",
  valor_real_bien: "", gastos_procedentes: "", conserva_salvamento: "",
  id_cobertura: "",
  incumplimientos: [],
});

const aFormulario = (e) => ({
  fecha_inspeccion: (e.fecha_inspeccion || hoy()).slice(0, 10),
  recomendacion: e.recomendacion,
  dictamen: e.dictamen || "",
  causas: e.causas || "",
  responsable: e.responsable || "",
  costo_reparacion: Number(e.costo_reparacion) ? e.costo_reparacion : "",
  costo_remplazo: Number(e.costo_remplazo) ? e.costo_remplazo : "",
  valor_residual: Number(e.valor_residual) ? e.valor_residual : "",
  valor_real_bien: Number(e.valor_real_bien) ? e.valor_real_bien : "",
  gastos_procedentes: Number(e.gastos_procedentes) ? e.gastos_procedentes : "",
  conserva_salvamento: e.conserva_salvamento || "",
  id_cobertura: e.id_cobertura || "",
  incumplimientos: Array.isArray(e.incumplimientos) ? e.incumplimientos : [],
});

/** Solo manda al servidor lo que corresponde a la recomendación y al ramo. */
const aPayload = (f, ramo) => {
  const total = esTotal(f, ramo);
  return {
    fecha_inspeccion: f.fecha_inspeccion,
    recomendacion: f.recomendacion,
    dictamen: f.dictamen,
    causas: f.causas,
    responsable: f.responsable || null,
    costo_reparacion: !esPersonas(ramo) && f.recomendacion === "reparar" ? Number(f.costo_reparacion) || 0 : 0,
    costo_remplazo: total ? Number(f.costo_remplazo) || 0 : 0,
    valor_residual: total ? Number(f.valor_residual) || 0 : 0,
    valor_real_bien: RAMOS_PROPORCIONAL.includes(ramo) && f.recomendacion !== "rechazar" && Number(f.valor_real_bien) > 0
      ? Number(f.valor_real_bien) : null,
    gastos_procedentes: ramo === "gastos_medicos" && f.recomendacion === "indemnizar"
      ? Number(f.gastos_procedentes) || 0 : null,
    conserva_salvamento: total && f.conserva_salvamento ? f.conserva_salvamento : null,
    id_cobertura: f.id_cobertura ? Number(f.id_cobertura) : null,
    incumplimientos: f.recomendacion === "rechazar"
      ? []
      : (f.incumplimientos || []).map((i) => ({
          codigo: i.codigo,
          aplica: !!i.aplica,
          tipo_ajuste: i.tipo_ajuste === "monto" ? "monto" : "porcentaje",
          valor: Number(i.valor) || 0,
          motivo: i.motivo || "",
        })),
  };
};

// valor_real_bien NO se exige aquí: con cobertura a primer riesgo no hace falta y el backend lo avisa si falta
const formularioValido = (f, ramo) => {
  const base = f.fecha_inspeccion && f.dictamen.trim().length >= 10 && f.causas.trim().length >= 5;
  if (!base) return false;
  if (f.recomendacion === "rechazar" || ramo === "vida") return true;
  if (ramo === "gastos_medicos") return Number(f.gastos_procedentes) > 0;
  return f.recomendacion === "reparar" ? Number(f.costo_reparacion) > 0 : Number(f.costo_remplazo) > 0;
};

export default function TabEvaluacion({ detalle, onCambio }) {
  const id = detalle.id;
  const ramo = detalle.poliza_tipo;
  const miEmpleado = obtenerUsuario().id_empleado;

  const [lista, setLista] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }
  const [ocupado, setOcupado] = useState(false);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [f, setF] = useState(() => formVacio(detalle.poliza_tipo));
  const [coberturas, setCoberturas] = useState([]);
  const [vista, setVista] = useState(null); // { calculo, nivel }
  const [errorVista, setErrorVista] = useState("");
  // Catálogo y detectados: se guardan aparte para que la sección no desaparezca si el cálculo da error
  const [disp, setDisp] = useState({ catalogo: [], detectados: [] });

  const [confirmarEnvio, setConfirmarEnvio] = useState(false);
  const [resolver, setResolver] = useState(null); // "aprobar" | "devolver"
  const [motivo, setMotivo] = useState("");

  const opcionesRec = esPersonas(ramo)
    ? RECOMENDACIONES.filter(([v]) => ["indemnizar", "rechazar"].includes(v))
    : RECOMENDACIONES;

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}/evaluaciones`);
      setLista(r.data);
      setErrorCarga("");
    } catch (e) {
      setErrorCarga(mensajeError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actual = lista && lista[0];
  const enCurso = actual && ["borrador", "en_revision"].includes(actual.estatus);
  const puedeCrear = lista && detalle.estatus_valor === "en_evaluacion" && !enCurso;

  // Cálculo en vivo mientras se captura (el monto nunca se escribe a mano)
  useEffect(() => {
    if (!formAbierto || !formularioValido(f, ramo)) {
      setVista(null);
      setErrorVista("");
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const r = await api.post(`/siniestros/${id}/evaluaciones/calcular`, aPayload(f, ramo));
        setVista(r.data);
        setErrorVista("");
        setDisp({
          catalogo: r.data.catalogo || [],
          detectados: (r.data.calculo?.incumplimientos || []).filter((l) => l.origen === "detectado"),
        });
      } catch (e) {
        setVista(null);
        setErrorVista(mensajeError(e));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [f, formAbierto, id, ramo]);

  const abrirForm = async (evaluacion = null) => {
    setEditando(evaluacion);
    setF(evaluacion ? aFormulario(evaluacion) : formVacio(ramo));
    setVista(null);
    setDisp({ catalogo: [], detectados: [] });
    setFormAbierto(true);
    if (detalle.poliza_id) {
      try {
        const r = await api.get(`/polizas/${detalle.poliza_id}/coberturas`);
        setCoberturas(r.data.coberturas.filter((c) => c.asignada));
      } catch {
        setCoberturas([]);
      }
    }
  };

  /**
   * Ejecuta una acción del servidor y muestra el aviso.
   * exito: { titulo, mensaje } o una función (respuesta) => { titulo, mensaje }
   * tituloError: título del aviso si la acción falla
   */
  const ejecutar = async (fn, exito, tituloError) => {
    if (ocupado) return false; // evita doble clic mientras se guarda
    setOcupado(true);
    try {
      const r = await fn();
      await cargar();
      onCambio && onCambio();
      const { titulo, mensaje } = typeof exito === "function" ? exito(r) : exito;
      mostrarAviso("exito", titulo, mensaje);
      return true;
    } catch (e) {
      mostrarAviso("error", tituloError, mensajeError(e));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardar = async () => {
    const payload = aPayload(f, ramo);
    const ok = await ejecutar(
      () => (editando ? api.put(`/evaluaciones/${editando.id}`, payload) : api.post(`/siniestros/${id}/evaluaciones`, payload)),
      { titulo: "Dictamen guardado", mensaje: "El dictamen quedó como borrador." },
      "No se pudo guardar el dictamen"
    );
    if (ok) setFormAbierto(false);
  };

  const enviar = async () => {
    const ok = await ejecutar(
      () => api.post(`/evaluaciones/${actual.id}/enviar`),
      (r) =>
        r.data.estatus === "aprobada"
          ? { titulo: "Dictamen autorizado", mensaje: "El dictamen se autorizó automáticamente." }
          : { titulo: "Dictamen enviado", mensaje: "El dictamen se envió a autorización." },
      "No se pudo enviar el dictamen"
    );
    if (ok) setConfirmarEnvio(false);
  };

  const confirmarResolucion = async () => {
    const aprobar = resolver === "aprobar";
    const ok = await ejecutar(
      () => api.post(`/evaluaciones/${actual.id}/resolver`, { accion: resolver, motivo }),
      aprobar
        ? { titulo: "Dictamen aprobado", mensaje: "El dictamen se aprobó correctamente." }
        : { titulo: "Dictamen devuelto", mensaje: "El dictamen volvió al ajustador." },
      aprobar ? "No se pudo aprobar el dictamen" : "No se pudo devolver el dictamen"
    );
    if (ok) {
      setResolver(null);
      setMotivo("");
    }
  };

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  // ---- Incumplimientos del asegurado ----
  const entrada = (codigo) => (f.incumplimientos || []).find((i) => i.codigo === codigo);
  const defDe = (codigo) => disp.catalogo.find((c) => c.codigo === codigo);

  const setIncumplimiento = (codigo, cambios) =>
    setF((prev) => {
      const lista = prev.incumplimientos || [];
      const nueva = lista.some((i) => i.codigo === codigo)
        ? lista.map((i) => (i.codigo === codigo ? { ...i, ...cambios } : i))
        : [...lista, { codigo, aplica: false, tipo_ajuste: "porcentaje", valor: "", motivo: "", ...cambios }];
      return { ...prev, incumplimientos: nueva };
    });

  const quitarIncumplimiento = (codigo) =>
    setF((prev) => ({ ...prev, incumplimientos: (prev.incumplimientos || []).filter((i) => i.codigo !== codigo) }));

  const camposIncumplimiento = (i, efecto) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 8 }}>
      {i.aplica && efecto === "reduce" && (
        <>
          <div className="balam-field">
            <label>Tipo de reducción</label>
            <select
              className="balam-select"
              value={i.tipo_ajuste}
              onChange={(e) => setIncumplimiento(i.codigo, { tipo_ajuste: e.target.value })}
            >
              <option value="porcentaje">% del daño</option>
              <option value="monto">Monto fijo</option>
            </select>
          </div>
          <div className="balam-field">
            <label>{i.tipo_ajuste === "monto" ? "Monto a descontar" : "Porcentaje a descontar"}</label>
            <input
              type="number" min="0" step="0.01" value={i.valor}
              onChange={(e) => setIncumplimiento(i.codigo, { valor: e.target.value })}
            />
          </div>
        </>
      )}
      <div className="balam-field" style={{ gridColumn: "1 / -1" }}>
        <label>{i.aplica ? "Motivo y sustento (mín. 10 caracteres)" : "Por qué no aplica (mín. 10 caracteres)"}</label>
        <textarea
          className="balam-textarea"
          rows={2} maxLength={255} value={i.motivo}
          onChange={(e) => setIncumplimiento(i.codigo, { motivo: e.target.value })}
        />
      </div>
    </div>
  );

  if (!lista) return <div className="sd-card sd-vacio">{errorCarga || "Cargando…"}</div>;

  // puedeAutorizarNivel recibe el nivel de autorización del dictamen (auto | supervisor | gerente)
  const puedeResolver =
    actual?.estatus === "en_revision" &&
    puedeAutorizarNivel(actual.nivel_autorizacion) &&
    !(miEmpleado && Number(miEmpleado) === Number(actual.id_empleado));

  return (
    <>
      {errorCarga && <div className="sd-alerta error">{errorCarga}</div>}

      {detalle.estatus_valor === "documentacion_pendiente" && lista.length === 0 && (
        <div className="sd-alerta aviso">No se puede dictaminar mientras falten documentos obligatorios. Revisa la pestaña Documentos.</div>
      )}

      {!actual ? (
        <div className="sd-card">
          <div className="sd-vacio">Este siniestro todavía no tiene dictamen.</div>
          {puedeCrear && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PrimaryButton
                text="Nuevo dictamen"
                icon={<AddCircleOutlinedIcon />}
                onClick={() => abrirForm()}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="sd-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>
                Dictamen #{actual.id} <EstatusEvaluacion valor={actual.estatus} />
              </h3>
              <div className="sd-gris">
                Recomendación: {RECOMENDACIONES.find(([v]) => v === actual.recomendacion)?.[1] || actual.recomendacion} · Inspección{" "}
                {fmtFecha(actual.fecha_inspeccion)}
              </div>
            </div>
            <div className="sd-acciones">
              {actual.estatus === "borrador" && (
                <>
                  <button className="sd-btn" disabled={ocupado} onClick={() => abrirForm(actual)}>
                    Editar
                  </button>
                  <PrimaryButton
                    text="Enviar a autorización"
                    icon={<SendIcon />}
                    disabled={ocupado}
                    onClick={() => setConfirmarEnvio(true)}
                  />
                </>
              )}
              {puedeResolver && (
                <>
                  <PrimaryButton
                    text="Aprobar"
                    icon={<CheckCircleOutlineIcon />}
                    disabled={ocupado}
                    onClick={() => setResolver("aprobar")}
                  />
                  <button className="sd-btn peligro" disabled={ocupado} onClick={() => setResolver("devolver")}>
                    Devolver
                  </button>
                </>
              )}
              {puedeCrear && actual.estatus !== "borrador" && (
                <PrimaryButton
                  text="Nuevo dictamen"
                  icon={<AddCircleOutlinedIcon />}
                  onClick={() => abrirForm()}
                />
              )}
            </div>
          </div>

          <div className="sd-grid" style={{ marginBottom: 12 }}>
            <div className="sd-dato"><span>Dictamen</span><div>{actual.dictamen}</div></div>
            <div className="sd-dato"><span>Causas</span><div>{actual.causas}</div></div>
            {actual.responsable && <div className="sd-dato"><span>Responsable</span><div>{actual.responsable}</div></div>}
            {actual.motivo_resolucion && <div className="sd-dato"><span>Resolución</span><div>{actual.motivo_resolucion}</div></div>}
          </div>

          <DesgloseCalculo calculo={actual.calculo} nivel={actual.nivel_autorizacion} />

          {actual.estatus === "en_revision" && !puedeResolver && (
            <div className="sd-alerta info" style={{ marginTop: 10, marginBottom: 0 }}>
              Pendiente de autorización. Lo revisa quien tenga permiso para el nivel indicado.
            </div>
          )}
        </div>
      )}

      {lista.length > 1 && (
        <div className="sd-card">
          <h3>Dictámenes anteriores</h3>
          <table className="sd-tabla">
            <tbody>
              {lista.slice(1).map((e) => (
                <tr key={e.id}>
                  <td>#{e.id}</td>
                  <td><EstatusEvaluacion valor={e.estatus} /></td>
                  <td>{RECOMENDACIONES.find(([v]) => v === e.recomendacion)?.[1]}</td>
                  <td className="der">{dinero(e.monto_recomendado)}</td>
                  <td>{e.motivo_resolucion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Captura del dictamen ---------- */}
      <Modal
        open={formAbierto}
        titulo={editando ? `Editar dictamen #${editando.id}` : "Nuevo dictamen"}
        subtitulo={`${detalle.numero_siniestro} · reclamado ${dinero(detalle.monto_reclamado)}`}
        ancho={900}
        onClose={() => setFormAbierto(false)}
        pie={
          <PieAcciones
            onCancelar={() => setFormAbierto(false)}
            onConfirmar={guardar}
            ocupado={ocupado}
            deshabilitado={!formularioValido(f, ramo)}
            textoConfirmar="Guardar borrador"
          />
        }
      >
        {/* Contenedor de UNA columna: apila los apartados uno debajo del otro */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", gridColumn: "1 / -1" }}>

          {/* ── Apartado 1: datos del dictamen (2 columnas) ── */}
          <div style={{ width: "100%" }}>
            <div className="balam-section-title">Datos del dictamen</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 12 }}>
              <div className="balam-field">
                <label>Fecha de inspección</label>
                <input type="date" name="fecha_inspeccion" value={f.fecha_inspeccion} onChange={cambiar} />
              </div>
              <div className="balam-field">
                <label>Recomendación</label>
                <select className="balam-select" name="recomendacion" value={f.recomendacion} onChange={cambiar}>
                  {opcionesRec.map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="balam-field" style={{ gridColumn: "1 / -1" }}>
                <label>Dictamen (mín. 10 caracteres)</label>
                <textarea
                  className="balam-textarea" rows={4} name="dictamen"
                  value={f.dictamen} onChange={cambiar} maxLength={255}
                  placeholder="Describe el resultado de la inspección y la conclusión del dictamen"
                />
              </div>
              <div className="balam-field" style={{ gridColumn: "1 / -1" }}>
                <label>Causas del siniestro</label>
                <textarea
                  className="balam-textarea" rows={3} name="causas"
                  value={f.causas} onChange={cambiar} maxLength={255}
                  placeholder="Qué originó el daño"
                />
              </div>
              <div className="balam-field" style={{ gridColumn: "1 / -1" }}>
                <label>Responsable del daño (opcional)</label>
                <input
                  name="responsable" value={f.responsable} onChange={cambiar} maxLength={255}
                  placeholder="Persona o empresa responsable, si aplica"
                />
              </div>
            </div>
          </div>

          {/* ── Apartado 2: valoración del daño (1 columna) ── */}
          {f.recomendacion !== "rechazar" && (
            <div style={{ width: "100%" }}>
              <div className="balam-section-title">Valoración del daño</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                {ramo === "vida" && f.recomendacion === "indemnizar" && (
                  <div className="sd-gris">
                    Se paga la suma asegurada vigente a la fecha del hecho (sin deducible).
                  </div>
                )}
                {ramo === "gastos_medicos" && f.recomendacion === "indemnizar" && (
                  <div className="balam-field">
                    <label>Gastos médicos procedentes</label>
                    <input type="number" min="0" step="0.01" name="gastos_procedentes" value={f.gastos_procedentes} onChange={cambiar} />
                  </div>
                )}
                {!esPersonas(ramo) && f.recomendacion === "reparar" && (
                  <div className="balam-field">
                    <label>Costo de reparación</label>
                    <input type="number" min="0" step="0.01" name="costo_reparacion" value={f.costo_reparacion} onChange={cambiar} />
                  </div>
                )}
                {esTotal(f, ramo) && (
                  <>
                    <div className="balam-field">
                      <label>Costo de reemplazo / valor del bien</label>
                      <input type="number" min="0" step="0.01" name="costo_remplazo" value={f.costo_remplazo} onChange={cambiar} />
                    </div>
                    <div className="balam-field">
                      <label>Valor residual (salvamento)</label>
                      <input type="number" min="0" step="0.01" name="valor_residual" value={f.valor_residual} onChange={cambiar} />
                    </div>
                    <div className="balam-field">
                      <label>¿Quién conserva el salvamento?</label>
                      <select className="balam-select" name="conserva_salvamento" value={f.conserva_salvamento} onChange={cambiar}>
                        <option value="">Según configuración de la aseguradora</option>
                        <option value="aseguradora">La aseguradora (se paga completo)</option>
                        <option value="asegurado">El asegurado (se descuenta)</option>
                      </select>
                    </div>
                  </>
                )}
                {RAMOS_PROPORCIONAL.includes(ramo) && (
                  <div className="balam-field">
                    <label>Valor real de los bienes asegurados</label>
                    <input type="number" min="0" step="0.01" name="valor_real_bien" value={f.valor_real_bien} onChange={cambiar} />
                    <span className="sd-gris" style={{ fontSize: 11, marginTop: 3 }}>
                      Reposición a la fecha del siniestro. Requerido salvo coberturas a primer riesgo.
                    </span>
                  </div>
                )}
                {coberturas.length > 1 && (
                  <div className="balam-field">
                    <label>Cobertura a aplicar</label>
                    <select className="balam-select" name="id_cobertura" value={f.id_cobertura} onChange={cambiar}>
                      <option value="">Automática (la más favorable al asegurado)</option>
                      {coberturas.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Apartado 3: cumplimiento del asegurado (1 columna) ── */}
          {f.recomendacion !== "rechazar" && (disp.detectados.length > 0 || disp.catalogo.length > 0) && (
            <div style={{ width: "100%" }}>
              <div className="balam-section-title">Cumplimiento del asegurado</div>
              <div className="sd-gris" style={{ margin: "10px 0" }}>
                El sistema detecta lo que puede. Si el asegurado no cumplió algo, regístralo con su motivo: la reducción
                entra al cálculo y el dictamen puede pasar a revisión. El monto nunca se escribe a mano.
              </div>

              {disp.detectados.map((d) => {
                const i = entrada(d.codigo);
                return (
                  <div key={d.codigo} className="sd-alerta aviso" style={{ marginBottom: 8 }}>
                    <strong>{d.nombre}</strong> · {d.detalle}
                    <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                      <button type="button" className="sd-btn" onClick={() => setIncumplimiento(d.codigo, { aplica: true })}>
                        {i?.aplica ? "✓ Aplicar reducción" : "Aplicar reducción"}
                      </button>
                      <button type="button" className="sd-btn" onClick={() => setIncumplimiento(d.codigo, { aplica: false })}>
                        {i && !i.aplica ? "✓ No aplica" : "No aplica"}
                      </button>
                    </div>
                    {i && camposIncumplimiento(i, d.efecto)}
                  </div>
                );
              })}

              {(f.incumplimientos || [])
                .filter((i) => !disp.detectados.some((d) => d.codigo === i.codigo))
                .map((i) => {
                  const def = defDe(i.codigo);
                  return (
                    <div key={i.codigo} className="sd-alerta aviso" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <strong>{def?.nombre || i.codigo}</strong>
                        <button
                          type="button"
                          aria-label="Quitar incumplimiento"
                          title="Quitar"
                          onClick={() => quitarIncumplimiento(i.codigo)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "inherit" }}
                        >
                          <CloseIcon style={{ fontSize: 18 }} />
                        </button>
                      </div>
                      {def?.ayuda && <div className="sd-gris">{def.ayuda}</div>}
                      {camposIncumplimiento(i, def?.efecto)}
                    </div>
                  );
                })}

              <div className="balam-field">
                <select
                  className="balam-select"
                  value=""
                  onChange={(e) => e.target.value && setIncumplimiento(e.target.value, { aplica: true })}
                >
                  <option value="">+ Registrar otro incumplimiento…</option>
                  {disp.catalogo
                    .filter((c) => !c.detectable && !entrada(c.codigo))
                    .map((c) => (
                      <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                    ))}
                </select>
              </div>

              {Number(vista?.calculo?.reduccion_incumplimientos) > 0 && (
                <div className="sd-gris" style={{ marginTop: 8 }}>
                  Reducción por incumplimientos: -{dinero(vista.calculo.reduccion_incumplimientos)}
                </div>
              )}
            </div>
          )}

          {/* ── Apartado 4: monto calculado (1 columna) ── */}
          <div style={{ width: "100%" }}>
            <div className="balam-section-title">Monto calculado por el sistema</div>
            <div style={{ marginTop: 12 }}>
              {errorVista && <div className="sd-alerta error">{errorVista}</div>}
              {vista ? (
                <DesgloseCalculo calculo={vista.calculo} nivel={vista.nivel} />
              ) : (
                !errorVista && <div className="sd-gris">Completa los datos para ver el cálculo.</div>
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* ---------- Confirmar envío ---------- */}
      <Modal
        open={confirmarEnvio}
        titulo="Enviar dictamen"
        subtitulo="Después de enviarlo ya no se podrá editar."
        onClose={() => setConfirmarEnvio(false)}
        pie={
          <PieAcciones
            onCancelar={() => setConfirmarEnvio(false)}
            onConfirmar={enviar}
            ocupado={ocupado}
            textoConfirmar="Enviar"
          />
        }
      >
        {actual && (
          <div>
            <p><strong>Dictamen #{actual.id}</strong></p>
            <p>Monto recomendado: {dinero(actual.monto_recomendado)}</p>
          </div>
        )}
      </Modal>

      {/* ---------- Aprobar / devolver ---------- */}
      <Modal
        open={!!resolver}
        titulo={resolver === "aprobar" ? "Aprobar dictamen" : "Devolver dictamen"}
        subtitulo={actual ? `${dinero(actual.monto_recomendado)} · nivel ${actual.nivel_autorizacion}` : ""}
        onClose={() => setResolver(null)}
        pie={
          <PieAcciones
            onCancelar={() => setResolver(null)}
            onConfirmar={confirmarResolucion}
            ocupado={ocupado}
            peligro={resolver === "devolver"}
            textoConfirmar={resolver === "aprobar" ? "Aprobar" : "Devolver"}
          />
        }
      >
        {actual && <DesgloseCalculo calculo={actual.calculo} nivel={actual.nivel_autorizacion} />}
        <div className="balam-field" style={{ marginTop: 12 }}>
          <label>{resolver === "devolver" ? "Por qué se devuelve (mínimo 10 caracteres)" : "Comentario (opcional)"}</label>
          <textarea className="balam-textarea" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        </div>
      </Modal>

      {/* ---------- Aviso (éxito / error) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className={`evi-aviso-icono ${aviso.tipo}`}>
              {aviso.tipo === "exito"
                ? <CheckCircleIcon style={{ fontSize: 40 }} />
                : <ErrorOutlineIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  );
}