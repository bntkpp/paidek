"use client"

import { useState } from "react"
import { updateEnrollment, deleteEnrollment, createEnrollment, extendEnrollment } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Calendar, GraduationCap, MoreVertical, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface EnrollmentWithDetails {
  id: string
  user_id: string
  course_id: string
  is_active: boolean
  plan_type: string | null
  expires_at: string | null
  enrolled_at: string
  profiles: {
    full_name: string
    email: string
  }
  courses: {
    title: string
  }
}

interface AdminEnrollmentsManagerProps {
  initialEnrollments: EnrollmentWithDetails[]
  users: Array<{ id: string; full_name: string; email: string }>
  courses: Array<{ id: string; title: string }>
}

export function AdminEnrollmentsManager({
  initialEnrollments,
  users,
  courses,
}: AdminEnrollmentsManagerProps) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courses.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEnrollmentCreated = (enrollment: EnrollmentWithDetails) => {
    // Verificar si ya existe (en caso de renovación)
    const existingIndex = enrollments.findIndex((e) => e.id === enrollment.id)

    if (existingIndex !== -1) {
      // Si existe, actualizar
      setEnrollments((prev) => prev.map((e) => (e.id === enrollment.id ? enrollment : e)))
    } else {
      // Si no existe, agregar al inicio
      setEnrollments((prev) => [enrollment, ...prev])
    }
  }

  const handleEnrollmentUpdated = (enrollment: EnrollmentWithDetails) => {
    setEnrollments((prev) => prev.map((e) => (e.id === enrollment.id ? enrollment : e)))
  }

  const handleEnrollmentDeleted = (enrollmentId: string) => {
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId))
  }

  const handleExtendEnrollment = async (enrollmentId: string, months: number) => {
    try {
      const updated = await extendEnrollment(enrollmentId, months)
      handleEnrollmentUpdated(updated)
      toast({
        title: "Inscripción extendida",
        description: `Se extendió la inscripción por ${months} ${months === 1 ? "mes" : "meses"}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al extender",
        description: error.message,
      })
    }
  }

  // Estadísticas
  const activeEnrollments = enrollments.filter((e) => e.is_active).length
  const expiredEnrollments = enrollments.filter(
    (e) => e.expires_at && new Date(e.expires_at) < new Date()
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inscripciones</h1>
          <p className="text-muted-foreground">Gestiona las inscripciones de estudiantes</p>
        </div>
        <CreateEnrollmentDialog
          users={users}
          courses={courses}
          onCreated={handleEnrollmentCreated}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredEnrollments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Inscripciones</CardTitle>
          <CardDescription>
            <Input
              placeholder="Buscar por nombre, email o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inscrito</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => {
                const isExpired =
                  enrollment.expires_at && new Date(enrollment.expires_at) < new Date()
                const daysUntilExpiry = enrollment.expires_at
                  ? Math.ceil(
                    (new Date(enrollment.expires_at).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                  )
                  : null

                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{enrollment.profiles.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.courses.title}</TableCell>
                    <TableCell>
                      {enrollment.plan_type ? (
                        <Badge variant="outline">
                          {enrollment.plan_type.replace("_", " ")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {enrollment.expires_at ? (
                        <div>
                          <div className="text-sm">
                            {new Date(enrollment.expires_at).toLocaleDateString("es-CL")}
                          </div>
                          {daysUntilExpiry !== null && (
                            <div
                              className={`text-xs ${isExpired
                                  ? "text-red-600"
                                  : daysUntilExpiry <= 7
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                }`}
                            >
                              {isExpired
                                ? "Expirado"
                                : `${daysUntilExpiry} ${daysUntilExpiry === 1 ? "día" : "días"} restantes`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">De por vida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {enrollment.is_active && (!enrollment.expires_at || !isExpired) ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive">Expirado</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(enrollment.enrolled_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleExtendEnrollment(enrollment.id, 1)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Extender 1 mes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExtendEnrollment(enrollment.id, 4)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Extender 4 meses
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExtendEnrollment(enrollment.id, 8)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Extender 8 meses
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <EditEnrollmentDialog
                          enrollment={enrollment}
                          users={users}
                          courses={courses}
                          onUpdated={handleEnrollmentUpdated}
                        />
                        <DeleteEnrollmentDialog
                          enrollment={enrollment}
                          onDeleted={handleEnrollmentDeleted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredEnrollments.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron inscripciones" : "No hay inscripciones aún"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== CREATE DIALOG ====================
function CreateEnrollmentDialog({
  users,
  courses,
  onCreated,
}: {
  users: Array<{ id: string; full_name: string; email: string }>
  courses: Array<{ id: string; title: string }>
  onCreated: (enrollment: EnrollmentWithDetails) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [planType, setPlanType] = useState("4_months")
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedUser || !selectedCourse) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar un estudiante y un curso",
      })
      return
    }

    setIsCreating(true)

    const formData = new FormData(event.currentTarget)

    // Calcular fecha de expiración
    let expiresAt = null
    if (planType && planType !== "none" && planType !== "lifetime") {
      const now = new Date()
      if (planType === "test_minutes") {
        // Modo de prueba: agregar minutos en lugar de meses
        const minutes = parseInt(formData.get("test_minutes") as string) || 1
        now.setTime(now.getTime() + minutes * 60 * 1000)
      } else {
        switch (planType) {
          case "1_month":
            now.setMonth(now.getMonth() + 1)
            break
          case "4_months":
            now.setMonth(now.getMonth() + 4)
            break
          case "8_months":
            now.setMonth(now.getMonth() + 8)
            break
        }
      }
      expiresAt = now.toISOString()
    }

    const payload = {
      user_id: selectedUser,
      course_id: selectedCourse,
      is_active: formData.get("is_active") === "on",
      plan_type: (planType === "none" || planType === "lifetime") ? null : planType,
      expires_at: expiresAt,
      enrolled_at: new Date().toISOString(),
    }

    try {
      const enrollment = await createEnrollment(payload)
      onCreated(enrollment)
      toast({
        title: "Inscripción creada",
        description: planType === "test_minutes"
          ? `Inscripción de prueba creada (expira en ${formData.get("test_minutes")} minutos)`
          : "La inscripción se creó correctamente.",
      })
      setIsOpen(false)
      setSelectedUser("")
      setSelectedCourse("")
      setPlanType("4_months")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear",
        description: error.message,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Inscripción
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Inscripción</DialogTitle>
          <DialogDescription>Inscribe a un estudiante en un curso</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Estudiante *</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estudiante" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_id">Curso *</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_type">Tipo de Plan</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin plan</SelectItem>
                <SelectItem value="lifetime">De por vida</SelectItem>
                <SelectItem value="test_minutes">🧪 Prueba (minutos)</SelectItem>
                <SelectItem value="1_month">1 Mes</SelectItem>
                <SelectItem value="4_months">4 Meses</SelectItem>
                <SelectItem value="8_months">8 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {planType === "test_minutes" && (
            <div className="space-y-2">
              <Label htmlFor="test_minutes">Duración (minutos) *</Label>
              <Input
                id="test_minutes"
                name="test_minutes"
                type="number"
                min="1"
                max="1440"
                defaultValue="1"
                required
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                La inscripción expirará en los minutos especificados
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch id="is_active" name="is_active" defaultChecked />
            <Label htmlFor="is_active">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear Inscripción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT DIALOG ====================
function EditEnrollmentDialog({
  enrollment,
  users,
  courses,
  onUpdated,
}: {
  enrollment: EnrollmentWithDetails
  users: Array<{ id: string; full_name: string; email: string }>
  courses: Array<{ id: string; title: string }>
  onUpdated: (enrollment: EnrollmentWithDetails) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const planType = formData.get("plan_type") as string

    // Calcular nueva fecha de expiración si cambió el tipo
    let expiresAt = enrollment.expires_at
    if (planType && planType !== "none" && planType !== enrollment.plan_type) {
      const now = new Date()
      switch (planType) {
        case "1_month":
          now.setMonth(now.getMonth() + 1)
          break
        case "4_months":
          now.setMonth(now.getMonth() + 4)
          break
        case "8_months":
          now.setMonth(now.getMonth() + 8)
          break
      }
      expiresAt = now.toISOString()
    } else if (planType === "none") {
      expiresAt = null
    }

    const payload = {
      is_active: formData.get("is_active") === "on",
      plan_type: planType === "none" ? null : planType,
      expires_at: expiresAt,
    }

    try {
      const updatedEnrollment = await updateEnrollment(enrollment.id, payload)
      onUpdated(updatedEnrollment)
      toast({
        title: "Inscripción actualizada",
        description: "Los cambios se guardaron correctamente.",
      })
      setIsOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Inscripción</DialogTitle>
          <DialogDescription>
            {enrollment.profiles.full_name} - {enrollment.courses.title}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan_type">Tipo de Plan</Label>
            <Select
              name="plan_type"
              defaultValue={enrollment.plan_type || "none"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin plan</SelectItem>
                <SelectItem value="1_month">1 Mes</SelectItem>
                <SelectItem value="4_months">4 Meses</SelectItem>
                <SelectItem value="8_months">8 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is_active"
              name="is_active"
              defaultChecked={enrollment.is_active}
            />
            <Label htmlFor="edit-is_active">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== DELETE DIALOG ====================
function DeleteEnrollmentDialog({
  enrollment,
  onDeleted,
}: {
  enrollment: EnrollmentWithDetails
  onDeleted: (enrollmentId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteEnrollment(enrollment.id)
      onDeleted(enrollment.id)
      toast({
        title: "Inscripción eliminada",
        description: "La inscripción se eliminó correctamente.",
      })
      setIsOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar inscripción?</DialogTitle>
          <DialogDescription>
            Se eliminará la inscripción de {enrollment.profiles.full_name} en{" "}
            {enrollment.courses.title}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}