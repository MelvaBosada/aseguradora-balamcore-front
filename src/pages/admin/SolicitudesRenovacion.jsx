import { useState } from "react";
import SearchIcon    from "@mui/icons-material/Search";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Snackbar      from "@mui/material/Snackbar";
import Alert         from "@mui/material/Alert";

import TablaForm          from "../../components/TablaForm";
import Paginacion         from "../../components/Paginacion";
import RenovarPolizaModal from "../../components/RenovarPolizaModal";
import "../../css/PolizasVencer.css";

const ITEMS_PER_PAGE = 8;

const solicitudesData = [
  { id: 1, nPoliza: "POL001", nombre: "María",       apellido: "Méndez",   tipo: "Vivienda", vigencia: "1 mes",   vence: "13-03-26", asesor: "Julian Chas", estatus: "Por vencer", correo: "maria@gmail.com"  },
  { id: 2, nPoliza: "POL002",   nombre: "Juan Carlos", apellido: "González", tipo: "Auto",     vigencia: "12 días", vence: "15-02-26", asesor: "Julian Chas", estatus: "Urgente",    correo: "juanc@gmail.com"  },
  { id: 3, nPoliza: "POL003",    nombre: "Laura",       apellido: "Torres",   tipo: "Hogar",    vigencia: "1 mes",   vence: "20-03-26", asesor: "Ana López",   estatus: "Por vencer", correo: "laura@gmail.com"  },
  { id: 4, nPoliza: "POL004",       nombre: "Carlos",      apellido: "Ramírez",  tipo: "Robo",     vigencia: "5 días",  vence: "05-03-26", asesor: "Ana López",   estatus: "Urgente",    correo: "carlos@gmail.com" },
];

const campos   = ["nPoliza", "nombre", "apellido", "tipo", "vigencia", "vence", "asesor", "estatus"];
const columnas = ["N° Póliza", "Nombre", "Apellido", "Tipo", "Vigencia", "Vence", "Asesor", "Estatus", "Acciones"];

const CAMPOS_RENOVAR = [
  { label: "Fecha de inicio", name: "fechaInicio",   type: "date"   },
  { label: "Fecha de corte",  name: "fechaCorte",    type: "date"   },
  { label: "Nueva vigencia",  name: "nuevaVigencia", opciones: ["1 mes", "3 meses", "6 meses", "1 año", "2 años"], placeholder: "Selecciona vigencia"     },
  { label: "Tipo de pago",    name: "tipoPago",      opciones: ["Mensual", "Trimestral", "Semestral", "Anual"],    placeholder: "Selecciona tipo de pago" },
  { label: "Suma asegurada",  name: "sumaAsegurada", type: "number", placeholder: "Ingresa la suma del seguro"    },
  { label: "Monto a pagar",   name: "montoAPagar",   type: "number", placeholder: "Ingresa lo que debe de pagar" },
];

const SolicitudesRenovacion = () => {
  const [search,      setSearch]      = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [snackOpen,   setSnackOpen]   = useState(false);

  const filtered = solicitudesData.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q)   ||
      p.apellido.toLowerCase().includes(q) ||
      p.nPoliza.toLowerCase().includes(q)  ||
      p.tipo.toLowerCase().includes(q)     ||
      p.asesor.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  const handleRenovar = (poliza) => { setSelected(poliza); setModalOpen(true); };

  const handleConfirmRenovar = () => {
    setModalOpen(false);
    setSnackOpen(true);
  };

  return (
    <div className="pv-page">
      <div className="pv-page-header">
        <h1>Solicitudes de renovación de pólizas</h1>
      </div>

      <div className="pv-toolbar">
        <div className="pv-field">
          <label>Búsqueda</label>
          <div className="pv-search-wrapper">
            <SearchIcon />
            <input type="text" className="pv-search" placeholder="Buscar póliza..."
              value={search} onChange={handleSearch} />
          </div>
        </div>
      </div>

      <TablaForm
        columna={columnas} data={paginated} campos={campos}
        acciones={[
          { titulo: "Renovar", clase: "tabla-btn-edit", icono: <AutorenewIcon fontSize="small" />, onClick: handleRenovar },
        ]}
      />

      <Paginacion currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <RenovarPolizaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRenovar={handleConfirmRenovar}
        poliza={selected}
        camposNuevos={CAMPOS_RENOVAR}
      />

      <Snackbar open={snackOpen} autoHideDuration={2500} onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackOpen(false)}>
          Póliza renovada exitosamente
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SolicitudesRenovacion;
