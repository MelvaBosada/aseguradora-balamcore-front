import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Clientes.css";

// Iconos
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Componentes
import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion from "../../components/Paginacion";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_URL = `${API_BASE}/reportes`;

const campos = ["poliza", "cliente", "siniestro", "estatus"];
const columnas = ["# de Poliza", "Cliente", "# de Siniestro", "Estatus", "Acciones"];

const FORM_CAMPOS = [
  { label: "# de Poliza", name: "id_poliza", type: "number" },
  { label: "Nombre del Reportante", name: "nombre_reportante", type: "text" },
  { label: "Teléfono", name: "telefono_reportante", type: "text" },
  {
    label: "Canal de Reporte",
    name: "canal_reporte",
    type: "select",
    options: [
      { value: "telefono", label: "Teléfono" },
      { value: "email", label: "Email" },
      { value: "presencial", label: "Presencial" },
      { value: "app", label: "App" },
      { value: "whatsapp", label: "WhatsApp" }
    ]
  },
  { label: "Fecha del Reporte", name: "fecha_reporte", type: "datetime-local" },
  { label: "Fecha de Ocurrencia", name: "fecha_ocurrencia", type: "datetime-local" },
  { label: "Ubicación del Accidente", name: "ubicacion_accidente", type: "text" },
  { label: "Descripción", name: "descripcion", type: "text" },
  {
    label: "Estatus",
    name: "estado",
    type: "select",
    options: [
      { value: "nuevo", label: "Nuevo" },
      { value: "en_revision", label: "En Revisión" },
      { value: "aprobado", label: "Aprobado" },
      { value: "rechazado", label: "Rechazado" },
      { value: "cerrado", label: "Cerrado" }
    ]
  },
  { label: "Observaciones", name: "observaciones", type: "text" }
];

const getFormVacio = () => ({
  id_aseguradora: 1,
  id_poliza: "",
  id_empleado: 1,
  reportado_por: "cliente",
  nombre_reportante: "",
  telefono_reportante: "",
  fecha_reporte: new Date().toISOString().slice(0, 16),
  fecha_ocurrencia: "",
  canal_reporte: "telefono",
  ubicacion_accidente: "",
  descripcion: "",
  estado: "nuevo",
  observaciones: ""
});

const Reportes = () => {
  const navigate = useNavigate();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(getFormVacio());
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();

        const mapeados = data.map(r => ({
          ...r,
          poliza: `POL-${String(r.id_poliza).padStart(4, "0")}`,
          cliente: r.nombre_reportante || "Sin nombre",
          siniestro: r.id_siniestro ? `SIN-${r.id_siniestro}` : "PENDIENTE",
          estatus: (r.estado || "nuevo").toUpperCase()
        }));

        setReportes(mapeados);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNuevoReporte = () => {
    setEditingItem(null);
    setFormData(getFormVacio());
    setShowModal(true);
  };

  const handleEditar = (item) => {
    setEditingItem(item);

    setFormData({
      ...item,
      fecha_reporte: item.fecha_reporte
        ? item.fecha_reporte.substring(0, 16).replace(" ", "T")
        : "",
      fecha_ocurrencia: item.fecha_ocurrencia
        ? item.fecha_ocurrencia.substring(0, 16).replace(" ", "T")
        : ""
    });

    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    if (e) e.preventDefault();

    const isEdit = !!editingItem;
    const url = isEdit ? `${API_URL}/${editingItem.id}` : API_URL;

    try {
      setLoading(true);

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${itemToDelete.id}`, {
        method: "DELETE",
        headers: getHeaders()
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

  const paginated = filteredReportes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

        <PrimaryButton
          text="Nuevo reporte"
          icon={<AddCircleOutlinedIcon />}
          onClick={handleNuevoReporte}
        />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            {
              titulo: "Agregar Siniestro",
              clase: "tabla-btn-agregar",
              icono: <AddCircleIcon fontSize="small" />,
              onClick: (item) => {
                navigate("/admin/siniestros", {
                  state: {
                    reporteId: item.id,
                    id_poliza: item.id_poliza
                  }
                });
              }
            },
            {
              titulo: "Ver",
              clase: "tabla-btn-ver",
              icono: <VisibilityIcon fontSize="small" />,
              onClick: (item) => {
                setItemDetalle(item);
                setShowDetalleModal(true);
              }
            },
            {
              titulo: "Editar",
              clase: "tabla-btn-edit",
              icono: <EditIcon fontSize="small" />,
              onClick: handleEditar
            },
            {
              titulo: "Eliminar",
              clase: "tabla-btn-del",
              icono: <DeleteIcon fontSize="small" />,
              onClick: handleEliminarClick
            }
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
        titulo={editingItem ? "Editar reporte" : "Agregar nuevo reporte"}
        btnTexto={editingItem ? "Guardar cambios" : "Agregar reporte"}
        campos={FORM_CAMPOS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar registro"
        subtitle="¿Deseas eliminar este reporte del sistema permanentemente?"
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
        avatar={itemDetalle ? itemDetalle.poliza.charAt(4) : "R"}
        items={
          itemDetalle
            ? Object.entries(itemDetalle)
                .filter(([key]) => {
                  const lowerKey = key.toLowerCase();

                  return (
                    !lowerKey.startsWith("id") &&
                    !lowerKey.includes("_id") &&
                    !["poliza", "cliente", "siniestro", "estatus"].includes(lowerKey)
                  );
                })
                .map(([key, value]) => ({
                  label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                  value: value || "N/A"
                }))
            : []
        }
      />
    </div>
  );
};

export default Reportes;