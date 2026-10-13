import { useEffect, useState } from "react";
import "./SplashScreen.css";

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
    { src: L_B, w: 60, grupo: "balam" },
    { src: L_a1, w: 44, grupo: "balam" },
    { src: L_l, w: 25, grupo: "balam" },
    { src: L_a2, w: 44, grupo: "balam" },
    { src: L_m, w: 73, grupo: "balam" },
    { src: L_C, w: 57, grupo: "core" },
    { src: L_o, w: 46, grupo: "core" },
    { src: L_r, w: 36, grupo: "core" },
    { src: L_e, w: 42, grupo: "core" },
];

// ready: pon false mientras cargas datos reales, true cuando ya terminó
// minTime: tiempo mínimo (ms) que se ve la pantalla de carga
const SplashScreen = ({ ready = true, minTime = 2800, holdTime = 700, onFinish }) => {
    const [phase, setPhase] = useState("loading"); // loading -> exit
    const [progress, setProgress] = useState(0);
    const [minDone, setMinDone] = useState(false);


    // tiempo mínimo
    useEffect(() => {
        const t = setTimeout(() => setMinDone(true), minTime);
        return () => clearTimeout(t);
    }, [minTime]);

    // avance "falso": sube rápido al inicio y se frena cerca del 92%
    useEffect(() => {
        const id = setInterval(() => {
            setProgress((p) => (p >= 100 ? p : p < 92 ? p + (92 - p) * 0.07 : p));
        }, 100);
        return () => clearInterval(id);
    }, []);

    // cuando ya cargó todo, se llena al 100%
    useEffect(() => {
        if (minDone && ready) setProgress(100);
    }, [minDone, ready]);

    // barra llena -> desvanecer
    // barra llena -> desvanecer
    useEffect(() => {
        if (progress >= 100 && phase === "loading") {
            const t = setTimeout(() => setPhase("exit"), holdTime);
            return () => clearTimeout(t);
        }
    }, [progress, phase, holdTime]);

    useEffect(() => {
        if (phase === "exit") {
            const t = setTimeout(() => onFinish && onFinish(), 650);
            return () => clearTimeout(t);
        }
    }, [phase, onFinish]);

    return (
        <div className={`splash ${phase}`} role="status" aria-label="Cargando">
            <div className="splash-content">


                {/* LÍNEA DE CARGA + JAGUAR ENCIMA */}
                <div className="splash-progress" aria-hidden="true">
                    <div className="jaguar-wrap" style={{ left: `${progress}%` }}>
                        <div className="jaguar-walk" />
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* LETRAS
        <div className="splash-letters" aria-hidden="true">
          {LETRAS.map((l, i) => (
            <span
              key={i}
              className={`letter ${l.grupo}${i === 5 ? " gap" : ""}`}
              style={{
                "--w": l.w,
                WebkitMaskImage: `url(${l.src})`,
                maskImage: `url(${l.src})`,
              }}
            />
          ))}
        </div>
*/}
                {/* CARGANDO */}
                <img src={Cargando} alt="" className="splash-cargando" aria-hidden="true" />
            </div>
        </div>
    );
};

export default SplashScreen;