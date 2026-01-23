"use client"

import { useState } from "react"
import { updateUser, deleteUser, createUser } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, Trash2, Users, UserCheck, DollarSign, GraduationCap, Plus, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface UserWithStats {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  enrollmentsCount: number
  activeEnrollmentsCount: number
  paymentsCount: number
  totalSpent: number
}

interface AdminUsersManagerProps {
  initialUsers: UserWithStats[]
}

export function AdminUsersManager({ initialUsers }: AdminUsersManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  
  // Estados para creación de usuario
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "student"
  })

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.full_name || !newUser.password) {
        toast({
          title: "Campos incompletos",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
        return
      }

      setIsCreating(true)
      const createdUser = await createUser(newUser)

      // Crear el objeto para la UI localmente
      const userWithStats: UserWithStats = {
        id: createdUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        created_at: new Date().toISOString(),
        enrollmentsCount: 0,
        activeEnrollmentsCount: 0,
        paymentsCount: 0,
        totalSpent: 0
      }

      setUsers([userWithStats, ...users])
      
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente.",
      })
      
      setIsCreateDialogOpen(false)
      setNewUser({
        email: "",
        full_name: "",
        password: "",
        role: "student"
      })

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear usuario",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUserUpdated = (updatedUser: UserWithStats) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)))
  }

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  // Estadísticas
  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.role === "admin").length
  const studentUsers = users.filter((u) => u.role === "student").length
  const activeUsers = users.filter((u) => u.activeEnrollmentsCount > 0).length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentUsers}</div>
            <p className="text-xs text-muted-foreground">Rol estudiante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Con cursos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Rol admin</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle>Todos los Usuarios</CardTitle>
            <div className="text-sm text-muted-foreground pt-1">
              Administra todos los usuarios de la plataforma
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[250px]"
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos del nuevo usuario. Se creará la cuenta y se enviará confirmación.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-name">Nombre Completo</Label>
                    <Input
                      id="create-name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-password">Contraseña</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-role">Rol</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Estudiante</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Inscripciones</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead>Total Gastado</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge className="bg-purple-500">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Estudiante</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{user.enrollmentsCount} total</div>
                      <div className="text-muted-foreground">
                        {user.activeEnrollmentsCount} activas
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{user.paymentsCount}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${user.totalSpent.toLocaleString("es-CL")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditUserDialog user={user} onUpdated={handleUserUpdated} />
                      <DeleteUserDialog user={user} onDeleted={handleUserDeleted} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados aún"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== EDIT DIALOG ====================
function EditUserDialog({
  user,
  onUpdated,
}: {
  user: UserWithStats
  onUpdated: (user: UserWithStats) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as string,
    }

    try {
      const updatedUser = await updateUser(user.id, payload)
      onUpdated(updatedUser)
      toast({
        title: "Usuario actualizado",
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
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name || ""}
              placeholder="Nombre completo del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue={user.role}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Estudiante</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
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
function DeleteUserDialog({
  user,
  onDeleted,
}: {
  user: UserWithStats
  onDeleted: (userId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteUser(user.id)
      onDeleted(user.id)
      toast({
        title: "Usuario eliminado",
        description: "El usuario se eliminó correctamente.",
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
          <DialogTitle>¿Eliminar usuario?</DialogTitle>
          <DialogDescription>
            Se eliminará el usuario {user.full_name || user.email} y todos sus datos asociados
            (inscripciones, pagos, etc.). Esta acción no se puede deshacer.
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