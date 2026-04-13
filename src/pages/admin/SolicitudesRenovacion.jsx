import { useState } from "react";
import SearchIcon    from "@mui/icons-material/Search";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Snackbar      from "@mui/material/Snackbar";
import Alert         from "@mui/material/Alert";


import TablaForm          from "../../components/TablaForm";
import Paginacion         from "../../components/Paginacion";
import RenovarPolizaModal from "../../components/RenovarPolizaModal";

import "../../css/PolizasVencer.css";




const solicitudesData = [
  { id: 1, nPoliza: "POL001", nombre: "María",       apellido: "Méndez Uc",   tipo: "Vivienda", vigencia: "1 mes",   vence: "13-03-26", asesor: "Julian Chas", estatus: "Por vencer", correo: "maria@gmail.com"  },
  { id: 2, nPoliza: "POL002", nombre: "Juan Carlos", apellido: "González Tec", tipo: "Auto",     vigencia: "12 días", vence: "15-02-26", asesor: "Julian Chas", estatus: "Urgente",    correo: "juanc@gmail.com"  },
  { id: 3, nPoliza: "POL003", nombre: "Laura",       apellido: "Torres Cab",   tipo: "Hogar",    vigencia: "1 mes",   vence: "20-03-26", asesor: "Ana López",   estatus: "Por vencer", correo: "laura@gmail.com"  },
  { id: 4, nPoliza: "POL004", nombre: "Carlos",      apellido: "Ramírez Tec",  tipo: "Robo",     vigencia: "5 días",  vence: "05-03-26", asesor: "Ana López",   estatus: "Urgente",    correo: "carlos@gmail.com" },
  { id: 5,  nPoliza: "POL005",nombre: "Sofía",      apellido: "Canul Pech",    tipo: "Vida",     vigencia: "2 meses",  vence: "25-03-26", asesor: "Julian Chas", estatus: "Por vencer", correo: "sofia@gmail.com"   },
{ id: 6,  nPoliza: "POL006", nombre: "Roberto",    apellido: "Dzul May",      tipo: "Auto",     vigencia: "8 días",   vence: "10-03-26", asesor: "Ana López",   estatus: "Urgente",    correo: "roberto@gmail.com" },
{ id: 7,  nPoliza: "POL007", nombre: "Valentina",  apellido: "Ek Contreras",  tipo: "Vivienda", vigencia: "3 semanas", vence: "01-04-26", asesor: "Pedro Sosa",  estatus: "Por vencer", correo: "vale@gmail.com"    },
{ id: 8,  nPoliza: "POL008", nombre: "Fernando",   apellido: "Couoh Balam",   tipo: "Hogar",    vigencia: "3 días",   vence: "05-03-26", asesor: "Pedro Sosa",  estatus: "Urgente",    correo: "fer@gmail.com"     },
{ id: 9,  nPoliza: "POL009", nombre: "Daniela",    apellido: "Tzuc Herrera",  tipo: "Robo",     vigencia: "1 mes",    vence: "15-04-26", asesor: "Julian Chas", estatus: "Por vencer", correo: "dani@gmail.com"    },
{ id: 10, nPoliza: "POL010", nombre: "Alejandro",  apellido: "Poot Estrella", tipo: "Vida",     vigencia: "6 días",   vence: "08-03-26", asesor: "Ana López",   estatus: "Urgente",    correo: "alex@gmail.com"    },
];

const campos   = ["nPoliza", "nombre", "apellido", "tipo", "vigencia", "vence", "asesor", "estatus"];
const columnas = ["N° Póliza", "Nombre", "Apellido(s)", "Tipo", "Vigencia", "Vence", "Asesor", "Estatus", "Acciones"];

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
  // Cambia la constante por un estado
const [itemsPerPage, setItemsPerPage] = useState(8);


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
  

 // Recalcula con el estado
const totalPages = Math.ceil(filtered.length / itemsPerPage);
const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  const handleRenovar = (poliza) => { setSelected(poliza); setModalOpen(true); };

  const handleConfirmRenovar = () => {
    setModalOpen(false);
    setSnackOpen(true);
  };

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Solicitudes de renovación de pólizas</h1>
      <hr className="mt-2 mb-3" />

      <div className="pv-toolbar">
        <div className="pv-field">
           <div className="fw-bold mb-2">Búsqueda</div>
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

<Paginacion
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  itemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
/>

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
