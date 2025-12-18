"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface StudentIntakeFormProps {
  courseId: string
  userId: string
  existingForm?: any
  onSuccess?: () => void
}

export function StudentIntakeForm({ courseId, userId, existingForm, onSuccess }: StudentIntakeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showOtherInput, setShowOtherInput] = useState(
    existingForm?.how_found_us === "otro" || false
  )

  const [formData, setFormData] = useState({
    full_name: existingForm?.full_name || "",
    phone: existingForm?.phone || "",
    email: existingForm?.email || "",
    comuna: existingForm?.comuna || "",
    guardian: existingForm?.guardian || "",
    comments: existingForm?.comments || "",
    sex: existingForm?.sex || "",
    age: existingForm?.age || "",
    how_found_us: existingForm?.how_found_us || "",
    how_found_us_other: existingForm?.how_found_us_other || "",
    why_exams_libres: existingForm?.why_exams_libres || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleHowFoundUsChange = (value: string) => {
    setFormData((prev) => ({ ...prev, how_found_us: value }))
    setShowOtherInput(value === "otro")
    if (value !== "otro") {
      setFormData((prev) => ({ ...prev, how_found_us_other: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.full_name || !formData.phone || !formData.email || !formData.comuna) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.sex || !formData.age || !formData.how_found_us || !formData.why_exams_libres) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.how_found_us === "otro" && !formData.how_found_us_other) {
        toast({
          title: "Error",
          description: "Por favor especifica cómo nos conociste",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const response = await fetch("/api/student-intake-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          course_id: courseId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar el formulario")
      }

      toast({
        title: "¡Formulario completado!",
        description: "Tu ficha ha sido guardada correctamente. Ahora puedes acceder a los módulos.",
      })

      if (onSuccess) {
        onSuccess()
      }

      // Recargar la página para actualizar el estado
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Error al guardar el formulario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Módulo 0: Ficha de Alumno</CardTitle>
        <CardDescription>
          Por favor completa este formulario antes de acceder a los contenidos del curso.
          {existingForm && " Puedes actualizar tu información cuando lo desees."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Juan Pérez"
              required
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Teléfono <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+56 9 1234 5678"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          {/* Comuna */}
          <div className="space-y-2">
            <Label htmlFor="comuna">
              Comuna <span className="text-red-500">*</span>
            </Label>
            <Input
              id="comuna"
              value={formData.comuna}
              onChange={(e) => handleInputChange("comuna", e.target.value)}
              placeholder="Santiago, Maipú, etc."
              required
            />
          </div>

          {/* Sexo y Edad en la misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sex">
                Sexo <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">
                Edad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                type="number"
                min="10"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="18"
                required
              />
            </div>
          </div>

          {/* Apoderado (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="guardian">Apoderado (opcional)</Label>
            <Input
              id="guardian"
              value={formData.guardian}
              onChange={(e) => handleInputChange("guardian", e.target.value)}
              placeholder="Nombre del apoderado"
            />
          </div>

          {/* ¿Cómo nos conoció? */}
          <div className="space-y-2">
            <Label htmlFor="how_found_us">
              ¿Cómo nos conociste? <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.how_found_us} onValueChange={handleHowFoundUsChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="recomendacion">Recomendación</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Otro (especificar) */}
          {showOtherInput && (
            <div className="space-y-2">
              <Label htmlFor="how_found_us_other">
                Especifica cómo nos conociste <span className="text-red-500">*</span>
              </Label>
              <Input
                id="how_found_us_other"
                value={formData.how_found_us_other}
                onChange={(e) => handleInputChange("how_found_us_other", e.target.value)}
                placeholder="Especifica..."
                required
              />
            </div>
          )}

          {/* ¿Por qué quiere dar exámenes libres? */}
          <div className="space-y-2">
            <Label htmlFor="why_exams_libres">
              ¿Por qué quieres dar exámenes libres? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="why_exams_libres"
              value={formData.why_exams_libres}
              onChange={(e) => handleInputChange("why_exams_libres", e.target.value)}
              placeholder="Cuéntanos tu motivación..."
              rows={4}
              required
            />
          </div>

          {/* Comentarios adicionales (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios adicionales (opcional)</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Cualquier información adicional que quieras compartir..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingForm ? "Actualizar ficha" : "Completar ficha y continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
