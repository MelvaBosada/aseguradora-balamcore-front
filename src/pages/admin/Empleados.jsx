import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/Clientes.css';

import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditIcon       from "@mui/icons-material/Edit";
import DeleteIcon     from "@mui/icons-material/Delete";
import SearchIcon     from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonIcon     from "@mui/icons-material/Person";
import PhoneIcon      from "@mui/icons-material/Phone";
import EmailIcon      from "@mui/icons-material/Email";
import HomeIcon       from "@mui/icons-material/Home";
import BadgeIcon      from "@mui/icons-material/Badge";

import PrimaryButton       from "../../components/PrimaryButton";
import TablaForm           from "../../components/TablaForm";
import ConfirmDeleteModal  from "../../components/ConfirmDeleteModal";
import EditModal           from "../../components/EditModal";
import ClienteDetalleModal from "../../components/ClienteDetalleModal";
import Paginacion          from "../../components/Paginacion";

const API      = "http://localhost:8000/api";
const campos   = ["nombre", "apellidos", "curp", "numero_de_telefono", "correo", "rol"];
const columnas = ["Nombre", "Apellidos", "CURP", "Teléfono", "Correo", "Rol", "Acciones"];
const usuario  = JSON.parse(localStorage.getItem("usuario") || "{}");

const FORM_VACIO = {
  nombre: "", apellidos: "", fecha_nacimiento: "", genero: "",
  estado_civil: "", nacionalidad: "", curp: "", rfc: "", nss: "",
  tipo_identificacion: "", numero_identificacion: "",
  numero_de_telefono: "", telefono_alternativo: "", correo: "",
  domicilio: "", municipio: "", estado: "", codigo_postal: "",
  fecha_ingreso: "", departamento: "", tipo_empleado: "",
  puesto: "", horario: "", estado_laboral: "",
  salario: "", tipo_nomina: "", banco: "",
  cuenta_bancaria: "", clabe_interbancaria: "",
  cedula_profesional: "", especialidad: "",
  contacto_emergencia_nombre: "", contacto_emergencia_parentesco: "",
  contacto_emergencia_telefono: "",
  password: "",
  id_rol: "",
};

