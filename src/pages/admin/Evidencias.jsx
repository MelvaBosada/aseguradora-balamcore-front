import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from 'axios';
import "../../css/Clientes.css";
import logo from "../../assets/Logo.png";
import ReporteEvidencias from "./ReporteEvidencias";
import DescargarModal from "../../components/DescargarModal";

// Iconos
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CategoryIcon from "@mui/icons-material/Category";
import InfoIcon from "@mui/icons-material/Info";
import GavelIcon from "@mui/icons-material/Gavel";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import MovieIcon from "@mui/icons-material/Movie";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/Person";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import HistoryIcon from "@mui/icons-material/History";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MAX_ARCHIVO_MB = 2;
const MAX_ARCHIVO_BYTES = MAX_ARCHIVO_MB * 1024 * 1024;
const MOTIVO_MIN = 10;
const MOTIVO_MAX = 500;
const SINIESTRO_CERRADO = ['cerrado', 'cancelado'];

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Estilos del icono de advertencia (por si el CSS no define .advertencia)
const ESTILO_ICONO_ADVERTENCIA = { background: "#FFF4D6", color: "#9A6B00" };

const campos = ["archivo_vista", "tipo", "siniestro", "estatus_validacion", "fecha_subida"];
const columnas = ["Archivo", "Tipo", "N° Siniestro", "Estatus", "Fecha", "Acciones"];

const FORM_CAMPOS_EVIDENCIA = [
  { label: "N° de Siniestro a buscar", name: "siniestro_buscar", type: "text", seccion: "Buscar Siniestro", fullWidth: true },
  { label: "Siniestro", name: "numero_siniestro", type: "text", seccion: "Siniestro Seleccionado", readOnly: true },
  { label: "Tipo de evidencia", name: "tipo", type: "select", options: ["foto", "video", "documento", "audio", "otro"], seccion: "Datos de la Evidencia", required: true },
  { label: "Categoría", name: "categoria", type: "text", seccion: "Datos de la Evidencia" },
  { label: "Descripción", name: "descripcion", type: "text", seccion: "Datos de la Evidencia", fullWidth: true },
  { label: `Archivo (máx. ${MAX_ARCHIVO_MB} MB)`, name: "archivo", type: "file", seccion: "Datos de la Evidencia", fullWidth: true }
];

const FORM_VACIO_EVIDENCIA = {
  siniestro_buscar: "",
  id_siniestro: "",
  numero_siniestro: "",
  tipo: "",
  categoria: "",
  descripcion: "",
  archivo: null
};

// Incluye siempre 'Accept: application/json' para evitar que Sanctum
// responda con redirect 302 y cause error de CORS.
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };
};

// ----------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------
const formatearTamano = (bytes) => {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const f = new Date(valor);
  return isNaN(f.getTime()) ? String(valor) : f.toLocaleString();
};

// Mensaje legible a partir de un error de axios.
// Sin respuesta del servidor = sin conexión.
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const errores = error.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join('\n');
  return error.response?.data?.message || defecto || error.message;
};

const numeroSiniestro = (d) => {
  if (d.siniestro && typeof d.siniestro === 'object') {
    return d.siniestro.numero_siniestro || d.id_siniestro || "—";
  }
  return d.siniestro || d.id_siniestro || "—";
};

const ETIQUETA_ACCION = {
  crear: 'Subida',
  editar: 'Edición de datos',
  reemplazar_archivo: 'Archivo reemplazado',
  validar: 'Validada',
  rechazar: 'Rechazada',
  eliminar: 'Eliminada',
  integridad_fallida: 'Fallo de integridad'
};

