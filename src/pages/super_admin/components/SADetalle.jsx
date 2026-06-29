import { useState } from "react";
import SABadge from "./SABadge";
import "../css/SADetalle.css";


/**
 * SADetalle — vista de solo lectura genérica para SuperAdmin.
 *
 * No sabe nada de "aseguradoras" ni ninguna entidad concreta. Recibe
 * un header opcional (logo/avatar + título + subtítulo + badge) y un
 * arreglo de `items` a mostrar en grid de label/value.
 *
 * @param {object} header  Opcional. { image, fallbackIcon, title, subtitle, badge: {text, variant} }
 * @param {object[]} items Cada uno: { label, value, span: 1|2 }
 *                          Si `value` es null/undefined/"" y no tiene `hideIfEmpty: false`,
 *                          se omite (no se muestra fila vacía).
 */
function SADetalle({ header, items }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="sa-detalle">
      {header && (
        <div className="sa-detalle__top">
          {(header.image || header.fallbackIcon) && (
            <div className="sa-detalle__logo">
              {header.image && !imageFailed ? (
                <img
                  src={header.image}
                  alt={header.title}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                header.fallbackIcon || "🏢"
              )}
            </div>
          )}
          <div className="sa-detalle__heading">
            {header.title && <h4 className="sa-detalle__nombre">{header.title}</h4>}
            {header.subtitle && <span className="sa-detalle__razon">{header.subtitle}</span>}
          </div>
          {header.badge && (
            <SABadge variant={header.badge.variant || "neutral"}>{header.badge.text}</SABadge>
          )}
        </div>
      )}

      <div className="sa-detalle__grid">
        {items
          .filter((item) => item.hideIfEmpty === false || (item.value !== null && item.value !== undefined && item.value !== ""))
          .map((item, i) => (
            <div
              key={i}
              className={`sa-detalle__item ${item.span === 2 ? "sa-detalle__item--full" : ""}`}
            >
              <span className="sa-detalle__label">{item.label}</span>
              <span className="sa-detalle__value">
                {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
                {item.hint && <span className="sa-detalle__hint"> {item.hint}</span>}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SADetalle;
