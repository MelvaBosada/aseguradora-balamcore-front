// pages/admin/Papelera.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../css/Clientes.css";

// Iconos
import SearchIcon from "@mui/icons-material/Search";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import InfoIcon from "@mui/icons-material/Info";

// Componentes
import TablaForm from "../../components/TablaForm";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Paginacion from "../../components/Paginacion";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${API_BASE}/papelera`;

const MODULOS = [
  { clave: "clientes", etiqueta: "Clientes" },
  { clave: "polizas", etiqueta: "Pólizas" },
  { clave: "reportes", etiqueta: "Reportes" },
  { clave: "siniestros", etiqueta: "Siniestros" },
  { clave: "evidencias", etiqueta: "Evidencias" },
  { clave: "indemnizaciones", etiqueta: "Indemnizaciones" },
  { clave: "bienes", etiqueta: "Bienes" },
  { clave: "coberturas", etiqueta: "Coberturas" },
];

const columnas = ["Registro", "Detalle", "Eliminado por", "Fecha", "Acciones"];
const campos = ["registro", "detalle", "eliminado_por", "eliminado_el"];

const getAuthConfig = () => ({
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const Papelera = () => {
  const [modulo, setModulo] = useState("clientes");
  const [items, setItems] = useState([]);
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  const [aviso, setAviso] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const avisar = useCallback((tipo, texto) => setAviso({ tipo, texto }), []);

  // Los avisos se cierran solos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  const manejarError = useCallback(
    (error, porDefecto) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      avisar("danger", error.response?.data?.message || porDefecto);
    },
    [avisar]
  );

  // Cuántos registros hay en la papelera por módulo (globitos de las pestañas)
  const cargarResumen = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/resumen`, getAuthConfig());
      setConteos(response.data || {});
    } catch (error) {
      manejarError(error, "No se pudo cargar el resumen de la papelera");
    }
  }, [manejarError]);

  // Registros del módulo seleccionado
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${modulo}`, {
        ...getAuthConfig(),
        params: { page: currentPage, search: searchTerm, per_page: itemsPerPage },
      });

      setItems(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      setItems([]);
      manejarError(error, "No se pudo cargar la papelera");
    } finally {
      setLoading(false);
    }
  }, [modulo, currentPage, searchTerm, itemsPerPage, manejarError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  const recargar = () => {
    cargarResumen();
    // Si se vació la página actual, regresa a la anterior
    if (items.length === 1 && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else {
      cargar();
    }
  };

  const cambiarModulo = (clave) => {
    setModulo(clave);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (nuevo) => {
    setItemsPerPage(nuevo);
    setCurrentPage(1);
  };

  // POST: Restaurar
  const handleRestaurar = async (fila) => {
    try {
      const response = await axios.post(
        `${API_URL}/${modulo}/${fila.id}/restaurar`,
        {},
        getAuthConfig()
      );
      avisar("success", response.data?.message || "Registro restaurado");
      recargar();
    } catch (error) {
      manejarError(error, "No se pudo restaurar el registro");
    }
  };

  const handleEliminarClick = (fila) => {
    setItemToDelete(fila);
    setShowDeleteModal(true);
  };

  // DELETE: Borrado definitivo
  const handleConfirmarEliminar = async () => {
    if (!itemToDelete) return;

    try {
      const response = await axios.delete(
        `${API_URL}/${modulo}/${itemToDelete.id}`,
        getAuthConfig()
      );
      avisar("success", response.data?.message || "Registro eliminado definitivamente");
      recargar();
    } catch (error) {
      manejarError(error, "No se pudo eliminar definitivamente el registro");
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const data = items.map((item) => ({
    ...item,
    registro: (
      <div>
        <strong>{item.titulo}</strong>
        <div style={{ fontSize: 12, color: "#777" }}>{item.subtitulo}</div>
      </div>
    ),
  }));

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Papelera</h1>
      <hr className="mt-2 mb-3" />

      {/* Pestañas por módulo */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {MODULOS.map(({ clave, etiqueta }) => {
          const activo = modulo === clave;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => cambiarModulo(clave)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid #0F4C3A",
                background: activo ? "#0F4C3A" : "#ffffff",
                color: activo ? "#ffffff" : "#0F4C3A",
              }}
            >
              {etiqueta}
              <span
                style={{
                  minWidth: 20,
                  padding: "0 6px",
                  borderRadius: 999,
                  fontSize: 12,
                  textAlign: "center",
                  background: activo ? "rgba(255,255,255,0.2)" : "#E6EFEC",
                }}
              >
                {conteos[clave] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13, color: "#6b7c75" }}>
        <InfoIcon style={{ fontSize: 16 }} />
        <span>
          Aquí están los registros eliminados. <strong>Restaurar</strong> los regresa a su módulo;{" "}
          <strong>Eliminar definitivamente</strong> no se puede deshacer.
        </span>
      </div>

      {aviso && (
        <div className={`alert alert-${aviso.tipo} py-2`} role="alert" style={{ whiteSpace: "pre-line" }}>
          {aviso.texto}
        </div>
      )}

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="search-custom"
              placeholder="Buscar en la papelera..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-success" role="status" />
        </div>
      )}

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={data}
          campos={campos}
          acciones={[
            {
              titulo: "Restaurar",
              clase: "tabla-btn-edit",
              icono: <RestoreFromTrashIcon fontSize="small" />,
              onClick: handleRestaurar,
            },
            {
              titulo: "Eliminar definitivamente",
              clase: "tabla-btn-del",
              icono: <DeleteForeverIcon fontSize="small" />,
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
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar definitivamente"
        subtitle="Esta acción no se puede deshacer."
      >
        {itemToDelete && (
          <div>
            <p>
              <strong>{itemToDelete.titulo}</strong>
            </p>
            <p>{itemToDelete.subtitulo}</p>
          </div>
        )}
      </ConfirmDeleteModal>
    </div>
  );
};

export default Papelera;