// ----------------------------------------------------------------------
// Tipos de archivo: icono, color y etiqueta según el formato
// ----------------------------------------------------------------------
const EXTENSIONES = {
  imagen: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
  word: ['doc', 'docx', 'odt', 'rtf'],
  excel: ['xls', 'xlsx', 'csv', 'ods'],
  ppt: ['ppt', 'pptx', 'odp'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  zip: ['zip', 'rar', '7z']
};

const ESTILOS_TIPO = {
  imagen: { etiqueta: 'IMG', color: '#2E7D32', Icon: ImageIcon },
  pdf: { etiqueta: 'PDF', color: '#D93025', Icon: PictureAsPdfIcon },
  word: { etiqueta: 'WORD', color: '#2B579A', Icon: DescriptionIcon },
  excel: { etiqueta: 'EXCEL', color: '#217346', Icon: TableChartIcon },
  ppt: { etiqueta: 'PPT', color: '#D24726', Icon: SlideshowIcon },
  video: { etiqueta: 'VIDEO', color: '#7B3FA0', Icon: MovieIcon },
  audio: { etiqueta: 'AUDIO', color: '#0F8B8D', Icon: AudiotrackIcon },
  zip: { etiqueta: 'ZIP', color: '#8D6E63', Icon: FolderZipIcon },
  texto: { etiqueta: 'TXT', color: '#607D8B', Icon: TextSnippetIcon },
  otro: { etiqueta: 'FILE', color: '#757575', Icon: InsertDriveFileIcon }
};

const tipoArchivo = (e) => {
  const mime = (e.mime_type || '').toLowerCase();
  const nombre = e.nombre_archivo || '';
  const ext = nombre.includes('.') ? nombre.split('.').pop().toLowerCase() : '';

  let clave = 'otro';
  if (mime.startsWith('image/') || EXTENSIONES.imagen.includes(ext)) clave = 'imagen';
  else if (mime === 'application/pdf' || ext === 'pdf') clave = 'pdf';
  else if (mime.includes('word') || EXTENSIONES.word.includes(ext)) clave = 'word';
  else if (mime.includes('excel') || mime.includes('spreadsheet') || EXTENSIONES.excel.includes(ext)) clave = 'excel';
  else if (mime.includes('powerpoint') || mime.includes('presentation') || EXTENSIONES.ppt.includes(ext)) clave = 'ppt';
  else if (mime.startsWith('video/') || EXTENSIONES.video.includes(ext)) clave = 'video';
  else if (mime.startsWith('audio/') || EXTENSIONES.audio.includes(ext)) clave = 'audio';
  else if (mime.includes('zip') || mime.includes('rar') || EXTENSIONES.zip.includes(ext)) clave = 'zip';
  else if (mime === 'text/plain' || ext === 'txt') clave = 'texto';

  const base = ESTILOS_TIPO[clave];
  const etiqueta = clave === 'otro' && ext ? ext.toUpperCase().slice(0, 4) : base.etiqueta;

  return { clave, ...base, etiqueta };
};

// ----------------------------------------------------------------------
// Carga del archivo como blob por /descargar (con token).
// No depende de storage:link ni de APP_URL (el disco es privado).
// ----------------------------------------------------------------------
const useArchivoBlob = (evidencia, habilitado, mimeForzado = null) => {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSrc(null);
    setError(false);
    if (!habilitado || !evidencia?.id) return;

    let activo = true;
    let objectUrl = null;

    axios
      .get(`${API_URL}/evidencias/${evidencia.id}/descargar`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      })
      .then((res) => {
        if (!activo) return;
        const blob = mimeForzado ? new Blob([res.data], { type: mimeForzado }) : res.data;
        objectUrl = window.URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (activo) setError(true);
      });

    return () => {
      activo = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [evidencia?.id, evidencia?.ruta_archivo, habilitado, mimeForzado]);

  return { src, error, cargando: habilitado && !src && !error };
};

const cajaBase = (size) => ({
  width: size,
  height: size,
  flexShrink: 0,
  borderRadius: 8,
  border: '1px solid #e5e5e5',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
});

const IconoArchivo = ({ info, size = 56 }) => {
  const Icon = info.Icon;
  return (
    <div
      style={{
        ...cajaBase(size),
        flexDirection: 'column',
        gap: 2,
        background: `${info.color}14`,
        borderColor: `${info.color}55`
      }}
    >
      <Icon style={{ color: info.color, fontSize: size * 0.46 }} />
      <span style={{ color: info.color, fontSize: Math.max(8, size * 0.15), fontWeight: 700, letterSpacing: 0.3 }}>
        {info.etiqueta}
      </span>
    </div>
  );
};

const Miniatura = ({ evidencia, size = 56 }) => {
  const info = tipoArchivo(evidencia);
  const esImg = info.clave === 'imagen';
  const { src, cargando } = useArchivoBlob(evidencia, esImg);

  if (esImg && src) {
    return (
      <div style={cajaBase(size)}>
        <img
          src={src}
          alt={evidencia.nombre_archivo}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  if (esImg && cargando) {
    return (
      <div style={cajaBase(size)}>
        <ImageIcon style={{ color: '#c4c4c4' }} />
      </div>
    );
  }

  return <IconoArchivo info={info} size={size} />;
};

// Celda de la columna "Archivo": miniatura con el nombre como leyenda, centrada
const ArchivoCelda = ({ evidencia }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      width: 140,
      maxWidth: '100%',
      margin: '0 auto'
    }}
  >
    <Miniatura evidencia={evidencia} />
    <span
      title={evidencia.nombre_archivo}
      style={{
        fontSize: 11,
        color: '#777',
        lineHeight: 1.2,
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center'
      }}
    >
      {evidencia.nombre_archivo}
    </span>
  </div>
);

