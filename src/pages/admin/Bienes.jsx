import { useState, useEffect, useCallback, useRef } from "react";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CategoryIcon from "@mui/icons-material/Category";
import BrandingWatermarkIcon from "@mui/icons-material/BrandingWatermark";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import DescargarModal from "../../components/DescargarModal";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/bienes`
  : "/api/bienes";

const MAX_FOTO_MB = 2;
const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024;
const RFC_MIN = 8;

// Tamaño de la miniatura en la tabla
const FOTO_TABLA_SIZE = 110;

const TIPOS_BIEN = [
  { value: "vehiculo", label: "Vehículo" },
  { value: "inmueble", label: "Inmueble" },
  { value: "electronico", label: "Electrónico" },
  { value: "maquinaria", label: "Maquinaria" },
];

// Tabla compacta: lo demás se ve en el botón "Ver"
const columnas = ["Foto", "Cliente", "Tipo", "Descripción", "Marca", "Valor", "Estado", "Acciones"];
const campos = ["foto_vista", "cliente_vista", "tipo", "descripcion", "marca", "valor", "estado_bienes"];

const CAMPOS_ESPECIFICOS = {
  vehiculo: [
    {
      label: "Tipo Vehículo",
      name: "tipo_vehiculo",
      type: "select",
      options: [
        { value: "sedan", label: "Sedán" },
        { value: "suv", label: "SUV" },
        { value: "pickup", label: "Pick-up" },
        { value: "motocicleta", label: "Motocicleta" },
        { value: "camion", label: "Camión" },
        { value: "van", label: "Van" },
        { value: "otro", label: "Otro" },
      ],
    },
    { label: "Año", name: "año", type: "number" },
    { label: "Color", name: "color", type: "text" },
    { label: "Placas", name: "numero_placas", type: "text" },
    { label: "Número Motor", name: "numero_motor", type: "text" },
    { label: "VIN", name: "numero_vin", type: "text" },
    {
      label: "Combustible",
      name: "tipo_combustible",
      type: "select",
      options: [
        { value: "gasolina", label: "Gasolina" },
        { value: "diesel", label: "Diesel" },
        { value: "electrico", label: "Eléctrico" },
        { value: "hibrido", label: "Híbrido" },
        { value: "gas", label: "Gas" },
      ],
    },
    {
      label: "Uso Vehículo",
      name: "uso_vehiculo",
      type: "select",
      options: [
        { value: "particular", label: "Particular" },
        { value: "comercial", label: "Comercial" },
        { value: "publico", label: "Público" },
        { value: "carga", label: "Carga" },
      ],
    },
  ],
  inmueble: [
    {
      label: "Tipo Inmueble",
      name: "tipo_inmueble",
      type: "select",
      options: [
        { value: "casa", label: "Casa" },
        { value: "departamento", label: "Departamento" },
        { value: "local_comercial", label: "Local Comercial" },
        { value: "bodega", label: "Bodega" },
        { value: "terreno", label: "Terreno" },
        { value: "oficina", label: "Oficina" },
      ],
    },
    {
      label: "Uso Inmueble",
      name: "uso_inmueble",
      type: "select",
      options: [
        { value: "habitacional", label: "Habitacional" },
        { value: "comercial", label: "Comercial" },
        { value: "mixto", label: "Mixto" },
        { value: "industrial", label: "Industrial" },
      ],
    },
    { label: "Colonia", name: "colonia", type: "text" },
    { label: "Núm. Exterior", name: "numero_exterior", type: "text" },
    { label: "Núm. Interior", name: "numero_interior", type: "text" },
    { label: "Metros Cuadrados", name: "metros_cuadrados", type: "number" },
    { label: "Núm. Pisos", name: "num_pisos", type: "number" },
    {
      label: "Construcción",
      name: "tipo_construccion",
      type: "select",
      options: [
        { value: "concreto", label: "Concreto" },
        { value: "madera", label: "Madera" },
        { value: "adobe", label: "Adobe" },
        { value: "metal", label: "Metal" },
        { value: "mixto", label: "Mixto" },
      ],
    },
    { label: "Año Construcción", name: "año_construccion", type: "number" },
    { label: "Número Escritura", name: "numero_escritura", type: "text" },
    { label: "Ubicación", name: "ubicacion", type: "text" },
  ],
  electronico: [
    {
      label: "Tipo Electrónico",
      name: "tipo_electronico",
      type: "select",
      options: [
        { value: "celular", label: "Celular" },
        { value: "laptop", label: "Laptop" },
        { value: "tablet", label: "Tablet" },
        { value: "camara", label: "Cámara" },
        { value: "televisor", label: "Televisor" },
        { value: "otro", label: "Otro" },
      ],
    },
    { label: "Número IMEI", name: "numero_imei", type: "text" },
    { label: "Color Electrónico", name: "color_electronico", type: "text" },
  ],
  maquinaria: [
    {
      label: "Tipo Maquinaria",
      name: "tipo_maquinaria",
      type: "select",
      options: [
        { value: "agricola", label: "Agrícola" },
        { value: "construccion", label: "Construcción" },
        { value: "industrial", label: "Industrial" },
        { value: "medica", label: "Médica" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      label: "Uso Maquinaria",
      name: "uso_maquinaria",
      type: "select",
      options: [
        { value: "propio", label: "Propio" },
        { value: "rentado", label: "Rentado" },
        { value: "leasing", label: "Leasing" },
      ],
    },
    { label: "Ubicación Operación", name: "ubicacion_operacion", type: "text" },
  ],
};

// Campos del cliente (solo lectura, se llenan al buscar por RFC)
const CAMPOS_CLIENTE = [
  { label: "Nombre del cliente", name: "nombre_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Correo", name: "correo_cliente", type: "email", seccion: "Información del Cliente", readOnly: true },
  { label: "Teléfono", name: "telefono_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "Domicilio", name: "domicilio_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
  { label: "CURP", name: "curp_cliente", type: "text", seccion: "Información del Cliente", readOnly: true },
];

// Datos que solo sirven para mostrar el formulario: nunca se envían al servidor
const CLAVES_SOLO_FORMULARIO = [
  "foto",
  "foto_url",
  "rfc_buscar",
  "nombre_cliente",
  "correo_cliente",
  "telefono_cliente",
  "domicilio_cliente",
  "curp_cliente",
];

const DATOS_CLIENTE_VACIOS = {
  id_cliente: "",
  nombre_cliente: "",
  correo_cliente: "",
  telefono_cliente: "",
  domicilio_cliente: "",
  curp_cliente: "",
};

const FORM_VACIO = {
  rfc_buscar: "",
  ...DATOS_CLIENTE_VACIOS,
  id_aseguradora: 1,
  id_poliza: 1,
  tipo: "vehiculo",
  marca: "",
  modelo: "",
  numero_serie: "",
  descripcion: "",
  valor: "",
  fecha_adquisicion: new Date().toISOString().split("T")[0],
  estado_bienes: "bueno",
  nivel_riesgo: "bajo",
  numero_factura: "",
  proveedor: "",
  foto: null,
};

// ----------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------
const formatearTamano = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const dinero = (v) =>
  `$${parseFloat(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ") : "—");

const nombreCompleto = (c) =>
  c ? [c.nombre, c.apellidos ?? c.apellido].filter(Boolean).join(" ") : "";

// El teléfono llega como "numero_de_telefono" desde la tabla clientes
const telefonoCliente = (c) => c?.telefono ?? c?.numero_de_telefono ?? "";

const COLOR_RIESGO = {
  bajo: { bg: "#DDF3E7", color: "#1B6B45" },
  medio: { bg: "#FFF4D6", color: "#9A6B00" },
  alto: { bg: "#FBE0DC", color: "#B3281B" },
};

const RiesgoBadge = ({ nivel }) => {
  const c = COLOR_RIESGO[nivel] || { bg: "#eee", color: "#555" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
      }}
    >
      {nivel || "—"}
    </span>
  );
};

