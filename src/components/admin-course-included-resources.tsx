"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Plus, Trash2, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CourseSelector } from "@/components/course-selector"

interface Course {
  id: string
  title: string
}

interface IncludedResource {
  id: string
  course_id: string
  included_course_id: string
  is_automatic: boolean
  order_index: number
  included_course: Course
}

interface AdminCourseIncludedResourcesProps {
  courseId: string
  courseTitle: string
}

export function AdminCourseIncludedResources({ courseId, courseTitle }: AdminCourseIncludedResourcesProps) {
  const [includedResources, setIncludedResources] = useState<IncludedResource[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    setIsLoading(true)

    // Cargar recursos incluidos
    const { data: resources } = await supabase
      .from("course_included_resources")
      .select(`
        *,
        included_course:courses!course_included_resources_included_course_id_fkey(id, title)
      `)
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    if (resources) {
      setIncludedResources(resources as any)
    }

    // Cargar cursos disponibles (excluir el curso actual)
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .neq("id", courseId)
      .order("title", { ascending: true })

    if (courses) {
      setAvailableCourses(courses)
    }

    setIsLoading(false)
  }

  const addResource = async (includedCourseId: string) => {
    // Calcular siguiente order_index
    const maxOrder = includedResources.reduce((max, r) => Math.max(max, r.order_index), -1)

    const { error } = await supabase
      .from("course_included_resources")
      .insert({
        course_id: courseId,
        included_course_id: includedCourseId,
        is_automatic: true,
        order_index: maxOrder + 1
      })

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } else {
      toast({
        title: "Recurso agregado",
        description: "El recurso se agregará automáticamente al comprar este curso"
      })
      loadData()
    }
  }

  const removeResource = async (resourceId: string) => {
    const { error } = await supabase
      .from("course_included_resources")
      .delete()
      .eq("id", resourceId)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } else {
      toast({
        title: "Recurso eliminado",
        description: "El recurso ya no se incluirá automáticamente"
      })
      loadData()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50/60 via-primary/10 to-transparent dark:from-blue-950/30 dark:via-primary/10">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Recursos Incluidos
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Cursos/packs que se otorgan automáticamente al comprar <span className="font-semibold text-primary">"{courseTitle}"</span>
            </CardDescription>
          </div>
          <AddResourceDialog
            availableCourses={availableCourses.filter(
              c => !includedResources.some(r => r.included_course_id === c.id)
            )}
            onAdd={addResource}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando...
          </div>
        ) : includedResources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hay recursos incluidos</p>
            <p className="text-sm">Agrega packs o cursos que se otorgarán automáticamente</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {includedResources.map((resource, index) => (
              <li
                key={resource.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-base">{resource.included_course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">Orden: {resource.order_index}</Badge>
                      {resource.is_automatic && (
                        <Badge variant="default" className="text-xs">Automático</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeResource(resource.id)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Eliminar recurso"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function AddResourceDialog({
  availableCourses,
  onAdd
}: {
  availableCourses: Course[]
  onAdd: (courseId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")

  const handleAdd = () => {
    if (selectedCourse) {
      onAdd(selectedCourse)
      setOpen(false)
      setSelectedCourse("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Recurso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Package className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">Agregar Recurso Incluido</span>
          </DialogTitle>
          <DialogDescription className="pr-8">
            Selecciona un curso/pack que se otorgará automáticamente al comprar este curso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Curso/Pack</label>
            {availableCourses.length === 0 ? (
              <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground text-center">
                No hay más cursos disponibles para agregar
              </div>
            ) : (
              <CourseSelector
                courses={availableCourses}
                value={selectedCourse}
                onChange={setSelectedCourse}
              />
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
              <Package className="h-4 w-4 text-primary" />
            </span>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              <strong className="text-primary">Automático:</strong> Cuando un usuario compre este curso, también obtendrá acceso al recurso seleccionado con la misma fecha de expiración.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedCourse} className="bg-primary text-white hover:bg-primary/90">
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
