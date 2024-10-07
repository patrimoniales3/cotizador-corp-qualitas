'use client'

import { useState, useEffect } from 'react'
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Simulación de datos
const vehiculosData = [
  { marca: "TOYOTA", modelo: "COROLLA", riesgo: "BAJO" },
  { marca: "TOYOTA", modelo: "YARIS", riesgo: "BAJO" },
  { marca: "HONDA", modelo: "CIVIC", riesgo: "MEDIO" },
  { marca: "HONDA", modelo: "ACCORD", riesgo: "MEDIO" },
  { marca: "FORD", modelo: "MUSTANG", riesgo: "ALTO" },
  { marca: "FORD", modelo: "FOCUS", riesgo: "MEDIO" },
]

const tasasData = {
  LIMA: {
    BAJO: { 0: 0.0350, 5: 0.0400, 10: 0.0450, 15: 0.0500 },
    MEDIO: { 0: 0.0400, 5: 0.0450, 10: 0.0500, 15: 0.0550 },
    ALTO: { 0: 0.0450, 5: 0.0500, 10: 0.0550, 15: 0.0600 },
  },
  PROVINCIA: {
    BAJO: { 0: 0.0300, 5: 0.0350, 10: 0.0400, 15: 0.0450 },
    MEDIO: { 0: 0.0350, 5: 0.0400, 10: 0.0450, 15: 0.0500 },
    ALTO: { 0: 0.0400, 5: 0.0450, 10: 0.0500, 15: 0.0550 },
  },
}

