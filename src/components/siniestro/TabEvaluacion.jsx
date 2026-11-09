import { useCallback, useEffect, useState } from "react";
import "../../css/SiniestroDetalle.css";
import Modal, { PieAcciones } from "./Modal";
import DesgloseCalculo from "./DesgloseCalculo";
import { EstatusEvaluacion } from "./Badges";
import { api, dinero, fmtFecha, mensajeError } from "../../services/siniestroApi";
import { obtenerUsuario, puedeAutorizarNivel } from "../../utils/permisos";

const RECOMENDACIONES = [
  ["reparar", "Reparar"],
  ["reemplazar", "Reemplazar"],
  ["indemnizar", "Indemnizar (pérdida total)"],
  ["rechazar", "Rechazar el siniestro"],
];

const hoy = () => new Date().toISOString().slice(0, 10);

const formVacio = () => ({
  fecha_inspeccion: hoy(),
  recomendacion: "reparar",
  dictamen: "",
  causas: "",
  responsable: "",
  costo_reparacion: "",
  costo_remplazo: "",
  valor_residual: "",
  id_cobertura: "",
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
  id_cobertura: e.id_cobertura || "",
});

/** Solo manda al servidor lo que corresponde a la recomendación. */
const aPayload = (f) => ({
  fecha_inspeccion: f.fecha_inspeccion,
  recomendacion: f.recomendacion,
  dictamen: f.dictamen,
  causas: f.causas,
  responsable: f.responsable || null,
  costo_reparacion: f.recomendacion === "reparar" ? Number(f.costo_reparacion) || 0 : 0,
  costo_remplazo: ["reemplazar", "indemnizar"].includes(f.recomendacion) ? Number(f.costo_remplazo) || 0 : 0,
  valor_residual: ["reemplazar", "indemnizar"].includes(f.recomendacion) ? Number(f.valor_residual) || 0 : 0,
  id_cobertura: f.id_cobertura ? Number(f.id_cobertura) : null,
});

const formularioValido = (f) =>
  f.fecha_inspeccion &&
  f.dictamen.trim().length >= 10 &&
  f.causas.trim().length >= 5 &&
  (f.recomendacion === "rechazar" ||
    (f.recomendacion === "reparar" && Number(f.costo_reparacion) > 0) ||
    (["reemplazar", "indemnizar"].includes(f.recomendacion) && Number(f.costo_remplazo) > 0));