// Vista previa grande (detalle y modales de motivo)
const VistaArchivo = ({ evidencia, compacto = false }) => {
  const info = tipoArchivo(evidencia);
  const previsualizable = ['imagen', 'pdf', 'video', 'audio'].includes(info.clave);
  const { src, error, cargando } = useArchivoBlob(
    evidencia,
    previsualizable,
    info.clave === 'pdf' ? 'application/pdf' : null
  );

  let contenido;

  if (previsualizable && cargando) {
    contenido = <span style={{ color: '#7a8680', fontSize: 14 }}>Cargando vista previa…</span>;
  } else if (previsualizable && src) {
    if (info.clave === 'imagen') {
      contenido = <img src={src} alt={evidencia.nombre_archivo} />;
    } else if (info.clave === 'pdf') {
      contenido = <iframe src={src} title={evidencia.nombre_archivo} />;
    } else if (info.clave === 'video') {
      contenido = <video src={src} controls />;
    } else {
      contenido = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
          <IconoArchivo info={info} size={88} />
          <audio src={src} controls />
        </div>
      );
    }
  } else {
    contenido = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <IconoArchivo info={info} size={compacto ? 88 : 120} />
        <span style={{ color: '#7a8680', fontSize: 13, maxWidth: 280 }}>
          {previsualizable && error
            ? 'No se pudo cargar el archivo.'
            : 'Este formato no tiene vista previa. Usa el botón Descargar.'}
        </span>
      </div>
    );
  }

  return <div className={`evi-preview ${compacto ? 'evi-preview-sm' : ''}`}>{contenido}</div>;
};

// ----------------------------------------------------------------------
// Estatus (badge) y detalle
// ----------------------------------------------------------------------
const COLOR_ESTATUS = {
  pendiente: { bg: '#FFF4D6', color: '#9A6B00' },
  validada: { bg: '#DDF3E7', color: '#1B6B45' },
  rechazada: { bg: '#FBE0DC', color: '#B3281B' }
};

const EstatusBadge = ({ estatus }) => {
  const c = COLOR_ESTATUS[estatus] || { bg: '#eee', color: '#555' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize'
      }}
    >
      {estatus || '—'}
    </span>
  );
};

