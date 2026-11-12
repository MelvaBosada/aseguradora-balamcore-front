// pages/admin/Polizas.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import VisibilityIcon from "@mui/icons-material/Visibility";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon from "@mui/icons-material/Notes";
import InfoIcon from "@mui/icons-material/Info";
import HomeIcon from "@mui/icons-material/Home";
import CarIcon from "@mui/icons-material/DirectionsCar";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import EditModal from "../../components/EditModal";
import Paginacion from "../../components/Paginacion";
import PolizaDetalleModal from "../../components/PolizaDetalleModal";
import PolizaCoberturasModal from "../../components/PolizaCoberturasModal";
import FichaCobertura, { NOMBRES_RAMO, dinero0 } from "../../components/FichaCobertura";
import DescargarModal from "../../components/DescargarModal";
import { EstatusPoliza } from "../../components/siniestro/Badges";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const MAX_PDF_MB = 2;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Estilos del icono de advertencia (por si el CSS no define .advertencia)
const ESTILO_ICONO_ADVERTENCIA = { background: "#FFF4D6", color: "#9A6B00" };

// Ramos que se aseguran con bienes (vida y gastos médicos aseguran personas: no llevan bienes)
const RAMOS_CON_BIENES = ['autos', 'hogar', 'empresarial', 'responsabilidad_civil', 'otro'];

// Tipo de póliza que se sugiere según el tipo del primer bien elegido
const TIPO_POR_BIEN = { vehiculo: 'autos', inmueble: 'hogar', electronico: 'hogar', maquinaria: 'empresarial' };

// Cada cuántos meses se paga según la forma de pago (contado y anual: un solo pago)
const MESES_POR_FORMA = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };

// Formas de pago en las que se elige el día de pago (contado y anual: un solo pago)
const DIA_PAGO_APLICA = ['mensual', 'trimestral', 'semestral'];

// Del 1 al 28 para que el día exista en todos los meses
const OPCIONES_DIA_PAGO = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `Día ${i + 1} de cada periodo`,
}));

// Textos que se muestran mientras el sistema aún no asigna el número (se asigna al guardar)
const TEXTO_NUMERO_AUTO = "Se asigna automáticamente al guardar";
const TEXTO_ENDOSO_AUTO = "Se asigna automáticamente (N° de póliza + -E001)";

// El orden de "campos" debe coincidir con el de "columnas"
const campos = ["nPoliza", "cliente", "estatus", "endoso"];
const columnas = ["N° Póliza", "Cliente", "Estatus", "Endoso", "Acciones"];

const OPCIONES_RAMO = ["autos", "hogar", "empresarial", "responsabilidad_civil", "vida", "gastos_medicos", "otro"]
  .map((v) => ({ value: v, label: NOMBRES_RAMO[v] }));

