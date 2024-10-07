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
    didDrawPage: (data) => {
      currentY = data.cursor.y + 20;
      if (currentY > doc.internal.pageSize.height - 60) {
        currentY = 40;
      }
    },
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
      ['Pérdida Total Sin Deducible (****).\nCon excepción de los eventos por Ausencia de Control donde aplicara el deducible correspondiente.'],
      ['Responsabilidad Civil frente a terceros y Responsabilidad a Ocupantes 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Accesorios Musicales y Especiales: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Equipo electrónico: 15% del monto indemnizable, mínimo US$ 200.00'],
      ['Ausencia de Control y RC por AC: 20% del monto del siniestro, mínimo US$ 300.00'],
      ['Robo de Accesorios: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Rotura de Lunas Nacionales: Sin deducible'],
      ['Rotura de Lunas Importadas: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Robo Total: Sin Deducible (****).\nVehículos con obligatoriedad de contar con dispositivo GPS y no lo tengan habilitado y operativo al momento de un evento, no contaran con cobertura de Robo Total.'],
      ['Accidentes Personales: Sin deducible'],
      ['Circulación en vías fuera del uso regular y frecuente: Uso de vías no autorizadas: 20% del monto indemnizable, mínimo US$ 300.00'],
      ['Vehículo de Reemplazo: Copago: US$ 90.00 más IGV'],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
    didDrawPage: (data) => {
      currentY = data.cursor.y + 20;
      if (currentY > doc.internal.pageSize.height - 60) {
        currentY = 40;
      }
    },
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
        'Pérdida Total: Sin deducible.\nCon excepción de los eventos por Ausencia de Control donde aplicara el deducible correspondiente.',
      ],
      ['Responsabilidad Civil frente a terceros y Responsabilidad a Ocupantes: 15% del monto indemnizable, mínimo US$ 150.00'],
      ['Accesorios Musicales y Especiales: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Ausencia de Control y RC por AC: 25% del monto del siniestro, mínimo US$ 400.00'],
      ['Robo de Accesorios: 10% del monto indemnizable, mínimo US$ 150.00'],
      ['Rotura de Lunas Nacionales: Sin deducible'],
      ['Rotura de Lunas Importadas: 10% del monto indemnizable, mínimo US$ 150.00'],
      [
        'Robo Total: Sin deducible.\nVehículos con obligatoriedad de contar con dispositivo GPS y no lo tengan habilitado y operativo al momento de un evento, no contaran con cobertura de Robo Total.',
      ],
      ['Accidentes Personales: Sin deducible'],
      ['Circulación en vías fuera del uso regular y frecuente: Uso de vías no autorizadas: 25% del monto indemnizable, mínimo US$ 400.00'],
      ['Vehículo de Reemplazo: Copago: US$ 90.00 más IGV'],
    ],
    theme: 'grid',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: 4 },
    didDrawPage: (data) => {
      currentY = data.cursor.y + 20;
      if (currentY > doc.internal.pageSize.height - 40) {
        currentY = 40;
      }
    },
  });

    // Salto de Pagina
        doc.addPage();
  
  // Coberturas Aplicables
  doc.setFontSize(12);
  doc.text('COBERTURAS APLICABLES', 40, currentY);
  currentY += 20;

  // Daños Materiales
  doc.setFontSize(12);
  doc.text('Daños Materiales', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Colisión, Incendio, Rotura accidental de Lunas, Fenómenos naturales, incluyendo maremoto, tsunami y marejada, así como los daños provenientes de inundaciones causadas por lluvias que originen crecidas de ríos, desborde de acequias, lagos y lagunas, deslizamientos de tierra (huaicos), huelga, conmoción civil, daño malicioso, vandalismo y terrorismo.', 40, currentY, 500);

  // Robo, Hurto o Uso No Autorizado
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Robo, Hurto o Uso No Autorizado', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Robo o hurto total del vehículo asegurado, hasta el valor indicado en las condiciones particulares. El robo o hurto de piezas o partes del vehículo asegurado, hasta el límite establecido en las Condiciones Particulares de la póliza. Los daños causados por la perpetración de delitos, en cualquiera de sus grados, de consumado, frustrado o tentativa.', 40, currentY, 500);

  // Responsabilidad Civil Frente a Terceros
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Responsabilidad Civil Frente a Terceros', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Hasta el límite indicado en el cuadro Detalle de Coberturas. La presente cobertura cubre los riesgos de daño emergente, lucro cesante, daño moral, para accidentes personales ocasionados a terceros no ocupantes, aplicará en exceso a la cobertura de SOAT.', 40, currentY, 500);

  // Responsabilidad Civil Frente a Ocupantes
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Responsabilidad Civil Frente a Ocupantes', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Lesiones corporales que sufran las personas que viajen dentro del vehículo asegurado, excepto conductor, chóferes y/o familiares. La presente cobertura es aplicable con un límite máximo por ocupante, según lo indicado en el cuadro Detalle de Coberturas.', 40, currentY, 500);

  // Accidentes Personales
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Accidentes Personales', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('El presente apartado comprende las siguientes sub-coberturas:', 40, currentY, 500);
  currentY += 10;
  const subCoberturas = [
    'Muerte e Invalidez permanente',
    'Gastos de curación',
    'Gastos de Sepelio'
  ];
  subCoberturas.forEach(subCobertura => {
    currentY = wrapText(`- ${subCobertura}`, 60, currentY, 500);
  });
  currentY = wrapText('La suma máxima por ocupante se especifica en el cuadro Detalle de Coberturas, considerando un límite de ocupantes, según lo señalado en la tarjeta de propiedad del vehículo.', 40, currentY + 10, 500);

  // Defensa Judicial
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Defensa Judicial', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Ante una eventual Responsabilidad Civil como consecuencia de un accidente de tránsito, este seguro se extiende a cubrir hasta el límite asegurado indicado en el cuadro Detalle de Coberturas, los gastos que se requieran para la correspondiente defensa judicial en las diligencias que deban realizarse.', 40, currentY, 500);

  // Asistencia en Viaje y/o Auxilio Mecánico
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Asistencia en Viaje y/o Auxilio Mecánico', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('En caso de emergencia, se deberá comunicar con la central de asistencia al 622-2233. Ofrecemos grúa y ambulancia. En caso de que la compañía se encuentre impedida de brindar el servicio, se reembolsará hasta el monto indicado en el cuadro Detalle de Coberturas.', 40, currentY, 500);

  // Ausencia de Control
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Ausencia de Control', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Daños Materiales y Responsabilidad Civil frente a terceros. Ausencia de control hasta el valor asegurado del vehículo y Responsabilidad Civil por ausencia de control limitada al monto indicado en el cuadro Detalle de Coberturas. Cubre eventos que se susciten en vías no autorizadas.', 40, currentY, 500);

  // Exclusiones
  currentY += 20;
  doc.setFontSize(12);
  doc.text('Exclusiones', 40, currentY);
  currentY += 20;
  doc.setFontSize(10);
  currentY = wrapText('Se excluyen los daños ocasionados por la carga transportada (para el transporte de combustible y material inflamable, no se amparan perdidas a consecuencia de incendio y/o explosión).', 40, currentY, 500);