// Historial (bitácora de movimientos) dentro del detalle
const HistorialEvidencia = ({ historial }) => {
  if (!historial) {
    return <span style={{ color: '#888', fontSize: 13 }}>No se pudo cargar el historial.</span>;
  }

  const { auditoria = [] } = historial;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {auditoria.length === 0 ? (
        <span style={{ color: '#888', fontSize: 13 }}>Sin movimientos registrados.</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditoria.map((a) => (
            <li key={a.id} style={{ fontSize: 13, lineHeight: 1.35, borderLeft: '3px solid #d9e2dd', paddingLeft: 10 }}>
              <strong>{ETIQUETA_ACCION[a.accion] || a.accion}</strong> · {a.usuario}
              <div style={{ color: '#888', fontSize: 11 }}>
                {formatearFecha(a.fecha)}{a.ip ? ` · IP ${a.ip}` : ''}
              </div>
              {a.accion === 'rechazar' && a.datos_despues?.motivo_rechazo && (
                <div style={{ color: '#555' }}>Motivo: {a.datos_despues.motivo_rechazo}</div>
              )}
              {a.accion === 'eliminar' && a.datos_despues?.motivo_eliminacion && (
                <div style={{ color: '#555' }}>Motivo: {a.datos_despues.motivo_eliminacion}</div>
              )}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
};

// Items para el ClienteDetalleModal. El primer item es la vista previa del archivo.
const construirItemsDetalle = (d, historial) => {
  const items = [
    { icon: <ImageIcon />, label: "Vista previa", value: <VistaArchivo key={d.id} evidencia={d} />, fullWidth: true },
    { icon: <DescriptionIcon />, label: "Archivo", value: d.nombre_archivo || "—" },
    { icon: <CategoryIcon />, label: "Tipo", value: d.tipo || "—" },
    { icon: <InfoIcon />, label: "Categoría", value: d.categoria || "—" },
    { icon: <AssignmentIcon />, label: "Siniestro", value: numeroSiniestro(d) },
    { icon: <GavelIcon />, label: "Estatus de validación", value: <EstatusBadge estatus={d.estatus_validacion} /> },
    { icon: <PersonIcon />, label: "Subida por", value: d.subido_por || "—" }
  ];

  if (d.validado_por) {
    items.push({ icon: <PersonIcon />, label: "Revisada por", value: d.validado_por });
  }
  if (d.estatus_validacion === 'rechazada') {
    items.push({ icon: <InfoIcon />, label: "Motivo de rechazo", value: d.motivo_rechazo || "—" });
  }
  if (d.fecha_validacion) {
    items.push({ icon: <DateRangeIcon />, label: "Fecha de revisión", value: formatearFecha(d.fecha_validacion) });
  }

  items.push({ icon: <DateRangeIcon />, label: "Fecha de subida", value: formatearFecha(d.fecha_subida) });
  items.push({ icon: <InfoIcon />, label: "Descripción", value: d.descripcion || "—" });

  if (d.tamano_bytes !== undefined && d.tamano_bytes !== null) {
    items.push({
      icon: <InsertDriveFileIcon />,
      label: "Tamaño y formato",
      value: `${formatearTamano(d.tamano_bytes)}${d.mime_type ? ` · ${d.mime_type}` : ''}`
    });
  }

  if (d.hash_archivo) {
    items.push({
      icon: <FingerprintIcon />,
      label: "Huella SHA-256",
      value: <span style={{ wordBreak: 'break-all', fontSize: 12 }}>{d.hash_archivo}</span>,
      fullWidth: true
    });
  }

  items.push({
    icon: <HistoryIcon />,
    label: "Historial",
    value: <HistorialEvidencia historial={historial} />,
    fullWidth: true
  });

  return items;
};

// ----------------------------------------------------------------------
// Modal reutilizable para acciones que exigen un motivo (rechazar / eliminar)
// ----------------------------------------------------------------------
const ModalMotivo = ({
  titulo,
  subtitulo,
  evidencia,
  etiqueta,
  placeholder,
  motivo,
  error,
  onChange,
  onCancel,
  onConfirm,
  procesando,
  textoBoton,
  textoProcesando
}) => (
  <div
    className="balam-overlay"
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className="balam-modal evi-modal-medio">
      <div className="balam-header">
        <img src={logo} alt="BalamCore" className="balam-logo" />
        <div>
          <h2>{titulo}</h2>
          <p>{subtitulo} · Siniestro: {evidencia.siniestro || "—"}</p>
        </div>
      </div>

      <div className="balam-body evi-body">
        {/* Vista previa centrada con el nombre como leyenda */}
        <figure className="evi-rechazo-visor">
          <VistaArchivo key={evidencia.id} evidencia={evidencia} compacto />
          <figcaption className="evi-leyenda" title={evidencia.nombre_archivo}>
            {evidencia.nombre_archivo}
          </figcaption>
        </figure>

        {/* Motivo a todo el ancho del modal */}
        <div className="balam-field evi-motivo-campo">
          <label style={{ color: error ? '#C0392B' : '' }}>
            {etiqueta} <span style={{ color: 'red', marginLeft: 4 }}>*</span>
          </label>
          <textarea
            className="balam-textarea evi-motivo"
            rows={4}
            maxLength={MOTIVO_MAX}
            value={motivo}
            onChange={onChange}
            placeholder={placeholder}
            style={{ borderColor: error ? '#C0392B' : '' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
            <span style={{ color: '#C0392B', fontSize: 11 }}>{error}</span>
            <span style={{ color: '#888', fontSize: 11 }}>{motivo.length}/{MOTIVO_MAX}</span>
          </div>
        </div>
      </div>

      <div className="balam-footer">
        <button className="balam-btn cancel" onClick={onCancel} disabled={procesando}>
          Cancelar
        </button>
        <button
          className="balam-btn save"
          onClick={onConfirm}
          disabled={procesando}
          style={{ background: '#C0392B' }}
        >
          {procesando ? textoProcesando : textoBoton}
        </button>
      </div>
    </div>
  </div>
);

const validarMotivoTexto = (texto) => {
  const t = texto.trim();
  if (!t) return 'El motivo es obligatorio.';
  if (t.length < MOTIVO_MIN) return `Describe el motivo con al menos ${MOTIVO_MIN} caracteres (${t.length}/${MOTIVO_MIN}).`;
  return '';
};

const Evidencias = () => {
  const location = useLocation();

  const [showDescarga, setShowDescarga] = useState(false);

  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [evidenciaDetalle, setEvidenciaDetalle] = useState(null);
  const [editingEvidencia, setEditingEvidencia] = useState(null);

  // Validar (con confirmación)
  const [validarEvidencia, setValidarEvidencia] = useState(null);

  // Rechazo
  const [rechazoEvidencia, setRechazoEvidencia] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");

  // Eliminación (con motivo)
  const [eliminarEvidencia, setEliminarEvidencia] = useState(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState("");
  const [errorEliminacion, setErrorEliminacion] = useState("");

  const [procesando, setProcesando] = useState(false);

  // Aviso con el diseño del sistema (reemplaza alert)
  // { tipo: 'exito' | 'error' | 'advertencia', titulo, mensaje }
  const [aviso, setAviso] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO_EVIDENCIA);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);

  const [siniestrosOptions, setSiniestrosOptions] = useState([]);

  const timerSiniestroRef = useRef(null);

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== 'exito') return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  // Limpia el temporizador de búsqueda al desmontar
  useEffect(() => () => clearTimeout(timerSiniestroRef.current), []);

  const cargarEvidencias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/evidencias`, {
        params: {
          page: currentPage,
          search: searchTerm,
          estatus_validacion: estatusFilter === "Todos" ? undefined : estatusFilter,
          per_page: itemsPerPage
        },
        ...getAuthHeaders()
      });

      const data = response.data.data || [];

      setEvidencias(data.map(e => {
        const numero = e.siniestro?.numero_siniestro || e.id_siniestro || "—";
        const cerrado = SINIESTRO_CERRADO.includes(e.siniestro?.estatus);

        return {
          ...e,
          archivo_vista: <ArchivoCelda evidencia={e} />,
          siniestro: numero,
          // Dato crudo para el modal de edición (no depende del texto mostrado)
          numero_siniestro_txt: String(numero),
          // Solo una evidencia pendiente de un siniestro abierto admite cambios
          es_modificable: e.estatus_validacion === 'pendiente' && !cerrado,
          fecha_subida: e.fecha_subida ? new Date(e.fecha_subida).toLocaleDateString() : "—"
        };
      }));
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Error cargando evidencias:', error);
      mostrarAviso('error', 'No se pudieron cargar las evidencias', mensajeError(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage, mostrarAviso]);

  useEffect(() => {
    cargarEvidencias();
  }, [cargarEvidencias]);

  // Precarga de siniestro cuando se navega desde el detalle de un siniestro
  useEffect(() => {
    if (location.state && location.state.siniestroId) {
      const { siniestroId, numeroSiniestro } = location.state;
      window.history.replaceState({}, document.title);
      setFormData(prev => ({
        ...prev,
        id_siniestro: siniestroId,
        numero_siniestro: numeroSiniestro || siniestroId
      }));
      setShowModal(true);
    }
  }, [location]);

  const buscarSiniestros = async (termino) => {
    if (!termino || termino.length < 2) {
      setSiniestrosOptions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/siniestros`, {
        params: { search: termino, per_page: 10 },
        ...getAuthHeaders()
      });

      const resultados = response.data.data || [];
      setSiniestrosOptions(resultados.map(s => ({
        value: s.id,
        label: `${s.numero_siniestro || s.id} - ${s.cliente || ''}`
      })));
    } catch (error) {
      console.error('Error al buscar siniestros:', error);
      setSiniestrosOptions([]);
      mostrarAviso('error', 'No se pudo buscar el siniestro', mensajeError(error));
    }
  };

  const handleSiniestroBuscarChange = (e) => {
    const termino = e.target.value;
    setFormData(prev => ({ ...prev, siniestro_buscar: termino }));

    if (timerSiniestroRef.current) clearTimeout(timerSiniestroRef.current);
    timerSiniestroRef.current = setTimeout(() => buscarSiniestros(termino), 500);
  };

  const handleSeleccionarSiniestro = (opcion) => {
    setFormData(prev => ({
      ...prev,
      id_siniestro: opcion.value,
      numero_siniestro: opcion.label
    }));
    setSiniestrosOptions([]);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'archivo') {
      const archivo = files?.[0] || null;

      if (archivo && archivo.size > MAX_ARCHIVO_BYTES) {
        e.target.value = ''; // limpia la selección del input
        setFormData(prev => ({ ...prev, archivo: null }));
        mostrarAviso(
          'error',
          'Archivo demasiado grande',
          `"${archivo.name}" pesa ${formatearTamano(archivo.size)}.\nEl tamaño máximo permitido es de ${MAX_ARCHIVO_MB} MB.`
        );
        return;
      }

      setFormData(prev => ({ ...prev, archivo }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'siniestro_buscar') {
      handleSiniestroBuscarChange(e);
    }
  };

  const cerrarModal = () => {
    clearTimeout(timerSiniestroRef.current);
    setShowModal(false);
    setEditingEvidencia(null);
    setFormData(FORM_VACIO_EVIDENCIA);
    setSiniestrosOptions([]);
  };

  const handleNuevaEvidencia = () => {
    cerrarModal();
    setShowModal(true);
  };

  const handleEditar = (evidencia) => {
    setFormData({
      siniestro_buscar: "",
      id_siniestro: evidencia.id_siniestro || "",
      numero_siniestro: evidencia.numero_siniestro_txt || "",
      tipo: evidencia.tipo || "",
      categoria: evidencia.categoria || "",
      descripcion: evidencia.descripcion || "",
      archivo: null
    });
    setEditingEvidencia(evidencia);
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!formData.id_siniestro) {
      mostrarAviso('error', 'Faltan datos', 'Debes seleccionar un siniestro.');
      return;
    }
    if (!formData.tipo) {
      mostrarAviso('error', 'Faltan datos', 'Selecciona el tipo de evidencia.');
      return;
    }
    if (!editingEvidencia && !formData.archivo) {
      mostrarAviso('error', 'Faltan datos', 'Debes seleccionar un archivo.');
      return;
    }

    try {
      const fd = new FormData();

      if (editingEvidencia) {
        // Con archivo (multipart) Laravel necesita POST + _method=PUT
        fd.append('_method', 'PUT');
        fd.append('tipo', formData.tipo);
        fd.append('categoria', formData.categoria ?? '');
        fd.append('descripcion', formData.descripcion ?? '');

        await axios.post(`${API_URL}/evidencias/${editingEvidencia.id}`, fd, getAuthHeaders());
      } else {
        fd.append('id_siniestro', formData.id_siniestro);
        fd.append('tipo', formData.tipo);
        if (formData.categoria) fd.append('categoria', formData.categoria);
        if (formData.descripcion) fd.append('descripcion', formData.descripcion);
        fd.append('archivo', formData.archivo);

        await axios.post(`${API_URL}/evidencias`, fd, getAuthHeaders());
      }

      const eraEdicion = !!editingEvidencia;

      cerrarModal();
      cargarEvidencias();
      mostrarAviso(
        'exito',
        eraEdicion ? 'Evidencia actualizada' : 'Evidencia subida',
        eraEdicion
          ? 'Los cambios se guardaron correctamente.'
          : 'La evidencia se subió correctamente.'
      );
    } catch (error) {
      console.error('Error al guardar la evidencia:', error);
      mostrarAviso('error', 'No se pudo guardar', mensajeError(error));
    }
  };

  const handleVerDetalle = async (evidencia) => {
    let data = evidencia;
    let historial = null;
    let fallo = null;

    try {
      const res = await axios.get(`${API_URL}/evidencias/${evidencia.id}`, getAuthHeaders());
      data = res.data;
    } catch (error) {
      console.warn('No se pudo obtener el detalle extendido, usando datos locales:', error);
      fallo = error;
    }

    try {
      const res = await axios.get(`${API_URL}/evidencias/${evidencia.id}/historial`, getAuthHeaders());
      historial = res.data;
    } catch (error) {
      console.warn('No se pudo obtener el historial:', error);
      fallo = fallo || error;
    }

    setEvidenciaDetalle({ ...data, items: construirItemsDetalle(data, historial) });
    setShowDetalleModal(true);

    if (fallo) {
      mostrarAviso(
        'advertencia',
        'Detalle incompleto',
        `${mensajeError(fallo)}\nSe muestran los datos disponibles.`
      );
    }
  };

  const handleDescargar = async (evidencia) => {
    try {
      const response = await axios.get(`${API_URL}/evidencias/${evidencia.id}/descargar`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', evidencia.nombre_archivo || 'evidencia');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar la evidencia:', error);

      // Con responseType 'blob' el JSON de error llega como Blob: se intenta leer el mensaje
      let mensaje = error.response
        ? 'El archivo no está disponible o no se pudo descargar.'
        : SIN_CONEXION;
      try {
        const texto = await error.response?.data?.text?.();
        if (texto) mensaje = JSON.parse(texto).message || mensaje;
      } catch {
        /* se mantiene el mensaje por defecto */
      }
      mostrarAviso('error', 'No se pudo descargar', mensaje);
    }
  };

  // ----- Validar (con confirmación) -----
  const abrirValidar = (evidencia) => setValidarEvidencia(evidencia);

  const cerrarValidar = () => {
    if (procesando) return;
    setValidarEvidencia(null);
  };

  const confirmarValidar = async () => {
    if (!validarEvidencia) return;

    setProcesando(true);
    try {
      await axios.post(`${API_URL}/evidencias/${validarEvidencia.id}/validar`, {
        accion: 'validar'
      }, getAuthHeaders());

      const nombre = validarEvidencia.nombre_archivo;
      setValidarEvidencia(null);
      mostrarAviso('exito', 'Evidencia validada', `La evidencia "${nombre}" se validó correctamente.`);
      cargarEvidencias();
    } catch (error) {
      console.error('Error al validar la evidencia:', error);
      setValidarEvidencia(null);
      mostrarAviso('error', 'No se pudo validar', mensajeError(error));
    } finally {
      setProcesando(false);
    }
  };

  // ----- Rechazo -----
  const abrirRechazo = (evidencia) => {
    setRechazoEvidencia(evidencia);
    setMotivoRechazo("");
    setErrorMotivo("");
  };

  const cerrarRechazo = () => {
    if (procesando) return;
    setRechazoEvidencia(null);
    setMotivoRechazo("");
    setErrorMotivo("");
  };

  const handleMotivoChange = (e) => {
    const valor = e.target.value;
    setMotivoRechazo(valor);
    if (errorMotivo) setErrorMotivo(validarMotivoTexto(valor));
  };

  const confirmarRechazo = async () => {
    const err = validarMotivoTexto(motivoRechazo);
    if (err) {
      setErrorMotivo(err);
      return;
    }

    setProcesando(true);
    try {
      await axios.post(`${API_URL}/evidencias/${rechazoEvidencia.id}/validar`, {
        accion: 'rechazar',
        motivo_rechazo: motivoRechazo.trim()
      }, getAuthHeaders());

      const nombre = rechazoEvidencia.nombre_archivo;
      setRechazoEvidencia(null);
      setMotivoRechazo("");
      setErrorMotivo("");
      mostrarAviso('exito', 'Evidencia rechazada', `La evidencia "${nombre}" se rechazó y el motivo quedó guardado.`);
      cargarEvidencias();
    } catch (error) {
      console.error('Error al rechazar la evidencia:', error);
      mostrarAviso('error', 'No se pudo rechazar', mensajeError(error));
    } finally {
      setProcesando(false);
    }
  };

  // ----- Eliminación (borrado lógico con motivo) -----
  const abrirEliminar = (evidencia) => {
    setEliminarEvidencia(evidencia);
    setMotivoEliminacion("");
    setErrorEliminacion("");
  };

  const cerrarEliminar = () => {
    if (procesando) return;
    setEliminarEvidencia(null);
    setMotivoEliminacion("");
    setErrorEliminacion("");
  };

  const handleMotivoEliminacionChange = (e) => {
    const valor = e.target.value;
    setMotivoEliminacion(valor);
    if (errorEliminacion) setErrorEliminacion(validarMotivoTexto(valor));
  };

  const confirmarEliminar = async () => {
    const err = validarMotivoTexto(motivoEliminacion);
    if (err) {
      setErrorEliminacion(err);
      return;
    }

    setProcesando(true);
    try {
      await axios.delete(`${API_URL}/evidencias/${eliminarEvidencia.id}`, {
        ...getAuthHeaders(),
        data: { motivo_eliminacion: motivoEliminacion.trim() }
      });

      const nombre = eliminarEvidencia.nombre_archivo;
      setEliminarEvidencia(null);
      setMotivoEliminacion("");
      setErrorEliminacion("");
      mostrarAviso('exito', 'Evidencia eliminada', `La evidencia "${nombre}" se eliminó. El movimiento quedó registrado en la bitácora.`);
      cargarEvidencias();
    } catch (error) {
      console.error('Error al eliminar evidencia:', error);
      mostrarAviso('error', 'No se pudo eliminar', mensajeError(error));
    } finally {
      setProcesando(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItems) => {
    setItemsPerPage(newItems);
    setCurrentPage(1);
  };

  // En edición: sin buscador de siniestro y sin archivo (el archivo es la prueba y no se reemplaza)
  const camposModal = editingEvidencia
    ? FORM_CAMPOS_EVIDENCIA.filter(c => c.name !== 'siniestro_buscar' && c.name !== 'archivo')
    : FORM_CAMPOS_EVIDENCIA;

  if (loading && evidencias.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Cargando evidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Evidencias</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar por nombre de archivo..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div>
          <div className="fw-bold mb-2">Estatus</div>
          <select
            className="form-select"
            style={{ width: "180px" }}
            value={estatusFilter}
            onChange={(e) => { setEstatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="Todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="validada">Validada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton
            text="Nueva evidencia"
            icon={<AddCircleOutlinedIcon />}
            onClick={handleNuevaEvidencia}
          />
        </div>
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={evidencias}
          campos={campos}
          acciones={[
            {
              titulo: "Validar",
              clase: "tabla-btn-edit",
              icono: <CheckCircleIcon fontSize="small" />,
              onClick: abrirValidar,
              oculto: (e) => !e.es_modificable
            },
            {
              titulo: "Rechazar",
              clase: "tabla-btn-del",
              icono: <CancelIcon fontSize="small" />,
              onClick: abrirRechazo,
              oculto: (e) => !e.es_modificable
            },
            {
              titulo: "Ver detalle",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle
            },
            {
              titulo: "Editar metadatos",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar,
              // Solo pendientes de un siniestro abierto. El backend lo vuelve a verificar.
              oculto: (e) => !e.es_modificable
            },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: abrirEliminar,
              // Solo pendientes de un siniestro abierto. El backend lo vuelve a verificar.
              oculto: (e) => !e.es_modificable
            },
            {
              titulo: "Descargar",
              clase: "tabla-btn-ver",
              icono: <DownloadIcon fontSize="small" />,
              onClick: handleDescargar
            }
          ]}
        />
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* ---------- Crear / editar ---------- */}
      <EditModal
        open={showModal}
        onClose={cerrarModal}
        onSave={handleGuardar}
        editando={!!editingEvidencia}
        titulo={editingEvidencia ? "Editar evidencia" : "Agregar nueva evidencia"}
        subtitulo={
          editingEvidencia
            ? "Modifica los datos de la evidencia"
            : "Busca el siniestro y sube el archivo de evidencia"
        }
        btnTexto={editingEvidencia ? "Guardar cambios" : "Subir evidencia"}
        campos={camposModal}
        formData={formData}
        onChange={handleInputChange}
        dropdowns={{
          siniestro_buscar: {
            options: siniestrosOptions,
            onSelect: handleSeleccionarSiniestro
          }
        }}
      >
        {editingEvidencia && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Archivo actual</div>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, maxWidth: 200 }}>
              <Miniatura evidencia={editingEvidencia} size={96} />
              <span
                title={editingEvidencia.nombre_archivo}
                style={{ fontSize: 11, color: '#777', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {editingEvidencia.nombre_archivo}
              </span>
            </div>
          </div>
        )}

        {editingEvidencia ? (
          <div className="evi-hint">
            <InfoIcon style={{ fontSize: 16 }} />
            <span>El archivo no se puede cambiar. Si te equivocaste, elimina esta evidencia y sube una nueva.</span>
          </div>
        ) : (
          <div className="evi-hint">
            <InfoIcon style={{ fontSize: 16 }} />
            <span>Tamaño máximo por archivo: <strong>{MAX_ARCHIVO_MB} MB</strong>.</span>
          </div>
        )}
      </EditModal>

      {/* ---------- Ver detalle (con vista previa e historial) ---------- */}
      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setEvidenciaDetalle(null); }}
        titulo={evidenciaDetalle ? evidenciaDetalle.nombre_archivo : ""}
        subtitulo={evidenciaDetalle ? numeroSiniestro(evidenciaDetalle) : ""}
        avatar="E"
        ancho="grande"
        items={evidenciaDetalle?.items || []}
      />

      {/* ---------- Confirmar validación ---------- */}
      {validarEvidencia && (
        <div
          className="balam-overlay"
          style={{ zIndex: 2900 }}
          onClick={(e) => e.target === e.currentTarget && cerrarValidar()}
        >
          <div className="balam-modal evi-aviso">
            <div className="evi-aviso-icono exito">
              <CheckCircleIcon style={{ fontSize: 40 }} />
            </div>
            <h3>Validar evidencia</h3>
            <p style={{ whiteSpace: 'pre-line' }}>
              Vas a validar "{validarEvidencia.nombre_archivo}" del siniestro {validarEvidencia.siniestro || "—"}.
              {"\n"}Una vez validada ya no se podrá editar, eliminar ni cambiar su estatus.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="balam-btn cancel" onClick={cerrarValidar} disabled={procesando}>
                Cancelar
              </button>
              <button className="balam-btn save" onClick={confirmarValidar} disabled={procesando}>
                {procesando ? 'Validando…' : 'Validar evidencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Rechazar evidencia ---------- */}
      {rechazoEvidencia && (
        <ModalMotivo
          titulo="Rechazar evidencia"
          subtitulo="Revisa el archivo e indica por qué se rechaza"
          evidencia={rechazoEvidencia}
          etiqueta="Motivo del rechazo"
          placeholder="Describe por qué se rechaza esta evidencia..."
          motivo={motivoRechazo}
          error={errorMotivo}
          onChange={handleMotivoChange}
          onCancel={cerrarRechazo}
          onConfirm={confirmarRechazo}
          procesando={procesando}
          textoBoton="Rechazar evidencia"
          textoProcesando="Rechazando…"
        />
      )}

      {/* ---------- Eliminar evidencia (exige motivo) ---------- */}
      {eliminarEvidencia && (
        <ModalMotivo
          titulo="Eliminar evidencia"
          subtitulo="La evidencia dejará de mostrarse, pero el movimiento queda en la bitácora"
          evidencia={eliminarEvidencia}
          etiqueta="Motivo de la eliminación"
          placeholder="Ej. Archivo subido por error al siniestro equivocado..."
          motivo={motivoEliminacion}
          error={errorEliminacion}
          onChange={handleMotivoEliminacionChange}
          onCancel={cerrarEliminar}
          onConfirm={confirmarEliminar}
          procesando={procesando}
          textoBoton="Eliminar evidencia"
          textoProcesando="Eliminando…"
        />
      )}

      {/* ---------- Aviso (éxito / error / advertencia) ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div
              className={`evi-aviso-icono ${aviso.tipo}`}
              style={aviso.tipo === 'advertencia' ? ESTILO_ICONO_ADVERTENCIA : undefined}
            >
              {aviso.tipo === 'exito' && <CheckCircleIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === 'error' && <ErrorOutlineIcon style={{ fontSize: 40 }} />}
              {aviso.tipo === 'advertencia' && <WarningAmberIcon style={{ fontSize: 40 }} />}
            </div>
            <h3>{aviso.titulo}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>Aceptar</button>
          </div>
        </div>
      )}

      {/* ---------- Descargar (listado Excel/CSV/PDF + fotos por siniestro) ---------- */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_URL}/exportar/evidencias`}
        params={{ search: searchTerm, estatus: estatusFilter }}
        nombreArchivo="evidencias"
        titulo="Descargar evidencias"
        nota={
          searchTerm || estatusFilter !== "Todos"
            ? `Se exportarán las evidencias con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatusFilter !== "Todos" ? ` (estatus: ${estatusFilter})` : ""}.`
            : "Se exportarán todas las evidencias."
        }
        tabExtra={{
          id: "reporte",
          label: "Fotos por siniestro",
          contenido: (
            <ReporteEvidencias
              Miniatura={Miniatura}
              getAuthHeaders={getAuthHeaders}
              onAviso={mostrarAviso}
            />
          )
        }}
      />
    </div>
  );
};

export default Evidencias;