// El ramo no se puede cambiar una vez emitida la póliza; IVA y prima total los calcula el sistema.
// Los datos de emisión y el calendario de pagos solo aparecen al editar (los llena el sistema).
// El día de pago sí lo elige el usuario (solo en pagos periódicos).
const getCampos = (editando, formaPago) => [
  { label: "RFC del Cliente", name: "rfc_buscar", type: "text", seccion: "Buscar Cliente", fullWidth: true },
  { label: "Nombre del cliente", name: "nombre_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Correo", name: "correo_cliente", type: "email", seccion: "Información del Cliente", readOnly: true },
  { label: "Teléfono", name: "telefono_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Domicilio", name: "domicilio_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "CURP", name: "curp_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "N° PÓLIZA", name: "numero_poliza", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
  ...(editando
    ? [
      { label: "FECHA DE EMISIÓN", name: "fecha_emision", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
      { label: "EMITIDA POR", name: "empleado_nombre", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
    ]
    : []),
  editando
    ? { label: "RAMO (no se puede cambiar)", name: "tipo_texto", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true, disabled: true }
    : { label: "RAMO", name: "tipo", type: "select", options: OPCIONES_RAMO, seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE INICIO", name: "fecha_inicio", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "FECHA DE FIN", name: "fecha_fin", type: "date", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "SUMA ASEGURADA", name: "suma_asegurada", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "PRIMA NETA", name: "prima_neta", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "DERECHO DE PÓLIZA", name: "derecho_poliza", type: "number", seccion: "DATOS DE LA PÓLIZA", required: true },
  { label: "IVA (lo calcula el sistema)", name: "iva", type: "number", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
  { label: "PRIMA TOTAL", name: "prima_total", type: "number", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
  { label: "FORMA DE PAGO", name: "forma_pago", type: "select", options: ["contado", "mensual", "trimestral", "semestral", "anual"], seccion: "DATOS DE LA PÓLIZA", required: true },
  // Solo en pagos periódicos; el usuario lo puede cambiar (también al editar, sin endoso)
  ...(DIA_PAGO_APLICA.includes(formaPago)
    ? [{ label: "DÍA DE PAGO", name: "dia_pago", type: "select", options: OPCIONES_DIA_PAGO, seccion: "DATOS DE LA PÓLIZA" }]
    : []),
  ...(editando
    ? [
      { label: "FECHA DEL PRIMER PAGO", name: "fecha_primer_pago", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
      { label: "SIGUIENTE PAGO", name: "siguiente_pago", type: "text", seccion: "DATOS DE LA PÓLIZA", readOnly: true },
    ]
    : []),
  { label: "OBSERVACIONES", name: "observaciones", type: "textarea", seccion: "DATOS DE LA PÓLIZA", fullWidth: true, rows: 4 },
];

// derecho_poliza y forma_pago arrancan con un valor por defecto para no olvidarlos.
// Los campos de emisión y de calendario (primer / siguiente pago) son solo de lectura:
// se llenan al editar y NO se envían al guardar.
const FORM_VACIO = {
  rfc_buscar: "", id_cliente: "", nombre_cliente: "", correo_cliente: "", telefono_cliente: "",
  domicilio_cliente: "", curp_cliente: "", numero_poliza: "", tipo: "", tipo_texto: "", fecha_inicio: "", fecha_fin: "",
  suma_asegurada: "", prima_neta: "", derecho_poliza: "0", iva: "", prima_total: "", forma_pago: "contado", observaciones: "",
  fecha_emision: "", empleado_nombre: "", dia_pago: "", fecha_primer_pago: "", siguiente_pago: "",
  bienes_seleccionados: [],
  precios_bienes: {},
  coberturas_ids: [],
  tiene_endoso: false,
  descripcion_endoso: "",
  fecha_efecto: ""
};

// Mismos estilos que usa EditModal para sus mensajes
const COLOR_ERROR = "#C0392B";
const estiloMensaje = { fontSize: 11, marginTop: 3 };
const estiloAyuda = { ...estiloMensaje, color: "#6B7280" };
const estiloRequerido = { color: "red", marginLeft: 4 };
const estiloTitulo = { fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 };

const validarPdf = (file) => {
  if (!file) return "";
  const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!esPdf) return "El archivo debe ser un PDF.";
  if (file.size > MAX_PDF_BYTES) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(2)} MB y el máximo permitido es ${MAX_PDF_MB} MB.`;
  }
  return "";
};

// Mensaje legible a partir de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const errores = error.response?.data?.errors;
  if (errores) return Object.values(errores).flat().join("\n");
  return error.response?.data?.message || defecto || error.message;
};

// ───────────── Helpers de cálculo y fechas ─────────────

const num = (v) => parseFloat(v) || 0;
const fmt = (n) => (n > 0 ? n.toFixed(2) : "");

// Un campo numérico cuenta como "capturado" si no está vacío (el 0 es válido)
const vacio = (v) => v === "" || v === null || v === undefined;

// Recorta timestamps ("2026-02-11 04:47:51" / ISO) a YYYY-MM-DD
const soloFecha = (v) => (v ? String(v).slice(0, 10) : "");

// Acepta texto o un objeto { nombre, apellidos } y devuelve un nombre legible (nunca un id)
const nombreDe = (v) => {
  if (!v || typeof v === 'number') return "";
  if (typeof v === 'object') return [v.nombre, v.apellidos || v.apellido].filter(Boolean).join(' ').trim();
  return String(v);
};

const sumaBienes = (precios, seleccionados) =>
  seleccionados.reduce((total, id) => total + num(precios?.[id]), 0);

// Fecha de hoy en hora local (toISOString usaría UTC y en la noche daría el día siguiente)
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Día de pago sugerido: el día de inicio de la vigencia (máximo 28)
const diaSugerido = (fecha) => {
  if (!fecha) return "";
  const dia = Number(String(fecha).split('-')[2]);
  return dia ? String(Math.min(dia, 28)) : "";
};

// Suma un año a una fecha "YYYY-MM-DD" (el 29 de febrero pasa al 28 del año siguiente)
const sumarAnio = (fecha) => {
  if (!fecha) return "";
  const [y, m, d] = fecha.split('-').map(Number);
  const ultimoDia = new Date(y + 1, m, 0).getDate();
  return `${y + 1}-${String(m).padStart(2, '0')}-${String(Math.min(d, ultimoDia)).padStart(2, '0')}`;
};

// Suma meses a una fecha sin pasarse del último día del mes
const sumarMeses = (fecha, meses) => {
  if (!fecha) return "";
  const [y, m, d] = fecha.split('-').map(Number);
  const destino = new Date(y, m - 1 + meses, 1);
  const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  return `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
};

const mesesEntre = (a, b) => {
  if (!a || !b) return 12;
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.max(1, Math.round((y2 - y1) * 12 + (m2 - m1) + (d2 - d1) / 30));
};

const rangoDe = (c) => {
  const min = num(c.monto_minimo);
  const max = num(c.monto_maximo);
  return [min > 0 ? min : null, max > 0 ? max : null];
};

// Solo se endosa una póliza emitida/activa (no borrador, cancelada ni vencida)
const estatusDe = (p) => String(p?.estatus || "").toLowerCase();
const puedeEndosar = (p) => {
  const est = estatusDe(p);
  return !["borrador", "draft", "cancelada", "cancelado"].includes(est) && !est.includes("vencid");
};

// Se puede cancelar una póliza que no esté ya cancelada ni vencida
const puedeCancelar = (p) => {
  const est = estatusDe(p);
  return !["cancelada", "cancelado"].includes(est) && !est.includes("vencid");
};

const Polizas = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);
  const [polizaToCancel, setPolizaToCancel] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [polizaDetalle, setPolizaDetalle] = useState(null);
  const [polizaCob, setPolizaCob] = useState(null); // póliza cuyas coberturas se consultan
  const [editingPoliza, setEditingPoliza] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);
  const [buscarRfcTimer, setBuscarRfcTimer] = useState(null);
  const [bienesCliente, setBienesCliente] = useState([]);
  const [cargandoBienes, setCargandoBienes] = useState(false);
  const [coberturas, setCoberturas] = useState([]);
  const [parametros, setParametros] = useState({ tasa_iva: 16, ramos_exentos_iva: ['vida'] });

  // Documentos PDF (póliza y endoso)
  const [docPoliza, setDocPoliza] = useState(null);
  const [docEndoso, setDocEndoso] = useState(null);
  const [docActual, setDocActual] = useState(null); // documento ya guardado de la póliza que se edita
  const [erroresDocs, setErroresDocs] = useState({});
  const [fileKey, setFileKey] = useState(0);        // sirve para limpiar los <input type="file">
  const [siguienteEndoso, setSiguienteEndoso] = useState(""); // N° que recibirá el próximo endoso (al editar)

  // Aviso con el diseño del sistema (reemplaza alert)
  // { tipo: 'exito' | 'error' | 'advertencia', titulo, mensaje }
  const [aviso, setAviso] = useState(null);

  // Indica qué campos el usuario ya escribió a mano: esos dejan de llenarse solos.
  const manual = useRef({ fin: false, suma: false, dia: false });

  // Valores de la póliza al abrir la edición: sirven para saber si hay cambios que exigen endoso
  const original = useRef(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== 'exito') return;
    const t = setTimeout(() => setAviso(null), AVISO_EXITO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Coberturas y parámetros de IVA al iniciar
  useEffect(() => {
    axios.get(`${API_URL}/coberturas`, { headers: headers() })
      .then((r) => setCoberturas(Array.isArray(r.data) ? r.data : []))
      .catch((error) => console.error('Error al cargar coberturas:', error));

    axios.get(`${API_URL}/polizas/parametros`, { headers: headers() })
      .then((r) => setParametros(r.data))
      .catch((error) => console.error('Error al cargar parámetros:', error));
  }, []);

  const cargarPolizas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/polizas`, {
        params: { page: currentPage, search: searchTerm, estatus: estatusFilter, per_page: itemsPerPage },
        headers: headers()
      });
      setPolizas(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error:', error);
      mostrarAviso('error', 'No se pudieron cargar las pólizas', mensajeError(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage, mostrarAviso]);

  useEffect(() => {
    cargarPolizas();
  }, [cargarPolizas]);

  // ───────────── Ramo, coberturas y cálculos ─────────────

  const conBienes = (tipo) => !tipo || RAMOS_CON_BIENES.includes(tipo);

  // Coberturas activas que se pueden contratar en un ramo (cada cobertura dice sus ramos)
  const disponiblesPara = (tipo) =>
    coberturas.filter((c) => c.estatus === 'activa' && (!(c.ramos && c.ramos.length) || c.ramos.includes(tipo)));

  // Recalcula lo que depende de otros campos, salvo lo que el usuario ya escribió a mano:
  //  - suma asegurada = suma del valor de los bienes marcados (solo ramos con bienes)
  //  - IVA            = tasa de la aseguradora sobre (prima neta + derecho); 0 en los ramos exentos
  //  - prima total    = prima neta + derecho de póliza + IVA (el servidor la vuelve a calcular)
  const derivar = (f) => {
    const m = manual.current;
    const next = { ...f };

    if (!m.suma && conBienes(f.tipo) && f.tipo) {
      next.suma_asegurada = fmt(sumaBienes(f.precios_bienes, f.bienes_seleccionados));
    }

    const base = num(f.prima_neta) + num(f.derecho_poliza);
    const exento = (parametros.ramos_exentos_iva || []).includes(f.tipo);
    const iva = exento ? 0 : base * (num(parametros.tasa_iva) / 100);

    next.iva = base > 0 ? iva.toFixed(2) : "";
    next.prima_total = base > 0 ? (base + iva).toFixed(2) : "";
    return next;
  };

  // Errores de la selección: rango de valor asegurable por cobertura y bien (mismo criterio que el servidor)
  const validarCoberturas = (f) => {
    const generales = [];
    const porCobertura = {};
    const porBien = {};

    const disponibles = f.tipo ? disponiblesPara(f.tipo) : [];
    if (f.tipo && disponibles.length > 0 && f.coberturas_ids.length === 0) {
      generales.push('Selecciona al menos una cobertura.');
    }

    const bienesSel = bienesCliente.filter((b) => f.bienes_seleccionados.includes(b.id));

    coberturas.filter((c) => f.coberturas_ids.includes(c.id)).forEach((c) => {
      const [min, max] = rangoDe(c);
      if (min === null && max === null) return;

      const revisar = bienesSel.length
        ? bienesSel
          .filter((b) => !(c.tipos_bien && c.tipos_bien.length) || c.tipos_bien.includes(b.tipo))
          .map((b) => ({ id: b.id, nombre: b.descripcion || `bien ${b.tipo}`, valor: num(f.precios_bienes?.[b.id] ?? b.valor) }))
        : [{ id: null, nombre: 'la suma asegurada', valor: num(f.suma_asegurada) }];

      revisar.forEach((r) => {
        let msg = '';
        if (min !== null && r.valor < min) msg = `El valor de ${r.nombre} (${dinero0(r.valor)}) es menor al mínimo asegurable de «${c.nombre}» (${dinero0(min)}).`;
        if (max !== null && r.valor > max) msg = `El valor de ${r.nombre} (${dinero0(r.valor)}) excede el máximo asegurable de «${c.nombre}» (${dinero0(max)}).`;
        if (!msg) return;
        porCobertura[c.id] = msg;
        if (r.id !== null) porBien[r.id] = [...(porBien[r.id] || []), msg];
        else generales.push(msg);
      });
    });

    return { generales, porCobertura, porBien, hayErrores: generales.length > 0 || Object.keys(porBien).length > 0 };
  };

  const erroresCob = validarCoberturas(formData);

  // Cambios que modifican el contrato de una póliza ya emitida (exigen endoso).
  // El día de pago NO cuenta: es operativo y se cambia sin endoso.
  const cambiosContractuales = () => {
    const o = original.current;
    if (!editingPoliza || !o) return [];
    const f = formData;
    const cambios = [];

    if (num(f.suma_asegurada) !== num(o.suma_asegurada)) cambios.push('suma asegurada');
    if (f.fecha_inicio !== o.fecha_inicio || f.fecha_fin !== o.fecha_fin) cambios.push('vigencia');
    if (num(f.prima_neta) !== num(o.prima_neta) || num(f.derecho_poliza) !== num(o.derecho_poliza)) cambios.push('prima');
    if (f.forma_pago !== o.forma_pago) cambios.push('forma de pago');

    const cobA = [...o.coberturas_ids].sort().join(',');
    const cobB = [...f.coberturas_ids].sort().join(',');
    if (o.coberturas_ids.length > 0 && cobA !== cobB) cambios.push('coberturas');

    const bienesA = [...o.bienes_seleccionados].sort().join(',');
    const bienesB = [...f.bienes_seleccionados].sort().join(',');
    const preciosCambian = f.bienes_seleccionados.some((id) => num(f.precios_bienes?.[id]) !== num(o.precios_bienes?.[id]));
    if (bienesA !== bienesB || preciosCambian) cambios.push('bienes asegurados');

    return cambios;
  };

  const estadoEdicion = String(editingPoliza?.estatus || "").toLowerCase();
  const esBorrador = estadoEdicion === "borrador";
  const esCancelada = estadoEdicion === "cancelada" || estadoEdicion === "cancelado";
  const coberturasEditables = !editingPoliza
    || (!esCancelada && (esBorrador || formData.tiene_endoso));

  const alternarCobertura = (id) => {
    setFormData((prev) => ({
      ...prev,
      coberturas_ids: prev.coberturas_ids.includes(id) ? prev.coberturas_ids.filter((x) => x !== id) : [...prev.coberturas_ids, id],
    }));
  };

  // Resumen de lo que se va a emitir
  const resumen = (() => {
    const f = formData;
    const neta = num(f.prima_neta);
    const derecho = num(f.derecho_poliza);
    const total = num(f.prima_total);
    const exento = (parametros.ramos_exentos_iva || []).includes(f.tipo);
    const meses = mesesEntre(f.fecha_inicio, f.fecha_fin);
    const cada = MESES_POR_FORMA[f.forma_pago];
    const pagos = cada ? Math.max(1, Math.floor(meses / cada)) : 1;
    const bienesSel = bienesCliente.filter((b) => f.bienes_seleccionados.includes(b.id));
    const valorBienes = sumaBienes(f.precios_bienes, f.bienes_seleccionados);
    const suma = num(f.suma_asegurada);
    const infraseguro = ['hogar', 'empresarial'].includes(f.tipo) && bienesSel.length > 0 && suma > 0 && suma < valorBienes - 0.005
      ? suma / valorBienes
      : null;

    return { neta, derecho, subtotal: neta + derecho, iva: num(f.iva), exento, total, meses, pagos, valorBienes, suma, infraseguro };
  })();

  // ───────────── Bienes del cliente ─────────────

  const cargarBienesPorClienteId = async (clienteId) => {
    if (!clienteId) return [];

    setCargandoBienes(true);
    try {
      const response = await axios.get(`${API_URL}/bienes/cliente/${clienteId}`, { headers: headers() });
      setBienesCliente(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al cargar bienes:', error);
      setBienesCliente([]);
      return [];
    } finally {
      setCargandoBienes(false);
    }
  };

  // Busca al cliente por RFC. SOLO llena los datos del cliente; los datos de la póliza no se copian.
  const buscarClientePorRfc = async (rfc) => {
    if (!rfc || rfc.length < 8) return;

    try {
      const response = await axios.get(`${API_URL}/polizas/buscar-ultima-por-rfc`, {
        params: { rfc },
        headers: headers()
      });

      const cliente = response.data.cliente;
      const bienes = await cargarBienesPorClienteId(cliente.id);

      const preciosIniciales = {};
      bienes.forEach(bien => {
        preciosIniciales[bien.id] = bien.valor || 0;
      });

      setFormData(prev => derivar({
        ...prev,
        id_cliente: cliente.id,
        nombre_cliente: `${cliente.nombre} ${cliente.apellido}`,
        correo_cliente: cliente.correo || "",
        telefono_cliente: cliente.telefono || "",
        domicilio_cliente: cliente.domicilio || "",
        curp_cliente: cliente.curp || "",
        bienes_seleccionados: [],
        precios_bienes: preciosIniciales
      }));
    } catch (error) {
      if (error.response?.status === 404) {
        // Limpia al cliente anterior para no guardar la póliza a nombre de otra persona
        setFormData(prev => derivar({
          ...prev,
          id_cliente: "",
          nombre_cliente: "Cliente no encontrado",
          correo_cliente: "",
          telefono_cliente: "",
          domicilio_cliente: "",
          curp_cliente: "",
          bienes_seleccionados: [],
          precios_bienes: {}
        }));
        setBienesCliente([]);
      }
    }
  };

  const handleSeleccionarBien = (bienId) => {
    setFormData((prev) => {
      const yaEsta = prev.bienes_seleccionados.includes(bienId);
      const seleccionados = yaEsta
        ? prev.bienes_seleccionados.filter(id => id !== bienId)
        : [...prev.bienes_seleccionados, bienId];

      // Si todavía no hay ramo, se sugiere según el bien elegido.
      let tipo = prev.tipo;
      let cobIds = prev.coberturas_ids;
      if (!editingPoliza && !prev.tipo && !yaEsta) {
        const bien = bienesCliente.find(b => b.id === bienId);
        tipo = TIPO_POR_BIEN[bien?.tipo] || '';
      }

      return derivar({ ...prev, bienes_seleccionados: seleccionados, tipo, coberturas_ids: cobIds });
    });
  };

  const handlePrecioBienChange = (bienId, nuevoPrecio) => {
    setFormData(prev => derivar({
      ...prev,
      precios_bienes: { ...prev.precios_bienes, [bienId]: parseFloat(nuevoPrecio) || 0 }
    }));
  };

  const handleRfcChange = (e) => {
    const rfc = e.target.value;
    setFormData(prev => ({ ...prev, rfc_buscar: rfc }));
    if (buscarRfcTimer) clearTimeout(buscarRfcTimer);
    setBuscarRfcTimer(setTimeout(() => buscarClientePorRfc(rfc), 500));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const m = manual.current;

    // Lo que el usuario escribe a mano deja de llenarse solo; si lo borra, vuelve a ser automático
    if (name === 'fecha_fin') m.fin = value !== '';
    if (name === 'suma_asegurada') m.suma = value !== '';
    if (name === 'dia_pago') m.dia = value !== '';

    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'fecha_inicio') {
        // La vigencia dura un año desde el inicio
        if (!m.fin) next.fecha_fin = sumarAnio(value);
        // El día de pago sugerido es el día de inicio
        if (!m.dia) next.dia_pago = diaSugerido(value);
      }

      // Al elegir el ramo se conservan las coberturas seleccionadas por el usuario.
      if (name === 'tipo' && !editingPoliza) {
        if (!RAMOS_CON_BIENES.includes(value)) {
          next.bienes_seleccionados = [];
          m.suma = false;
          next.suma_asegurada = '';
        }
      }

      return derivar(next);
    });
  };

  // ───────────── Documentos PDF ─────────────

  const resetDocumentos = () => {
    setDocPoliza(null);
    setDocEndoso(null);
    setDocActual(null);
    setErroresDocs({});
    setSiguienteEndoso("");
    setFileKey(k => k + 1);
  };

  const handleArchivo = (e, tipo) => {
    const file = e.target.files?.[0] || null;
    const error = validarPdf(file);
    const clave = tipo === 'poliza' ? 'poliza' : 'endoso_doc';

    setErroresDocs(prev => ({ ...prev, [clave]: error }));

    if (error || !file) {
      e.target.value = "";
      tipo === 'poliza' ? setDocPoliza(null) : setDocEndoso(null);
      return;
    }

    tipo === 'poliza' ? setDocPoliza(file) : setDocEndoso(file);
  };

  const handleTieneEndoso = (valor) => {
    setFormData(prev => ({
      ...prev,
      tiene_endoso: valor,
      descripcion_endoso: valor ? prev.descripcion_endoso : ""
    }));

    if (!valor) {
      setDocEndoso(null);
      setErroresDocs(prev => ({ ...prev, endoso_descripcion: "", endoso_doc: "" }));
      setFileKey(k => k + 1);
    }
  };

  // Mensaje legible cuando falla una descarga con responseType 'blob'
  // (el JSON de error llega como Blob: se intenta leer el mensaje)
  const mensajeErrorBlob = async (error) => {
    let mensaje = error.response ? 'El documento no está disponible.' : SIN_CONEXION;
    try {
      const texto = await error.response?.data?.text?.();
      if (texto) mensaje = JSON.parse(texto).message || mensaje;
    } catch {
      /* se mantiene el mensaje por defecto */
    }
    return mensaje;
  };

  // Abre un PDF protegido (necesita token) en una pestaña nueva
  const abrirPdf = async (url) => {
    const ventana = window.open('', '_blank');
    try {
      const res = await axios.get(url, { headers: headers(), responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

      if (ventana) {
        ventana.location.href = blobUrl;
      } else {
        window.location.href = blobUrl;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      if (ventana) ventana.close();
      console.error('Error al abrir documento:', error);
      mostrarAviso('error', 'No se pudo abrir el documento', await mensajeErrorBlob(error));
    }
  };

  // Descarga el PDF de la póliza generado por el servidor (datos, cálculos, bienes, coberturas, endosos e historial)
  const handleDescargarPoliza = async (p) => {
    try {
      const res = await axios.get(`${API_URL}/polizas/${p.id}/pdf`, { headers: headers(), responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Poliza-${p.nPoliza || 'poliza'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('Error al descargar póliza:', error);
      mostrarAviso('error', 'No se pudo descargar la póliza', await mensajeErrorBlob(error));
    }
  };

  const handleNuevaPoliza = () => {
    manual.current = { fin: false, suma: false, dia: false };
    original.current = null;

    // La vigencia arranca hoy y termina en un año
    const hoy = hoyLocal();

    setEditingPoliza(null);
    setFormData({ ...FORM_VACIO, fecha_inicio: hoy, fecha_fin: sumarAnio(hoy), dia_pago: diaSugerido(hoy) });
    setBienesCliente([]);
    resetDocumentos();
    setShowModal(true);
  };

  // Segundo parámetro: abre la edición con el endoso ya activado
  const handleEditar = async (poliza, conEndoso = false) => {
    // Al editar se respetan los valores guardados: vigencia, suma y día de pago no se tocan solos.
    manual.current = { fin: true, suma: true, dia: true };

    setEditingPoliza(poliza);
    resetDocumentos();
    try {
      const res = await axios.get(`${API_URL}/polizas/${poliza.id}`, { headers: headers() });
      const data = res.data;
      setEditingPoliza({ ...poliza, estatus: data.estatus || poliza.estatus });

      const bienesResponse = await axios.get(`${API_URL}/bienes/cliente/${data.id_cliente}`, { headers: headers() });

      const bienesAsociados = bienesResponse.data
        .filter(b => b.id_poliza === poliza.id)
        .map(b => b.id);

      const preciosIniciales = {};
      bienesResponse.data.forEach(bien => {
        preciosIniciales[bien.id] = bien.valor || 0;
      });

      // "??" en vez de "||" para que un 0 guardado (ej. derecho de póliza = 0) no se vuelva ""
      const cargado = {
        rfc_buscar: data.cliente_rfc || "",
        id_cliente: data.id_cliente || "",
        nombre_cliente: `${data.cliente_nombre || ''} ${data.cliente_apellido || ''}`.trim(),
        correo_cliente: data.cliente_correo || "",
        telefono_cliente: data.cliente_telefono || "",
        domicilio_cliente: data.cliente_domicilio || "",
        curp_cliente: data.cliente_curp || "",
        numero_poliza: data.nPoliza || "",
        tipo: data.tipo || "",
        tipo_texto: NOMBRES_RAMO[data.tipo] || data.tipo || "",
        fecha_inicio: data.fechaInicio || "",
        fecha_fin: data.fechaFinal || "",
        suma_asegurada: data.sumaAsegurada ?? "",
        prima_neta: data.prima_neta ?? "",
        derecho_poliza: data.derecho_poliza ?? "",
        iva: data.iva ?? "",
        prima_total: data.prima_total ?? "",
        forma_pago: data.formaPago || "",
        observaciones: data.observaciones || "",
        // Solo lectura: los registra / calcula el sistema
        fecha_emision: soloFecha(data.fechaEmision ?? data.fecha_emision),
        empleado_nombre: nombreDe(data.empleado ?? data.empleado_nombre),
        fecha_primer_pago: soloFecha(data.fechaPrimerPago ?? data.fecha_primer_pago),
        siguiente_pago: soloFecha(data.siguientePago ?? data.siguiente_pago),
        // Editable: el día de pago se cambia sin endoso
        dia_pago: data.diaPago != null ? String(data.diaPago) : "",
        bienes_seleccionados: bienesAsociados,
        precios_bienes: preciosIniciales,
        coberturas_ids: data.coberturas_ids || data.coberturas?.map((c) => c.id) || [],
        tiene_endoso: conEndoso === true,
        descripcion_endoso: "",
        fecha_efecto: hoyLocal()
      };

      original.current = JSON.parse(JSON.stringify(cargado));
      setFormData(cargado);
      setDocActual(data.tiene_documento ? { nombre: data.documento_nombre } : null);
      setSiguienteEndoso(data.siguiente_endoso || "");
      setBienesCliente(bienesResponse.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      setEditingPoliza(null);
      mostrarAviso(
        'error',
        'No se pudo abrir la póliza',
        mensajeError(error, 'No se pudieron cargar los datos de la póliza para editar.')
      );
    }
  };

  // Abre la edición con "Sí, agregar endoso" ya elegido (botón de la fila y del modal de coberturas)
  const handleAgregarEndoso = (p) => {
    if (!puedeEndosar(p)) {
      const est = estatusDe(p);
      const mensaje = est.includes('vencid')
        ? 'La póliza ya venció: no admite endosos. Renuévala para continuar.'
        : ['cancelada', 'cancelado'].includes(est)
          ? 'La póliza está cancelada: no admite endosos.'
          : 'Una póliza en borrador se modifica directamente con «Editar»; el endoso es solo para pólizas emitidas o activas.';
      mostrarAviso('advertencia', 'No se puede agregar endoso', mensaje);
      return;
    }
    handleEditar(p, true);
  };

  // Revisa TODOS los datos obligatorios antes de pegarle al servidor
  // y devuelve la lista de lo que falta, en español.
  const validarFormulario = () => {
    const f = formData;
    const faltan = [];

    if (!f.id_cliente) faltan.push('• Cliente: búscalo por RFC.');
    if (!f.tipo) faltan.push('• Ramo de la póliza.');

    if (!f.fecha_inicio) faltan.push('• Fecha de inicio.');
    if (!f.fecha_fin) faltan.push('• Fecha de fin.');
    if (f.fecha_inicio && f.fecha_fin && f.fecha_fin <= f.fecha_inicio) {
      faltan.push('• La fecha de fin debe ser posterior a la de inicio.');
    }

    if (!(num(f.suma_asegurada) > 0)) {
      faltan.push('• Suma asegurada (mayor a 0). Si no hay bienes seleccionados, captúrala a mano.');
    }
    if (vacio(f.prima_neta) || num(f.prima_neta) < 0) faltan.push('• Prima neta.');
    if (vacio(f.derecho_poliza) || num(f.derecho_poliza) < 0) faltan.push('• Derecho de póliza (puede ser 0).');
    if (!f.forma_pago) faltan.push('• Forma de pago.');

    return faltan;
  };

  const handleGuardar = async () => {
    try {
      const faltan = validarFormulario();
      if (faltan.length > 0) {
        mostrarAviso('error', 'Faltan datos', faltan.join('\n'));
        return;
      }

      if (erroresCob.hayErrores) {
        mostrarAviso(
          'error',
          'Revisa las coberturas',
          erroresCob.generales[0] || 'Hay bienes que no cumplen el rango de valor de las coberturas. Revisa los avisos en rojo.'
        );
        return;
      }

      // Validación de documentos y endoso
      const nuevosErrores = { poliza: erroresDocs.poliza || "" };
      const cambios = cambiosContractuales();

      if (editingPoliza && cambios.length > 0 && !esBorrador && !esCancelada && !formData.tiene_endoso) {
        mostrarAviso(
          'advertencia',
          'Falta el endoso',
          `Cambiaste: ${cambios.join(', ')}.\nUna póliza emitida o activa solo se modifica con un endoso: elige "Sí, agregar endoso" y sube su documento.`
        );
        document.getElementById('seccion-documentos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (formData.tiene_endoso) {
        if (!formData.descripcion_endoso.trim()) nuevosErrores.endoso_descripcion = 'Escribe la descripción del endoso.';
        if (!docEndoso) nuevosErrores.endoso_doc = erroresDocs.endoso_doc || 'Sube el documento del endoso (PDF).';
      }
      setErroresDocs(nuevosErrores);

      if (Object.values(nuevosErrores).some(Boolean)) {
        document.getElementById('seccion-documentos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Se envía como FormData porque lleva archivos PDF.
      // NO se envían: N° de póliza, IVA, prima total, fecha de emisión, empleado,
      // primer pago ni siguiente pago: los calcula / registra el servidor.
      const fd = new FormData();
      const simples = {
        id_cliente: formData.id_cliente,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        suma_asegurada: formData.suma_asegurada,
        prima_neta: formData.prima_neta,
        derecho_poliza: formData.derecho_poliza,
        forma_pago: formData.forma_pago,
        observaciones: formData.observaciones
      };
      Object.entries(simples).forEach(([k, v]) => fd.append(k, v ?? ""));

      // Día de pago: solo en pagos periódicos (el servidor calcula el siguiente pago)
      if (DIA_PAGO_APLICA.includes(formData.forma_pago) && formData.dia_pago) {
        fd.append('dia_pago', formData.dia_pago);
      }

      fd.append('bienes_sync', '1');
      formData.bienes_seleccionados.forEach(id => fd.append('bienes_ids[]', id));
      Object.entries(formData.precios_bienes).forEach(([id, precio]) => fd.append(`precios_bienes[${id}]`, precio));

      fd.append('coberturas_sync', '1');
      formData.coberturas_ids.forEach(id => fd.append('coberturas_ids[]', id));

      if (docPoliza) fd.append('documento', docPoliza);

      fd.append('tiene_endoso', formData.tiene_endoso ? '1' : '0');
      if (formData.tiene_endoso) {
        fd.append('descripcion_endoso', formData.descripcion_endoso.trim());
        fd.append('endoso_documento', docEndoso);
        if (editingPoliza && formData.fecha_efecto) fd.append('fecha_efecto', formData.fecha_efecto);
      }

      if (editingPoliza) {
        fd.append('_method', 'PUT');
        const r = await axios.post(`${API_URL}/polizas/${editingPoliza.id}`, fd, { headers: headers() });

        setShowModal(false);
        cargarPolizas();

        const e = r.data?.endoso;
        const ajuste = Number(e?.ajuste_prima || 0);
        mostrarAviso(
          'exito',
          'Póliza actualizada',
          e
            ? `Se emitió el endoso ${e.numero_endoso} (tipo ${e.tipo_endoso}).` +
            (ajuste !== 0 ? `\nAjuste de prima a prorrata: ${ajuste > 0 ? 'cobrar' : 'devolver'} ${dinero0(Math.abs(ajuste))}.` : '')
            : 'Los cambios se guardaron correctamente.'
        );
        return;
      }

      const res = await axios.post(`${API_URL}/polizas`, fd, { headers: headers() });

      setShowModal(false);
      cargarPolizas();
      mostrarAviso('exito', 'Póliza creada', `La póliza se creó con el N° ${res.data.poliza.numero_poliza}.`);
    } catch (error) {
      console.error('Error:', error);
      mostrarAviso('error', 'No se pudo guardar', mensajeError(error, 'Error al guardar la póliza.'));
    }
  };

  const getIconoPorTipoBien = (tipo) => {
    switch (tipo) {
      case 'vehiculo': return <CarIcon fontSize="small" />;
      case 'inmueble': return <HomeIcon fontSize="small" />;
      case 'electronico': return <ComputerIcon fontSize="small" />;
      case 'maquinaria': return <BuildIcon fontSize="small" />;
      default: return <AssignmentIcon fontSize="small" />;
    }
  };

  const handleVerDetalle = async (polizaOrId) => {
    try {
      const polizaId = polizaOrId?.id || polizaOrId;

      if (!polizaId) {
        console.error('No se pudo obtener el ID de la póliza', polizaOrId);
        mostrarAviso('error', 'No se pudo abrir el detalle', 'No se pudo identificar la póliza seleccionada.');
        return;
      }

      const [res, coberturasRes] = await Promise.all([
        axios.get(`${API_URL}/polizas/${polizaId}`, { headers: headers() }),
        axios.get(`${API_URL}/polizas/${polizaId}/coberturas`, { headers: headers() }),
      ]);

      const data = res.data;
      const coberturas = (coberturasRes.data?.coberturas || []).filter((c) => c.asignada);

      const emision = soloFecha(data.fechaEmision ?? data.fecha_emision);
      const emitidaPor = nombreDe(data.empleado ?? data.empleado_nombre);
      const diaPago = data.diaPago ?? data.dia_pago;
      const primerPago = soloFecha(data.fechaPrimerPago ?? data.fecha_primer_pago);
      const siguientePago = soloFecha(data.siguientePago ?? data.siguiente_pago);

      const items = [
        { icon: <AssignmentIcon />, label: "N° Póliza", value: data.nPoliza },
        { icon: <AssignmentIcon />, label: "Ramo", value: NOMBRES_RAMO[data.tipo] || data.tipo },
        { icon: <AssignmentIcon />, label: "Endoso", value: data.endoso },
        { icon: <PersonIcon />, label: "Cliente", value: data.cliente },
        { icon: <PersonIcon />, label: "Emitida por", value: emitidaPor || "—" },
        { icon: <DateRangeIcon />, label: "Fecha de emisión", value: emision || "—" },
        { icon: <DateRangeIcon />, label: "Fecha de inicio", value: data.fechaInicio },
        { icon: <DateRangeIcon />, label: "Fecha final", value: data.fechaFinal },
        { icon: <InfoIcon />, label: "Estatus", value: <EstatusPoliza valor={data.estatus} /> },
        { icon: <AttachMoneyIcon />, label: "Suma asegurada", value: `$${Number(data.sumaAsegurada).toLocaleString()}` },
        { icon: <PaymentIcon />, label: "Forma de pago", value: data.numero_pagos > 1 ? `${data.formaPago}: ${data.numero_pagos} pagos de ${dinero0(data.pago_periodico)}` : data.formaPago },
        { icon: <PaymentIcon />, label: "Día de pago", value: diaPago ? `Día ${diaPago} de cada periodo` : "—" },
        { icon: <DateRangeIcon />, label: "Fecha del primer pago", value: primerPago || "—" },
        { icon: <DateRangeIcon />, label: "Siguiente pago", value: siguientePago || "—" },
        { icon: <MonetizationOnIcon />, label: "Prima neta", value: `$${Number(data.prima_neta).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Derecho de póliza", value: `$${Number(data.derecho_poliza).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: data.iva_exento ? "IVA (exento)" : `IVA (${data.tasa_iva}%)`, value: `$${Number(data.iva).toLocaleString()}` },
        { icon: <MonetizationOnIcon />, label: "Prima total", value: `$${Number(data.prima_total).toLocaleString()}` },
        {
          icon: <InfoIcon />,
          label: "Coberturas contratadas",
          value: data.coberturas?.length ? data.coberturas.map((c) => c.nombre).join(", ") : "Sin coberturas asignadas",
          fullWidth: true
        },
        { icon: <NotesIcon />, label: "Observaciones", value: data.observaciones || "—", fullWidth: true }
      ];

      setPolizaDetalle({ ...data, items, coberturas });
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      mostrarAviso(
        'error',
        'No se pudo abrir el detalle',
        mensajeError(error, 'Error al cargar los detalles de la póliza.')
      );
    }
  };

  const handleCancelarClick = (p) => {
    if (!puedeCancelar(p)) {
      const vencida = estatusDe(p).includes('vencid');
      mostrarAviso(
        'advertencia',
        'No se puede cancelar',
        vencida ? 'La póliza ya venció: no se puede cancelar.' : 'La póliza ya está cancelada.'
      );
      return;
    }
    setMotivoCancelacion("");
    setPolizaToCancel(p);
  };

  const handleConfirmarCancelar = async () => {
    if (!polizaToCancel) return;

    if (motivoCancelacion.trim().length < 5) {
      mostrarAviso('error', 'Falta el motivo', 'Escribe el motivo de la cancelación (mínimo 5 caracteres).');
      return;
    }

    setCancelando(true);
    try {
      const res = await axios.post(
        `${API_URL}/polizas/${polizaToCancel.id}/cancelar`,
        { motivo: motivoCancelacion.trim() },
        { headers: headers() }
      );

      setPolizaToCancel(null);
      setMotivoCancelacion("");
      cargarPolizas();
      mostrarAviso('exito', 'Póliza cancelada', res.data?.message || 'La póliza se canceló correctamente.');
    } catch (error) {
      console.error('Error al cancelar:', error);
      // El modal se queda abierto para no perder el motivo escrito
      mostrarAviso('error', 'No se pudo cancelar', mensajeError(error, 'Error al cancelar la póliza.'));
    } finally {
      setCancelando(false);
    }
  };

  const handleItemsPerPageChange = (newItems) => {
    setItemsPerPage(newItems);
    setCurrentPage(1);
  };

  if (loading && polizas.length === 0) {
    return <div className="container py-4"><div className="text-center py-5"><div className="spinner-border text-success"></div><p>Cargando pólizas...</p></div></div>;
  }

  const disponibles = formData.tipo ? disponiblesPara(formData.tipo) : [];
  const cobDeLaSeleccion = coberturas.filter((c) => formData.coberturas_ids.includes(c.id));
  const cambiosPendientes = cambiosContractuales();

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Pólizas</h1>
      <hr className="mt-2 mb-3" />
      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar número de póliza..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="fw-bold mb-2">Estatus</div>
          <select
            className="form-select"
            style={{ width: "180px" }}
            value={estatusFilter}
            onChange={(e) => {
              setEstatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="Todos">Todos</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
            <option value="suspendida">Suspendida</option>
            <option value="en_renovacion">En renovación</option>
          </select>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton text="Nueva póliza" icon={<AddCircleRoundedIcon />} onClick={handleNuevaPoliza} />
        </div>
      </div>
      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={polizas}
          campos={campos}
          renderers={{
            estatus: (p) => <EstatusPoliza valor={p.estatus} />,
          }}
          acciones={[
            {
              titulo: "Ver detalle",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: (item) => handleVerDetalle(item)
            },
            {
              titulo: "Coberturas",
              clase: "tabla-btn-reasignar",
              icono: <VerifiedUserIcon fontSize="small" />,
              onClick: (p) => setPolizaCob({ id: p.id, nPoliza: p.nPoliza, estatus: p.estatus, tipo: p.tipo })
            },
            {
              titulo: "Agregar endoso",
              clase: "tabla-btn-edit",
              icono: <NoteAddIcon fontSize="small" />,
              visible: (p) => puedeEndosar(p),
              onClick: (p) => handleAgregarEndoso(p)
            },
            {
              titulo: "Cancelar póliza",
              clase: "tabla-btn-del",
              icono: <CancelIcon fontSize="small" />,
              visible: (p) => puedeCancelar(p),
              onClick: handleCancelarClick
            },
            {
              titulo: "Descargar póliza",
              clase: "tabla-btn-crear",
              icono: <PictureAsPdfIcon fontSize="small" />,
              onClick: (p) => handleDescargarPoliza(p)
            },
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

      <EditModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setBienesCliente([]);
          resetDocumentos();
        }}
        onSave={handleGuardar}
        editando={!!editingPoliza}
        titulo={editingPoliza ? "Editar póliza" : "Agregar nueva póliza"}
        subtitulo={editingPoliza ? "Una póliza emitida solo cambia con un endoso" : "Ingresa el RFC del cliente, el ramo, los bienes y las coberturas"}
        btnTexto={editingPoliza ? "Guardar cambios" : "Agregar póliza"}
        campos={getCampos(!!editingPoliza, formData.forma_pago)}
        // En una póliza nueva el N° se muestra como texto informativo; el real lo asigna el servidor
        formData={{ ...formData, numero_poliza: editingPoliza ? formData.numero_poliza : TEXTO_NUMERO_AUTO }}
        onChange={handleInputChange}
        customHandlers={{ onRfcChange: handleRfcChange }}
      >
        {editingPoliza && cambiosPendientes.length > 0 && !formData.tiene_endoso && (
          <div style={{ background: '#FFF4D6', color: '#7A5600', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
            Cambiaste: <strong>{cambiosPendientes.join(', ')}</strong>. Eso modifica el contrato: elige «Sí, agregar endoso» más abajo
            y sube su documento para poder guardar.
          </div>
        )}

        {/* ───── BIENES ───── */}
        {formData.id_cliente && conBienes(formData.tipo) && (
          <div style={{ marginTop: 20, padding: 15, borderTop: '1px solid #E5E7EB' }}>
            <div style={estiloTitulo}>
              <HomeIcon fontSize="small" />
              BIENES DEL CLIENTE A ASEGURAR
            </div>

            {cargandoBienes ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner-border text-success spinner-border-sm"></div>
                <p style={{ marginTop: 10, fontSize: 14, color: '#6B7280' }}>Cargando bienes...</p>
              </div>
            ) : bienesCliente.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 8, color: '#6B7280', fontSize: 14 }}>
                No hay bienes registrados para este cliente
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto',
                border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#FFFFFF'
              }}>
                {bienesCliente.map(bien => {
                  const errores = erroresCob.porBien[bien.id] || [];
                  const estaSeleccionado = formData.bienes_seleccionados.includes(bien.id);
                  const precioActual = formData.precios_bienes?.[bien.id] ?? bien.valor ?? 0;
                  const ocupadoEnOtra = bien.id_poliza && (!editingPoliza || bien.id_poliza !== editingPoliza.id);

                  return (
                    <div
                      key={bien.id}
                      style={{
                        padding: 12,
                        backgroundColor: estaSeleccionado ? (errores.length ? '#FEE2E2' : '#E0F2FE') : '#F9FAFB',
                        borderRadius: 8,
                        border: estaSeleccionado ? (errores.length ? '1px solid #DC2626' : '1px solid #0284C7') : '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => handleSeleccionarBien(bien.id)}
                          style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2 }}
                        />
                        <div style={{ flexShrink: 0 }}>{getIconoPorTipoBien(bien.tipo)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{bien.descripcion || 'Sin descripción'}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                            <span style={{ backgroundColor: '#E5E7EB', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                              {bien.tipo ? bien.tipo.charAt(0).toUpperCase() + bien.tipo.slice(1) : 'Tipo no especificado'}
                            </span>
                            {bien.marca && <span style={{ marginRight: 8 }}>Marca: {bien.marca}</span>}
                            {bien.modelo && <span style={{ marginRight: 8 }}>Modelo: {bien.modelo}</span>}
                            {ocupadoEnOtra && <span style={{ color: '#9A6B00' }}>· ya asegurado en otra póliza</span>}
                          </div>

                          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Valor asegurado del bien:</label>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ position: 'absolute', left: 8, fontSize: 14, color: '#6B7280' }}>$</span>
                              <input
                                type="number"
                                value={precioActual}
                                onChange={(e) => handlePrecioBienChange(bien.id, e.target.value)}
                                disabled={!estaSeleccionado}
                                style={{
                                  padding: '6px 8px 6px 24px', border: `1px solid ${estaSeleccionado ? '#D1D5DB' : '#E5E7EB'}`,
                                  borderRadius: 6, fontSize: 13, width: 150,
                                  backgroundColor: estaSeleccionado ? '#FFFFFF' : '#F3F4F6', cursor: estaSeleccionado ? 'text' : 'not-allowed'
                                }}
                              />
                            </div>
                            {estaSeleccionado && (
                              <span style={{ fontSize: 11, color: '#6B7280' }}>(se suma a la suma asegurada)</span>
                            )}
                          </div>

                          {estaSeleccionado && errores.map((msg, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>
                              <WarningIcon fontSize="small" style={{ verticalAlign: 'middle' }} /> {msg}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {bienesCliente.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280', textAlign: 'center', padding: 8, backgroundColor: '#F3F4F6', borderRadius: 6 }}>
                {formData.bienes_seleccionados.length} bien(es) seleccionado(s) · valor total {dinero0(resumen.valorBienes)}
              </div>
            )}
          </div>
        )}

        {/* ───── COBERTURAS ───── */}
        <div style={{ marginTop: 20, padding: 15, borderTop: '1px solid #E5E7EB' }}>
          <div style={estiloTitulo}>ASIGNACIÓN DE COBERTURAS</div>
          {!formData.tipo ? (
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, color: '#6B7280', fontSize: 13 }}>
              Selecciona primero el ramo de la póliza para consultar las coberturas disponibles.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                Selecciona manualmente las coberturas contratadas. Ninguna cobertura se asigna automáticamente.
              </div>
              {editingPoliza && !coberturasEditables && (
                <div style={{ background: '#E6F2EC', color: '#14573A', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>
                  Para cambiar las coberturas de esta póliza elige «Sí, agregar endoso» en la sección Endoso.
                </div>
              )}
              {disponibles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, color: '#6B7280', fontSize: 13 }}>
                  No hay coberturas activas para este ramo. Créalas en el módulo Coberturas.
                </div>
              ) : (
                disponibles.map((c) => (
                  <FichaCobertura
                    key={c.id}
                    cobertura={c}
                    checked={formData.coberturas_ids.includes(c.id)}
                    onChange={() => alternarCobertura(c.id)}
                    disabled={!coberturasEditables}
                    error={formData.coberturas_ids.includes(c.id) ? erroresCob.porCobertura[c.id] : ''}
                  />
                ))
              )}
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#14573A', fontSize: 13 }}>
                <strong>{cobDeLaSeleccion.length} cobertura(s) seleccionada(s)</strong>
                {cobDeLaSeleccion.length > 0 ? (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                    {cobDeLaSeleccion.map((c) => <li key={c.id}>{c.nombre}</li>)}
                  </ul>
                ) : (
                  <div style={{ marginTop: 4 }}>Selecciona las coberturas contratadas por el cliente.</div>
                )}
              </div>
              {erroresCob.generales.filter((g) => !Object.values(erroresCob.porCobertura).includes(g)).map((g, i) => (
                <div key={i} style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{g}</div>
              ))}
            </>
          )}
        </div>

        {/* ───── RESUMEN ───── */}
        {formData.tipo && (
          <div style={{ marginTop: 20, padding: 15, borderTop: '1px solid #E5E7EB' }}>
            <div style={estiloTitulo}>RESUMEN DE LA PÓLIZA</div>

            {resumen.infraseguro !== null && (
              <div style={{ background: '#FFF4D6', color: '#7A5600', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
                <strong>Infraseguro:</strong> la suma asegurada ({dinero0(resumen.suma)}) es menor al valor de los bienes ({dinero0(resumen.valorBienes)}):
                cubre el {(resumen.infraseguro * 100).toFixed(1)}%. En un siniestro parcial solo se pagará ese porcentaje del daño
                (regla proporcional), salvo en coberturas a primer riesgo.
              </div>
            )}

            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Ramo', NOMBRES_RAMO[formData.tipo] || formData.tipo],
                  ['Vigencia', formData.fecha_inicio && formData.fecha_fin ? `${formData.fecha_inicio} al ${formData.fecha_fin} (${resumen.meses} meses)` : '—'],
                  ['Suma asegurada', dinero0(resumen.suma)],
                  ['Prima neta', dinero0(resumen.neta)],
                  ['Derecho de póliza', dinero0(resumen.derecho)],
                  ['Subtotal', dinero0(resumen.subtotal)],
                  [resumen.exento ? 'IVA (exento en este ramo)' : `IVA (${parametros.tasa_iva}%)`, dinero0(resumen.iva)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '5px 0', color: '#6B7280', borderBottom: '1px dashed #E5E7EB' }}>{k}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', borderBottom: '1px dashed #E5E7EB' }}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 700 }}>Prima total</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>{dinero0(resumen.total)}</td>
                </tr>
                {formData.forma_pago && (
                  <tr>
                    <td style={{ padding: '5px 0', color: '#6B7280' }}>Forma de pago</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>
                      {resumen.pagos > 1
                        ? `${resumen.pagos} pagos de ${dinero0(resumen.total / resumen.pagos)} (${formData.forma_pago}, sin recargo por fraccionamiento)`
                        : `Un solo pago (${formData.forma_pago})`}
                    </td>
                  </tr>
                )}
                {DIA_PAGO_APLICA.includes(formData.forma_pago) && formData.dia_pago && (
                  <tr>
                    <td style={{ padding: '5px 0', color: '#6B7280' }}>Día de pago</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>Día {formData.dia_pago} de cada periodo</td>
                  </tr>
                )}
                {formData.fecha_inicio && MESES_POR_FORMA[formData.forma_pago] && (
                  <tr>
                    <td style={{ padding: '5px 0', color: '#6B7280' }}>Primer pago / siguiente</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>
                      {formData.fecha_primer_pago || formData.fecha_inicio} / {formData.siguiente_pago || sumarMeses(formData.fecha_inicio, MESES_POR_FORMA[formData.forma_pago])}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '5px 0', color: '#6B7280', verticalAlign: 'top' }}>Coberturas</td>
                  <td style={{ padding: '5px 0', textAlign: 'right' }}>
                    {cobDeLaSeleccion.length ? cobDeLaSeleccion.map((c) => c.nombre).join(', ') : 'Ninguna seleccionada'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Documento de la póliza + Endoso: mismo diseño que el resto del formulario */}
        <div id="seccion-documentos">

          {/* DOCUMENTO DE LA PÓLIZA */}
          <div className="balam-section-title">DOCUMENTO DE LA PÓLIZA</div>
          <div className="balam-fields-grid">

            {editingPoliza && docActual && (
              <div className="balam-field balam-full">
                <label>DOCUMENTO ACTUAL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                  <span>{docActual.nombre || 'documento.pdf'}</span>
                  <button
                    type="button"
                    className="balam-btn cancel"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => abrirPdf(`${API_URL}/polizas/${editingPoliza.id}/documento`)}
                  >
                    Ver PDF
                  </button>
                </div>
              </div>
            )}

            <div className="balam-field balam-full">
              <label style={{ color: erroresDocs.poliza ? COLOR_ERROR : "" }}>
                {docActual ? 'REEMPLAZAR DOCUMENTO (PDF)' : 'SUBIR DOCUMENTO (PDF)'}
              </label>
              <input
                key={`doc-poliza-${fileKey}`}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleArchivo(e, 'poliza')}
                style={{ borderColor: erroresDocs.poliza ? COLOR_ERROR : "" }}
              />
              <span style={estiloAyuda}>Solo archivos PDF · Tamaño máximo: {MAX_PDF_MB} MB</span>
              {erroresDocs.poliza && (
                <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.poliza}</span>
              )}
            </div>
          </div>

          {/* ENDOSO */}
          <div className="balam-section-title" style={{ marginTop: 24 }}>ENDOSO</div>
          <div className="balam-fields-grid">

            <div className="balam-field">
              <label>{editingPoliza ? '¿AGREGAR UN ENDOSO?' : '¿TIENE ENDOSO?'}</label>
              <select
                className="balam-select"
                value={formData.tiene_endoso ? 'si' : 'no'}
                onChange={(e) => handleTieneEndoso(e.target.value === 'si')}
              >
                <option value="no">{editingPoliza ? 'No agregar endoso' : 'No tiene endoso'}</option>
                <option value="si">{editingPoliza ? 'Sí, agregar endoso' : 'Sí tiene endoso'}</option>
              </select>
              {editingPoliza && (
                <span style={estiloAyuda}>Obligatorio para cambiar suma asegurada, vigencia, prima, forma de pago, bienes o coberturas</span>
              )}
            </div>

            {formData.tiene_endoso && (
              <>
                {editingPoliza && (
                  <div className="balam-field">
                    <label>EL ENDOSO ENTRA EN VIGOR EL</label>
                    <input
                      type="date"
                      value={formData.fecha_efecto}
                      min={original.current?.fecha_inicio || ''}
                      max={original.current?.fecha_fin || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_efecto: e.target.value }))}
                    />
                    <span style={estiloAyuda}>El ajuste de prima se calcula a prorrata desde esta fecha hasta el fin de la vigencia</span>
                  </div>
                )}

                {/* El N° de endoso lo asigna el sistema a partir del N° de póliza */}
                <div className="balam-field">
                  <label>N° DE ENDOSO</label>
                  <input
                    type="text"
                    readOnly
                    value={editingPoliza ? (siguienteEndoso || TEXTO_ENDOSO_AUTO) : TEXTO_ENDOSO_AUTO}
                  />
                  <span style={estiloAyuda}>Se arma con el N° de póliza y un consecutivo</span>
                </div>

                <div className="balam-field balam-full">
                  <label style={{ color: erroresDocs.endoso_descripcion ? COLOR_ERROR : "" }}>
                    DESCRIPCIÓN DEL ENDOSO<span style={estiloRequerido}>*</span>
                  </label>
                  <textarea
                    className="balam-textarea"
                    rows={3}
                    maxLength={255}
                    value={formData.descripcion_endoso}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion_endoso: e.target.value }))}
                    placeholder="Describe qué cambio se hizo a la póliza"
                    style={{ borderColor: erroresDocs.endoso_descripcion ? COLOR_ERROR : "" }}
                  />
                  {erroresDocs.endoso_descripcion && (
                    <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.endoso_descripcion}</span>
                  )}
                </div>

                <div className="balam-field balam-full">
                  <label style={{ color: erroresDocs.endoso_doc ? COLOR_ERROR : "" }}>
                    DOCUMENTO DEL ENDOSO (PDF)<span style={estiloRequerido}>*</span>
                  </label>
                  <input
                    key={`doc-endoso-${fileKey}`}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => handleArchivo(e, 'endoso')}
                    style={{ borderColor: erroresDocs.endoso_doc ? COLOR_ERROR : "" }}
                  />
                  <span style={estiloAyuda}>Solo archivos PDF · Tamaño máximo: {MAX_PDF_MB} MB</span>
                  {erroresDocs.endoso_doc && (
                    <span style={{ ...estiloMensaje, color: COLOR_ERROR }}>{erroresDocs.endoso_doc}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </EditModal>

      {polizaToCancel && (
        <div
          className="balam-overlay"
          onClick={(e) => e.target === e.currentTarget && !cancelando && setPolizaToCancel(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className="evi-aviso-icono" style={ESTILO_ICONO_ADVERTENCIA}>
              <WarningAmberIcon style={{ fontSize: 40 }} />
            </div>
            <h3>Cancelar póliza</h3>
            <p>
              <strong>Póliza #{polizaToCancel.nPoliza}</strong><br />
              Cliente: {polizaToCancel.cliente}
            </p>
            <p style={{ fontSize: 13 }}>
              La póliza no se borra: queda en el sistema como cancelada, solo de consulta, con su historial y documentos.
              Esta acción no se puede deshacer.
            </p>
            <textarea
              className="balam-textarea"
              rows={3}
              maxLength={200}
              placeholder="Motivo de la cancelación (obligatorio)"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              style={{ width: '100%', marginTop: 8 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
              <button className="balam-btn cancel" disabled={cancelando} onClick={() => setPolizaToCancel(null)}>
                Volver
              </button>
              <button className="balam-btn save" disabled={cancelando} onClick={handleConfirmarCancelar}>
                {cancelando ? 'Cancelando...' : 'Cancelar póliza'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PolizaDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={polizaDetalle ? `Póliza #${polizaDetalle.nPoliza}` : ""}
        subtitulo={polizaDetalle ? polizaDetalle.cliente : ""}
        avatar="P"
        items={polizaDetalle ? polizaDetalle.items : []}
        coberturas={polizaDetalle?.coberturas || []}
        documento={polizaDetalle?.tiene_documento ? { nombre: polizaDetalle.documento_nombre } : null}
        onVerDocumento={() => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/documento`)}
        endosos={polizaDetalle ? polizaDetalle.endosos || [] : []}
        onVerDocumentoEndoso={(e) => abrirPdf(`${API_URL}/polizas/${polizaDetalle.id}/endosos/${e.id}/documento`)}
      />

      {/* COBERTURAS CONTRATADAS DE LA PÓLIZA */}
      <PolizaCoberturasModal
        open={!!polizaCob}
        poliza={polizaCob}
        onClose={() => setPolizaCob(null)}
        onGuardado={cargarPolizas}
        onAgregarEndoso={(p) => handleAgregarEndoso(p)}
      />

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

      {/* MODAL DE DESCARGA DEL LISTADO (PDF / Excel / CSV) */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_URL}/exportar/polizas`}
        params={{ search: searchTerm, estatus: estatusFilter }}
        nombreArchivo="polizas"
        titulo="Descargar listado de pólizas"
        nota={
          searchTerm || estatusFilter !== "Todos"
            ? `Se exportarán las pólizas con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatusFilter !== "Todos" ? ` (estatus: ${estatusFilter})` : ""}.`
            : "Se exportarán todas las pólizas."
        }
      />
    </div>
  );
};

export default Polizas;