const generarCampos = (roles) => [
  // ── Datos personales ──────────────────────────────
  { seccion: "Datos personales", label: "Nombre",             name: "nombre",              type: "text"   },
  { seccion: "Datos personales", label: "Apellidos",          name: "apellidos",           type: "text"   },
  { seccion: "Datos personales", label: "Fecha nacimiento",   name: "fecha_nacimiento",    type: "date"   },
  { seccion: "Datos personales", label: "Género",             name: "genero",              type: "select",
    options: [{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }] },
  { seccion: "Datos personales", label: "Estado civil",       name: "estado_civil",        type: "select",
    options: [
      { value: "soltero",    label: "Soltero(a)"    },
      { value: "casado",     label: "Casado(a)"     },
      { value: "divorciado", label: "Divorciado(a)" },
      { value: "viudo",      label: "Viudo(a)"      },
    ]},
  { seccion: "Datos personales", label: "Nacionalidad",       name: "nacionalidad",        type: "text"   },
  { seccion: "Datos personales", label: "CURP",               name: "curp",                type: "text"   },
  { seccion: "Datos personales", label: "RFC",                name: "rfc",                 type: "text"   },
  { seccion: "Datos personales", label: "NSS",                name: "nss",                 type: "text"   },
  { seccion: "Datos personales", label: "Tipo identificación",name: "tipo_identificacion", type: "select",
    options: [
      { value: "INE",       label: "INE"          },
      { value: "pasaporte", label: "Pasaporte"    },
      { value: "cedula",    label: "Cédula prof." },
    ]},
  { seccion: "Datos personales", label: "No. identificación", name: "numero_identificacion", type: "text" },

  // ── Contacto ──────────────────────────────────────
  { seccion: "Contacto", label: "Teléfono",      name: "numero_de_telefono",   type: "text"  },
  { seccion: "Contacto", label: "Teléfono alt.", name: "telefono_alternativo", type: "text"  },
  { seccion: "Contacto", label: "Correo",        name: "correo",               type: "email" },

  // ── Domicilio ─────────────────────────────────────
  { seccion: "Domicilio", label: "Código postal", name: "codigo_postal", type: "text" },
  { seccion: "Domicilio", label: "Domicilio",     name: "domicilio",     type: "text" },
  { seccion: "Domicilio", label: "Municipio",     name: "municipio",     type: "text" },
  { seccion: "Domicilio", label: "Estado",        name: "estado",        type: "text" },

  // ── Datos laborales ───────────────────────────────
  { seccion: "Datos laborales", label: "Fecha ingreso",  name: "fecha_ingreso",  type: "date" },
  { seccion: "Datos laborales", label: "Departamento",   name: "departamento",   type: "select",
    options: [
      { value: "siniestros",     label: "Siniestros"     },
      { value: "ajuste",         label: "Ajuste"         },
      { value: "peritos",        label: "Peritos"        },
      { value: "cobranza",       label: "Cobranza"       },
      { value: "ventas",         label: "Ventas"         },
      { value: "administracion", label: "Administración" },
      { value: "sistemas",       label: "Sistemas"       },
      { value: "juridico",       label: "Jurídico"       },
    ]},
  { seccion: "Datos laborales", label: "Tipo empleado",  name: "tipo_empleado",  type: "select",
    options: [
      { value: "ajustador", label: "Ajustador"     },
      { value: "perito",    label: "Perito"         },
      { value: "agente",    label: "Agente"         },
      { value: "promotor",  label: "Promotor"       },
      { value: "cobrador",  label: "Cobrador"       },
      { value: "abogado",   label: "Abogado"        },
      { value: "admin",     label: "Administrativo" },
    ]},
  { seccion: "Datos laborales", label: "Puesto",         name: "puesto",         type: "text" },
  { seccion: "Datos laborales", label: "Horario",        name: "horario",        type: "select",
    options: [
      { value: "matutino",   label: "Matutino (7am-3pm)"   },
      { value: "vespertino", label: "Vespertino (3pm-11pm)" },
      { value: "nocturno",   label: "Nocturno (11pm-7am)"  },
      { value: "mixto",      label: "Mixto"                },
    ]},
  { seccion: "Datos laborales", label: "Estado laboral", name: "estado_laboral", type: "select",
    options: [
      { value: "activo",     label: "Activo"     },
      { value: "inactivo",   label: "Inactivo"   },
      { value: "suspendido", label: "Suspendido" },
      { value: "baja",       label: "Baja"       },
    ]},
  { seccion: "Datos laborales", label: "Rol", name: "id_rol", type: "select",
    options: roles.map(r => ({ value: String(r.id), label: r.nombre })) },

  // ── Acceso al sistema ─────────────────────────────
  { seccion: "Acceso al sistema", label: "Contraseña", name: "password", type: "password" },

  // ── Nómina ────────────────────────────────────────
  { seccion: "Nómina", label: "Salario",             name: "salario",             type: "number" },
  { seccion: "Nómina", label: "Tipo nómina",         name: "tipo_nomina",         type: "select",
    options: [
      { value: "semanal",   label: "Semanal"   },
      { value: "quincenal", label: "Quincenal" },
      { value: "mensual",   label: "Mensual"   },
    ]},
  { seccion: "Nómina", label: "Banco",               name: "banco",               type: "text" },
  { seccion: "Nómina", label: "Cuenta bancaria",     name: "cuenta_bancaria",     type: "text" },
  { seccion: "Nómina", label: "CLABE interbancaria", name: "clabe_interbancaria", type: "text" },

  // ── Datos específicos ─────────────────────────────
  { seccion: "Datos específicos", label: "Cédula profesional", name: "cedula_profesional", type: "text" },
  { seccion: "Datos específicos", label: "Especialidad",       name: "especialidad",       type: "text" },

  // ── Contacto de emergencia ────────────────────────
  { seccion: "Contacto de emergencia", label: "Nombre",     name: "contacto_emergencia_nombre",     type: "text" },
  { seccion: "Contacto de emergencia", label: "Parentesco", name: "contacto_emergencia_parentesco", type: "text" },
  { seccion: "Contacto de emergencia", label: "Teléfono",   name: "contacto_emergencia_telefono",   type: "text" },
];

