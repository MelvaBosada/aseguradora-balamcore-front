import logo from "../../assets/Logo.png";

const AdminHome = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  return (
    <div className="container py-4" data-tour="main-panel" style={{ position: "relative", overflow: "hidden", minHeight: "80vh" }}>

      {/* LOGO DE FONDO CON TRANSPARENCIA — centrado */}
      <img
        src={logo}
        alt="Logo de la aseguradora"
        style={{
          position: "absolute",
          width: "320px",
          opacity: 0.10,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* CONTENIDO */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* TÍTULO */}
        <h1 className="h2 fw-bold mb-1">Panel Principal</h1>
        <p style={{ color: "#172e0e", fontSize: 18, marginBottom: 0, marginTop: 20 }}>
          Bienvenido de nuevo {usuario.nombre || usuario.correo || "Usuario"}, gestiona tu aseguradora desde aquí.
        </p>
        <p style={{ color: "#172e0e", fontSize: 18, margin: 0 }}>
          Selecciona una opción del menú para comenzar a trabajar.
        </p>
        <hr className="mt-2 mb-4" />

      </div>
    </div>
  );
};

export default AdminHome;