// Salto de página
if (currentY > doc.internal.pageSize.height - 60) {
    doc.addPage();
    currentY = 40; // Reinicia la posición en la nueva página
  }
  

    // Aspectos Generales de Suscripción
    currentY += 20;
    doc.setFontSize(12);
    doc.text('ASPECTOS GENERALES DE SUSCRIPCIÓN', 40, currentY);
    currentY += 20;
    doc.setFontSize(10);
    const aspectosGenerales = [
    '- Las unidades sin placa de Rodaje se podrán emitir sólo si son unidades nuevas. Los datos de identificación necesarios son el número de motor y chasís.',
    '- Los accesorios musicales o de comunicación que no se encuentren fijos en el vehículo no serán materia de cobertura.',
    '- Los valores comerciales serán determinados en función a la lista de APESEG vigente al momento de la cotización. Se podrá evaluar con sustento en caso la suma asegurada solicitada se encuentre fuera del rango permitido.',
    '- En caso la factura del proveedor contemple un descuento especial, la suma asegurada no considerará dicho descuento.',
    '- Sólo se considerará condiciones de año cero a las unidades con año de fabricación correspondiente al año vigente (2024).'
    ];
    aspectosGenerales.forEach((text) => {
    currentY = wrapText(text, 40, currentY, 500);
    currentY += 5;
    });

    // Coberturas Adicionales
    currentY += 20;
    doc.setFontSize(12);
    doc.text('COBERTURAS ADICIONALES', 40, currentY);
    currentY += 20;
    doc.setFontSize(10);
    const coberturasAdicionales = [
    '- Cobertura automática para nuevas adquisiciones. (Hasta por 30 días desde la fecha de adquisición)',
    '- Restitución automática de la suma asegurada de daño propio, sin costo adicional. Para la cobertura de accesorios musicales se podrá restituir la suma asegurada hasta una vez en el año, pero con cobro adicional.',
    '- Atención de siniestros en red de talleres afiliados a Qualitas Seguros.',
    '- Uso de vías o rutas no autorizadas al tránsito bajo condiciones de las coberturas de Ausencia de control / Imprudencia Temeraria.'
    ];
    coberturasAdicionales.forEach((text) => {
    currentY = wrapText(text, 40, currentY, 500);
    currentY += 5;
    });

    // Servicios Adicionales
    currentY += 20;
    doc.setFontSize(12);
    doc.text('SERVICIOS ADICIONALES', 40, currentY);
    currentY += 20;
    doc.setFontSize(10);
    const serviciosAdicionales = [
    '- Servicio de atención las 24 horas a través de la central de emergencias QUALITAS.',
    '- Servicio de Auxilio Mecánico.',
    '- Servicio de Grúa en caso de siniestro. Por reembolso hasta US$ 1,000.00 cuando el proveedor de la compañía no pueda brindar el servicio.',
    '- Servicio de Ambulancia en caso de siniestro. Por reembolso hasta US$ 1,000.00 cuando el proveedor de la compañía no pueda brindar el servicio.',
    '- Servicio de asistencia de procuraduría en caso de siniestro.',
    '- Chofer reemplazo para vehículos livianos de uso particular.',
    '- Vehículo de reemplazo en caso de siniestro: Cobertura de 15 días para casos de choque, vuelco, incendio, despiste y 30 días para casos de robo total. (Sujeto a disponibilidad de proveedores)',
    '- Gastos de Búsqueda y Rescate por evento hasta US$ 3,000.00.',
    ' -Gastos Defensa Jurídica y Penal por evento hasta US$ 2,700.00.',
    '- Se cubre el costo de reposición de llaves de los vehículos (incluyendo llaves electrónicas) a consecuencia de robo por asalto. Cobertura hasta US$ 1,000.00, un evento por vigencia.'
    ];
    serviciosAdicionales.forEach((text) => {
    currentY = wrapText(text, 40, currentY, 500);
    currentY += 5;
    });

    // Condiciones Especiales
    currentY += 20;
    doc.setFontSize(12);
    doc.text('CONDICIONES ESPECIALES', 40, currentY);
    currentY += 20;
    doc.setFontSize(10);
    const condicionesEspeciales = [
    'Valor Admitido y/o Convenido: Las indemnizaciones en caso de pérdida total y/o robo total serán efectuadas sobre la base de la suma asegurada establecida en la póliza, la misma que no podrá superar el 120% del valor comercial que tenga una unidad de las mismas condiciones y características en el mercado nacional, a la fecha de indemnización del siniestro.',
    'Se deja constancia que la totalidad de las unidades incluidas en la póliza están siendo aseguradas incluyendo el IGV, motivo por el cual las indemnizaciones en caso de siniestro de pérdida total y/o robo total deberán efectuarse incluyendo dicho impuesto, para todos los asegurados, sin excepción alguna.',
    'La cobertura de daño propio se extiende inclusive para resarcir las pérdidas y/o daños que se produzcan mientras las unidades se encuentren siendo remolcadas y/o reparadas y/o en prueba en sus propios talleres y/o talleres de terceros a quienes el asegurado haya solicitado este servicio.',
    'Las pérdidas totales serán determinadas cuando los daños a la unidad siniestrada sean iguales o superen el 75% de la suma asegurada.',
    'Responsabilidad Civil frente a ocupantes y/o pasajeros, limitados por el número de ocupantes permitidos por la Tarjeta de Propiedad, excluyendo al conductor. Máximo el número de personas según tarjeta.',
    'Se declarará una pérdida total por robo, a los treinta (30) días transcurridos desde la fecha de ocurrencia del siniestro, en caso no aparezca el vehículo robado.',
    "El aire acondicionado, las bolsas de aire (Air bag), así como cualquier otro equipamiento de fábrica que posean los vehículos, se encuentran incluidos en el valor del vehículo; accesorios adicionales deberán ser declarados y su valor agregado a la suma asegurada.",
    "No se limitará la cobertura de robo parcial y/o total para las unidades que no cuenten con dispositivos de seguridad tales como: alarmas antirrobo, sistemas de trabagas, protectores de faros, tuercas y pernos y seguridad para aros y llantas.",
    "Exoneración de devolución de la carátula desmontable para equipos de música. Es decir, para tener la cobertura de robo no será necesario retirar la misma como medida de seguridad. Hasta 05 eventos.",
    "Se cubren las pérdidas y/o daños a las unidades aseguradas, en cualquier lugar en donde se encuentren estacionadas, incluyendo la cobertura de incendio a consecuencia de fuego externo. Se amparan los accidentes que sufran las unidades aseguradas por cualquier suceso que se origine por una fuerza externa, repentina y violenta que ocasione pérdida total o parcial.",
    "No se aplicará depreciación para la indemnización de llantas.",
    "En caso de siniestro y de no existir en el país las piezas de recambio (repuestos originales), la compañía se encargará de obtener estas en el extranjero. Sólo en el caso de no existir en estos mercados, se procederá de acuerdo con las condiciones de la póliza.",
    "Exoneración de intervención policial en casos tales como: robos parciales, choques estacionados, choques y/o daños donde no haya involucrado daños a terceros, siempre y cuando exista la intervención y aprobación del procurador de la compañía. La procuraduría será las 24 horas del día, llamando al call center y en las zonas urbanas donde se cuente con el servicio. Este servicio también se encargará de coordinar la asistencia de grúa y/o remolque, ambulancia y del servicio de auxilio mecánico en caso sea necesario.",
    "En caso de siniestro, no se excluirán daños o pérdidas adicionales ocurridas al vehículo asegurado a consecuencia del abandono de la unidad por causas de fuerza mayor, tales como: cumplimiento de un deber de humanidad, salvaguardar la integridad del chofer, de ocupantes del vehículo y para cumplir con el trámite legal y/o policial.",
    "En el caso de rotura de lunas y cualquier otro siniestro que las afecte, se incluye en la cobertura las láminas de seguridad, anti-impacto y polarizadas y/o control solar, siempre y cuando hayan formado parte del vehículo.",
    "Al amparo de la Cláusula de 'Uso de Vías No Autorizadas' y bajo las condiciones de Ausencia de Control, se extiende a cubrir siniestros que ocurran en cruce de riachuelos, caminos y carreteras internas en las minas.",
    "Se cubren los siniestros cuando la licencia de conducir del chofer se encuentre vencida, y se haya efectuado el trámite de renovación, y habiendo aprobado las evaluaciones, se encuentre pendiente de entrega del nuevo documento, como máximo hasta 30 días posteriores al vencimiento.",
    'Plazo para denuncia de siniestros:\na. A la Autoridad Policial, hasta 4 horas después de ocurrido cualquier siniestro.\nb. A la Compañía de Seguros, hasta 03 días después de ocurrido cualquier siniestro, siempre y cuando el asegurado haya realizado la denuncia policial y se haya sometido al dosaje etílico correspondiente en los plazos de ley.',
  'La cobertura de accidentes personales para ocupantes se activa por cualquier evento o accidente que se encuentre debidamente amparado por la cobertura de daño propio. Asimismo, las sumas aseguradas bajo las coberturas de accidentes personales serán iguales para todos los pasajeros de cualquier edad, sin ninguna limitación o reducción, o aplicación de porcentaje.',
  'Para la aplicación de la cláusula de Ausencia de Control o Imprudencia del Conductor:\n- No se limita a radio urbano.\n- Será de aplicación los 365 días del año, las 24 horas del día, aun cuando el siniestro no se produzca en el desempeño de las funciones autorizadas a los trabajadores.\n- Conducir a una velocidad que exceda la permitida.\n- Cuando el vehículo se encuentre conducido por el titular, cónyuge, sus hijos mayores de edad y/o terceras personas sin la autorización del asegurado, siempre y cuando tengan la licencia de conducir vigente. La póliza se extiende a amparar los siniestros que se produzcan como consecuencia de que la unidad circule en sentido contrario al tránsito autorizado, incluyendo invasión de carril contrario, línea discontinua.\n- No es necesario que el chofer se encuentre en la planilla del asegurado. Asimismo, se deja constancia que las unidades pueden ser conducidas por cualquier persona, trabajador, funcionario o cualquier persona contratada o no por el asegurado, aunque no se encuentren registrados en la planilla o no realicen las actividades de chofer.',
  'No se aplicará deducible en los siguientes siniestros, siempre y cuando no cuenten con deducible diferenciado en póliza:\n- Daños Personales.\n- Pérdida Total, excepto Ausencia de Control o imprudencia culposa del conductor, y en los deducibles que se especifiquen en las condiciones particulares.\n- Rotura de lunas, cuando se reponga con luna nacional.',
  'Obligatoriedad de Instalación de GPS: Según política adjunta.',
];
    condicionesEspeciales.forEach((text, index) => {
    if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 40;
    }
    currentY = wrapText(`${index + 1}. ${text}`, 40, currentY, 500);
    currentY += 5;
    });

    if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 40;
      }

