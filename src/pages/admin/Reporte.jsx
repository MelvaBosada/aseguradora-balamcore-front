import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Clientes.css";

// Iconos
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
  import DescriptionIcon from '@mui/icons-material/Description';

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import DescargarModal from "../../components/DescargarModal";
import Modal, { PieAcciones } from "../../components/siniestro/Modal";
import { EstatusReporte } from "../../components/siniestro/Badges";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_URL = `${API_BASE}/reportes`;
const EXPORT_BASE = import.meta.env.VITE_API_URL || "/api";

const campos = ["poliza", "cliente", "siniestro", "estatus_vista"];
const columnas = ["N° Poliza", "Cliente", "N° Siniestro", "Estatus", "Acciones"];

const BUSQUEDA_MIN = 2;
const BUSQUEDA_DEBOUNCE_MS = 500;
const AVISO_EXITO_MS = 3500;

const FORM_CAMPOS = [
  // ── Póliza ──
  {
    seccion: "Póliza",
    label: "Buscar póliza por número, RFC o nombre del asegurado",
    name: "busqueda_poliza",
    type: "text",
    required: true,
    fullWidth: true,
  },

  // ── Quién reporta ──
  {
    seccion: "Quién reporta",
    label: "Reportado por",
    name: "reportado_por",
    type: "select",
    required: true,
    options: [
      { value: "cliente", label: "Cliente" },
      { value: "tercero", label: "Tercero" },
      { value: "empleado", label: "Empleado" },
      { value: "anonimo", label: "Anónimo" },
    ],
  },
  {
    seccion: "Quién reporta",
    label: "Canal de Reporte",
    name: "canal_reporte",
    type: "select",
    required: true,
    options: [
      { value: "telefono", label: "Teléfono" },
      { value: "email", label: "Email" },
      { value: "presencial", label: "Presencial" },
      { value: "app", label: "App" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
  },
  { seccion: "Quién reporta", label: "Nombre del Reportante", name: "nombre_reportante", type: "text" },
  { seccion: "Quién reporta", label: "Teléfono", name: "telefono_reportante", type: "text" },

  // ── El hecho ──
  { seccion: "El hecho", label: "Fecha del Reporte", name: "fecha_reporte", type: "datetime-local" },
  { seccion: "El hecho", label: "Fecha de Ocurrencia", name: "fecha_ocurrencia", type: "datetime-local", required: true },
  {
    seccion: "El hecho",
    label: "Ubicación del Accidente",
    name: "ubicacion_accidente",
    type: "text",
    required: true,
    fullWidth: true,
  },

  // ── Detalles ──
  {
    seccion: "Detalles",
    label: "Descripción",
    name: "descripcion",
    type: "textarea",
    rows: 3,
    required: true,
    fullWidth: true,
  },
  {
    seccion: "Detalles",
    label: "Observaciones",
    name: "observaciones",
    type: "textarea",
    rows: 2,
    fullWidth: true,
  },
];

// Lo único que el servidor acepta de un reporte. El estado NO se edita: cambia con Validar / Descartar.
// (busqueda_poliza es solo de la interfaz y NO se envía)
const CAMPOS_ENVIADOS = [
  "id_poliza", "reportado_por", "nombre_reportante", "telefono_reportante", "fecha_reporte",
  "fecha_ocurrencia", "canal_reporte", "ubicacion_accidente", "descripcion", "observaciones",
];

const getFormVacio = () => ({
  busqueda_poliza: "",
  id_poliza: "",
  reportado_por: "cliente",
  nombre_reportante: "",
  telefono_reportante: "",
  fecha_reporte: new Date().toISOString().slice(0, 16),
  fecha_ocurrencia: "",
  canal_reporte: "telefono",
  ubicacion_accidente: "",
  descripcion: "",
  observaciones: "",
});

const aFechaInput = (v) => (v ? String(v).substring(0, 16).replace(" ", "T") : "");

const etiquetaPoliza = (p) =>
  `${p.numero_poliza}${p.cliente ? ` · ${p.cliente}` : ""}${p.rfc ? ` (${p.rfc})` : ""}${
    p.estatus ? ` — ${p.estatus}` : ""
  }`;

const SIN_CONEXION = "No hay conexión con el servidor.";

const Reportes = () => {
  const navigate = useNavigate();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [descartando, setDescartando] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }
  const [erroresForm, setErroresForm] = useState({});
  const [ocupado, setOcupado] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(getFormVacio());
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Búsqueda de póliza (sugerencias en vivo)
  const [polizasOptions, setPolizasOptions] = useState([]);
  const timerPolizaRef = useRef(null);
  const peticionPolizaRef = useRef(0); // evita que una respuesta vieja pise a una nueva

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  // Limpia el temporizador al desmontar
  useEffect(() => () => clearTimeout(timerPolizaRef.current), []);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const leerError = async (response, defecto) => {
    const data = await response.json().catch(() => ({}));
    const detalle = data.errors ? Object.values(data.errors).flat().join("\n") : null;
    return { data, mensaje: detalle || data.message || defecto };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, { headers: getHeaders() });

      if (response.ok) {
        const data = await response.json();

        setReportes(
          data.map((r) => ({
            ...r,
            poliza: r.poliza_numero || `POL-${String(r.id_poliza).padStart(4, "0")}`,
            cliente: r.nombre_reportante || "Sin nombre",
            siniestro: r.numero_siniestro || "PENDIENTE",
            estatus: (r.estado || "nuevo").toUpperCase(),
            estatus_vista: <EstatusReporte valor={r.estado || "nuevo"} />,
          }))
        );
      } else {
        const { mensaje } = await leerError(response, "No se pudieron cargar los reportes.");
        mostrarAviso("error", "No se pudieron cargar los reportes", mensaje);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      mostrarAviso("error", "No se pudieron cargar los reportes", SIN_CONEXION);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, mostrarAviso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Búsqueda de póliza (número, RFC o nombre) ─────────────────────────────
  const cancelarBusquedaPoliza = () => {
    clearTimeout(timerPolizaRef.current);
    peticionPolizaRef.current++; // invalida peticiones en vuelo
    setPolizasOptions([]);
  };

  const buscarPolizas = useCallback(async (termino) => {
    const id = ++peticionPolizaRef.current;
    try {
      const response = await fetch(`${API_URL}/buscar-poliza?q=${encodeURIComponent(termino)}`, {
        headers: getHeaders(),
      });
      if (!response.ok || id !== peticionPolizaRef.current) return;

      const data = await response.json();
      setPolizasOptions(data.map((p) => ({ value: String(p.id), label: etiquetaPoliza(p) })));
    } catch (error) {
      console.error("Error buscando pólizas:", error);
    }
  }, [getHeaders]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "busqueda_poliza") {
      // Si el usuario vuelve a escribir, la póliza elegida deja de ser válida
      setFormData((prev) => ({ ...prev, busqueda_poliza: value, id_poliza: "" }));
      setErroresForm((prev) => ({ ...prev, busqueda_poliza: undefined, id_poliza: undefined }));

      clearTimeout(timerPolizaRef.current);
      const termino = value.trim();

      if (termino.length < BUSQUEDA_MIN) {
        cancelarBusquedaPoliza();
        return;
      }
      timerPolizaRef.current = setTimeout(() => buscarPolizas(termino), BUSQUEDA_DEBOUNCE_MS);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErroresForm((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const seleccionarPoliza = (op) => {
    cancelarBusquedaPoliza();
    setFormData((prev) => ({ ...prev, id_poliza: op.value, busqueda_poliza: op.label }));
    setErroresForm((prev) => ({ ...prev, busqueda_poliza: undefined, id_poliza: undefined }));
  };

  const handleNuevoReporte = () => {
    setEditingItem(null);
    setErroresForm({});
    setFormData(getFormVacio());
    cancelarBusquedaPoliza();
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingItem(item);
    setErroresForm({});
    setFormData({
      ...getFormVacio(),
      ...Object.fromEntries(CAMPOS_ENVIADOS.map((k) => [k, item[k] ?? ""])),
      id_poliza: item.id_poliza != null ? String(item.id_poliza) : "",
      busqueda_poliza: item.poliza_numero || item.poliza || "",
      fecha_reporte: aFechaInput(item.fecha_reporte),
      fecha_ocurrencia: aFechaInput(item.fecha_ocurrencia),
    });
    cancelarBusquedaPoliza();
    setShowModal(true);
  };

  const cerrarFormulario = () => {
    cancelarBusquedaPoliza();
    setShowModal(false);
  };

  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // La póliza tiene que haberse elegido de la lista, no solo escrita
    if (!formData.id_poliza) {
      setErroresForm((prev) => ({
        ...prev,
        busqueda_poliza: "Busca y elige una póliza de la lista.",
      }));
      return;
    }

    const isEdit = !!editingItem;
    const url = isEdit ? `${API_URL}/${editingItem.id}` : API_URL;
    const cuerpo = Object.fromEntries(CAMPOS_ENVIADOS.map((k) => [k, formData[k] === "" ? null : formData[k]]));

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(cuerpo),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const volvioANuevo = isEdit && editingItem.estado === "validado" && data.estado === "nuevo";

        cerrarFormulario();
        fetchData();

        mostrarAviso(
          "exito",
          isEdit ? "Reporte actualizado" : "Reporte creado",
          volvioANuevo
            ? "Cambiaste la póliza o la fecha del hecho, por lo que el reporte volvió a estado \"nuevo\" y hay que validarlo otra vez."
            : data.message || (isEdit ? "Los cambios se guardaron correctamente." : "El reporte se guardó correctamente.")
        );
        return;
      }

      const { data, mensaje } = await leerError(response, "No se pudo guardar el reporte.");
      if (data.errors) {
        setErroresForm(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, v[0]])));
      } else {
        mostrarAviso("error", "No se pudo guardar", mensaje);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      mostrarAviso("error", "No se pudo guardar", SIN_CONEXION);
    }
  };

  const handleValidar = async (item) => {
    try {
      const response = await fetch(`${API_URL}/${item.id}/validar`, { method: "POST", headers: getHeaders() });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        mostrarAviso("exito", "Reporte validado", data.message || "El reporte se validó correctamente.");
      } else {
        const { mensaje } = await leerError(response, "No se pudo validar el reporte.");
        mostrarAviso("error", "El reporte no se puede validar", mensaje);
      }
      fetchData();
    } catch (error) {
      console.error("Error al validar:", error);
      mostrarAviso("error", "No se pudo validar", SIN_CONEXION);
    }
  };

  const confirmarDescarte = async () => {
    setOcupado(true);
    try {
      const response = await fetch(`${API_URL}/${descartando.id}/descartar`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ motivo }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setDescartando(null);
        setMotivo("");
        mostrarAviso("exito", "Reporte descartado", data.message || "El reporte se descartó y el motivo quedó en las observaciones.");
        fetchData();
      } else {
        const { mensaje } = await leerError(response, "No se pudo descartar el reporte.");
        mostrarAviso("error", "No se pudo descartar", mensaje);
      }
    } catch (error) {
      console.error("Error al descartar:", error);
      mostrarAviso("error", "No se pudo descartar", SIN_CONEXION);
    } finally {
      setOcupado(false);
    }
  };

  const handleEliminarClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // DELETE /reportes/{id} -> lo manda a la papelera
  const handleConfirmarEliminar = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`${API_URL}/${itemToDelete.id}`, { method: "DELETE", headers: getHeaders() });
      setShowDeleteModal(false);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        mostrarAviso("exito", "Enviado a la papelera", data.message || "El reporte se envió a la papelera.");
      } else {
        // 422 / 409: por estado o por reglas de la papelera
        const { mensaje } = await leerError(response, "No se pudo eliminar el reporte.");
        mostrarAviso("error", "No se pudo eliminar", mensaje);
      }
      fetchData();
    } catch (error) {
      console.error("Error al eliminar:", error);
      mostrarAviso("error", "No se pudo eliminar", SIN_CONEXION);
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredReportes = reportes.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.poliza.toLowerCase().includes(q) ||
      r.cliente.toLowerCase().includes(q) ||
      r.siniestro.toLowerCase().includes(q) ||
      r.estatus.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredReportes.length / itemsPerPage) || 1;
  const paginated = filteredReportes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && reportes.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const ocultarEstados = (...permitidos) => (fila) => !permitidos.includes(fila.estado);

  // El error de id_poliza (del servidor) se muestra bajo el buscador
  const erroresModal = {
    ...erroresForm,
    busqueda_poliza: erroresForm.busqueda_poliza || erroresForm.id_poliza,
  };

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Reportes</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton text="Descargar" icon={<DownloadIcon />} onClick={() => setShowDescarga(true)} />
          <PrimaryButton text="Nuevo reporte" icon={<AddCircleOutlinedIcon />} onClick={handleNuevoReporte} />
        </div>
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            
            {
              titulo: "Agregar Siniestro",
              clase: "tabla-btn-crear",
              icono: <AddCircleIcon fontSize="small" />,
              oculto: ocultarEstados("validado"),
              onClick: (item) => navigate("/admin/siniestros", { state: { reporteId: item.id, id_poliza: item.id_poliza } }),
            },
            {
              titulo: "Ver siniestro",
              clase: "tabla-btn-ver",
              icono: <DescriptionIcon fontSize="small" />,
              oculto: (fila) => !fila.id_siniestro,
              onClick: (item) => navigate(`/admin/siniestros/${item.id_siniestro}`),
            },
            
            {
                titulo: "Validar",
                clase: "tabla-btn-aprobar",
                icono: <CheckCircleIcon fontSize="small" />,
                oculto: ocultarEstados("nuevo"),
                onClick: handleValidar,
            },
            
            {
              titulo: "Descartar",
              clase: "tabla-btn-rechazar",
              icono: <CancelIcon fontSize="small" />,
              oculto: ocultarEstados("nuevo", "validado"),
              onClick: (item) => {
                setMotivo("");
                setDescartando(item);
              },
            },

            {
              titulo: "Ver detalles",
              clase: "tabla-btn-reasignar",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: (item) => {
                setItemDetalle(item);
                setShowDetalleModal(true);
              },
            },

            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              oculto: ocultarEstados("nuevo", "validado"),
              onClick: handleEditar,
            },

            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              oculto: ocultarEstados("nuevo", "descartado"),
              onClick: handleEliminarClick,
            },
          ]}
        />
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <EditModal
        open={showModal}
        onClose={cerrarFormulario}
        onSave={handleGuardar}
        titulo={editingItem ? "Editar reporte" : "Agregar nuevo reporte"}
        subtitulo="Busca la póliza por el número de la carátula, RFC o nombre. Si cambias la póliza o la fecha del hecho, el reporte vuelve a validarse."
        btnTexto={editingItem ? "Guardar cambios" : "Agregar reporte"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
        errores={erroresModal}
        dropdowns={{
          busqueda_poliza: { options: polizasOptions, onSelect: seleccionarPoliza },
        }}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="Enviar a la papelera"
        subtitle="El reporte se podrá restaurar desde la Papelera."
      >
        {itemToDelete && (
          <div>
            <p><strong>{itemToDelete.poliza}</strong></p>
            <p>Cliente: {itemToDelete.cliente}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={itemDetalle ? `Reporte ${itemDetalle.siniestro}` : ""}
        subtitulo={itemDetalle ? `Folio #${itemDetalle.id}` : ""}
        avatar={itemDetalle ? (itemDetalle.cliente || "R").charAt(0).toUpperCase() : "R"}
        items={
          itemDetalle
            ? Object.entries(itemDetalle)
                .filter(([key, value]) => {
                  const k = key.toLowerCase();
                  return (
                    !k.startsWith("id") &&
                    !k.includes("_id") &&
                    typeof value !== "object" &&
                    !["poliza", "cliente", "siniestro", "estatus", "estatus_vista"].includes(k)
                  );
                })
                .map(([key, value]) => ({
                  label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  value: value || "N/A",
                }))
            : []
        }
      />

      <Modal
        open={!!descartando}
        titulo="Descartar reporte"
        subtitulo={descartando ? `${descartando.poliza} · ${descartando.cliente}` : ""}
        onClose={() => setDescartando(null)}
        pie={<PieAcciones onCancelar={() => setDescartando(null)} onConfirmar={confirmarDescarte} ocupado={ocupado} peligro textoConfirmar="Descartar" />}
      >
        <div className="sd-form-grid">
          <div className="completo">
            <label>Motivo (mínimo 5 caracteres; queda en las observaciones)</label>
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />
          </div>
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

      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${EXPORT_BASE}/exportar/reportes`}
        params={{ search: searchTerm }}
        nombreArchivo="reportes"
        titulo="Descargar listado de reportes"
        nota={
          searchTerm
            ? `Se exportarán los reportes con los filtros actuales (búsqueda: "${searchTerm}").`
            : "Se exportarán todos los reportes."
        }
      />
    </div>
  );
};

export default Reportes;