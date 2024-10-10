// Función para obtener datos de las hojas de cálculo
async function obtenerDatos(url) {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const rows = doc.querySelectorAll('tbody tr');
    return Array.from(rows).map(row => Array.from(row.cells).map(cell => cell.textContent));
  }
  
  // Función para procesar los datos de vehículos
  function procesarDatosVehiculos(data) {
    return data.slice(1).map(row => ({
      marca: row[1],
      modelo: row[2],
      riesgo: row[3]
    }));
  }
  
  // Función para procesar los datos de tasas
  function procesarDatosTasas(data) {
    return data.slice(1).map(row => ({
      antiguedad: parseInt(row[1]),
      categoriaI: parseFloat(row[2]),
      medianoRiesgo: parseFloat(row[3]),
      altoRiesgo: parseFloat(row[4]),
      chinoEIndio: parseFloat(row[5])
    }));
  }
  
  // Función para crear la interfaz de usuario
  function crearInterfazUsuario(vehiculos, tasasLima, tasasProvincia) {
    const app = document.getElementById('app');
    
    // Crear selectores
    const marcaSelect = document.createElement('select');
    marcaSelect.id = 'marca';
    const modeloSelect = document.createElement('select');
    modeloSelect.id = 'modelo';
    const riesgoSelect = document.createElement('select');
    riesgoSelect.id = 'riesgo';
    const antiguedadSelect = document.createElement('select');
    antiguedadSelect.id = 'antiguedad';
    const ubicacionSelect = document.createElement('select');
    ubicacionSelect.id = 'ubicacion';
    
    // Poblar selectores
    const marcas = [...new Set(vehiculos.map(v => v.marca))];
    marcas.forEach(marca => {
      const option = document.createElement('option');
      option.value = option.textContent = marca;
      marcaSelect.appendChild(option);
    });
    
    const riesgos = [...new Set(vehiculos.map(v => v.riesgo))];
    riesgos.forEach(riesgo => {
      const option = document.createElement('option');
      option.value = option.textContent = riesgo;
      riesgoSelect.appendChild(option);
    });
    
    tasasLima.forEach(tasa => {
      const option = document.createElement('option');
      option.value = option.textContent = tasa.antiguedad;
      antiguedadSelect.appendChild(option);
    });
    
    ['Lima', 'Provincia'].forEach(ubicacion => {
      const option = document.createElement('option');
      option.value = option.textContent = ubicacion;
      ubicacionSelect.appendChild(option);
    });
    
    // Eventos
    marcaSelect.addEventListener('change', () => {
      modeloSelect.innerHTML = '';
      const modelosFiltrados = vehiculos.filter(v => v.marca === marcaSelect.value);
      modelosFiltrados.forEach(v => {
        const option = document.createElement('option');
        option.value = option.textContent = v.modelo;
        modeloSelect.appendChild(option);
      });
    });
    
    // Agregar elementos a la página
    app.appendChild(marcaSelect);
    app.appendChild(modeloSelect);
    app.appendChild(riesgoSelect);
    app.appendChild(antiguedadSelect);
    app.appendChild(ubicacionSelect);
    
    // Botón para calcular
    const calcularBtn = document.createElement('button');
    calcularBtn.textContent = 'Calcular Tasa';
    calcularBtn.addEventListener('click', () => {
      const vehiculo = vehiculos.find(v => v.marca === marcaSelect.value && v.modelo === modeloSelect.value);
      const antiguedad = parseInt(antiguedadSelect.value);
      const tasas = ubicacionSelect.value === 'Lima' ? tasasLima : tasasProvincia;
      const tasa = tasas.find(t => t.antiguedad === antiguedad);
      
      let tasaFinal;
      switch(vehiculo.riesgo) {
        case 'CATEGORIA I':
          tasaFinal = tasa.categoriaI;
          break;
        case 'MEDIANO RIESGO':
          tasaFinal = tasa.medianoRiesgo;
          break;
        case 'ALTO RIESGO':
          tasaFinal = tasa.altoRiesgo;
          break;
        case 'CHINO E INDIO':
          tasaFinal = tasa.chinoEIndio;
          break;
        default:
          tasaFinal = 'No disponible';
      }
      
      alert(`La tasa para el vehículo seleccionado es: ${tasaFinal}%`);
    });
    
    app.appendChild(calcularBtn);
  }
  
  // Función principal
  async function main() {
    const urlVehiculos = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQI6kmRoIxEde-RHfZ1U0AfGC2ZubjeF-4BHbyw9Wx74ob3FFwcM3OV29X1HopLX_ncAnCAEMg3G7IQ/pub?gid=1008793461';
    const urlTasasLima = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSM9S_j_BZW6QnxB03uNMcbtJak39CPZ2tZKRHDehiqBFr7b6jNJdrSQ3UqpRzor5cfuMCMgDwAJ-1h/pub?gid=1732458939';
    const urlTasasProvincia = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSM9S_j_BZW6QnxB03uNMcbtJak39CPZ2tZKRHDehiqBFr7b6jNJdrSQ3UqpRzor5cfuMCMgDwAJ-1h/pub?gid=2015943443';
  
    const [datosVehiculos, datosTasasLima, datosTasasProvincia] = await Promise.all([
      obtenerDatos(urlVehiculos),
      obtenerDatos(urlTasasLima),
      obtenerDatos(urlTasasProvincia)
    ]);
  
    const vehiculos = procesarDatosVehiculos(datosVehiculos);
    const tasasLima = procesarDatosTasas(datosTasasLima);
    const tasasProvincia = procesarDatosTasas(datosTasasProvincia);
  
    crearInterfazUsuario(vehiculos, tasasLima, tasasProvincia);
  }
  
  // Ejecutar la función principal cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', main);