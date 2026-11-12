import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import "../../css/SiniestroDetalle.css";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import Modal, { PieAcciones } from "./Modal";
import OutlineButton from "../OutlineButton";
import useAccionAsync from "../../hooks/useAccionAsync";
import { EstadoDocumento } from "./Badges";
import { api, descargarArchivo, fmtFecha, mensajeError } from "../../services/siniestroApi";

const MAX_MB = 5;
const CERRADOS = ["cerrado", "cancelado", "pagado"];

const COLOR_PELIGRO = "#C0392B";
const COLOR_APROBAR = "#2E9E5B";

export default function TabDocumentos({ detalle, onCambio }) {
  const id = detalle.id;
  const cerrado = CERRADOS.includes(detalle.estatus_valor);

  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [subiendoId, setSubiendoId] = useState(null); // documento que se está subiendo
  const [modal, setModal] = useState(null); // { tipo: "rechazar" | "exentar" | "nuevo", doc }
  const [motivo, setMotivo] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", obligatorio: true, dias_limite: "" });

  const inputRef = useRef(null);
  const docParaSubir = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}/documentos`);
      setDatos(r.data);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutarBase = async (fn, mensajeOk = "") => {
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await fn();
      if (mensajeOk) setAviso(mensajeOk);
      await cargar();
      onCambio && onCambio(); // el estatus del siniestro puede haber cambiado solo
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  // Si tarda más de 2 s sale el loader de letras de BalamCore
  const [ejecutar, ejecutando] = useAccionAsync(ejecutarBase);

  const pedirArchivo = (doc) => {
    docParaSubir.current = doc;
    inputRef.current?.click();
  };

  const alElegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    const doc = docParaSubir.current;
    if (!archivo || !doc) return;
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`"${archivo.name}" pesa más de ${MAX_MB} MB.`);
      return;
    }
    const fd = new FormData();
    fd.append("archivo", archivo);

    // El spinner se queda en el botón Subir/Reemplazar de ese documento
    setSubiendoId(doc.id);
    try {
      await ejecutar(() => api.post(`/siniestros/${id}/documentos/${doc.id}/archivo`, fd), "Archivo cargado. Queda por revisar.");
    } finally {
      setSubiendoId(null);
    }
  };

  const revisar = (doc, accion, texto) =>
    ejecutar(() => api.post(`/siniestros/${id}/documentos/${doc.id}/revisar`, { accion, motivo: texto }));

  const confirmarModal = async () => {
    let ok;
    if (modal.tipo === "nuevo") {
      ok = await ejecutar(
        () =>
          api.post(`/siniestros/${id}/documentos`, {
            ...nuevo,
            dias_limite: nuevo.dias_limite ? Number(nuevo.dias_limite) : null,
          }),
        "Documento agregado al checklist."
      );
    } else {
      ok = await revisar(modal.doc, modal.tipo === "rechazar" ? "rechazar" : "exentar", motivo);
    }
    if (ok) {
      setModal(null);
      setMotivo("");
      setNuevo({ nombre: "", descripcion: "", obligatorio: true, dias_limite: "" });
    }
  };

  if (!datos) {
    return <div className="sd-card sd-vacio">{error || "Cargando documentos…"}</div>;
  }

  const { documentos, resumen } = datos;
  const porcentaje = resumen.obligatorios ? Math.round((resumen.resueltos / resumen.obligatorios) * 100) : 100;
  const bloqueado = ocupado || ejecutando;

  return (
    <>
      <input ref={inputRef} type="file" hidden onChange={alElegirArchivo} accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx" />

      {error && <div className="sd-alerta error">{error}</div>}
      {aviso && <div className="sd-alerta info">{aviso}</div>}

      <div className="sd-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <h3 style={{ marginBottom: 2 }}>Documentos requeridos</h3>
            <div className="sd-gris">
              {resumen.resueltos} de {resumen.obligatorios} obligatorios resueltos
              {resumen.por_revisar > 0 && ` · ${resumen.por_revisar} por revisar`}
              {resumen.vencidos > 0 && <span className="sd-rojo"> · {resumen.vencidos} vencido(s)</span>}
            </div>
            <div className="sd-progreso">
              <div style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
          {!cerrado && (
            <div className="sd-acciones">
              {resumen.total === 0 && (
                <OutlineButton
                  text="Generar checklist"
                  disabled={bloqueado}
                  compact
                  onClick={() => ejecutar(() => api.post(`/siniestros/${id}/documentos/generar`), "Checklist generado.")}
                />
              )}
              {detalle.estatus_valor === "documentacion_pendiente" && (
                <OutlineButton
                  text="Recordar al cliente"
                  disabled={bloqueado}
                  compact
                  onClick={() => ejecutar(() => api.post(`/siniestros/${id}/documentos/notificar`), "Se enviará un correo al cliente.")}
                />
              )}
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => setModal({ tipo: "nuevo" })}
                sx={{
                  backgroundColor: "#295E4E",
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "999px",
                  border: "1.5px solid transparent",
                  px: 2,
                  py: 0.4,
                  fontSize: "0.85rem",
                  boxShadow: "none",
                  "& .MuiSvgIcon-root": { fontSize: 18 },
                  "&:hover": { backgroundColor: "#357564", boxShadow: "none" },
                }}
              >
                Pedir documento
              </Button>
            </div>
          )}
        </div>

        {resumen.completo && resumen.obligatorios > 0 && (
          <div className="sd-alerta info" style={{ marginTop: 10, marginBottom: 0 }}>
            Documentación obligatoria completa: el siniestro puede evaluarse.
          </div>
        )}
      </div>

      <div className="sd-card" style={{ overflowX: "auto" }}>
        {documentos.length === 0 ? (
          <div className="sd-vacio">Este siniestro no tiene documentos requeridos.</div>
        ) : (
          <table className="sd-tabla">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Estado</th>
                <th>Fecha límite</th>
                <th>Archivo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.nombre}</strong> {!d.obligatorio && <span className="sd-gris">(opcional)</span>}
                    {d.descripcion && <div className="sd-gris">{d.descripcion}</div>}
                    {d.motivo_rechazo && (
                      <div className={d.estado === "rechazado" ? "sd-rojo" : "sd-gris"} style={{ fontSize: 12 }}>
                        {d.estado === "exento" ? "Exento: " : "Rechazado: "}
                        {d.motivo_rechazo}
                      </div>
                    )}
                  </td>
                  <td>
                    <EstadoDocumento valor={d.estado} />
                  </td>
                  <td className={d.vencido ? "sd-rojo" : ""}>
                    {fmtFecha(d.fecha_limite)}
                    {d.vencido && " (vencido)"}
                  </td>
                  <td>{d.tiene_archivo ? d.nombre_archivo : "—"}</td>
                  <td>
                    <div className="acciones">
                      {d.tiene_archivo && (
                        <OutlineButton
                          text="Descargar"
                          compact
                          square
                          onClick={() =>
                            descargarArchivo(`/siniestros/${id}/documentos/${d.id}/descargar`, d.nombre_archivo).catch((e) =>
                              setError(mensajeError(e))
                            )
                          }
                        />
                      )}
                      {!cerrado && (
                        <>
                          {["pendiente", "rechazado", "recibido"].includes(d.estado) && (
                            <OutlineButton
                              text={d.tiene_archivo ? "Reemplazar" : "Subir"}
                              compact
                              square
                              loading={subiendoId === d.id}
                              disabled={bloqueado}
                              onClick={() => pedirArchivo(d)}
                            />
                          )}
                          {d.estado === "recibido" && (
                            <OutlineButton
                              text="Aprobar"
                              color={COLOR_APROBAR}
                              compact
                              square
                              disabled={bloqueado}
                              onClick={() => revisar(d, "aprobar")}
                            />
                          )}
                          {["recibido", "aprobado"].includes(d.estado) && (
                            <OutlineButton
                              text="Rechazar"
                              color={COLOR_PELIGRO}
                              compact
                              square
                              disabled={bloqueado}
                              onClick={() => setModal({ tipo: "rechazar", doc: d })}
                            />
                          )}
                          {["pendiente", "rechazado", "recibido"].includes(d.estado) && (
                            <OutlineButton
                              text="Exentar"
                              compact
                              square
                              disabled={bloqueado}
                              onClick={() => setModal({ tipo: "exentar", doc: d })}
                            />
                          )}
                          {d.manual && d.estado !== "aprobado" && (
                            <OutlineButton
                              text="Eliminar"
                              color={COLOR_PELIGRO}
                              compact
                              square
                              disabled={bloqueado}
                              onClick={() =>
                                window.confirm("¿Eliminar este documento?") &&
                                ejecutar(() => api.delete(`/siniestros/${id}/documentos/${d.id}`))
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={!!modal}
        titulo={modal?.tipo === "nuevo" ? "Pedir un documento" : modal?.tipo === "rechazar" ? "Rechazar documento" : "Exentar documento"}
        subtitulo={modal?.doc?.nombre}
        onClose={() => setModal(null)}
        pie={
          <PieAcciones
            onCancelar={() => setModal(null)}
            onConfirmar={confirmarModal}
            ocupado={bloqueado}
            peligro={modal?.tipo === "rechazar"}
            textoConfirmar={modal?.tipo === "nuevo" ? "Agregar" : modal?.tipo === "rechazar" ? "Rechazar" : "Exentar"}
          />
        }
      >
        {modal?.tipo === "nuevo" ? (
          <div className="sd-form-grid">
            <div className="completo">
              <label>Nombre del documento</label>
              <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} maxLength={150} />
            </div>
            <div className="completo">
              <label>Descripción (opcional)</label>
              <input value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} maxLength={255} />
            </div>
            <div>
              <label>Plazo en días (vacío = el de la aseguradora)</label>
              <input type="number" min="1" max="90" value={nuevo.dias_limite} onChange={(e) => setNuevo({ ...nuevo, dias_limite: e.target.value })} />
            </div>
            <div className="sd-check">
              <input type="checkbox" checked={nuevo.obligatorio} onChange={(e) => setNuevo({ ...nuevo, obligatorio: e.target.checked })} />
              <label style={{ margin: 0 }}>Obligatorio para evaluar</label>
            </div>
          </div>
        ) : (
          <div className="sd-form-grid">
            <div className="completo">
              <label>
                {modal?.tipo === "rechazar" ? "Motivo del rechazo (se le informa al cliente)" : "Por qué se exenta"} — mínimo 10 caracteres
              </label>
              <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}