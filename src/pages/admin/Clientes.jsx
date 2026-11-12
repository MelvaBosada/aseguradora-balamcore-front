import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";
import DescargarModal from "../../components/DescargarModal";
import { EstatusCliente } from "../../components/siniestro/Badges";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${API_BASE}/clientes`;

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Helper de headers para peticiones autenticadas
const getAuthConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Extrae un mensaje legible de un error de axios
const mensajeError = (error, defecto) => {
  if (!error.response) return SIN_CONEXION;
  const data = error.response.data || {};
  const detalle = data.errors ? Object.values(data.errors).flat().join("\n") : null;
  return detalle || data.message || defecto;
};

// "nombre_completo" y "fecha_registro_txt" se arman en el componente
const campos = [
  "rfc",
  "nombre_completo",
  "telefono",
  "correo",
  "ocupacion",
  "estatus",
];
const columnas = [
  "RFC",
  "Nombre",
  "Teléfono",
  "Correo",
  "Ocupación",
  "Estatus",
  "Acciones",
];

// Cada campo lleva su "seccion"; se agrupan en el orden en que aparecen
const FORM_CAMPOS = [
  // ---- DATOS PERSONALES ----
  { label: "Nombre", name: "nombre", type: "text", required: true, seccion: "Datos personales" },
  { label: "Apellido", name: "apellido", type: "text", required: true, seccion: "Datos personales" },
  { label: "Fecha de nacimiento", name: "fecha_nacimiento", type: "date", required: true, seccion: "Datos personales" },
  {
    label: "Género",
    name: "genero",
    type: "select",
    options: ["masculino", "femenino", "otro"],
    required: true,
    defaultValue: "masculino",
    seccion: "Datos personales",
  },
  {
    label: "Estado civil",
    name: "estado_civil",
    type: "select",
    options: ["soltero", "casado", "divorciado", "viudo", "union_libre"],
    required: true,
    defaultValue: "soltero",
    seccion: "Datos personales",
  },
  { label: "Nacionalidad", name: "nacionalidad", type: "text", defaultValue: "Mexicana", seccion: "Datos personales" },
  { label: "CURP", name: "curp", type: "text", required: true, seccion: "Datos personales" },
  { label: "RFC", name: "rfc", type: "text", required: true, seccion: "Datos personales" },
  {
    label: "Tipo identificación",
    name: "tipo_identificacion",
    type: "select",
    options: ["ine", "pasaporte", "cedula_profesional", "licencia"],
    required: true,
    defaultValue: "ine",
    seccion: "Datos personales",
  },
  { label: "No. identificación", name: "numero_identificacion", type: "text", required: true, seccion: "Datos personales" },

  // ---- CONTACTO ----
  { label: "Teléfono", name: "telefono", type: "text", required: true, seccion: "Contacto" },
  { label: "Teléfono alternativo", name: "telefono_alternativo", type: "text", seccion: "Contacto" },
  { label: "Correo", name: "correo", type: "email", required: true, seccion: "Contacto" },

  // ---- DOMICILIO ----
  { label: "Domicilio", name: "domicilio", type: "text", required: true, seccion: "Domicilio" },
  { label: "Municipio", name: "municipio", type: "text", required: true, seccion: "Domicilio" },
  { label: "Estado", name: "estado", type: "text", required: true, seccion: "Domicilio" },
  { label: "Código postal", name: "codigo_postal", type: "text", required: true, seccion: "Domicilio" },

  // ---- INFORMACIÓN ADICIONAL ----
  { label: "Ocupación", name: "ocupacion", type: "text", required: true, seccion: "Información adicional" },
  {
    label: "Estatus",
    name: "estatus",
    type: "select",
    options: ["activo", "inactivo", "suspendido"],
    defaultValue: "activo",
    seccion: "Información adicional",
  },
];

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  telefono: "",
  curp: "",
  rfc: "",
  domicilio: "",
  correo: "",
  fecha_nacimiento: "",
  genero: "masculino",
  estado_civil: "soltero",
  nacionalidad: "Mexicana",
  tipo_identificacion: "ine",
  numero_identificacion: "",
  telefono_alternativo: "",
  municipio: "",
  estado: "",
  codigo_postal: "",
  ocupacion: "",
  estatus: "activo",
};

// ---------- Estilos de los campos (look del modal de empleados) ----------
const ESTILO_LABEL = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  color: "#14573A",
  marginBottom: 6,
};

const ESTILO_INPUT = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FAFAFA",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

// "union_libre" -> "Union libre"
const bonito = (txt) => {
  const t = String(txt).replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Un campo individual (text / email / date / select)
const Campo = ({ campo, valor, onChange }) => {
  const id = `cli-${campo.name}`;
  return (
    <div>
      <label htmlFor={id} style={ESTILO_LABEL}>{campo.label}</label>
      {campo.type === "select" ? (
        <select id={id} name={campo.name} value={valor ?? ""} onChange={onChange} style={ESTILO_INPUT}>
          {campo.options.map((o) => {
            const value = typeof o === "object" ? o.value : o;
            const label = typeof o === "object" ? o.label : bonito(o);
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      ) : (
        <input
          id={id}
          name={campo.name}
          type={campo.type}
          value={valor ?? ""}
          onChange={onChange}
          placeholder={campo.type === "date" ? "" : `Ingresa ${campo.label.toLowerCase()}`}
          style={ESTILO_INPUT}
        />
      )}
    </div>
  );
};

// Agrupa los campos por sección: título con línea + cuadrícula de 3 columnas
const Seccion = ({ items, formData, onChange }) => {
  const grupos = [];
  items.forEach((c) => {
    const nombre = c.seccion || "Otros";
    let g = grupos.find((x) => x.nombre === nombre);
    if (!g) {
      g = { nombre, campos: [] };
      grupos.push(g);
    }
    g.campos.push(c);
  });

  return grupos.map((g) => (
    <div key={g.nombre} style={{ marginBottom: 24 }}>
      <div className="balam-section-title" style={{ marginBottom: 14 }}>{g.nombre}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px 20px" }}>
        {g.campos.map((c) => (
          <Campo key={c.name} campo={c} valor={formData[c.name]} onChange={onChange} />
        ))}
      </div>
    </div>
  ));
};

// Une nombre y apellido en una sola cadena
const nombreCompleto = (c) =>
  [c.nombre, c.apellido ?? c.apellidos].filter(Boolean).join(" ").trim() || "—";

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const f = new Date(valor);
  return isNaN(f.getTime()) ? String(valor) : f.toLocaleDateString("es-MX");
};

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showDescarga, setShowDescarga] = useState(false);

  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [estatusFilter, setEstatusFilter] = useState("Todos");
  const [totalPages, setTotalPages] = useState(1);

  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', titulo, mensaje }

  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo, titulo, mensaje });
  }, []);

  // Los avisos de éxito se cierran solos
  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
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

  // GET: Cargar clientes con paginación y filtros
  const cargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        ...getAuthConfig(),
        params: {
          page: currentPage,
          search: searchTerm,
          estatus: estatusFilter,
          per_page: itemsPerPage,
        },
      });

      const data = response.data.data || [];

      // Se conservan los datos originales (para editar/ver/eliminar)
      // y se agregan los campos armados para la tabla
      setClientes(
        data.map((c) => ({
          ...c,
          nombre_completo: nombreCompleto(c),
          fecha_registro_txt: formatearFecha(c.fecha_registro),
        }))
      );
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error("Error al cargar clientes:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      mostrarAviso(
        "error",
        "No se pudieron cargar los clientes",
        mensajeError(error, "Ocurrió un error al cargar los clientes.")
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estatusFilter, itemsPerPage, mostrarAviso]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setFormData({ ...FORM_VACIO });
    setShowModal(true);
  };

  const handleEditar = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      curp: cliente.curp || "",
      rfc: cliente.rfc || "",
      domicilio: cliente.domicilio || "",
      correo: cliente.correo || "",
      fecha_nacimiento: cliente.fecha_nacimiento || "",
      genero: cliente.genero || "masculino",
      estado_civil: cliente.estado_civil || "soltero",
      nacionalidad: cliente.nacionalidad || "Mexicana",
      tipo_identificacion: cliente.tipo_identificacion || "ine",
      numero_identificacion: cliente.numero_identificacion || "",
      telefono_alternativo: cliente.telefono_alternativo || "",
      municipio: cliente.municipio || "",
      estado: cliente.estado || "",
      codigo_postal: cliente.codigo_postal || "",
      ocupacion: cliente.ocupacion || "",
      estatus: cliente.estatus || "activo",
    });
    setShowModal(true);
  };

  // POST / PUT: Guardar cambios o registrar cliente
  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const requiredFields = [
      "nombre",
      "apellido",
      "rfc",
      "curp",
      "telefono",
      "correo",
      "fecha_nacimiento",
      "genero",
      "estado_civil",
      "tipo_identificacion",
      "numero_identificacion",
      "domicilio",
      "municipio",
      "estado",
      "codigo_postal",
      "ocupacion",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      const etiquetas = missingFields.map(
        (name) => FORM_CAMPOS.find((c) => c.name === name)?.label || name
      );
      mostrarAviso("error", "Faltan campos requeridos", etiquetas.join("\n"));
      return;
    }

    const clienteData = {
      ...formData,
      nacionalidad: formData.nacionalidad || "Mexicana",
      telefono_alternativo: formData.telefono_alternativo || null,
      estatus: formData.estatus || "activo",
    };

    const isEdit = !!editingCliente;

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${editingCliente.id}`, clienteData, getAuthConfig());
      } else {
        await axios.post(API_URL, clienteData, getAuthConfig());
      }
      setShowModal(false);
      cargarClientes();
      mostrarAviso(
        "exito",
        isEdit ? "Cliente actualizado" : "Cliente creado",
        isEdit
          ? "Los cambios se guardaron correctamente."
          : "El cliente se guardó correctamente."
      );
    } catch (error) {
      console.error("Error al guardar cliente:", error.response?.data || error.message);
      mostrarAviso("error", "No se pudo guardar", mensajeError(error, "Error al guardar cliente."));
    }
  };

  const handleEliminarClick = (cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };

  // DELETE: Eliminar cliente
  const handleConfirmarEliminar = async () => {
    if (!clienteToDelete) return;

    try {
      await axios.delete(`${API_URL}/${clienteToDelete.id}`, getAuthConfig());
      setShowDeleteModal(false);
      setClienteToDelete(null);
      cargarClientes();
      mostrarAviso("exito", "Cliente eliminado", "El cliente se eliminó correctamente.");
    } catch (error) {
      console.error("Error al eliminar cliente:", error.response?.data || error.message);
      setShowDeleteModal(false);
      setClienteToDelete(null);
      mostrarAviso("error", "No se pudo eliminar", mensajeError(error, "Error al eliminar cliente."));
    }
  };

  const handleVerDetalle = (cliente) => {
    setClienteDetalle(cliente);
    setShowDetalleModal(true);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Clientes</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar cliente..."
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
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton
            text="Descargar"
            icon={<DownloadIcon />}
            onClick={() => setShowDescarga(true)}
          />
          <PrimaryButton
            text="Nuevo cliente"
            icon={<AddCircleOutlinedIcon />}
            onClick={handleNuevoCliente}
          />
        </div>
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={clientes}
          campos={campos}
          renderers={{
            estatus: (c) => <EstatusCliente valor={c.estatus} />,
          }}
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
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Los campos se pintan en <Seccion/>, por eso campos={[]} */}
      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingCliente}
        titulo={editingCliente ? "Editar cliente" : "Agregar nuevo cliente"}
        subtitulo={
          editingCliente
            ? "Modifica los datos del cliente"
            : "Ingresa los datos para registrar al cliente"
        }
        btnTexto={editingCliente ? "Guardar cambios" : "Agregar cliente"}
        campos={[]}
        formData={formData}
        onChange={handleInputChange}
      >
        <Seccion items={FORM_CAMPOS} formData={formData} onChange={handleInputChange} />
      </EditModal>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClienteToDelete(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar cliente"
        subtitle="¿Deseas eliminar este cliente del sistema?"
      >
        {clienteToDelete && (
          <div>
            <p>
              <strong>{clienteToDelete.nombre_completo}</strong>
            </p>
            <p>ID: {clienteToDelete.id}</p>
            <p>Teléfono: {clienteToDelete.telefono}</p>
            <p>Correo: {clienteToDelete.correo}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setClienteDetalle(null);
        }}
        cliente={clienteDetalle}
      />

      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${API_BASE}/exportar/clientes`}
        params={{ search: searchTerm, estatus: estatusFilter }}
        nombreArchivo="clientes"
        titulo="Descargar listado de clientes"
        nota={
          searchTerm || estatusFilter !== "Todos"
            ? `Se exportarán los clientes con los filtros actuales${searchTerm ? ` (búsqueda: "${searchTerm}")` : ""}${estatusFilter !== "Todos" ? ` (estatus: ${estatusFilter})` : ""}.`
            : "Se exportarán todos los clientes."
        }
      />

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
};

export default Clientes;