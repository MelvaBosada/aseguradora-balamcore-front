import { useRef, useState } from "react";

/**
 * Hook reutilizable para imprimir/descargar como PDF el contenido de un ref.
 *
 * Uso en cualquier vista:
 *   const { printRef, snack, setSnack, handleDescargar } = usePDFExport("NombreArchivo");
 *   <div ref={printRef}>...contenido del documento...</div>
 *   <button onClick={handleDescargar}>Descargar PDF</button>
 */
const usePDFExport = (filename = "documento") => {
  const printRef = useRef(null);
  const [snack, setSnack] = useState(false);

  const handleDescargar = () => {
    if (!printRef.current) return;

    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #1f2d2a;
              padding: 24px;
            }
            .doc { max-width: 780px; margin: 0 auto; }

            /* Header */
            .top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 18px;
              padding-bottom: 12px;
              border-bottom: 2px solid #0F4C3A;
            }
            .titulo {
              font-size: 15px;
              font-weight: 800;
              color: #0F4C3A;
              text-transform: uppercase;
              letter-spacing: .04em;
              margin-bottom: 4px;
            }
            .sub { font-size: 10.5px; color: #6B7280; margin-bottom: 2px; }
            .logo { width: 56px; height: 56px; object-fit: contain; }

            /* Grids */
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
            .grid1 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
            .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }

            /* Sección */
            .sec {
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 7px;
              padding: 11px 13px;
            }
            .sec-titulo {
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .08em;
              color: #0F4C3A;
              margin-bottom: 7px;
              padding-bottom: 5px;
              border-bottom: 1px solid #E5E7EB;
            }

            /* Fila */
            .fila { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
            .lbl  { font-size: 9.5px; color: #6B7280; font-weight: 600; }
            .val  { font-size: 10px; color: #1f2d2a; font-weight: 500; text-align: right; }
            .txt  { font-size: 10px; color: #374151; line-height: 1.6; margin-top: 3px; }

            /* Monto */
            .monto-total {
              background: linear-gradient(135deg, #0F4C3A, #295E4E);
              color: #fff;
              padding: 9px 13px;
              border-radius: 7px;
              font-weight: 700;
              font-size: 11px;
            }

            /* Badge */
            .badge {
              display: inline-block;
              padding: 2px 10px;
              border-radius: 20px;
              font-size: 9.5px;
              font-weight: 700;
              background: #dcfce7;
              color: #16a34a;
              margin-top: 3px;
            }

            /* Footer */
            .footer {
              margin-top: 18px;
              padding-top: 12px;
              border-top: 1px solid #E5E7EB;
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              color: #9CA3AF;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      ventana.close();
      setSnack(true);
    }, 500);
  };

  return { printRef, snack, setSnack, handleDescargar };
};

export default usePDFExport;