const Empleados = () => {
  const [empleados,        setEmpleados]        = useState([]);
  const [roles,            setRoles]            = useState([]);
  const [showModal,        setShowModal]        = useState(false);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [empToDelete,      setEmpToDelete]      = useState(null);
  const [empDetalle,       setEmpDetalle]       = useState(null);
  const [editingEmp,       setEditingEmp]       = useState(null);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [formData,         setFormData]         = useState(FORM_VACIO);
  const [itemsPerPage,     setItemsPerPage]     = useState(10);
  const [errores,          setErrores]          = useState({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resEmp, resRoles] = await Promise.all([
          axios.get(`${API}/empleados`, {
            headers: { "X-Usuario": JSON.stringify(usuario) }
          }),
          axios.get(`${API}/roles`),
        ]);
        setEmpleados(resEmp.data);
        setRoles(resRoles.data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    cargar();
  }, []);

  const recargarEmpleados = async () => {
    try {
      const res = await axios.get(`${API}/empleados`, {
        headers: { "X-Usuario": JSON.stringify(usuario) }
      });
      setEmpleados(res.data);
    } catch (err) {
      console.error("Error al recargar empleados:", err);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "codigo_postal" && value.length === 5) {
      try {
        const res = await axios.get(`https://api.zippopotam.us/mx/${value}`);
        const lugar = res.data.places[0];
        setFormData(prev => ({
          ...prev,
          codigo_postal: value,
          municipio: lugar["place name"] || prev.municipio,
          estado:    lugar["state"]       || prev.estado,
        }));
      } catch {
        // CP no encontrado
      }
    }
  };

  const handleNuevo = () => {
    setEditingEmp(null);
    setFormData({ ...FORM_VACIO, id_aseguradora: usuario.id_aseguradora });
    setErrores({});
    setShowModal(true);
  };

  const handleEditar = (emp) => {
    setEditingEmp(emp);
    setFormData(emp);
    setErrores({});
    setShowModal(true);
  };

  const handleGuardar = async () => {
    const nuevosErrores = {};
    const requeridos = [
      "nombre", "apellidos", "fecha_nacimiento", "genero", "estado_civil",
      "nacionalidad", "curp", "rfc", "nss", "tipo_identificacion",
      "numero_identificacion", "numero_de_telefono", "correo",
      "domicilio", "municipio", "estado", "codigo_postal",
      "fecha_ingreso", "departamento", "tipo_empleado", "puesto",
      "horario", "estado_laboral", "salario", "tipo_nomina",
      "banco", "cuenta_bancaria", "clabe_interbancaria",
      "contacto_emergencia_nombre", "contacto_emergencia_parentesco",
      "contacto_emergencia_telefono", "id_rol",
      ...(!editingEmp ? ["password"] : []),
    ];

    requeridos.forEach(campo => {
      if (!formData[campo] || formData[campo] === "") {
        nuevosErrores[campo] = "Este campo es requerido";
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});

    try {
      const payload = { ...formData, id_aseguradora: usuario.id_aseguradora };
if (!payload.password) delete payload.password;
      if (editingEmp) {
        await axios.put(`${API}/empleados/${editingEmp.id}`, payload);
      } else {
        await axios.post(`${API}/empleados`, payload);
      }
      await recargarEmpleados();
      setShowModal(false);
    } catch (err) {
      console.error("Error al guardar empleado:", err);
      console.error("Detalle:", err.response?.data);
    }
  };

  const handleEliminarClick  = (e) => { setEmpToDelete(e); setShowDeleteModal(true); };

  const handleConfirmarEliminar = async () => {
    try {
      await axios.delete(`${API}/empleados/${empToDelete.id}`);
      await recargarEmpleados();
      setShowDeleteModal(false);
      setEmpToDelete(null);
    } catch (err) {
      console.error("Error al eliminar empleado:", err);
    }
  };

  const filteredEmps = empleados.filter(e => {
    const q = searchTerm.toLowerCase();
    return (
      e.nombre?.toLowerCase().includes(q)    ||
      e.apellidos?.toLowerCase().includes(q) ||
      e.curp?.toLowerCase().includes(q)
    );
  });

  const totalPages   = Math.ceil(filteredEmps.length / itemsPerPage);
  const paginated    = filteredEmps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleVerDetalle = (e) => { setEmpDetalle(e); setShowDetalleModal(true); };

  const detalleItems = empDetalle ? [
  { icon: <PersonIcon />, label: "Nombre",                value: empDetalle.nombre                          },
  { icon: <PersonIcon />, label: "Apellidos",             value: empDetalle.apellidos                       },
  { icon: <BadgeIcon  />, label: "CURP",                  value: empDetalle.curp                            },
  { icon: <BadgeIcon  />, label: "RFC",                   value: empDetalle.rfc                             },
  { icon: <BadgeIcon  />, label: "NSS",                   value: empDetalle.nss                             },
  { icon: <BadgeIcon  />, label: "Tipo identificación",   value: empDetalle.tipo_identificacion             },
  { icon: <BadgeIcon  />, label: "No. identificación",    value: empDetalle.numero_identificacion           },
  { icon: <PhoneIcon  />, label: "Teléfono",              value: empDetalle.numero_de_telefono              },
  { icon: <PhoneIcon  />, label: "Teléfono alternativo",  value: empDetalle.telefono_alternativo  || "—"   },
  { icon: <EmailIcon  />, label: "Correo",                value: empDetalle.correo                          },
  { icon: <HomeIcon   />, label: "Domicilio",             value: empDetalle.domicilio                       },
  { icon: <HomeIcon   />, label: "Municipio",             value: empDetalle.municipio                       },
  { icon: <HomeIcon   />, label: "Estado",                value: empDetalle.estado                          },
  { icon: <HomeIcon   />, label: "Código postal",         value: empDetalle.codigo_postal                   },
  { icon: <BadgeIcon  />, label: "Fecha nacimiento",      value: empDetalle.fecha_nacimiento                },
  { icon: <BadgeIcon  />, label: "Género",                value: empDetalle.genero                          },
  { icon: <BadgeIcon  />, label: "Estado civil",          value: empDetalle.estado_civil                    },
  { icon: <BadgeIcon  />, label: "Nacionalidad",          value: empDetalle.nacionalidad                    },
  { icon: <BadgeIcon  />, label: "Puesto",                value: empDetalle.puesto                          },
  { icon: <BadgeIcon  />, label: "Departamento",          value: empDetalle.departamento                    },
  { icon: <BadgeIcon  />, label: "Tipo empleado",         value: empDetalle.tipo_empleado                   },
  { icon: <BadgeIcon  />, label: "Horario",               value: empDetalle.horario                         },
  { icon: <BadgeIcon  />, label: "Estado laboral",        value: empDetalle.estado_laboral                  },
  { icon: <BadgeIcon  />, label: "Fecha ingreso",         value: empDetalle.fecha_ingreso                   },
  { icon: <BadgeIcon  />, label: "Rol",                   value: empDetalle.rol                             },
  { icon: <BadgeIcon  />, label: "Salario",               value: empDetalle.salario ? `$${Number(empDetalle.salario).toLocaleString()}` : "—" },
  { icon: <BadgeIcon  />, label: "Tipo nómina",           value: empDetalle.tipo_nomina                     },
  { icon: <BadgeIcon  />, label: "Banco",                 value: empDetalle.banco                           },
  { icon: <BadgeIcon  />, label: "Cuenta bancaria",       value: empDetalle.cuenta_bancaria                 },
  { icon: <BadgeIcon  />, label: "CLABE interbancaria",   value: empDetalle.clabe_interbancaria             },
  { icon: <BadgeIcon  />, label: "Cédula profesional",    value: empDetalle.cedula_profesional    || "—"   },
  { icon: <BadgeIcon  />, label: "Especialidad",          value: empDetalle.especialidad          || "—"   },
  { icon: <PersonIcon />, label: "Contacto emergencia",   value: empDetalle.contacto_emergencia_nombre      },
  { icon: <BadgeIcon  />, label: "Parentesco",            value: empDetalle.contacto_emergencia_parentesco  },
  { icon: <PhoneIcon  />, label: "Tel. emergencia",       value: empDetalle.contacto_emergencia_telefono    },
] : [];

  return (
    <div className="container py-4">
      <h1 className="h2 fw-bold mb-3">Empleados</h1>
      <hr className="mt-2 mb-3" />

      <div className="d-flex align-items-end justify-content-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-2">Búsqueda</div>
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input type="text" className="search-custom" placeholder="Buscar empleados..."
              value={searchTerm} onChange={handleSearch} />
          </div>
        </div>
        <PrimaryButton text="Nuevo empleado" icon={<AddCircleOutlinedIcon />} onClick={handleNuevo} />
      </div>

      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={paginated}
          campos={campos}
          acciones={[
            { titulo: "Ver",      clase: "tabla-btn-ver",  icono: <VisibilityIcon fontSize="small" />, onClick: handleVerDetalle    },
            { titulo: "Editar",   clase: "tabla-btn-edit", icono: <EditIcon       fontSize="small" />, onClick: handleEditar        },
            { titulo: "Eliminar", clase: "tabla-btn-del",  icono: <DeleteIcon     fontSize="small" />, onClick: handleEliminarClick },
          ]}
        />
      </div>

      <Paginacion currentPage={currentPage} totalPages={totalPages}
        onPageChange={setCurrentPage} itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage} />

      <EditModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleGuardar}
        editando={!!editingEmp}
        titulo={editingEmp ? "Editar empleado" : "Agregar nuevo empleado"}
        subtitulo={editingEmp ? "Modifica los datos del empleado" : "Ingresa los datos del empleado"}
        btnTexto={editingEmp ? "Guardar cambios" : "Agregar empleado"}
        campos={generarCampos(roles)}
        formData={formData}
        onChange={handleInputChange}
        errores={errores}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setEmpToDelete(null); }}
        onConfirm={handleConfirmarEliminar}
        title="Eliminar empleado"
        subtitle="¿Deseas eliminar este empleado del sistema?"
      >
        {empToDelete && (
          <div>
            <p><strong>{empToDelete.nombre} {empToDelete.apellidos}</strong></p>
            <p>ID: #{empToDelete.id}</p>
            <p>Correo: {empToDelete.correo}</p>
          </div>
        )}
      </ConfirmDeleteModal>

      <ClienteDetalleModal
        open={showDetalleModal}
        onClose={() => { setShowDetalleModal(false); setEmpDetalle(null); }}
        titulo={empDetalle ? `${empDetalle.nombre} ${empDetalle.apellidos}` : ""}
        subtitulo={empDetalle ? `ID #${empDetalle.id} · ${empDetalle.puesto}` : ""}
        avatar={empDetalle ? empDetalle.nombre.charAt(0) : ""}
        items={detalleItems}
      />
    </div>
  );
};

export default Empleados;