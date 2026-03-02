import { useState } from 'react';
import '../../css/Clientes.css'; 
import logo from "../../assets/Logo.png";
import TablaForm from '../../components/TablaForm'; // Ajusta la ruta según tu estructura

const Clientes = () => {
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
    "ID",
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
      {/* Header con título y botón verde */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">Listado clientes</h1>
        <button 
          className="btn btn-imss px-4 py-2"
          onClick={handleNuevoCliente}
        >
          Nuevo cliente
        </button>
      </div>

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

      {/* Tabla usando el componente TablaForm */}
      <div className="mb-4">
        <TablaForm 
          columna={columnas}
          data={filteredClientes}
          onEditar={handleEditar}
          onEliminar={handleEliminarClick}
        />
      </div>

      

      {/* Modal de Agregar/Editar Cliente */}
      {showModal && (
        <div className="modal-custom-overlay">
          <div className="modal-custom">
            <div className="modal-custom-header">
              <img src={logo} alt="Logo" className="modal-logo" />
              <div>
                <h2 className="modal-custom-title">
                  {editingCliente ? 'Editar cliente' : 'Agregar nuevo cliente'}
                </h2>
                <p className="modal-custom-subtitle">
                  {editingCliente ? 'Modifica los datos del cliente' : 'Ingresa todos los datos para continuar con el proceso'}
                </p>
              </div>
            </div>
            
            <div className="modal-custom-body">
              <div className="modal-custom-field">
                <label className="modal-custom-label">Nombre's</label>
                <input
                  type="text"
                  className="modal-custom-input"
                  placeholder="Ingresa el nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">Apellidos</label>
                <input
                  type="text"
                  className="modal-custom-input"
                  placeholder="Ingresa el apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">Numero de teléfono</label>
                <input
                  type="text"
                  className="modal-custom-input"
                  placeholder="Ingresa el número telefónico"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">Fecha de alta</label>
                <input
                  type="date"
                  className="modal-custom-input"
                  placeholder="Ingresa la fecha"
                  name="fechaAlta"
                  value={formData.fechaAlta}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="modal-custom-input"
                  placeholder="Ingresa el correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">CURP</label>
                <input
                  type="text"
                  className="modal-custom-input"
                  placeholder="Ingresa la CURP"
                  name="curp"
                  value={formData.curp}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-custom-field">
                <label className="modal-custom-label">RFC</label>
                <input
                  type="text"
                  className="modal-custom-input"
                  placeholder="Ingresa el RFC"
                  name="rfc"
                  value={formData.rfc}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="modal-custom-footer">
              <button 
                className="modal-custom-btn modal-custom-btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="modal-custom-btn modal-custom-btn-agregar"
                onClick={handleGuardar}
              >
                {editingCliente ? 'Guardar Cambios' : 'Agregar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && clienteToDelete && (
        <div className="modal-custom-overlay">
          <div className="modal-custom modal-delete">
            <div className="modal-custom-header">
              <div className="modal-delete-icon">
                🗑️
              </div>
              <div>
                <h2 className="modal-custom-title modal-delete-title">Eliminar cliente</h2>
                <p className="modal-custom-subtitle">¿Estás seguro de que deseas eliminar este cliente?</p>
              </div>
            </div>
            
            <div className="modal-custom-body modal-delete-body">
              <div className="delete-client-info">
                <p><strong>Cliente a eliminar:</strong></p>
                <p className="delete-client-name">{clienteToDelete.nombre} {clienteToDelete.apellido}</p>
                <p className="delete-client-detail">ID: {clienteToDelete.id}</p>
                <p className="delete-client-detail">Teléfono: {clienteToDelete.telefono}</p>
                <p className="delete-client-detail">Correo: {clienteToDelete.correo}</p>
              </div>
              <p className="delete-warning">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-custom-footer">
              <button 
                className="modal-custom-btn modal-custom-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setClienteToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="modal-custom-btn modal-custom-btn-eliminar"
                onClick={handleConfirmarEliminar}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;