// Salto de página
if (currentY > doc.internal.pageSize.height - 60) {
    doc.addPage();
    currentY = 40; // Reinicia la posición en la nueva página
  }  

  // Unidades No Asegurables
currentY += 20;
doc.setFontSize(12);
doc.text('UNIDADES NO ASEGURABLES EN EL PRESENTE PROGRAMA - SUJETAS A EVALUACIÓN', 40, currentY);
currentY += 20;

autoTable(doc, {
  startY: currentY,
  head: [['Por Modelo', '']],
  body: [
    ['Audi', 'TT, TTS, R8 y RS3 en adelante'],
    ['BMW', 'Versiones Coupe y Gran Coupe, M3, M4, M5, M6, 840, 850, Serie Z'],
    ['Mazda', 'RX8, MX5'],
    ['Subaru', 'WRX (todas las versiones), BRZ (todas las versiones)'],
    ['Dodge', 'Challenger, Charger, Nitro'],
    ['Ford', 'Mustang'],
    ['Toyota', '86 GT'],
    ['Nissan', '350 Z'],
    ['Renault', 'Megane RS'],
    ['Mitsubishi', 'Lancer EVO'],
    ['Hyundai', 'Tiburón'],
    ['Mercedes Benz', 'Versiones AMG, SLK, SL, SLC todas con motor de 3.0 en adelante'],
    ['Peugeot', 'RCZ'],
    ['Hummer', 'En todos sus modelos'],
    ['Aston Martin', 'En todos sus modelos'],
    ['Porsche', 'En todos sus modelos'],
    ['Maserati', 'En todos sus modelos'],
    ['Jaguar', 'En todos sus modelos'],
  ],
  theme: 'grid',
  margin: { left: 40, right: 40 },
  styles: { fontSize: 10, cellPadding: 4 },
  didDrawPage: (data) => {
    currentY = data.cursor.y + 20;  // Mover el puntero al final de la tabla + un margen de 20
    if (currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();  // Solo agregar página si se alcanza el límite inferior
      currentY = 40;  // Reiniciar `currentY` al inicio de la nueva página
    }
  },
});

