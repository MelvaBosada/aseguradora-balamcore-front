import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/SiniestroDetalle.css";
import Modal, { PieAcciones } from "./Modal";
import { EstatusEvidencia } from "./Badges";
import { api, descargarArchivo, fmtFecha, mensajeError } from "../../services/siniestroApi";

const MAX_MB = 2;
const CERRADOS = ["cerrado", "cancelado"];

export default function TabEvidencias({ detalle }) {
  const navigate = useNavigate();
  const id = detalle.id;
  const cerrado = CERRADOS.includes(detalle.estatus_valor);

  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ tipo: "foto", descripcion: "", archivo: null });
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get(`/siniestros/${id}/evidencias`);
      setLista(r.data);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegir = (e) => {
    const archivo = e.target.files?.[0] || null;
    if (archivo && archivo.size > MAX_MB * 1024 * 1024) {
      e.target.value = "";
      setError(`"${archivo.name}" pesa más de ${MAX_MB} MB.`);
      return;
    }
    setError("");
    setF({ ...f, archivo });
  };

  const subir = async () => {
    if (!f.archivo) {
      setError("Selecciona un archivo.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("id_siniestro", id);
      fd.append("tipo", f.tipo);
      if (f.descripcion) fd.append("descripcion", f.descripcion);
      fd.append("archivo", f.archivo);
      await api.post("/evidencias", fd);
      setAbierto(false);
      setF({ tipo: "foto", descripcion: "", archivo: null });
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      {error && !abierto && <div className="sd-alerta error">{error}</div>}

      <div className="sd-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Evidencias (fotos, videos y audios del hecho)</h3>
          <div className="sd-acciones">
            <button
              className="sd-btn"
              onClick={() => navigate("/admin/evidencias", { state: { siniestroId: id, numeroSiniestro: detalle.numero_siniestro } })}
            >
              Abrir en Evidencias
            </button>
            {!cerrado && (
              <button className="sd-btn primario" onClick={() => setAbierto(true)}>
                + Subir evidencia
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sd-card" style={{ overflowX: "auto" }}>
        {!lista ? (
          <div className="sd-vacio">Cargando…</div>
        ) : lista.length === 0 ? (
          <div className="sd-vacio">Este siniestro todavía no tiene evidencias.</div>
        ) : (
          <table className="sd-tabla">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Tipo</th>
                <th>Estatus</th>
                <th>Subida</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.nombre_archivo}
                    {e.descripcion && <div className="sd-gris">{e.descripcion}</div>}
                    {e.motivo_rechazo && <div className="sd-rojo" style={{ fontSize: 12 }}>Rechazada: {e.motivo_rechazo}</div>}
                  </td>
                  <td>{e.tipo}</td>
                  <td>
                    <EstatusEvidencia valor={e.estatus_validacion} />
                  </td>
                  <td>{fmtFecha(e.fecha_subida)}</td>
                  <td className="der">
                    <button className="sd-btn mini" onClick={() => descargarArchivo(`/evidencias/${e.id}/descargar`, e.nombre_archivo).catch((er) => setError(mensajeError(er)))}>
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={abierto}
        titulo="Subir evidencia"
        subtitulo={detalle.numero_siniestro}
        onClose={() => setAbierto(false)}
        pie={<PieAcciones onCancelar={() => setAbierto(false)} onConfirmar={subir} ocupado={ocupado} textoConfirmar="Subir" />}
      >
        {error && <div className="sd-alerta error">{error}</div>}
        <div className="sd-form-grid">
          <div>
            <label>Tipo</label>
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              <option value="foto">Foto</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="documento">Documento</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label>Archivo (máx. {MAX_MB} MB)</label>
            <input type="file" onChange={elegir} />
          </div>
          <div className="completo">
            <label>Descripción (opcional)</label>
            <input value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} maxLength={255} />
          </div>
        </div>
      </Modal>
    </>
  );
}
