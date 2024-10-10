'use client'

import { useState, useEffect } from 'react'
import { generatePDF } from '@/lib/generatePDF';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import PDFPreviewModal from './pdf-preview-modal';

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
    autoDealer: false,
  })

  const [marcas, setMarcas] = useState<string[]>([])
  const [modelos, setModelos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cotizacion, setCotizacion] = useState({
    tasaNeta: 0,
    primaNeta: 0,
    primaTotal: 0,
  })

  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null)

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
    setFormData(prev => ({ ...prev, [name]: checked, placa: name === 'placaEnTramite' && checked ? 'ET' : prev.placa }))
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
    if (formData.autoDealer) {
      primaNeta += 90
    }
    const primaTotal = primaNeta * 1.03 * 1.18

    setCotizacion({
      tasaNeta,
      primaNeta,
      primaTotal,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const pdfBlob = await generatePDF(formData, cotizacion, formData.autoDealer)
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Generar nombre del archivo
      const now = new Date()
      const timestamp = now.getFullYear().toString().substr(-2) +
                        (now.getMonth() + 1).toString().padStart(2, '0') +
                        now.getDate().toString().padStart(2, '0') +
                        now.getHours().toString().padStart(2, '0') +
                        now.getMinutes().toString().padStart(2, '0')
      const placa = formData.placa.replace(/[^a-zA-Z0-9]/g, '')
      const cliente = formData.contratante.replace(/[./()\s]+$/, '').replace(/[./()]/g, '')
      const fileName = `Qualitas Corp ${timestamp} ${placa} ${cliente}.pdf`
      
      setPdfPreview({ url: pdfUrl, fileName })
    } catch (error) {
      console.error('Error al generar el PDF:', error)
      // Manejar el error aquí (por ejemplo, mostrar un mensaje al usuario)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i)

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Cotizador Corp Qualitas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contratante">CONTRATANTE / ASEGURADO</Label>
                  <Input id="contratante" name="contratante" value={formData.contratante} onChange={handleInputChange} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="dni_ruc">DNI / RUC</Label>
                  <Input id="dni_ruc" name="dni_ruc" value={formData.dni_ruc} onChange={handleInputChange} onBlur={handleDniRucBlur} required className="mt-1" />
                  {error && error.startsWith('DNI') && <Alert variant="destructive" className="mt-2"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                </div>
                <div>
                  <Label htmlFor="circulacion">CIRCULACIÓN</Label>
                  <Select name="circulacion" onValueChange={(value) => handleSelectChange('circulacion', value)} required>
                    <SelectTrigger className="mt-1">
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
                  <Input id="placa" name="placa" value={formData.placa} onChange={handleInputChange} onBlur={handlePlacaBlur} disabled={formData.placaEnTramite} required className="mt-1" />
                  {error && error.startsWith('La placa') && <Alert variant="destructive" className="mt-2"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                  <div className="flex items-center mt-2">
                    <input type="checkbox" id="placaEnTramite" name="placaEnTramite" checked={formData.placaEnTramite} onChange={handleCheckboxChange} className="mr-2" />
                    <Label htmlFor="placaEnTramite">Placa en trámite</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="marca">MARCA</Label>
                  <Select name="marca" onValueChange={(value) => handleSelectChange('marca', value)} required>
                    <SelectTrigger className="mt-1">
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
                    <SelectTrigger className="mt-1">
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
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="autoDealer" name="autoDealer" checked={formData.autoDealer} onChange={(e) => setFormData(prev => ({ ...prev, autoDealer: e.target.checked }))} className="mr-2" />
                  <Label htmlFor="autoDealer">Auto al Dealer</Label>
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
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-md mt-6">
              <h3 className="text-lg font-semibold mb-2">Cotización</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RIESGO</Label>
                  <Input value={formData.riesgo} readOnly className="mt-1" />
                </div>
                <div>
                  <Label>TASA NETA</Label>
                  <Input value={`${(cotizacion.tasaNeta * 100).toFixed(3)}%`} readOnly className="mt-1" />
                </div>
                <div>
                  <Label>PRIMA NETA</Label>
                  <Input value={cotizacion.primaNeta.toFixed(2)} readOnly className="mt-1" />
                </div>
                <div>
                  <Label>PRIMA TOTAL</Label>
                  <Input value={cotizacion.primaTotal.toFixed(2)} readOnly className="mt-1" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full mt-6">ENVIAR</Button>
          </form>
        </CardContent>
      </Card>
      {pdfPreview && (
        <PDFPreviewModal
          pdfUrl={pdfPreview.url}
          fileName={pdfPreview.fileName}
          onClose={() => {
            URL.revokeObjectURL(pdfPreview.url)
            setPdfPreview(null)
          }}
        />
      )}
    </>
  )
}