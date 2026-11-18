/*
  Generacion de informes PDF compartida por todas las pantallas.

  generarPDF recibe ya los datos preparados (cabeceras y filas) para que cada pantalla
  decida que columnas exporta. Asi la tabla de la pantalla y el PDF no se desincronizan.

  Parametros:
    titulo        texto grande de la cabecera del informe.
    cabeceras     array con los titulos de columna, en orden.
    filas         array de arrays; cada fila debe tener el mismo numero de celdas que cabeceras.
    nombreArchivo nombre con el que el navegador descarga el fichero.
    descripcion   texto opcional bajo la fecha (por ejemplo, los filtros aplicados).
    orientacion   "portrait" o "landscape" para tablas anchas.
*/

// Color de marca del proyecto usado en el titulo y en la cabecera de la tabla.
const COLOR_PRIMARIO = [27, 73, 101];

export async function generarPDF({
  titulo,
  cabeceras,
  filas,
  nombreArchivo,
  descripcion = "",
  orientacion = "portrait",
}) {
  // jsPDF y AutoTable pesan mucho: se importan solo cuando se pide un informe, no al
  // arrancar la aplicacion. Promise.all pide las dos librerias en paralelo.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  // Documento en memoria; la orientacion cambia el ancho y el alto de la pagina.
  const doc = new jsPDF(orientacion);
  // Fecha de generacion con el formato local espanol (dd/mm/aaaa).
  const fecha = new Date().toLocaleDateString("es-ES");

  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARIO);
  // Titulo en el color de marca y debajo la fecha en gris.
  doc.text(titulo, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Fecha de generación: ${fecha}`, 14, 28);

  let inicioTabla = 35;
  // La descripcion se parte en varias lineas segun el ancho util de la pagina.
  if (descripcion) {
    const lineasDescripcion = doc.splitTextToSize(
      descripcion,
      doc.internal.pageSize.getWidth() - 28,
    );
    doc.text(lineasDescripcion, 14, inicioTabla);
    inicioTabla += lineasDescripcion.length * 5 + 2;
  }

  // AutoTable dibuja la tabla desde inicioTabla y salta de pagina solo cuando hace falta.
  autoTable(doc, {
    startY: inicioTabla,
    head: [cabeceras],
    body: filas,
    margin: { left: 14, right: 14, bottom: 18 },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLOR_PRIMARIO,
    },
    // didDrawPage se ejecuta en cada pagina: aqui se escribe el pie y el numero de pagina.
    didDrawPage: () => {
      const anchoPagina = doc.internal.pageSize.getWidth();
      const altoPagina = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Informe generado desde la aplicación", 14, altoPagina - 8);
      doc.text(
        `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
        anchoPagina - 14,
        altoPagina - 8,
        { align: "right" },
      );
    },
  });

  doc.save(nombreArchivo);
}