currentY = doc.lastAutoTable.finalY + 20;

// Por Uso
doc.setFontSize(12);
doc.text('Por Uso', 40, currentY);
currentY += 20;
doc.setFontSize(10);
currentY = wrapText('Cualquier uso distinto al PARTICULAR.', 40, currentY, 500);
currentY = wrapText('En caso de encontrarse asegurada una unidad distinta al uso PARTICULAR, el siniestro será rechazado.', 40, currentY + 5, 500);

// Por Estado De Conservación
currentY += 20;
doc.setFontSize(12);
doc.text('Por Estado De Conservación', 40, currentY);
currentY += 20;
doc.setFontSize(10);
currentY = wrapText('Unidades que no tengan buen estado de conservación según informe de inspección.', 40, currentY, 500);
currentY = wrapText('Las versiones americanas o vehículos de importación directa podrán ser evaluados únicamente con la presentación del reporte AUTOCHECK.', 40, currentY + 5, 500);

// Por Otras Características Especiales
currentY += 20;
doc.setFontSize(12);
doc.text('Por Otras Características Especiales', 40, currentY);
currentY += 20;
doc.setFontSize(10);
currentY = wrapText('No se aseguran vehículos utilizados para carreras, competencias, demostración o vehículos que tengan jaula interna incorporada.', 40, currentY, 500);
currentY = wrapText('No se aseguran vehículos que son convertibles o cabriolet.', 40, currentY + 5, 500);
currentY = wrapText('No se aseguran vehículos blindados. Excepciones a negociar.', 40, currentY + 5, 500);
currentY = wrapText('No se aseguran aquellos vehículos con modificaciones en el motor con el objetivo de aumentar la potencia y/o rendimiento del motor.', 40, currentY + 5, 500);

// Add footer at the bottom of the page
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
  
      doc.setLineWidth(0.5);
      doc.line(40, pageHeight - 40, 555, pageHeight - 40);
      doc.setFontSize(8);
      doc.text('Qualitas Corp - Cotización de Seguro Vehicular', 40, pageHeight - 25);
      doc.text(`Fecha de generación: ${today.toLocaleString()}`, 40, pageHeight - 10);
    }
  };
  
  // Call the function after generating all content
  addFooter(doc);  

if (currentY > doc.internal.pageSize.height - 60) {
  doc.addPage();
  currentY = 40;
}

  // Save the PDF
  doc.save(`${fileName}.pdf`);
}