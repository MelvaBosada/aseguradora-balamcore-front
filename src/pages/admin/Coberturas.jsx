import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../css/Clientes.css";

// Iconos
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RuleIcon from "@mui/icons-material/Rule";
import CategoryIcon from "@mui/icons-material/Category";
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
import { NOMBRES_RAMO, NOMBRES_BIEN, NOMBRES_SINIESTRO, aFicha, textoDeducible, dinero0 } from "../../components/FichaCobertura";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/coberturas`
  : "/api/coberturas";

const AVISO_EXITO_MS = 3500;
const SIN_CONEXION = "No hay conexión con el servidor.";

// Configuración de headers para Axios
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

const columnas = ["Nombre", "Ramos", "Deducible", "Paga la aseguradora", "Tope por siniestro", "Estatus", "Acciones"];
const campos = ["nombre", "ramos_txt", "deducible_txt", "paga_txt", "tope_txt", "estatus"];

// Cada campo lleva su "seccion"; se agrupan en el orden en que aparecen
const FORM_CAMPOS = [
  // ---- DATOS GENERALES ----
  { label: "Nombre", name: "nombre", type: "text", seccion: "Datos generales" },
  { label: "Descripción", name: "descripcion", type: "text", seccion: "Datos generales" },
  {
    label: "Estatus",
    name: "estatus",
    type: "select",
    seccion: "Datos generales",
    options: [
      { value: "activa", label: "Activo" },
      { value: "inactiva", label: "Inactivo" },
    ],
  },

  // ---- DEDUCIBLE ----
  { label: "Deducible (monto fijo)", name: "deducible", type: "number", seccion: "Deducible" },
  { label: "Deducible (porcentaje %)", name: "porcentaje_deducible", type: "number", seccion: "Deducible" },
  {
    label: "Cómo se calcula el deducible",
    name: "tipo_calculo",
    type: "select",
    seccion: "Deducible",
    options: [
      { value: "monto_fijo", label: "Monto fijo" },
      { value: "porcentaje", label: "Porcentaje" },
      { value: "mixto", label: "Mixto (el mayor de los dos)" },
    ],
  },
  {
    label: "El porcentaje se calcula sobre",
    name: "aplica_sobre",
    type: "select",
    seccion: "Deducible",
    options: [
      { value: "valor_bien", label: "Valor del bien" },
      { value: "suma_asegurada", label: "Suma asegurada" },
      { value: "monto_reclamado", label: "Monto reclamado" },
      { value: "costo_reparacion", label: "Costo de reparación" },
    ],
  },

  // ---- MONTOS Y LÍMITES ----
  { label: "% que paga la aseguradora (coaseguro; vacío = 100)", name: "porcentaje_cobertura", type: "number", seccion: "Montos y límites" },
  { label: "Tope por siniestro (vacío = la suma asegurada)", name: "monto_maximo_siniestro", type: "number", seccion: "Montos y límites" },
  { label: "Valor asegurable mínimo (0 = sin mínimo)", name: "monto_minimo", type: "number", seccion: "Montos y límites" },
  { label: "Valor asegurable máximo (0 = sin máximo)", name: "monto_maximo", type: "number", seccion: "Montos y límites" },
];

const NUMERICOS = [
  "deducible", "porcentaje_deducible", "porcentaje_cobertura",
  "monto_minimo", "monto_maximo", "monto_maximo_siniestro",
];

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

// Un campo individual (text / number / select)
const Campo = ({ campo, valor, onChange }) => {
  const id = `cob-${campo.name}`;
  return (
    <div>
      <label htmlFor={id} style={ESTILO_LABEL}>{campo.label}</label>
      {campo.type === "select" ? (
        <select id={id} name={campo.name} value={valor ?? ""} onChange={onChange} style={ESTILO_INPUT}>
          {campo.options.map((o) => {
            const value = typeof o === "object" ? o.value : o;
            const label = typeof o === "object" ? o.label : o;
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
          min={campo.type === "number" ? 0 : undefined}
          step={campo.type === "number" ? "any" : undefined}
          placeholder={campo.type === "number" ? "0" : ""}
          style={ESTILO_INPUT}
        />
      )}
    </div>
  );
};

// Agrupa los campos por sección y pinta: título con línea + cuadrícula de 3 columnas
const Seccion = ({ campos: lista, formData, onChange }) => {
  const grupos = [];
  lista.forEach((c) => {
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "16px 20px" }}>
        {g.campos.map((c) => (
          <Campo key={c.name} campo={c} valor={formData[c.name]} onChange={onChange} />
        ))}
      </div>
    </div>
  ));
};

// Grupo de opciones como "chips" seleccionables, en cuadrícula
const Casillas = ({ titulo, ayuda, opciones, valores, onCambio }) => {
  const seleccionados = valores || [];
  const alternar = (v) =>
    onCambio(seleccionados.includes(v) ? seleccionados.filter((x) => x !== v) : [...seleccionados, v]);

  return (
    <div style={{ marginBottom: 22 }}>
      <div className="balam-section-title" style={{ marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
        {ayuda}
        {seleccionados.length === 0 && <strong style={{ color: "#14573A" }}> · Hoy aplica a todos.</strong>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {Object.entries(opciones).map(([v, t]) => {
          const activo = seleccionados.includes(v);
          return (
            <label
              key={v}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: activo ? 600 : 400, userSelect: "none",
                border: `1px solid ${activo ? "#86EFAC" : "#E5E7EB"}`,
                background: activo ? "#F0FDF4" : "#fff",
                color: activo ? "#14573A" : "#374151",
              }}
            >
              <input
                type="checkbox"
                checked={activo}
                onChange={() => alternar(v)}
                style={{ width: 16, height: 16, accentColor: "#14573A", flexShrink: 0, margin: 0 }}
              />
              {t}
            </label>
          );
        })}
      </div>
    </div>
  );
};

const lista = (arr, nombres, vacio) => (arr && arr.length ? arr.map((x) => nombres[x] || x).join(", ") : vacio);

const Cobertura = () => {
  const [coberturas, setCoberturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [coberturaToDelete, setCoberturaToDelete] = useState(null);
  const [coberturaDetalle, setCoberturaDetalle] = useState(null);
  const [editingCobertura, setEditingCobertura] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDescarga, setShowDescarga] = useState(false);
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

  // GET: Obtener coberturas
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getAuthConfig());
      const data = Array.isArray(response.data) ? response.data : [];
      setCoberturas(data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error("Error al obtener datos:", error.response?.data || error.message);
      mostrarAviso(
        "error",
        "No se pudieron cargar las coberturas",
        mensajeError(error, "Ocurrió un error al cargar las coberturas.")
      );
    } finally {
      setLoading(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNuevo = () => {
    setEditingCobertura(null);
    setFormData({
      nombre: "",
      descripcion: "",
      estatus: "activa",
      tipo_calculo: "monto_fijo",
      aplica_sobre: "valor_bien",
      monto_minimo: "",
      monto_maximo: "",
      monto_maximo_siniestro: "",
      porcentaje_deducible: "",
      deducible: "",
      porcentaje_cobertura: "",
      ramos: [],
      tipos_bien: [],
      tipos_siniestro: [],
      primer_riesgo: false,
    });
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingCobertura(item);
    const dataForModal = { ...item };
    NUMERICOS.forEach((f) => {
      if (dataForModal[f] === null || dataForModal[f] === undefined) dataForModal[f] = "";
    });
    ["ramos", "tipos_bien", "tipos_siniestro"].forEach((f) => {
      if (!Array.isArray(dataForModal[f])) dataForModal[f] = [];
    });
    dataForModal.primer_riesgo = !!dataForModal.primer_riesgo;
    setFormData(dataForModal);
    setShowModal(true);
  };

  const handleVerDetalle = (item) => {
    setCoberturaDetalle(item);
    setShowDetalleModal(true);
  };

  // POST / PUT: los números vacíos se envían como 0 ("sin límite" / "sin deducible")
  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);

    const isEdit = !!editingCobertura;
    const url = isEdit ? `${API_URL}/${editingCobertura.id}` : API_URL;

    const dataToSubmit = { ...formData };
    NUMERICOS.forEach((field) => {
      const val = dataToSubmit[field];
      dataToSubmit[field] = val === "" || val === undefined || val === null || Number.isNaN(val) ? 0 : Number(val);
    });

    try {
      if (isEdit) {
        await axios.put(url, dataToSubmit, getAuthConfig());
      } else {
        await axios.post(url, dataToSubmit, getAuthConfig());
      }

      setShowModal(false);
      fetchData();
      mostrarAviso(
        "exito",
        isEdit ? "Cobertura actualizada" : "Cobertura creada",
        isEdit
          ? "Los cambios se guardaron correctamente."
          : "La cobertura se guardó correctamente."
      );
    } catch (error) {
      console.error("Error API:", error.response?.data || error.message);
      mostrarAviso("error", "No se pudo guardar", mensajeError(error, "Error al guardar la cobertura."));
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Eliminar registro
  const handleConfirmDelete = async () => {
    if (!coberturaToDelete) return;
    setLoading(true);

    try {
      await axios.delete(`${API_URL}/${coberturaToDelete.id}`, getAuthConfig());
      setShowDeleteModal(false);
      setCoberturaToDelete(null);
      fetchData();
      mostrarAviso("exito", "Cobertura eliminada", "La cobertura se eliminó correctamente.");
    } catch (error) {
      console.error("Error al eliminar:", error.response?.data || error.message);
      setShowDeleteModal(false);
      setCoberturaToDelete(null);
      mostrarAviso("error", "No se pudo eliminar", mensajeError(error, "No se pudo eliminar la cobertura."));
    } finally {
      setLoading(false);
    }
  };

  const filtered = coberturas.filter((c) => (c.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filas = paginated.map((c) => {
    const f = aFicha(c);
    return {
      ...c,
      ramos_txt: lista(c.ramos, NOMBRES_RAMO, "Todos"),
      deducible_txt: textoDeducible(f),
      paga_txt: `${f.porcentaje_cobertura}%`,
      tope_txt: f.monto_maximo_siniestro > 0 ? dinero0(f.monto_maximo_siniestro) : "Suma asegurada",
    };
  });

  const detalleItems = coberturaDetalle
    ? (() => {
        const f = aFicha(coberturaDetalle);
        return [
          { icon: <DescriptionIcon />, label: "Descripción", value: coberturaDetalle.descripcion || "Sin descripción" },
          { icon: <RuleIcon />, label: "Estatus", value: coberturaDetalle.estatus ? coberturaDetalle.estatus.toUpperCase() : "-" },
          { icon: <CategoryIcon />, label: "Se contrata en pólizas de", value: lista(f.ramos, NOMBRES_RAMO, "Todos los ramos") },
          { icon: <CategoryIcon />, label: "Responde a siniestros de", value: lista(f.tipos_siniestro, NOMBRES_SINIESTRO, "Todos los tipos") },
          { icon: <CategoryIcon />, label: "Rango de valor aplica a bienes", value: lista(f.tipos_bien, NOMBRES_BIEN, "Todos los tipos de bien") },
          { icon: <AttachMoneyIcon />, label: "Valor asegurable", value: `${f.valor_minimo ? dinero0(f.valor_minimo) : "sin mínimo"} a ${f.valor_maximo ? dinero0(f.valor_maximo) : "sin máximo"}` },
          { icon: <AttachMoneyIcon />, label: "Tope por siniestro", value: f.monto_maximo_siniestro > 0 ? dinero0(f.monto_maximo_siniestro) : "La suma asegurada" },
          { icon: <AttachMoneyIcon />, label: "Deducible", value: textoDeducible(f) },
          { icon: <PercentIcon />, label: "Paga la aseguradora", value: `${f.porcentaje_cobertura}%` },
          { icon: <SettingsIcon />, label: "Tipo de cálculo", value: coberturaDetalle.tipo_calculo ? coberturaDetalle.tipo_calculo.replace("_", " ") : "-" },
          { icon: <FactCheckIcon />, label: "Primer riesgo", value: f.primer_riesgo ? "Sí (sin regla proporcional)" : "No" },
        ];
      })()
    : [];

  if (loading && coberturas.length === 0) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p>Cargando coberturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Listado de Coberturas</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar cobertura..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <PrimaryButton text="Descargar" icon={<DownloadIcon />} onClick={() => setShowDescarga(true)} />
          <PrimaryButton text="Nueva Cobertura" icon={<AddCircleOutlinedIcon />} onClick={handleNuevo} />
        </div>
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={filas}
          campos={campos}
          acciones={[
            { titulo: "Ver", clase: "tabla-btn-ver", icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle },
            { titulo: "Editar", clase: "tabla-btn-edit", icono: <EditIcon fontSize="small" />, onClick: handleEditar },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: (c) => {
                setCoberturaToDelete(c);
                setShowDeleteModal(true);
              },
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
        titulo={editingCobertura ? "Editar Cobertura" : "Nueva Cobertura"}
        btnTexto={editingCobertura ? "Actualizar" : "Guardar"}
        campos={[]}
        formData={formData}
        onChange={handleInputChange}
      >
        <Seccion campos={FORM_CAMPOS} formData={formData} onChange={handleInputChange} />

        <div
          style={{
            background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#075985",
            borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.5, marginBottom: 20,
          }}
        >
          El «valor asegurable» (mínimo y máximo) se revisa al <strong>contratar</strong> la póliza; no limita lo que se paga en un siniestro.
          Lo que limita el pago es el deducible, el % que paga la aseguradora, el tope por siniestro y la suma asegurada.
        </div>

        <Casillas
          titulo="¿En qué ramos se contrata?"
          ayuda="Solo aparecerá al hacer pólizas de estos ramos."
          opciones={NOMBRES_RAMO}
          valores={formData.ramos}
          onCambio={(v) => setFormData({ ...formData, ramos: v })}
        />
        <Casillas
          titulo="¿A qué tipos de bien se le revisa el valor asegurable?"
          ayuda="Se aplica solo a esos bienes de la póliza."
          opciones={NOMBRES_BIEN}
          valores={formData.tipos_bien}
          onCambio={(v) => setFormData({ ...formData, tipos_bien: v })}
        />
        <Casillas
          titulo="¿A qué tipos de siniestro responde?"
          ayuda="Si no marcas ninguno, «Robo total», por ejemplo, también respondería a un incendio."
          opciones={NOMBRES_SINIESTRO}
          valores={formData.tipos_siniestro}
          onCambio={(v) => setFormData({ ...formData, tipos_siniestro: v })}
        />

        <div className="balam-section-title" style={{ marginBottom: 8 }}>Regla proporcional</div>
        <label
          style={{
            display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", borderRadius: 8,
            border: `1px solid ${formData.primer_riesgo ? "#86EFAC" : "#E5E7EB"}`,
            background: formData.primer_riesgo ? "#F0FDF4" : "#fff",
          }}
        >
          <input
            type="checkbox"
            checked={!!formData.primer_riesgo}
            onChange={(e) => setFormData({ ...formData, primer_riesgo: e.target.checked })}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: "#14573A", flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>
            <strong>Primer riesgo absoluto</strong>
            <span style={{ display: "block", color: "#6B7280", fontSize: 12, marginTop: 2 }}>
              No se aplica la regla proporcional (infraseguro): si el daño es menor a la suma asegurada se paga completo
              (menos deducible), sin importar cuánto valgan todos los bienes. Típico en contenidos del hogar o inventarios.
            </span>
          </span>
        </label>
      </EditModal>

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCoberturaToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cobertura"
        subtitle="¿Estás seguro de que deseas eliminar este registro?"
      >
        {coberturaToDelete && (
          <p>
            <strong>{coberturaToDelete.nombre}</strong>
          </p>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        titulo={coberturaDetalle ? coberturaDetalle.nombre : ""}
        subtitulo={coberturaDetalle ? `ID #${coberturaDetalle.id}` : ""}
        avatar={coberturaDetalle?.nombre ? coberturaDetalle.nombre.charAt(0) : "C"}
        items={detalleItems}
      />

      <DescargarModal
        open={showDescarga}
        onClose={() => setShowDescarga(false)}
        url={`${import.meta.env.VITE_API_URL || "/api"}/exportar/coberturas`}
        params={{ search: searchTerm }}
        nombreArchivo="coberturas"
        titulo="Descargar listado de coberturas"
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

export default Cobertura;