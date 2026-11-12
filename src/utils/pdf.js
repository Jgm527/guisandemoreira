const COLOR_PRIMARIO = [27, 73, 101];

export async function generarPDF({
  titulo,
  cabeceras,
  filas,
  nombreArchivo,
  descripcion = "",
  orientacion = "portrait",
}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF(orientacion);
  const fecha = new Date().toLocaleDateString("es-ES");

  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.text(titulo, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Fecha de generación: ${fecha}`, 14, 28);

  let inicioTabla = 35;
  if (descripcion) {
    const lineasDescripcion = doc.splitTextToSize(
      descripcion,
      doc.internal.pageSize.getWidth() - 28,
    );
    doc.text(lineasDescripcion, 14, inicioTabla);
    inicioTabla += lineasDescripcion.length * 5 + 2;
  }

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