// Celda de la columna "Foto": miniatura grande con el nombre del archivo como leyenda
const FotoCelda = ({ bien }) => {
  const tieneFoto = !!bien.foto_url;
  const leyenda = tieneFoto ? bien.foto_nombre || bien.descripcion || "Fotografía" : "Sin fotografía";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        width: "100%",
        maxWidth: FOTO_TABLA_SIZE + 20,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: FOTO_TABLA_SIZE,
          height: FOTO_TABLA_SIZE,
          flexShrink: 0,
          borderRadius: 10,
          border: "1px solid #e5e5e5",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {tieneFoto ? (
          <img
            src={bien.foto_url}
            alt={leyenda}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImageIcon style={{ color: "#c4c4c4", fontSize: 40 }} />
        )}
      </div>
      <span
        title={leyenda}
        style={{
          fontSize: 11,
          color: "#777",
          lineHeight: 1.2,
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {leyenda}
      </span>
    </div>
  );
};

// Celda de la columna "Cliente": solo el nombre
const ClienteCelda = ({ cliente }) => {
  const nombre = nombreCompleto(cliente);

  if (!nombre) {
    return <span style={{ color: "#9aa5a0" }}>—</span>;
  }

  return (
    <span title={nombre} style={{ fontWeight: 600 }}>
      {nombre}
    </span>
  );
};

// Foto grande para el modal de detalle
const FotoDetalle = ({ src, alt }) => (
  <div
    style={{
      background: "#f3f5f4",
      border: "1px solid #e3e8e5",
      borderRadius: 12,
      minHeight: 220,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      overflow: "hidden",
    }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: 8 }}
      />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#9aa5a0" }}>
        <ImageIcon style={{ fontSize: 56 }} />
        <span style={{ fontSize: 13 }}>Este bien no tiene fotografía</span>
      </div>
    )}
  </div>
);

