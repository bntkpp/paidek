"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Users, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"

interface IntakeFormWithDetails {
  id: string
  user_id: string
  course_id: string
  full_name: string
  phone: string
  email: string
  comuna: string
  guardian: string | null
  comments: string | null
  sex: string
  age: number
  how_found_us: string
  how_found_us_other: string | null
  why_exams_libres: string
  created_at: string
  updated_at: string
  user: {
    full_name: string
    email: string
  }
  course: {
    title: string
  }
}

interface AdminIntakeFormsManagerProps {
  initialForms: IntakeFormWithDetails[]
}

export function AdminIntakeFormsManager({ initialForms }: AdminIntakeFormsManagerProps) {
  const [forms] = useState(initialForms)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredForms = forms.filter(
    (form) =>
      form.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.comuna.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSexBadge = (sex: string) => {
    const colors = {
      masculino: "bg-blue-500",
      femenino: "bg-pink-500",
      otro: "bg-purple-500",
    }
    return <Badge className={colors[sex as keyof typeof colors] || "bg-gray-500"}>{sex}</Badge>
  }

  const getHowFoundUsLabel = (value: string, other: string | null) => {
    if (value === "otro" && other) {
      return `Otro: ${other}`
    }
    const labels: Record<string, string> = {
      YouTube: "YouTube",
      TikTok: "TikTok",
      Instagram: "Instagram",
      Facebook: "Facebook",
      recomendacion: "Recomendación",
      Google: "Google",
    }
    return labels[value] || value
  }

  const handleExportExcel = () => {
    const dataToExport = filteredForms.map(form => ({
      "Nombre Completo": form.full_name,
      "Email": form.email,
      "Teléfono": form.phone,
      "Comuna": form.comuna,
      "Curso": form.course.title,
      "Sexo": form.sex,
      "Edad": form.age,
      "Apoderado": form.guardian || "N/A",
      "Cómo nos conoció": getHowFoundUsLabel(form.how_found_us, form.how_found_us_other),
      "Motivación": form.why_exams_libres,
      "Comentarios": form.comments || "",
      "Fecha Registro": new Date(form.created_at).toLocaleDateString("es-CL"),
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fichas de Alumnos")
    
    // Ajustar ancho de columnas
    const wscols = [
      { wch: 30 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 20 }, // Comuna
      { wch: 30 }, // Curso
      { wch: 10 }, // Sexo
      { wch: 5 },  // Edad
      { wch: 25 }, // Apoderado
      { wch: 20 }, // Cómo nos conoció
      { wch: 50 }, // Motivación
      { wch: 30 }, // Comentarios
      { wch: 15 }, // Fecha
    ]
    worksheet['!cols'] = wscols

    XLSX.writeFile(workbook, "Fichas_Alumnos_Paidek.xlsx")
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Total Fichas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.length}</div>
            <p className="text-xs text-muted-foreground">Registros completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Edad Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.length > 0 ? Math.round(forms.reduce((sum, f) => sum + f.age, 0) / forms.length) : 0} años
            </div>
            <p className="text-xs text-muted-foreground">De los estudiantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Fuente Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const counts: Record<string, number> = {}
                forms.forEach((f) => {
                  counts[f.how_found_us] = (counts[f.how_found_us] || 0) + 1
                })
                const max = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a), ["", 0])
                return max[0] || "N/A"
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Cómo nos conocen</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fichas de Alumnos</CardTitle>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
          <CardDescription>
            <Input
              placeholder="Buscar por nombre, email, curso o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm mt-2"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Comuna</TableHead>
                  <TableHead>Cómo nos conoció</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No se encontraron fichas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{form.full_name}</div>
                          <div className="text-sm text-muted-foreground">{form.email}</div>
                          <div className="text-sm text-muted-foreground">{form.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{form.course.title}</TableCell>
                      <TableCell>{form.age}</TableCell>
                      <TableCell>{getSexBadge(form.sex)}</TableCell>
                      <TableCell>{form.comuna}</TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate">{getHowFoundUsLabel(form.how_found_us, form.how_found_us_other)}</div>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: es })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Ficha de {form.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Información Personal</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Nombre:</span>
                                    <p className="font-medium">{form.full_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <p className="font-medium">{form.email}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Teléfono:</span>
                                    <p className="font-medium">{form.phone}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Comuna:</span>
                                    <p className="font-medium">{form.comuna}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Edad:</span>
                                    <p className="font-medium">{form.age} años</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Sexo:</span>
                                    <p className="font-medium">{form.sex}</p>
                                  </div>
                                  {form.guardian && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Apoderado:</span>
                                      <p className="font-medium">{form.guardian}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Curso</h4>
                                <p className="text-sm">{form.course.title}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">¿Cómo nos conoció?</h4>
                                <p className="text-sm">{getHowFoundUsLabel(form.how_found_us, form.how_found_us_other)}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">¿Por qué quiere dar exámenes libres?</h4>
                                <p className="text-sm whitespace-pre-wrap">{form.why_exams_libres}</p>
                              </div>

                              {form.comments && (
                                <div>
                                  <h4 className="font-semibold mb-2">Comentarios adicionales</h4>
                                  <p className="text-sm whitespace-pre-wrap">{form.comments}</p>
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground pt-4 border-t">
                                <p>Creado: {new Date(form.created_at).toLocaleString("es-CL")}</p>
                                {form.updated_at !== form.created_at && (
                                  <p>Actualizado: {new Date(form.updated_at).toLocaleString("es-CL")}</p>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