export default function TabEvaluacion({ detalle, onCambio }) {
  const id = detalle.id;
  const miEmpleado = obtenerUsuario().id_empleado;

  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [f, setF] = useState(formVacio());
  const [coberturas, setCoberturas] = useState([]);
  const [vista, setVista] = useState(null); // { calculo, nivel }
  const [errorVista, setErrorVista] = useState("");

  const [resolver, setResolver] = useState(null); // "aprobar" | "devolver"
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}/evaluaciones`);
      setLista(r.data);
    } catch (e) {
      setError(mensajeError(e));
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
    if (!formAbierto || !formularioValido(f)) {
      setVista(null);
      setErrorVista("");
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const r = await api.post(`/siniestros/${id}/evaluaciones/calcular`, aPayload(f));
        setVista(r.data);
        setErrorVista("");
      } catch (e) {
        setVista(null);
        setErrorVista(mensajeError(e));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [f, formAbierto, id]);

  const abrirForm = async (evaluacion = null) => {
    setEditando(evaluacion);
    setF(evaluacion ? aFormulario(evaluacion) : formVacio());
    setError("");
    setVista(null);
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

  const ejecutar = async (fn, ok) => {
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      const r = await fn();
      if (ok) setAviso(typeof ok === "function" ? ok(r) : ok);
      await cargar();
      onCambio && onCambio();
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardar = async () => {
    const payload = aPayload(f);
    const ok = await ejecutar(
      () => (editando ? api.put(`/evaluaciones/${editando.id}`, payload) : api.post(`/siniestros/${id}/evaluaciones`, payload)),
      "Dictamen guardado como borrador."
    );
    if (ok) setFormAbierto(false);
  };

  const enviar = () => {
    if (!window.confirm("¿Enviar el dictamen? Después ya no se podrá editar.")) return;
    ejecutar(
      () => api.post(`/evaluaciones/${actual.id}/enviar`),
      (r) => (r.data.estatus === "aprobada" ? "Dictamen autorizado automáticamente." : "Dictamen enviado a autorización.")
    );
  };

  const confirmarResolucion = async () => {
    const ok = await ejecutar(
      () => api.post(`/evaluaciones/${actual.id}/resolver`, { accion: resolver, motivo }),
      resolver === "aprobar" ? "Dictamen aprobado." : "Dictamen devuelto al ajustador."
    );
    if (ok) {
      setResolver(null);
      setMotivo("");
    }
  };

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  if (!lista) return <div className="sd-card sd-vacio">{error || "Cargando…"}</div>;

  const puedeResolver =
    actual?.estatus === "en_revision" &&
    puedeAutorizarNivel(actual.nivel_autorizacion) &&
    !(miEmpleado && Number(miEmpleado) === Number(actual.id_empleado));

  return (
    <>
      {error && !formAbierto && <div className="sd-alerta error">{error}</div>}
      {aviso && <div className="sd-alerta info">{aviso}</div>}

      {detalle.estatus_valor === "documentacion_pendiente" && lista.length === 0 && (
        <div className="sd-alerta aviso">No se puede dictaminar mientras falten documentos obligatorios. Revisa la pestaña Documentos.</div>
      )}

      {!actual ? (
        <div className="sd-card">
          <div className="sd-vacio">Este siniestro todavía no tiene dictamen.</div>
          {puedeCrear && (
            <div style={{ textAlign: "center" }}>
              <button className="sd-btn primario" onClick={() => abrirForm()}>
                + Nuevo dictamen
              </button>
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
                  <button className="sd-btn primario" disabled={ocupado} onClick={enviar}>
                    Enviar a autorización
                  </button>
                </>
              )}
              {puedeResolver && (
                <>
                  <button className="sd-btn primario" disabled={ocupado} onClick={() => setResolver("aprobar")}>
                    Aprobar
                  </button>
                  <button className="sd-btn peligro" disabled={ocupado} onClick={() => setResolver("devolver")}>
                    Devolver
                  </button>
                </>
              )}
              {puedeCrear && actual.estatus !== "borrador" && (
                <button className="sd-btn" onClick={() => abrirForm()}>
                  + Nuevo dictamen
                </button>
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
        ancho={760}
        onClose={() => setFormAbierto(false)}
        pie={
          <PieAcciones
            onCancelar={() => setFormAbierto(false)}
            onConfirmar={guardar}
            ocupado={ocupado}
            deshabilitado={!formularioValido(f)}
            textoConfirmar="Guardar borrador"
          />
        }
      >
        {error && <div className="sd-alerta error">{error}</div>}
        <div className="sd-form-grid">
          <div>
            <label>Fecha de inspección</label>
            <input type="date" name="fecha_inspeccion" value={f.fecha_inspeccion} onChange={cambiar} />
          </div>
          <div>
            <label>Recomendación</label>
            <select name="recomendacion" value={f.recomendacion} onChange={cambiar}>
              {RECOMENDACIONES.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div className="completo">
            <label>Dictamen (mín. 10 caracteres)</label>
            <textarea rows={2} name="dictamen" value={f.dictamen} onChange={cambiar} maxLength={255} />
          </div>
          <div className="completo">
            <label>Causas del siniestro</label>
            <textarea rows={2} name="causas" value={f.causas} onChange={cambiar} maxLength={255} />
          </div>
          <div className="completo">
            <label>Responsable del daño (opcional)</label>
            <input name="responsable" value={f.responsable} onChange={cambiar} maxLength={255} />
          </div>

          {f.recomendacion === "reparar" && (
            <div>
              <label>Costo de reparación</label>
              <input type="number" min="0" step="0.01" name="costo_reparacion" value={f.costo_reparacion} onChange={cambiar} />
            </div>
          )}
          {["reemplazar", "indemnizar"].includes(f.recomendacion) && (
            <>
              <div>
                <label>Costo de reemplazo / valor del bien</label>
                <input type="number" min="0" step="0.01" name="costo_remplazo" value={f.costo_remplazo} onChange={cambiar} />
              </div>
              <div>
                <label>Valor residual (lo que queda del bien)</label>
                <input type="number" min="0" step="0.01" name="valor_residual" value={f.valor_residual} onChange={cambiar} />
              </div>
            </>
          )}
          {f.recomendacion !== "rechazar" && coberturas.length > 1 && (
            <div className="completo">
              <label>Cobertura a aplicar</label>
              <select name="id_cobertura" value={f.id_cobertura} onChange={cambiar}>
                <option value="">Automática (la más favorable al asegurado)</option>
                {coberturas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 14 }}>Monto calculado por el sistema</h3>
          {errorVista && <div className="sd-alerta error">{errorVista}</div>}
          {vista ? (
            <DesgloseCalculo calculo={vista.calculo} nivel={vista.nivel} />
          ) : (
            !errorVista && <div className="sd-gris">Completa los datos para ver el cálculo.</div>
          )}
        </div>
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
        {error && <div className="sd-alerta error">{error}</div>}
        {actual && <DesgloseCalculo calculo={actual.calculo} nivel={actual.nivel_autorizacion} />}
        <div className="sd-form-grid" style={{ marginTop: 12 }}>
          <div className="completo">
            <label>{resolver === "devolver" ? "Por qué se devuelve (mínimo 10 caracteres)" : "Comentario (opcional)"}</label>
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
          </div>
        </div>
      </Modal>
    </>
  );
}
