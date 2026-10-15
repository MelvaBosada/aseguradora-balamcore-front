import { useEffect, useState } from "react";
import "./LetrasLoader.css";

import L_B from "../../assets/loader/Recurso_12.png";
import L_a1 from "../../assets/loader/Recurso_14.png";
import L_l from "../../assets/loader/Recurso_15.png";
import L_a2 from "../../assets/loader/Recurso_16.png";
import L_m from "../../assets/loader/Recurso_17.png";
import L_C from "../../assets/loader/Recurso_18.png";
import L_o from "../../assets/loader/Recurso_19.png";
import L_r from "../../assets/loader/Recurso_20.png";
import L_e from "../../assets/loader/Recurso_21.png";
import Cargando from "../../assets/loader/Recurso_46.png";

// w = ancho original de cada PNG (todos miden 80 de alto)
const LETRAS = [
  { src: L_B,  w: 60 },
  { src: L_a1, w: 44 },
  { src: L_l,  w: 25 },
  { src: L_a2, w: 44 },
  { src: L_m,  w: 73 },
  { src: L_C,  w: 57 },
  { src: L_o,  w: 46 },
  { src: L_r,  w: 36 },
  { src: L_e,  w: 42 },
];

const LetrasLoader = ({ visible }) => {
  const [render, setRender] = useState(visible); // está en el DOM
  const [show, setShow] = useState(false);       // opacidad (para el fade)

  useEffect(() => {
    if (visible) {
      setRender(true);
      const r = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(r);
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (!render) return null;

  return (
    <div className={`ll-overlay ${show ? "show" : ""}`} role="status" aria-label="Cargando">
      <div className="ll-letras" aria-hidden="true">
        {LETRAS.map((l, i) => (
          <span
            key={i}
            className={`ll-letra${i === 5 ? " ll-gap" : ""}`}
            style={{
              "--w": l.w,
              "--i": i,
              WebkitMaskImage: `url(${l.src})`,
              maskImage: `url(${l.src})`,
            }}
          />
        ))}
      </div>

    </div>
  );
};

export default LetrasLoader;