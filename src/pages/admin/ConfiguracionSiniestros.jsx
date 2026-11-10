import { useCallback, useEffect, useState } from "react";
import "../../css/Clientes.css";
import "../../css/SiniestroDetalle.css";
import TablaForm from "../../components/TablaForm";
import PrimaryButton from "../../components/PrimaryButton";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Modal, { PieAcciones } from "../../components/siniestro/Modal";
import { Badge } from "../../components/siniestro/Badges";
import { api, mensajeError } from "../../services/siniestroApi";
import { tienePermiso } from "../../utils/permisos";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const AVISO_EXITO_MS = 3500;

const TIPOS = [
  ["todos", "Todos los tipos"], ["robo", "Robo"], ["accidente", "Accidente"], ["incendio", "Incendio"],
  ["inundacion", "Inundación"], ["responsabilidad_civil", "Responsabilidad civil"],
  ["fallecimiento", "Fallecimiento"], ["invalidez", "Invalidez"], ["otro", "Otro"],
];
const nombreTipo = (v) => TIPOS.find(([k]) => k === v)?.[1] || v;

const COLUMNAS = ["Tipo de siniestro", "Documento", "Obligatorio", "Plazo", "Activo", "Acciones"];
const CAMPOS = ["tipo_txt", "nombre", "obligatorio_vista", "plazo", "activo_vista"];

const DOC_VACIO = { tipo_siniestro: "todos", nombre: "", descripcion: "", obligatorio: true, dias_limite: "", activo: true, orden: 0 };

const PARAMETROS = [
  ["dias_aviso_siniestro", "Plazo para avisar el siniestro (días)", 1, 365],
  ["dias_limite_documentos", "Plazo para entregar documentos (días)", 1, 90],
  ["dias_recordatorio", "Recordar al cliente cada (días)", 1, 30],
  ["max_recordatorios", "Máximo de recordatorios", 0, 10],
];

