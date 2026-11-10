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

const FORM_CAMPOS = [
  { label: "Nombre", name: "nombre", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  { label: "Deducible (monto fijo)", name: "deducible", type: "number" },
  { label: "Deducible (porcentaje %)", name: "porcentaje_deducible", type: "number" },
  {
    label: "Cómo se calcula el deducible",
    name: "tipo_calculo",
    type: "select",
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
    options: [
      { value: "valor_bien", label: "Valor del bien" },
      { value: "suma_asegurada", label: "Suma asegurada" },
      { value: "monto_reclamado", label: "Monto reclamado" },
      { value: "costo_reparacion", label: "Costo de reparación" },
    ],
  },
  { label: "% que paga la aseguradora (coaseguro; vacío = 100)", name: "porcentaje_cobertura", type: "number" },
  { label: "Tope por siniestro (vacío = la suma asegurada)", name: "monto_maximo_siniestro", type: "number" },
  { label: "Valor asegurable mínimo (0 = sin mínimo)", name: "monto_minimo", type: "number" },
  { label: "Valor asegurable máximo (0 = sin máximo)", name: "monto_maximo", type: "number" },
  {
    label: "Estatus",
    name: "estatus",
    type: "select",
    options: [
      { value: "activa", label: "Activo" },
      { value: "inactiva", label: "Inactivo" },
    ],
  },
];

const NUMERICOS = [
  "deducible", "porcentaje_deducible", "porcentaje_cobertura",
  "monto_minimo", "monto_maximo", "monto_maximo_siniestro",
];

// Grupo de casillas para una lista de opciones
const Casillas = ({ titulo, ayuda, opciones, valores, onCambio }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontWeight: 600 }}>{titulo}</div>
    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{ayuda}</div>
    {Object.entries(opciones).map(([v, t]) => (
      <label key={v} style={{ marginRight: 14 }}>
        <input
          type="checkbox"
          checked={(valores || []).includes(v)}
          onChange={(e) => onCambio(e.target.checked ? [...(valores || []), v] : (valores || []).filter((x) => x !== v))}
        />{" "}
        {t}
      </label>
    ))}
  </div>
);

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

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        titulo={editingCobertura ? "Editar Cobertura" : "Nueva Cobertura"}
        btnTexto={editingCobertura ? "Actualizar" : "Guardar"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      >
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
          El «valor asegurable» (mínimo y máximo) se revisa al <strong>contratar</strong> la póliza; no limita lo que se paga en un siniestro.
          Lo que limita el pago es el deducible, el % que paga la aseguradora, el tope por siniestro y la suma asegurada.
        </div>

        <Casillas
          titulo="¿En qué ramos se contrata?"
          ayuda="Solo aparecerá al hacer pólizas de estos ramos (ninguno marcado = todos)."
          opciones={NOMBRES_RAMO}
          valores={formData.ramos}
          onCambio={(v) => setFormData({ ...formData, ramos: v })}
        />
        <Casillas
          titulo="¿A qué tipos de bien se le revisa el valor asegurable?"
          ayuda="Ninguno marcado = a todos los bienes de la póliza."
          opciones={NOMBRES_BIEN}
          valores={formData.tipos_bien}
          onCambio={(v) => setFormData({ ...formData, tipos_bien: v })}
        />
        <Casillas
          titulo="¿A qué tipos de siniestro responde?"
          ayuda="Ninguno marcado = a todos. Si no lo defines, «Robo total» se usaría también para un incendio."
          opciones={NOMBRES_SINIESTRO}
          valores={formData.tipos_siniestro}
          onCambio={(v) => setFormData({ ...formData, tipos_siniestro: v })}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={!!formData.primer_riesgo}
            onChange={(e) => setFormData({ ...formData, primer_riesgo: e.target.checked })}
            style={{ marginTop: 3 }}
          />
          <span>
            <strong>Primer riesgo absoluto.</strong> No se aplica la regla proporcional (infraseguro): si el daño es menor a la suma
            asegurada se paga completo (menos deducible), sin importar cuánto valgan todos los bienes. Típico en contenidos del hogar o inventarios.
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