import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Importar la extensión de autoTable

export async function generatePDF(formData, cotizacion, autoDealer) {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`;
  const fileName = `Qualitas_Corp_${formattedDate}_${formData.placa}_${formData.contratante.replace(/[./\s]+/g, "")}`;

  // Calcular la prima neta y total considerando la opción de Auto al Dealer
  let primaNeta = cotizacion.primaNeta;
  if (autoDealer) {
    primaNeta += 90; // Añadir el costo de auto al dealer si se selecciona
  }
  const primaTotal = primaNeta * 1.03 * 1.18;

  // Generate the PDF using jsPDF
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Add header to the document
  doc.setFontSize(16);
  doc.setTextColor("#333333");
  doc.text('SLIP DE COTIZACIÓN - QUALITAS CORP', 40, 40);
  doc.setLineWidth(0.5);
  doc.line(40, 50, 555, 50);

  // Adding date and number of the quotation
  doc.setFontSize(12);
  doc.text(`Fecha de Cotización: ${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`, 40, 70);
  doc.text(`Número de Cotización: ${formattedDate}`, 40, 90);

  // Información general - Tabla en formato vertical
  doc.setFontSize(12);
  let currentY = 120;
  doc.text('Información General:', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    body: [
      ['CONTRATANTE/ASEGURADO', formData.contratante],
      ['DNI/RUC', formData.dni_ruc],
      ['CIRCULACIÓN', formData.circulacion],
      ['USO', "PARTICULAR"],
      ['PERÍODO', "ANUAL"],
      ['MONEDA', "US$ dólares americanos"],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // Información del vehículo - Tabla horizontal
  doc.setFontSize(12);
  doc.text('Información del Vehículo:', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    head: [['PLACA', 'MARCA', 'MODELO', 'AÑO', 'SUMA ASEGURADA']],
    body: [[formData.placa, formData.marca, formData.modelo, formData.ano, formData.sumaAsegurada]],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // Resumen de primas - Mantener el orden existente
  doc.setFontSize(12);
  doc.text('Resumen de Primas:', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    head: [['PRIMA NETA', 'AUTO AL DEALER', 'PRIMA TOTAL']],
    body: [
      [
        `${primaNeta.toFixed(2)}`,
        autoDealer ? '90.00' : 'No Aplica',
        `${primaTotal.toFixed(2)}`,
      ]
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  currentY = doc.lastAutoTable.finalY + 30;

  // Materia del Seguro
  doc.setFontSize(12);
  doc.text('MATERIA DEL SEGURO', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  doc.text('Vehículos livianos de uso particular.', 40, currentY);

  currentY += 40;

  // Coberturas - Tabla
  doc.setFontSize(12);
  doc.text('Coberturas:', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    head: [['Coberturas para Todo Riesgo de Automóviles', 'Suma Asegurada']],
    body: [
      ['Daños Materiales / Robo, Hurto o Uso No Autorizado (Choque, Vuelco, Incendio, Robo Total, Robo Parcial y Rotura de Lunas)', 'Suma Asegurada'],
      ['Responsabilidad Civil frente a terceros, por vehículo (por evento)', 'US$ 200,000.00'],
      ['Responsabilidad Civil Frente Ocupantes (*)', 'Limite Por Vehículo: US$ 100,000.00, Máximo por ocupante: US$ 25,000.00'],
      ['Accesorios Musicales y Equipos audiovisuales', 'US$ 2,000.00'],
      ['Accesorios Especiales adaptados y fijos en la unidad', 'US$ 2,000.00'],
      ['Equipo electrónico', 'US$ 3,000.00'],
      ['Accidentes Personales (máximo 5 ocupantes)', 'Muerte e invalidez permanente hasta US$ 30,000.00, Gastos de curación hasta US$ 6,000.00'],
      ['Ausencia de Control / Imprudencia Temeraria - Daño Propio', 'Suma Asegurada'],
      ['Ausencia de Control / Imprudencia Temeraria - Responsabilidad Civil', 'US$ 100,000.00'],
      ['Asistencia en viaje', 'Servicio de Grúa hasta US$ 1,000.00, Servicio de Ambulancia hasta US$ 1,000.00'],
      ['Defensa Judicial', 'US$ 2,700.00'],
      ['Gastos de rescate y/o búsqueda de la unidad', 'US$ 3,000.00'],
      ['Vehículo de Reemplazo', 'Amparado'],
      ['Chofer de Reemplazo', '5 eventos'],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });
  
  currentY = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(10);
  const wrapText = (text, x, y, maxWidth) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * 12;
  };
  currentY = wrapText('(*) Por Vehículo / Por evento', 40, currentY, 500);
  currentY = wrapText('(**) Automóviles, SUV y Pick Ups, hasta 5 ocupantes. Vehículos pesados, panel, hasta 2 ocupantes. Microbuses, Minibuses y Ómnibus, hasta 2 ocupantes.', 40, currentY + 5, 500);
  currentY = wrapText('(***) Servicio de Grúa y Ambulancia, hasta 4 eventos al año, máximo 2 eventos al mes. Eventos de Auxilio mecánico, ilimitados.', 40, currentY + 5, 500);

  // Salto de página
  doc.addPage();

  // Sección de deducibles
  doc.setFontSize(12);
  currentY = 40;
  doc.text('DEDUCIBLES (No incluyen IGV)', 40, currentY);
  currentY += 20;
  doc.text('Automóviles y Camionetas SUV - Particular', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    body: [
      ['Por evento 10% del monto indemnizable, mínimo US$ 150 en Talleres Calificados Multimarca'],
      ['Por evento 15% del monto indemnizable, mínimo US$ 200 en Talleres Concesionarios Afiliados'],
      ['Vehículos híbridos 20% del monto indemnizable, mínimo US$ 300.00. Aplica para la reparación a los componentes del sistema eléctrico del vehículo.'],
      ['Excepto:'],
      [
        'Pérdida Total Sin Deducible (****). Con excepción de los eventos por Ausencia de Control donde aplicara el deducible correspondiente.',
      ],
      ['Responsabilidad Civil frente a terceros y Responsabilidad a Ocupantes 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Accesorios Musicales y Especiales: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Equipo electrónico: 15% del monto indemnizable, mínimo US$ 200.00'],
      ['Ausencia de Control y RC por AC: 20% del monto del siniestro, mínimo US$ 300.00'],
      ['Robo de Accesorios: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Rotura de Lunas Nacionales: Sin deducible'],
      ['Rotura de Lunas Importadas: 10% del monto indemnizable, mínimo US$ 150.00'],
      [
        'Robo Total: Sin Deducible (****). Vehículos con obligatoriedad de contar con dispositivo GPS y no lo tengan habilitado y operativo al momento de un evento, no contaran con cobertura de Robo Total.',
      ],
      ['Accidentes Personales: Sin deducible'],
      ['Circulación en vías fuera del uso regular y frecuente: Uso de vías no autorizadas: 20% del monto indemnizable, mínimo US$ 300.00'],
      ['Vehículo de Reemplazo: Copago: US$ 90.00 más IGV'],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  currentY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('(****) Con excepción del modelo Soluto de la marca Kia al que se aplica deducible del 20% del monto indemnizable.', 40, currentY);

  currentY += 40;

  // Automóviles y Camionetas SUV de Origen Chino / Indio - Particular
  doc.setFontSize(12);
  doc.text('Automóviles y Camionetas SUV de Origen Chino / Indio - Particular', 40, currentY);
  currentY += 20;

  autoTable(doc, {
    startY: currentY,
    body: [
      ['Por evento 15% del monto indemnizable, mínimo US$ 150 en Talleres Calificados Multimarca'],
      ['Por evento 20% del monto indemnizable, mínimo US$ 200 en Talleres Concesionarios Afiliados'],
      ['Vehículos híbridos: 25% del monto indemnizable, mínimo US$ 300.00. Aplica para la reparación a los componentes del sistema eléctrico del vehículo.'],
      ['Excepto:'],
      [
        'Pérdida Total: Sin deducible. Con excepción de los eventos por Ausencia de Control donde aplicara el deducible correspondiente.',
      ],
      ['Responsabilidad Civil frente a terceros y Responsabilidad a Ocupantes: 15% del monto indemnizable, mínimo US$ 150.00'],
      ['Accesorios Musicales y Especiales: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Ausencia de Control y RC por AC: 25% del monto del siniestro, mínimo US$ 400.00'],
      ['Robo de Accesorios: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Rotura de Lunas Nacionales: Sin deducible'],
      ['Rotura de Lunas Importadas: 10% del monto indemnizable, mínimo US$ 150.00'],
      [
        'Robo Total: Sin deducible. Vehículos con obligatoriedad de contar con dispositivo GPS y no lo tengan habilitado y operativo al momento de un evento, no contaran con cobertura de Robo Total.',
      ],
      ['Accidentes Personales: Sin deducible'],
      ['Circulación en vías fuera del uso regular y frecuente: Uso de vías no autorizadas: 25% del monto indemnizable, mínimo US$ 400.00'],
      ['Vehículo de Reemplazo: Copago: US$ 90.00 más IGV'],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // Términos y Condiciones
  doc.addPage();
  currentY = 40;
  doc.setFontSize(12);
  doc.text('TÉRMINOS Y CONDICIONES GENERALES', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('1. Este documento es una cotización y no constituye un contrato de seguro. Todas las coberturas, deducibles y servicios están sujetos a las condiciones generales y particulares de la póliza que se emita.', 40, currentY, 500);
  currentY = wrapText('2. La prima total incluye impuestos y cargos administrativos según la legislación vigente.', 40, currentY + 5, 500);
  currentY = wrapText('3. La información contenida en este documento es válida por un plazo de 30 días a partir de la fecha de emisión, sujeta a modificaciones dependiendo de la evaluación final del riesgo.', 40, currentY + 5, 500);
  currentY = wrapText('4. La cobertura del seguro entrará en vigor una vez que se hayan cumplido todas las formalidades, incluyendo la aceptación de la propuesta por parte de la compañía aseguradora y el pago correspondiente de la prima.', 40, currentY + 5, 500);
  currentY = wrapText('5. En caso de siniestro, el asegurado deberá cumplir con todos los requisitos establecidos en las condiciones de la póliza para hacer efectiva la cobertura.', 40, currentY + 5, 500);

  // Add footer
  currentY = doc.lastAutoTable.finalY + 30;
  doc.setLineWidth(0.5);
  doc.line(40, currentY, 555, currentY);
  doc.setFontSize(8);
  currentY += 20;
  doc.text('Qualitas Corp - Cotización de Seguro Vehicular', 40, currentY);
  doc.text(`Fecha de generación: ${today.toLocaleString()}`, 40, currentY + 15);

  // Save the PDF
  doc.save(`${fileName}.pdf`);
}