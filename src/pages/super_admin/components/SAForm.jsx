import { useState, useEffect, useRef } from "react";
import SAButton from "./SAButton";
import "../css/SAModal.css";
import "../css/SAForm.css";

/**
 * SAForm — motor de formulario genérico para SuperAdmin.
 *
 * No sabe nada de "aseguradoras", "planes" ni ninguna entidad concreta.
 * Recibe un arreglo `fields` que describe qué inputs mostrar, y arma
 * el grid, la validación y el manejo de FormData/objeto plano.
 *
 * @param {object[]} fields  Definición de cada campo:
 *   {
 *     name: "rfc",                 // key del campo
 *     label: "RFC",
 *     type: "text" | "email" | "select" | "textarea" | "image",
 *     required: true,
 *     span: 1 | 2,                 // columnas que ocupa en el grid (default 1)
 *     maxLength: 13,
 *     options: ["a","b"],          // para type "select"
 *     disabledOnEdit: true,        // se deshabilita cuando isEdit=true
 *     transform: (v) => v.toUpperCase(), // transforma el valor al escribir
 *     validate: (v) => "mensaje" | null, // validación custom, regresa string de error o null
 *     placeholder: "https://...",
 *     hint: "PNG o JPG, máx. 2MB", // solo para type "image"
 *   }
 *
 * @param {object|null} initialValues  Valores iniciales (edición) o null (alta)
 * @param {function} onSubmit          (payload: FormData) => Promise
 *                                      Siempre construye FormData (sirve para JSON simple
 *                                      o multipart si hay un campo "image" con archivo nuevo).
 * @param {function} onCancel
 * @param {string|null} errorMsg       Error del backend a mostrar arriba del form
 * @param {boolean} loading
 * @param {string} submitLabel         Texto del botón en modo alta (default "Guardar")
 * @param {string} submitLabelEdit     Texto del botón en modo edición (default "Guardar cambios")
 * @param {function} buildImageUrl     (relativePath) => url completa, para precargar preview en edición
 */
function SAForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  errorMsg,
  loading,
  submitLabel = "Guardar",
  submitLabelEdit = "Guardar cambios",
  buildImageUrl,
}) {
  const isEdit = !!initialValues;
  const fileInputRefs = useRef({});

  const buildEmptyState = () => {
    const state = {};
    fields.forEach((f) => {
      if (f.type === "image") return; // las imágenes se manejan aparte
      state[f.name] = f.defaultValue ?? "";
    });
    return state;
  };

  const [values, setValues] = useState(buildEmptyState());
  const [imageFiles, setImageFiles] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      const next = {};
      fields.forEach((f) => {
        if (f.type === "image") return;
        next[f.name] = initialValues[f.name] ?? "";
      });
      setValues(next);

      const previews = {};
      fields.forEach((f) => {
        if (f.type === "image" && initialValues[f.name]) {
          previews[f.name] = buildImageUrl
            ? buildImageUrl(initialValues[f.name])
            : initialValues[f.name];
        }
      });
      setImagePreviews(previews);
    } else {
      setValues(buildEmptyState());
      setImagePreviews({});
    }
    setImageFiles({});
    setFieldErrors({});
  }, [initialValues]);

  const handleChange = (field, rawValue) => {
    const value = field.transform ? field.transform(rawValue) : rawValue;
    setValues((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleImageChange = (field, file) => {
    if (!file) return;
    setImageFiles((prev) => ({ ...prev, [field.name]: file }));
    setImagePreviews((prev) => ({ ...prev, [field.name]: URL.createObjectURL(file) }));
  };

  const validar = () => {
    const errs = {};
    fields.forEach((f) => {
      if (f.type === "image") return;
      const value = values[f.name];

      if (f.required && !String(value ?? "").trim()) {
        errs[f.name] = "Requerido";
        return;
      }
      if (f.validate) {
        const msg = f.validate(value);
        if (msg) errs[f.name] = msg;
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      fd.append(key, value ?? "");
    });
    Object.entries(imageFiles).forEach(([key, file]) => {
      fd.append(key, file);
    });
    if (isEdit) fd.append("_method", "PUT");

    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="sa-modal-error">{errorMsg}</div>}

      <div className="sa-form-grid">
        {fields.map((field) => {
          if (field.type === "image") {
            return (
              <div key={field.name} className="sa-field sa-field--span2" style={{ marginBottom: 16 }}>
                {field.label && <label>{field.label}</label>}
                <div className="sa-logo-upload">
                  <div className="sa-logo-upload__preview">
                    {imagePreviews[field.name] ? (
                      <img src={imagePreviews[field.name]} alt={field.label || field.name} />
                    ) : (
                      field.placeholderIcon || "🏢"
                    )}
                  </div>
                  <div className="sa-logo-upload__input-wrap">
                    <button
                      type="button"
                      className="sa-logo-upload__btn"
                      onClick={() => fileInputRefs.current[field.name]?.click()}
                    >
                      {imagePreviews[field.name] ? "Cambiar imagen" : "Subir imagen"}
                    </button>
                    {field.hint && <span className="sa-logo-upload__hint">{field.hint}</span>}
                    <input
                      ref={(el) => (fileInputRefs.current[field.name] = el)}
                      type="file"
                      accept={field.accept || "image/png,image/jpeg"}
                      style={{ display: "none" }}
                      onChange={(e) => handleImageChange(field, e.target.files?.[0])}
                    />
                  </div>
                </div>
              </div>
            );
          }

          const spanClass = field.span === 2 ? "sa-field--span2" : "";
          const disabled = field.disabledOnEdit && isEdit;

          return (
            <div key={field.name} className={`sa-field ${spanClass}`}>
              <label>
                {field.label}
                {field.required ? " *" : ""}
              </label>

              {field.type === "select" ? (
                <select
                  value={values[field.name] ?? ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">{field.placeholder || "Selecciona..."}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={values[field.name] ?? ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  disabled={disabled}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.name] ?? ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  maxLength={field.maxLength}
                  disabled={disabled}
                  placeholder={field.placeholder}
                  title={disabled ? field.disabledHint : undefined}
                />
              )}

              {field.hint && !fieldErrors[field.name] && (
                <span className="sa-field-hint">{field.hint}</span>
              )}

              {fieldErrors[field.name] && (
                <span className="sa-field-error">{fieldErrors[field.name]}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sa-form-actions">
        <SAButton variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </SAButton>
        <SAButton variant="accent" type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? submitLabelEdit : submitLabel}
        </SAButton>
      </div>
    </form>
  );
}

export default SAForm;