export default function CotizadorCorpQualitas() {
  const [formData, setFormData] = useState({
    contratante: '',
    dni_ruc: '',
    circulacion: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    riesgo: '',
    sumaAsegurada: '',
    placaEnTramite: false,
  })

  const [marcas, setMarcas] = useState<string[]>([])
  const [modelos, setModelos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cotizacion, setCotizacion] = useState({
    tasaNeta: 0,
    primaNeta: 0,
    primaTotal: 0,
  })

  useEffect(() => {
    const uniqueMarcas = Array.from(new Set(vehiculosData.map(v => v.marca)))
    setMarcas(uniqueMarcas)
  }, [])

  useEffect(() => {
    if (formData.marca) {
      const modelosFiltrados = vehiculosData
        .filter(v => v.marca === formData.marca)
        .map(v => v.modelo)
      setModelos(modelosFiltrados)
    } else {
      setModelos([])
    }
  }, [formData.marca])

  useEffect(() => {
    if (formData.marca && formData.modelo) {
      const vehiculo = vehiculosData.find(v => v.marca === formData.marca && v.modelo === formData.modelo)
      if (vehiculo) {
        setFormData(prev => ({ ...prev, riesgo: vehiculo.riesgo }))
      }
    }
  }, [formData.marca, formData.modelo])

  useEffect(() => {
    calcularCotizacion()
  }, [formData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let newValue = value

    if (name === 'contratante') {
      newValue = value.toUpperCase()
    }

    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handleDniRucBlur = () => {
    if (formData.dni_ruc.length === 11 && !['10', '20'].includes(formData.dni_ruc.substring(0, 2))) {
      setError('RUC debe comenzar con 10 o 20')
    } else if (formData.dni_ruc.length !== 8 && formData.dni_ruc.length !== 11) {
      setError('DNI debe tener 8 dígitos o RUC debe tener 11 dígitos')
    } else {
      setError(null)
    }
  }

  const handlePlacaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase().replace(/\s/g, '')
    if (newValue.length === 6) {
      newValue = `${newValue.slice(0, 3)}-${newValue.slice(3)}`
    }
    const placaRegex = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/

    if (newValue && !placaRegex.test(newValue)) {
      setError('La placa debe tener el formato correcto')
    } else {
      setError(null)
    }

    setFormData(prev => ({ ...prev, placa: newValue }))
  }

  const handleSumaAseguradaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(/,/g, ''))
    if (!isNaN(value)) {
      setFormData(prev => ({ ...prev, sumaAsegurada: value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked, placa: checked ? 'ET' : '' }))
  }

  const calcularCotizacion = () => {
    if (!formData.circulacion || !formData.riesgo || !formData.ano || !formData.sumaAsegurada) return

    const currentYear = new Date().getFullYear()
    const antiguedad = currentYear - parseInt(formData.ano.toString())
    let tasaIndex: 0 | 5 | 10 | 15 = 0
    if (antiguedad >= 15) tasaIndex = 15
    else if (antiguedad >= 10) tasaIndex = 10
    else if (antiguedad >= 5) tasaIndex = 5

    const tasaNeta = tasasData[formData.circulacion as 'LIMA' | 'PROVINCIA'][formData.riesgo as 'BAJO' | 'MEDIO' | 'ALTO'][tasaIndex]
    let primaNeta = tasaNeta * parseFloat(formData.sumaAsegurada.replace(/,/g, ''))
    primaNeta = Math.max(primaNeta, 300)
    const primaTotal = primaNeta * 1.03 * 1.18

    setCotizacion({
      tasaNeta,
      primaNeta,
      primaTotal,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date()
    const formattedDate = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`
    const fileName = `Qualitas_Corp_${formattedDate}_${formData.placa}_${formData.contratante.replace(/[./\s]+/g, "")}`

    // Fetch the HTML template from the public folder
    const response = await fetch('/corporativo-plantilla.html')
    let template = await response.text()

    // Replace placeholders in the template with actual form values
    template = template.replace('{{fecha_cotizacion}}', `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`)
    template = template.replace('{{numero_cotizacion}}', formattedDate)
    template = template.replace('{{contratante}}', formData.contratante)
    template = template.replace('{{dni_ruc}}', formData.dni_ruc)
    template = template.replace('{{circulacion}}', formData.circulacion)
    template = template.replace('{{placa}}', formData.placa)
    template = template.replace('{{marca}}', formData.marca)
    template = template.replace('{{modelo}}', formData.modelo)
    template = template.replace('{{ano}}', formData.ano.toString())
    template = template.replace('{{sumaAsegurada}}', formData.sumaAsegurada)
    template = template.replace('{{primaNeta}}', cotizacion.primaNeta.toFixed(2))
    template = template.replace('{{tasaNeta}}', (cotizacion.tasaNeta * 100).toFixed(3))
    template = template.replace('{{primaTotal}}', cotizacion.primaTotal.toFixed(2))

    // Generate the PDF using jsPDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Add header to the document
    doc.setFontSize(12);
    doc.text('SLIP DE COTIZACIÓN - QUALITAS CORP', 40, 40);
    doc.setLineWidth(0.5);
    doc.line(40, 50, 555, 50);

    // Add content to the document
    doc.setFontSize(10);
    doc.text(`Fecha de Cotización: ${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`, 40, 70);
    doc.text(`Número de Cotización: ${formattedDate}`, 40, 90);

    // Cotización details
    doc.text('Cotización:', 40, 120);
    doc.text(`Contratante / Asegurado: ${formData.contratante}`, 40, 140);
    doc.text(`DNI/RUC: ${formData.dni_ruc}`, 40, 160);
    doc.text(`Circulación: ${formData.circulacion}`, 40, 180);
    doc.text(`Placa: ${formData.placa}`, 40, 200);
    doc.text(`Marca: ${formData.marca}`, 40, 220);
    doc.text(`Modelo: ${formData.modelo}`, 40, 240);
    doc.text(`Año: ${formData.ano}`, 40, 260);
    doc.text(`Suma Asegurada: ${formData.sumaAsegurada}`, 40, 280);
    doc.text(`Tasa Neta: ${(cotizacion.tasaNeta * 100).toFixed(3)}%`, 40, 300);
    doc.text(`Prima Neta: ${cotizacion.primaNeta.toFixed(2)}`, 40, 320);
    doc.text(`Prima Total: ${cotizacion.primaTotal.toFixed(2)}`, 40, 340);

    // Add footer
    doc.setLineWidth(0.5);
    doc.line(40, 770, 555, 770);
    doc.setFontSize(8);
    doc.text('Qualitas Corp - Cotización de Seguro Vehicular', 40, 790);
    doc.text(`Fecha de generación: ${today.toLocaleString()}`, 40, 810);

    // Add a page break if needed
    if (doc.internal.getNumberOfPages() > 1) {
      doc.addPage();
    }

    // Save the PDF
    doc.save(`${fileName}.pdf`);
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Cotizador Corp Qualitas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="contratante">CONTRATANTE / ASEGURADO</Label>
                <Input id="contratante" name="contratante" value={formData.contratante} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="dni_ruc">DNI / RUC</Label>
                <Input id="dni_ruc" name="dni_ruc" value={formData.dni_ruc} onChange={handleInputChange} onBlur={handleDniRucBlur} required />
                {error && error.startsWith('DNI') && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              </div>
              <div>
                <Label htmlFor="circulacion">CIRCULACIÓN</Label>
                <Select name="circulacion" onValueChange={(value) => handleSelectChange('circulacion', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione circulación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIMA">LIMA</SelectItem>
                    <SelectItem value="PROVINCIA">PROVINCIA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="placa">PLACA</Label>
                <Input id="placa" name="placa" value={formData.placa} onChange={handleInputChange} onBlur={handlePlacaBlur} disabled={formData.placaEnTramite} required />
                {error && error.startsWith('La placa') && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="placaEnTramite" name="placaEnTramite" checked={formData.placaEnTramite} onChange={handleCheckboxChange} className="mr-2" />
                  <Label htmlFor="placaEnTramite">Placa en trámite</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="marca">MARCA</Label>
                <Select name="marca" onValueChange={(value) => handleSelectChange('marca', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map(marca => (
                      <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modelo">MODELO</Label>
                <Select name="modelo" onValueChange={(value) => handleSelectChange('modelo', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelos.map(modelo => (
                      <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ano">AÑO</Label>
                <Select name="ano" onValueChange={(value) => handleSelectChange('ano', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sumaAsegurada">SUMA ASEGURADA</Label>
                <Input
                  id="sumaAsegurada"
                  name="sumaAsegurada"
                  value={formData.sumaAsegurada}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9,]/g, '')
                    setFormData(prev => ({ ...prev, sumaAsegurada: value }))
                  }}
                  onBlur={handleSumaAseguradaBlur}
                  placeholder="Ingrese la suma asegurada (ej: 10,000.00)"
                  required
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Cotización</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>RIESGO</Label>
                <Input value={formData.riesgo} readOnly />
              </div>
              <div>
                <Label>TASA NETA</Label>
                <Input value={`${(cotizacion.tasaNeta * 100).toFixed(3)}%`} readOnly />
              </div>
              <div>
                <Label>PRIMA NETA</Label>
                <Input value={cotizacion.primaNeta.toFixed(2)} readOnly />
              </div>
              <div>
                <Label>PRIMA TOTAL</Label>
                <Input value={cotizacion.primaTotal.toFixed(2)} readOnly />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full">ENVIAR</Button>
        </form>
      </CardContent>
    </Card>
  )
}