const Bienes = () => {
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [bienToDelete, setBienToDelete] = useState(null);
  const [bienDetalle, setBienDetalle] = useState(null);
  const [editingBien, setEditingBien] = useState(null);
  const [showDescarga, setShowDescarga] = useState(false);

  // Aviso con el diseño del sistema (reemplaza alert)
  const [aviso, setAviso] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const timerRfcRef = useRef(null);

  const mostrarAviso = useCallback((titulo, mensaje) => {
    setAviso({ titulo, mensaje });
  }, []);

  const getHeaders = () => ({
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        const finalData = Array.isArray(data) ? data : data.data || [];
        setBienes(finalData.sort((a, b) => b.id - a.id));
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error al cargar bienes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------
  // Búsqueda de cliente por RFC (mismo servicio que usa Pólizas).
  // Sirve tanto al crear como al editar un bien.
  // ---------------------------------------------------------------
  const buscarClientePorRfc = async (rfc) => {
    if (!rfc || rfc.length < RFC_MIN) {
      setFormData((prev) => ({ ...prev, ...DATOS_CLIENTE_VACIOS }));
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/polizas/buscar-ultima-por-rfc?rfc=${encodeURIComponent(rfc)}`,
        { headers: getHeaders() },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = response.ok ? await response.json() : null;
      const cliente = data?.cliente;

      if (!cliente) {
        setFormData((prev) => ({
          ...prev,
          ...DATOS_CLIENTE_VACIOS,
          nombre_cliente:
            response.status === 404 || response.ok
              ? "Cliente no encontrado"
              : "No se pudo consultar el cliente",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        id_cliente: cliente.id,
        nombre_cliente: nombreCompleto(cliente),
        correo_cliente: cliente.correo || "",
        telefono_cliente: telefonoCliente(cliente),
        domicilio_cliente: cliente.domicilio || "",
        curp_cliente: cliente.curp || "",
      }));
    } catch (error) {
      console.error("Error al buscar cliente por RFC:", error);
      setFormData((prev) => ({
        ...prev,
        ...DATOS_CLIENTE_VACIOS,
        nombre_cliente: "No se pudo consultar el cliente",
      }));
    }
  };

  const handleRfcChange = (e) => {
    const rfc = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, rfc_buscar: rfc }));

    if (timerRfcRef.current) clearTimeout(timerRfcRef.current);
    timerRfcRef.current = setTimeout(() => buscarClientePorRfc(rfc), 500);
  };

  // ---------------------------------------------------------------
  // Formulario
  // ---------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "foto") {
      const archivo = files?.[0] || null;

      if (archivo && !archivo.type.startsWith("image/")) {
        e.target.value = "";
        setFormData((prev) => ({ ...prev, foto: null }));
        mostrarAviso(
          "Formato no válido",
          `"${archivo.name}" no es una imagen.\nSelecciona una fotografía (JPG, PNG, WEBP…).`,
        );
        return;
      }

      if (archivo && archivo.size > MAX_FOTO_BYTES) {
        e.target.value = ""; // limpia la selección del input
        setFormData((prev) => ({ ...prev, foto: null }));
        mostrarAviso(
          "Archivo demasiado grande",
          `"${archivo.name}" pesa ${formatearTamano(archivo.size)}.\nEl tamaño máximo permitido es de ${MAX_FOTO_MB} MB.`,
        );
        return;
      }

      setFormData((prev) => ({ ...prev, foto: archivo }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingBien(null);
    setFormData(FORM_VACIO);
    if (timerRfcRef.current) clearTimeout(timerRfcRef.current);
  };

  const handleNuevoBien = () => {
    cerrarModal();
    setShowModal(true);
  };

  const handleEditar = (item) => {
    // La tabla recibe el valor ya formateado ("$1,000.00"); se usa el registro original
    const original = bienes.find((b) => b.id === item.id) || item;
    const cliente = original.cliente;

    setEditingBien(original);
    // Se precargan el RFC y los datos del cliente actual: el usuario puede
    // dejarlos o escribir otro RFC para cambiar el cliente del bien.
    // 'foto' se resetea a null: si el usuario no sube una nueva,
    // no se reenvía el string base64 (foto_url) como si fuera un archivo
    setFormData({
      ...original,
      rfc_buscar: cliente?.rfc || "",
      nombre_cliente: nombreCompleto(cliente),
      correo_cliente: cliente?.correo || "",
      telefono_cliente: telefonoCliente(cliente),
      domicilio_cliente: cliente?.domicilio || "",
      curp_cliente: cliente?.curp || "",
      foto: null,
    });
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const isEdit = !!editingBien;

    // Tanto al crear como al editar el bien debe quedar ligado a un cliente válido
    if (!formData.id_cliente) {
      mostrarAviso(
        "Falta el cliente",
        isEdit
          ? "El RFC escrito no corresponde a un cliente. Corrígelo o déjalo como estaba para conservar el cliente actual."
          : "Escribe el RFC del cliente para asociarle el bien.",
      );
      return;
    }

    setLoading(true);
    const url = isEdit ? `${API_URL}/${editingBien.id}` : API_URL;

    try {
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "foto") {
          if (value instanceof File) fd.append("foto", value);
          return; // si no hay archivo nuevo, no se manda nada
        }
        if (CLAVES_SOLO_FORMULARIO.includes(key)) return;
        if (value === null || value === undefined) return;
        if (typeof value === "object") return; // relaciones anidadas (cliente, póliza…)

        fd.append(key, key === "valor" ? parseFloat(value) || 0 : value);
      });

      // Laravel necesita este spoof para procesar archivos en un "PUT"
      if (isEdit) fd.append("_method", "PUT");

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(), // sin Content-Type: el navegador arma el boundary solo
        body: fd,
      });

      if (response.ok) {
        cerrarModal();
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const detalle = errorData.errors
          ? Object.values(errorData.errors).flat().join("\n")
          : null;
        mostrarAviso(
          "No se pudo guardar",
          detalle || errorData.message || "El servidor devolvió un error.",
        );
      }
    } catch (error) {
      console.error("Error en Fetch:", error);
      mostrarAviso("No se pudo guardar", "No hay conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (item) => {
    setBienToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${bienToDelete.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (response.ok) {
        setShowDeleteModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (item) => {
    // Registro original, sin el valor formateado de la tabla
    setBienDetalle(bienes.find((b) => b.id === item.id) || item);
    setShowDetalleModal(true);
  };

  // Búsqueda + filtro por tipo (se filtra en memoria, igual que antes).
  // También busca por nombre y RFC del cliente.
  const filteredBienes = bienes.filter((b) => {
    const q = searchTerm.toLowerCase();

    const coincideBusqueda =
      b.tipo?.toLowerCase().includes(q) ||
      b.modelo?.toLowerCase().includes(q) ||
      b.descripcion?.toLowerCase().includes(q) ||
      b.marca?.toLowerCase().includes(q) ||
      nombreCompleto(b.cliente).toLowerCase().includes(q) ||
      b.cliente?.rfc?.toLowerCase().includes(q);

    const coincideTipo = tipoFilter === "Todos" || b.tipo === tipoFilter;

    return coincideBusqueda && coincideTipo;
  });

  const paginated = filteredBienes
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((item) => ({
      ...item,
      valor: dinero(item.valor),
      foto_vista: <FotoCelda bien={item} />,
      cliente_vista: <ClienteCelda cliente={item.cliente} />,
    }));

  // ---------------------------------------------------------------
  // Campos del formulario (por secciones) — iguales al crear y al editar
  // ---------------------------------------------------------------
  const camposFormulario = [
    { label: "RFC del Cliente", name: "rfc_buscar", type: "text", seccion: "Buscar Cliente", fullWidth: true },
    ...CAMPOS_CLIENTE,

    {
      label: "Tipo de Bien",
      name: "tipo",
      type: "select",
      options: TIPOS_BIEN,
      seccion: "Datos del Bien",
    },
    { label: "Descripción", name: "descripcion", type: "text", seccion: "Datos del Bien" },
    { label: "Marca", name: "marca", type: "text", seccion: "Datos del Bien" },
    { label: "Modelo", name: "modelo", type: "text", seccion: "Datos del Bien" },
    { label: "# de Serie", name: "numero_serie", type: "text", seccion: "Datos del Bien" },
    { label: "Valor Estimado", name: "valor", type: "number", seccion: "Datos del Bien" },
    { label: "Fecha Adquisición", name: "fecha_adquisicion", type: "date", seccion: "Datos del Bien" },
    {
      label: "Nivel de Riesgo",
      name: "nivel_riesgo",
      type: "select",
      seccion: "Datos del Bien",
      options: [
        { value: "bajo", label: "Bajo" },
        { value: "medio", label: "Medio" },
        { value: "alto", label: "Alto" },
      ],
    },
    {
      label: "Estado Físico",
      name: "estado_bienes",
      type: "select",
      seccion: "Datos del Bien",
      options: [
        { value: "excelente", label: "Excelente" },
        { value: "bueno", label: "Bueno" },
        { value: "regular", label: "Regular" },
        { value: "malo", label: "Malo" },
      ],
    },

    ...(CAMPOS_ESPECIFICOS[formData.tipo] || []).map((c) => ({
      ...c,
      seccion: "Características del Bien",
    })),

    {
      label: editingBien
        ? `Reemplazar fotografía (opcional, máx. ${MAX_FOTO_MB} MB)`
        : `Fotografía del bien (máx. ${MAX_FOTO_MB} MB)`,
      name: "foto",
      type: "file",
      seccion: "Fotografía",
      fullWidth: true,
    },
  ];

  // ---------------------------------------------------------------
  // Detalle (mismo formato que Evidencias)
  // ---------------------------------------------------------------
  const getDetalleItems = () => {
    if (!bienDetalle) return [];
    const b = bienDetalle;
    const cliente = b.cliente;

    const etiquetaTipo = TIPOS_BIEN.find((t) => t.value === b.tipo)?.label || capitalizar(b.tipo);

    const items = [
      {
        icon: <ImageIcon />,
        label: "Fotografía",
        value: <FotoDetalle src={b.foto_url} alt={b.descripcion || "Bien"} />,
        fullWidth: true,
      },
    ];

    // Datos del cliente propietario del bien
    if (cliente) {
      items.push(
        { icon: <PersonIcon />, label: "Cliente", value: nombreCompleto(cliente) || "—" },
        { icon: <BadgeIcon />, label: "RFC", value: cliente.rfc || "—" },
        { icon: <EmailIcon />, label: "Correo", value: cliente.correo || "—" },
        { icon: <PhoneIcon />, label: "Teléfono", value: telefonoCliente(cliente) || "—" },
        { icon: <HomeIcon />, label: "Domicilio", value: cliente.domicilio || "—" },
        { icon: <BadgeIcon />, label: "CURP", value: cliente.curp || "—" },
      );
    }

    items.push(
      { icon: <CategoryIcon />, label: "Categoría", value: etiquetaTipo },
      { icon: <DescriptionIcon />, label: "Descripción", value: b.descripcion || "—" },
      { icon: <BrandingWatermarkIcon />, label: "Marca", value: b.marca || "—" },
      { icon: <DescriptionIcon />, label: "Modelo", value: b.modelo || "—" },
      { icon: <DescriptionIcon />, label: "# de Serie", value: b.numero_serie || "—" },
      { icon: <AttachMoneyIcon />, label: "Valor estimado", value: dinero(b.valor) },
      { icon: <CalendarMonthIcon />, label: "Fecha de adquisición", value: b.fecha_adquisicion || "—" },
      { icon: <AssignmentIndIcon />, label: "Estado físico", value: capitalizar(b.estado_bienes) },
      { icon: <InfoIcon />, label: "Nivel de riesgo", value: <RiesgoBadge nivel={b.nivel_riesgo} /> },
      { icon: <DescriptionIcon />, label: "Número de factura", value: b.numero_factura || "—" },
      { icon: <DescriptionIcon />, label: "Proveedor", value: b.proveedor || "—" },
    );

    // Características propias del tipo de bien
    (CAMPOS_ESPECIFICOS[b.tipo] || []).forEach((c) => {
      const valor = b[c.name];
      if (valor === null || valor === undefined || valor === "") return;

      const opcion = c.options?.find((o) => String(o.value) === String(valor));
      items.push({
        icon: <DescriptionIcon />,
        label: c.label,
        value: opcion ? opcion.label : valor,
      });
    });

    return items;
  };

  if (loading && bienes.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando bienes asegurados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Bienes asegurados</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar por bien, cliente o RFC..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div>
          <div className="fw-bold mb-2">Tipo</div>
          <select
            className="form-select"
            style={{ width: "180px" }}
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="Todos">Todos</option>
            {TIPOS_BIEN.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton
            text="Nuevo bien"
            icon={<AddCircleOutlinedIcon />}
            onClick={handleNuevoBien}
          />
        </div>
      </div>

      <div className="mb-4 position-relative tabla-bienes">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Ver",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: handleVerDetalle,
            },
            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar,
            },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: handleEliminarClick,
            },
          ]}
        />
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={Math.ceil(filteredBienes.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* ---------- Crear / editar ---------- */}
      <EditModal
        open={showModal}
        onClose={cerrarModal}
        onSave={handleGuardar}
        titulo={editingBien ? "Editar bien" : "Agregar nuevo bien"}
        subtitulo={
          editingBien
            ? "Cambia el cliente con su RFC, modifica los datos del bien o reemplaza su fotografía"
            : "Ingresa el RFC del cliente y los datos del bien"
        }
        btnTexto={editingBien ? "Guardar cambios" : "Registrar bien"}
        campos={camposFormulario}
        formData={formData}
        onChange={handleInputChange}
        customHandlers={{ onRfcChange: handleRfcChange }}
      >
        {editingBien && formData.foto_url && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Fotografía actual</div>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <img
                src={formData.foto_url}
                alt="Fotografía actual"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        )}

        <div className="evi-hint">
          <InfoIcon style={{ fontSize: 16 }} />
          <span>
            Tamaño máximo de la fotografía: <strong>{MAX_FOTO_MB} MB</strong>.
          </span>
        </div>
      </EditModal>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar bien"
        subtitle="¿Deseas eliminar este registro?"
      >
        {bienToDelete && (
          <div>
            <p>
              <strong>
                {bienToDelete.tipo} - {bienToDelete.modelo}
              </strong>
            </p>
            {bienToDelete.cliente && (
              <p>
                Cliente: {nombreCompleto(bienToDelete.cliente)}
                {bienToDelete.cliente.rfc ? ` (${bienToDelete.cliente.rfc})` : ""}
              </p>
            )}
          </div>
        )}
      </ConfirmDeleteModal>

      {/* ---------- Ver detalle ---------- */}
      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setBienDetalle(null);
        }}
        titulo={
          bienDetalle
            ? `${TIPOS_BIEN.find((t) => t.value === bienDetalle.tipo)?.label || bienDetalle.tipo} ${bienDetalle.marca || ""}`.trim()
            : ""
        }
        subtitulo={bienDetalle ? `Folio #${bienDetalle.id}` : ""}
        avatar={bienDetalle?.tipo ? bienDetalle.tipo.charAt(0).toUpperCase() : "B"}
        ancho="grande"
        items={getDetalleItems()}
      />

      {/* ---------- Descarga del listado ---------- */}
      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_BASE}/exportar/bienes`}
        params={{ search: searchTerm, tipo: tipoFilter }}
        nombreArchivo="bienes"
        titulo="Descargar listado de bienes"
        nota={
          searchTerm || tipoFilter !== "Todos"
            ? `Se exportarán los bienes con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${tipoFilter !== "Todos" ? ` (tipo: ${tipoFilter})` : ""}.`
            : "Se exportarán todos los bienes."
        }
      />

      {/* ---------- Aviso con el diseño del sistema ---------- */}
      {aviso && (
        <div
          className="balam-overlay"
          style={{ zIndex: 3000 }}
          onClick={(e) => e.target === e.currentTarget && setAviso(null)}
        >
          <div className="balam-modal evi-aviso">
            <div className="evi-aviso-icono error">
              <ErrorOutlineIcon style={{ fontSize: 40 }} />
            </div>
            <h3>{aviso.titulo}</h3>
            <p>{aviso.mensaje}</p>
            <button className="balam-btn save" onClick={() => setAviso(null)}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bienes;