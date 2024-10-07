'use client'

import { useState, useEffect } from 'react'
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
    } else if (name === 'dni_ruc') {
      if (value.length > 11) return
      if (!/^\d*$/.test(value)) return
      if (value.length === 11 && !['10', '20'].includes(value.substring(0, 2))) {
        setError('RUC debe comenzar con 10 o 20')
      } else if (value.length !== 8 && value.length !== 11) {
        setError('DNI debe tener 8 dígitos o RUC debe tener 11 dígitos')
      } else {
        setError(null)
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handlePlacaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase().replace(/\s/g, '')
    if (newValue.length === 0) {
      newValue = 'ET'
    } else if (newValue.length > 6) {
      newValue = newValue.slice(0, 6)
    }
    if (newValue.length === 6) {
      newValue = `${newValue.slice(0, 3)}-${newValue.slice(3)}`
    }
    setFormData(prev => ({ ...prev, placa: newValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Generando PDF...')
    // Aquí iría la lógica para generar el PDF
    alert('PDF generado con éxito')
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
                <Input id="dni_ruc" name="dni_ruc" value={formData.dni_ruc} onChange={handleInputChange} required />
                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
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
                <Input id="placa" name="placa" value={formData.placa} onChange={handleInputChange} onBlur={handlePlacaBlur} required />
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
                <Input value={cotizacion.tasaNeta.toFixed(4)} readOnly />
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