export default function ConfiguracionSiniestros() {
  const puedeEditar = tienePermiso("siniestros.configurar");

  const [config, setConfig] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }
  const [ocupado, setOcupado] = useState(false);
  const [doc, setDoc] = useState(null); // documento en edición o nuevo
  const [docToDelete, setDocToDelete] = useState(null);

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
      const [c, k] = await Promise.all([api.get("/configuracion/siniestros"), api.get("/catalogo-documentos")]);
      setConfig(c.data);
      setCatalogo(k.data);
      setErrorCarga("");
    } catch (e) {
      setErrorCarga(mensajeError(e));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarConfig = async () => {
    if (ocupado) return; // evita doble clic mientras se guarda

    if (Number(config.monto_auto_hasta) > Number(config.monto_supervisor_hasta)) {
      mostrarAviso("error", "No se pudo guardar", "El límite automático no puede ser mayor al del supervisor.");
      return;
    }

    setOcupado(true);
    try {
      const r = await api.put("/configuracion/siniestros", config);
      setConfig(r.data);
      mostrarAviso("exito", "Configuración guardada", "Los cambios se guardaron correctamente.");
    } catch (e) {
      mostrarAviso("error", "No se pudo guardar", mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const guardarDoc = async () => {
    if (ocupado) return;
    setOcupado(true);
    const esEdicion = !!doc.id;
    try {
      const cuerpo = { ...doc, dias_limite: doc.dias_limite ? Number(doc.dias_limite) : null, orden: Number(doc.orden) || 0 };
      if (esEdicion) await api.put(`/catalogo-documentos/${doc.id}`, cuerpo);
      else await api.post("/catalogo-documentos", cuerpo);
      setDoc(null);
      await cargar();
      mostrarAviso(
        "exito",
        esEdicion ? "Documento actualizado" : "Documento creado",
        esEdicion ? "Los cambios se guardaron correctamente." : "El documento se agregó al catálogo."
      );
    } catch (e) {
      mostrarAviso("error", "No se pudo guardar el documento", mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!docToDelete) return;
    try {
      await api.delete(`/catalogo-documentos/${docToDelete.id}`);
      setDocToDelete(null);
      await cargar();
      mostrarAviso("exito", "Documento quitado", "El documento se quitó del catálogo.");
    } catch (e) {
      setDocToDelete(null);
      mostrarAviso("error", "No se pudo quitar el documento", mensajeError(e));
    }
  };

  if (!config) {
    return (
      <div className="container py-4 text-center">
        {errorCarga || <div className="spinner-border text-success" />}
      </div>
    );
  }

  const filas = catalogo
    .filter((d) => !filtro || d.tipo_siniestro === filtro)
    .map((d) => ({
      ...d,
      tipo_txt: nombreTipo(d.tipo_siniestro),
      obligatorio_vista: <Badge texto={d.obligatorio ? "Obligatorio" : "Opcional"} color={d.obligatorio ? "verde" : "gris"} />,
      plazo: d.dias_limite ? `${d.dias_limite} días` : "Por defecto",
      activo_vista: <Badge texto={d.activo ? "Activo" : "Inactivo"} color={d.activo ? "verde" : "gris"} />,
    }));

  const acciones = puedeEditar
    ? [
        {
          titulo: "Editar",
          clase: "tabla-btn-edit",
          icono: <EditIcon fontSize="small" />,
          onClick: (d) => setDoc({ ...d, dias_limite: d.dias_limite || "" }),
        },
        {
          titulo: "Quitar",
          clase: "tabla-btn-del",
          icono: <DeleteIcon fontSize="small" />,
          onClick: (d) => setDocToDelete(d),
        },
      ]
    : [];

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Configuración de siniestros</h1>
      <hr className="mt-2 mb-3" />

      {errorCarga && <div className="sd-alerta error">{errorCarga}</div>}
      {!puedeEditar && <div className="sd-alerta info">Solo puedes consultar esta configuración. Para cambiarla se necesita el permiso "Configurar siniestros".</div>}

      <div className="sd-card">
        <h3>Plazos y autorización</h3>
        <div className="sd-form-grid">
          {PARAMETROS.map(([campo, etiqueta, min, max]) => (
            <div key={campo}>
              <label>{etiqueta}</label>
              <input
                type="number"
                min={min}
                max={max}
                disabled={!puedeEditar}
                value={config[campo]}
                onChange={(e) => setConfig({ ...config, [campo]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label>Se autoriza solo hasta (MXN)</label>
            <input type="number" min="0" step="0.01" disabled={!puedeEditar} value={config.monto_auto_hasta} onChange={(e) => setConfig({ ...config, monto_auto_hasta: e.target.value })} />
          </div>
          <div>
            <label>Autoriza un supervisor hasta (MXN)</label>
            <input type="number" min="0" step="0.01" disabled={!puedeEditar} value={config.monto_supervisor_hasta} onChange={(e) => setConfig({ ...config, monto_supervisor_hasta: e.target.value })} />
          </div>
          <div className="completo sd-check">
            <input type="checkbox" disabled={!puedeEditar} checked={!!config.doble_control_pago} onChange={(e) => setConfig({ ...config, doble_control_pago: e.target.checked })} />
            <label style={{ margin: 0 }}>Doble control de pago: quien confirma los datos bancarios no puede registrar el pago</label>
          </div>
        </div>
        <div className="sd-gris" style={{ marginTop: 8 }}>
          Arriba del límite del supervisor, el dictamen lo autoriza gerencia. Un dictamen con alertas o sin cobertura nunca se autoriza solo.
        </div>
        {puedeEditar && (
          <div style={{ marginTop: 12 }}>
            <PrimaryButton
              text="Guardar configuración"
              icon={<SaveIcon />}
              disabled={ocupado}
              onClick={guardarConfig}
            />
          </div>
        )}
      </div>

      <div className="sd-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Documentos requeridos por tipo de siniestro</h3>
          <div className="sd-acciones">
            <select className="form-select" style={{ width: 220 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Ver todos</option>
              {TIPOS.map(([k, t]) => (
                <option key={k} value={k}>{t}</option>
              ))}
            </select>
            {puedeEditar && (
              <PrimaryButton
                text="Nuevo documento"
                icon={<AddCircleOutlinedIcon />}
                onClick={() => setDoc({ ...DOC_VACIO })}
              />
            )}
          </div>
        </div>
        <TablaForm columna={COLUMNAS} data={filas} campos={CAMPOS} acciones={acciones} />
        <div className="sd-gris">
          Al abrir un siniestro se copian los documentos activos de su tipo y los de "Todos los tipos". Los cambios aplican a los siniestros nuevos.
        </div>
      </div>

      <Modal
        open={!!doc}
        titulo={doc?.id ? "Editar documento" : "Nuevo documento"}
        onClose={() => setDoc(null)}
        pie={<PieAcciones onCancelar={() => setDoc(null)} onConfirmar={guardarDoc} ocupado={ocupado} />}
      >
        {doc && (
          <div className="sd-form-grid">
            <div>
              <label>Tipo de siniestro</label>
              <select value={doc.tipo_siniestro} onChange={(e) => setDoc({ ...doc, tipo_siniestro: e.target.value })}>
                {TIPOS.map(([k, t]) => (
                  <option key={k} value={k}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Plazo en días (vacío = el general)</label>
              <input type="number" min="1" max="90" value={doc.dias_limite} onChange={(e) => setDoc({ ...doc, dias_limite: e.target.value })} />
            </div>
            <div className="completo">
              <label>Nombre del documento</label>
              <input value={doc.nombre} maxLength={150} onChange={(e) => setDoc({ ...doc, nombre: e.target.value })} />
            </div>
            <div className="completo">
              <label>Descripción / qué debe contener</label>
              <input value={doc.descripcion || ""} maxLength={255} onChange={(e) => setDoc({ ...doc, descripcion: e.target.value })} />
            </div>
            <div className="sd-check">
              <input type="checkbox" checked={!!doc.obligatorio} onChange={(e) => setDoc({ ...doc, obligatorio: e.target.checked })} />
              <label style={{ margin: 0 }}>Obligatorio para evaluar</label>
            </div>
            <div className="sd-check">
              <input type="checkbox" checked={!!doc.activo} onChange={(e) => setDoc({ ...doc, activo: e.target.checked })} />
              <label style={{ margin: 0 }}>Activo</label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={confirmarEliminar}
        title="Quitar documento"
        subtitle="Los siniestros en trámite conservan su copia."
      >
        {docToDelete && (
          <div>
            <p><strong>{docToDelete.nombre}</strong></p>
            <p>Tipo: {nombreTipo(docToDelete.tipo_siniestro)}</p>
          </div>
        )}
      </ConfirmDeleteModal>

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
    </div>
  );
}
