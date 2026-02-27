import { useState } from 'react';
import '../../css/Clientes.css';

import AddIcon from "@mui/icons-material/Add";

import PrimaryButton from "../../components/PrimaryButton";
import TablaForm from '../../components/TablaForm'; // Ajusta la ruta según tu estructura
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import EditModal from "../../components/EditModal";


const Clientes = () => {

const campos = [
  "nombre",
  "apellido",
  "telefono",
  "curp",
  "rfc",
  "domicilio",
  "correo"
];


  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: "Maria",
      apellido: "Mendez",
      telefono: "9993456789",
      curp: "SIE884FGHTI59R3G",
      rfc: "4DFGT3456JGF",
      domicilio: "Calle 50",
      correo: "ejemplo@gmail.com"
    },
    {
      id: 2,
      nombre: "Juan Carlos",
      apellido: "Gonzales",
      telefono: "8994567812",
      curp: "DHFG5678ORE34RD",
      rfc: "SGD5651100IUU",
      domicilio: "Calle 90",
      correo: "ejemplo@gmail.com"
    },
    {
      id: 3,
      nombre: "Jacob M.",
      apellido: "Mendoza",
      telefono: "9993456789",
      curp: "UY4S322FGHT9670K",
      rfc: "ILIT5411034",
      domicilio: "Avenida",
      correo: "ejemplo@gmail.com"
    },
    {
      id: 4,
      nombre: "Miguel",
      apellido: "Torres",
      telefono: "9993459876",
      curp: "SDG3456JGHC3456",
      rfc: "JF5673112DCS",
      domicilio: "Circuito",
      correo: "ejemplo@gmail.com"
    },
    {
      id: 5,
      nombre: "Angel",
      apellido: "Torres",
      telefono: "9990340567",
      curp: "SDG456FKH789WSDF",
      rfc: "DFS234519076",
      domicilio: "Calle 50",
      correo: "ejemplo@gmail.com"
    }
  ]);

  // Definimos las columnas como un array
  const columnas = [
    "Nombre",
    "Apellido",
    "Teléfono",
    "CURP",
    "RFC",
    "Domicilio",
    "Correo",
    "Acciones"
  ];

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    curp: '',
    rfc: '',
    domicilio: '',
    correo: '',
    fechaAlta: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
      curp: '',
      rfc: '',
      domicilio: '',
      correo: '',
      fechaAlta: ''
    });
    setShowModal(true);
  };

  const handleEditar = (cliente) => {
    setEditingCliente(cliente);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (editingCliente) {
      setClientes(clientes.map(c =>
        c.id === editingCliente.id ? { ...formData, id: editingCliente.id } : c
      ));
    } else {
      const newId = Math.max(...clientes.map(c => c.id), 0) + 1;
      setClientes([...clientes, { ...formData, id: newId }]);
    }
    setShowModal(false);
  };

  const handleEliminarClick = (cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = () => {
    if (clienteToDelete) {
      setClientes(clientes.filter(c => c.id !== clienteToDelete.id));
      setShowDeleteModal(false);
      setClienteToDelete(null);
    }
  };


  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(searchLower) ||
      cliente.apellido.toLowerCase().includes(searchLower) ||
      cliente.telefono.includes(searchTerm) ||
      cliente.correo.toLowerCase().includes(searchLower) ||
      cliente.rfc.toLowerCase().includes(searchLower) ||
      cliente.curp.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">Listado clientes</h1></div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div className="fw-bold mb-2">Búsqueda</div>
        <div style={{ maxWidth: '250px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar cliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Línea divisoria después de búsqueda */}
      <hr className="mt-0 mb-4" />

      {/* Header con título y botón verde */}

      <div className="d-flex justify-content-end align-items-center mb-4">
        <PrimaryButton
          text="Nuevo cliente"
          icon={<AddIcon />}
          onClick={handleNuevoCliente}
        />
      </div>
      {/* Tabla usando el componente TablaForm */}
      <div className="mb-4">
        <TablaForm
          columna={columnas}
          data={filteredClientes}
          campos={campos}
          onEditar={handleEditar}
          onEliminar={handleEliminarClick}
        />
      </div>



      {/* Modal de Agregar/Editar Cliente */}
    <EditModal
  open={showModal}
  onClose={() => setShowModal(false)}
  onSave={handleGuardar}
  editingCliente={editingCliente}
  formData={formData}
  onChange={handleInputChange}
/>

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
      <p><strong>{clienteToDelete.nombre} {clienteToDelete.apellido}</strong></p>
      <p>ID: {clienteToDelete.id}</p>
      <p>Teléfono: {clienteToDelete.telefono}</p>
      <p>Correo: {clienteToDelete.correo}</p>
    </div>
  )}
</ConfirmDeleteModal>
    </div>
  );
};

export default Clientes;