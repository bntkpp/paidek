"use client"

import { useMemo, useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil, Plus, Trash2, Video, FileText, Dumbbell, File, Upload } from "lucide-react"
import { useRouter } from "next/navigation" // ← AGREGAR

// Function to convert YouTube URLs to embed format
function convertToYouTubeEmbed(url: string): string {
  if (!url) return ""

  // Already in embed format
  if (url.includes("/embed/")) return url

  // Extract video ID from various YouTube URL formats
  let videoId = ""

  // youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0]
  }
  // youtube.com/watch?v=VIDEO_ID
  else if (url.includes("youtube.com/watch")) {
    const urlParams = new URLSearchParams(url.split("?")[1])
    videoId = urlParams.get("v") || ""
  }
  // youtube.com/v/VIDEO_ID
  else if (url.includes("youtube.com/v/")) {
    videoId = url.split("/v/")[1]?.split("?")[0]
  }

  // If we found a video ID, return embed URL
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  // Return original URL if not a YouTube link
  return url
}

interface ModuleOption {
  id: string
  title: string
  course_id?: string
  courses?: {
    title?: string
  } | null
}

export interface LessonWithModule {
  id: string
  title: string
  lesson_type: string
  module_id: string
  order_index: number | null
  duration_minutes: number | null
  video_url: string | null
  content: string | null
  created_at?: string | null
  modules?: ModuleOption | null
}

interface AdminLessonsManagerProps {
  initialLessons: LessonWithModule[]
  modules: ModuleOption[]
}

const lessonTypeOptions = [
  { value: "video", label: "Video", icon: Video },
  { value: "reading", label: "Lectura", icon: FileText },
  { value: "pdf", label: "PDF", icon: File },
  { value: "exercise", label: "Ejercicio", icon: Dumbbell },
  { value: "intake_form", label: "Ficha de Alumno", icon: FileText },
]

export function AdminLessonsManager({ initialLessons, modules }: AdminLessonsManagerProps) {
  const [lessons, setLessons] = useState(initialLessons)
  const router = useRouter() // ← AGREGAR
  const [isCreating, setIsCreating] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all")
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("all")
  const { toast } = useToast()

  const defaultModuleId = useMemo(() => modules[0]?.id ?? "", [modules])

  // Obtener lista única de cursos
  const courses = useMemo(() => {
    const coursesMap = new Map<string, { id: string; title: string }>()
    
    modules.forEach((module) => {
      if (module.course_id && module.courses?.title) {
        coursesMap.set(module.course_id, {
          id: module.course_id,
          title: module.courses.title,
        })
      }
    })
    
    return Array.from(coursesMap.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [modules])

  // Filtrar módulos por curso seleccionado
  const filteredModules = useMemo(() => {
    if (selectedCourseFilter === "all") {
      return modules
    }
    return modules.filter((module) => module.course_id === selectedCourseFilter)
  }, [modules, selectedCourseFilter])

  // Filtrar lecciones por curso y/o módulo seleccionado
  const filteredLessons = useMemo(() => {
    let result = lessons
    
    // Filtrar por curso
    if (selectedCourseFilter !== "all") {
      result = result.filter((lesson) => {
        const module = modules.find((m) => m.id === lesson.module_id)
        return module?.course_id === selectedCourseFilter
      })
    }
    
    // Filtrar por módulo
    if (selectedModuleFilter !== "all") {
      result = result.filter((lesson) => lesson.module_id === selectedModuleFilter)
    }
    
    return result
  }, [lessons, selectedCourseFilter, selectedModuleFilter, modules])

  // Resetear filtro de módulo cuando cambia el curso
  const handleCourseFilterChange = (courseId: string) => {
    setSelectedCourseFilter(courseId)
    setSelectedModuleFilter("all")
  }

  const [formState, setFormState] = useState({
    title: "",
    lessonType: lessonTypeOptions[0]?.value || "video",
    moduleId: defaultModuleId,
    orderIndex: "",
    duration: "",
    videoUrl: "",
    content: "",
    contentTitle: "",
  })

  const resetForm = () => {
    setFormState({
      title: "",
      lessonType: lessonTypeOptions[0]?.value || "video",
      moduleId: defaultModuleId,
      orderIndex: "",
      duration: "",
      videoUrl: "",
      content: "",
      contentTitle: "",
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten archivos PDF",
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB",
      })
      return
    }

    setIsUploadingFile(true)
    const supabase = createClient()

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `lessons/${fileName}`

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      // Actualizar el estado del formulario con la URL
      setFormState((prev) => ({ ...prev, videoUrl: publicUrl }))

      toast({
        title: "Archivo subido",
        description: "El PDF se ha cargado correctamente",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir archivo",
        description: error.message,
      })
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleCreateLesson = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)
    const supabase = createClient()

    const payload = {
      title: formState.title,
      lesson_type: formState.lessonType,
      module_id: formState.moduleId,
      order_index: formState.orderIndex ? Number(formState.orderIndex) : null,
      duration_minutes: formState.duration ? Number(formState.duration) : null,
      video_url: formState.videoUrl ? convertToYouTubeEmbed(formState.videoUrl) : null,
      content: formState.content || null,
      content_title: formState.contentTitle || null,
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert(payload)
      .select("*, modules(id, title, courses(title))")
      .single()

    setIsCreating(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al crear la lección",
        description: error.message,
      })
      return
    }

    if (data) {
      setLessons((prev) => [data, ...prev])
      router.refresh() // ← AGREGAR
      toast({
        title: "Lección creada",
        description: `Se agregó "${data.title}" al módulo correctamente.`,
      })
      resetForm()
    }
  }

  const handleLessonUpdated = (lesson: LessonWithModule) => {
    setLessons((prev) => prev.map((item) => (item.id === lesson.id ? lesson : item)))
    router.refresh() // ← AGREGAR
    toast({ title: "Lección actualizada exitosamente" })
  }

  const handleLessonDeleted = (lessonId: string) => {
    setLessons((prev) => prev.filter((item) => item.id !== lessonId))
    router.refresh() // ← AGREGAR
    toast({ title: "Lección eliminada exitosamente" })
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredLessons.length}</p>
                <p className="text-xs text-muted-foreground">Lecciones totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Video className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredLessons.filter(l => l.lesson_type === 'video').length}
                </p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <File className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredLessons.filter(l => l.lesson_type === 'reading' || l.lesson_type === 'pdf').length}
                </p>
                <p className="text-xs text-muted-foreground">Lecturas/PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">
            Listado
          </TabsTrigger>
          <TabsTrigger value="create">
            Crear Nueva
          </TabsTrigger>
        </TabsList>

      <TabsContent value="list">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lecciones registradas</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mostrando {filteredLessons.length} de {lessons.length} lecciones
                  </p>
                </div>
                {(selectedCourseFilter !== "all" || selectedModuleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCourseFilter("all")
                      setSelectedModuleFilter("all")
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
              
              {/* Filtros mejorados */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Filtro por curso */}
                <div className="space-y-2">
                  <Label htmlFor="course-filter" className="text-xs font-medium text-muted-foreground">
                    Filtrar por curso
                  </Label>
                  <select
                    id="course-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={selectedCourseFilter}
                    onChange={(e) => handleCourseFilterChange(e.target.value)}
                  >
                    <option value="all">Todos los cursos ({courses.length})</option>
                    {courses.map((course) => {
                      const count = lessons.filter((lesson) => {
                        const module = modules.find((m) => m.id === lesson.module_id)
                        return module?.course_id === course.id
                      }).length
                      return (
                        <option key={course.id} value={course.id}>
                          {course.title} ({count})
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Filtro por módulo */}
                <div className="space-y-2">
                  <Label htmlFor="module-filter" className="text-xs font-medium text-muted-foreground">
                    Filtrar por módulo
                  </Label>
                  <select
                    id="module-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={selectedModuleFilter}
                    onChange={(e) => setSelectedModuleFilter(e.target.value)}
                    disabled={selectedCourseFilter !== "all" && filteredModules.length === 0}
                  >
                    <option value="all">
                      Todos los módulos
                      {selectedCourseFilter === "all" 
                        ? ` (${modules.length})` 
                        : ` (${filteredModules.length})`}
                    </option>
                    {filteredModules.map((module) => {
                      const count = lessons.filter((lesson) => lesson.module_id === module.id).length
                      return (
                        <option key={module.id} value={module.id}>
                          {module.title} ({count})
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredLessons.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {selectedCourseFilter === "all" && selectedModuleFilter === "all"
                    ? "Aún no hay lecciones creadas." 
                    : "No hay lecciones que coincidan con los filtros seleccionados."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="hidden md:table-cell">Orden</TableHead>
                      <TableHead className="hidden md:table-cell">Duración</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLessons.map((lesson) => {
                      const typeInfo = lessonTypeOptions.find((option) => option.value === lesson.lesson_type)
                      const TypeIcon = typeInfo?.icon
                      return (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <div className="space-y-1 max-w-md">
                              <p className="font-medium truncate">{lesson.title}</p>
                              {lesson.content && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {lesson.content.length > 100 
                                    ? lesson.content.substring(0, 100) + '...' 
                                    : lesson.content}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {TypeIcon && <TypeIcon className="h-4 w-4 text-muted-foreground" />}
                              <Badge variant="outline">{typeInfo?.label || lesson.lesson_type}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{lesson.modules?.title || "Sin módulo"}</p>
                              {lesson.modules?.courses?.title && (
                                <p className="text-xs text-muted-foreground">{lesson.modules.courses.title}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{lesson.order_index ?? "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "-"}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            <EditLessonDialog lesson={lesson} modules={modules} onUpdated={handleLessonUpdated} />
                            <DeleteLessonDialog lesson={lesson} onDeleted={handleLessonDeleted} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="create">
        <Card>
          <CardHeader>
            <CardTitle>Crear nueva lección</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Título</Label>
                <Input
                  id="lesson-title"
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Introduce el título de la lección"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-module">Módulo</Label>
                  <select
                    id="lesson-module"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formState.moduleId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, moduleId: event.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un módulo
                    </option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title} {module.courses?.title ? `- ${module.courses.title}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-type">Tipo de lección</Label>
                  <select
                    id="lesson-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formState.lessonType}
                    onChange={(event) => setFormState((prev) => ({ ...prev, lessonType: event.target.value }))}
                    required
                  >
                    {lessonTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-order">Orden</Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    value={formState.orderIndex}
                    onChange={(event) => setFormState((prev) => ({ ...prev, orderIndex: event.target.value }))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duración (min)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    value={formState.duration}
                    onChange={(event) => setFormState((prev) => ({ ...prev, duration: event.target.value }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-video">
                  {formState.lessonType === "video" 
                    ? "URL del video" 
                    : formState.lessonType === "pdf" 
                    ? "URL del PDF" 
                    : "URL (opcional)"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="lesson-video"
                    value={formState.videoUrl}
                    onChange={(event) => setFormState((prev) => ({ ...prev, videoUrl: event.target.value }))}
                    placeholder={
                      formState.lessonType === "video" 
                        ? "https://www.youtube.com/embed/..." 
                        : formState.lessonType === "pdf" 
                        ? "https://example.com/document.pdf o sube un archivo" 
                        : "URL del recurso"
                    }
                    className="flex-1"
                  />
                  {formState.lessonType === "pdf" && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="pdf-upload"
                        disabled={isUploadingFile}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('pdf-upload')?.click()}
                        disabled={isUploadingFile}
                        title="Subir PDF"
                      >
                        {isUploadingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {formState.videoUrl && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Recurso cargado correctamente
                  </p>
                )}
              </div>

              {(formState.lessonType === "reading" || formState.lessonType === "exercise") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-content-title">Título del Contenido (opcional)</Label>
                    <Input
                      id="lesson-content-title"
                      value={formState.contentTitle}
                      onChange={(event) => setFormState((prev) => ({ ...prev, contentTitle: event.target.value }))}
                      placeholder="Ej: Introducción al tema, Conceptos básicos, etc."
                    />
                    <p className="text-xs text-muted-foreground">
                      Si no agregas un título, no se mostrará ningún encabezado sobre el contenido
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-content">Contenido</Label>
                    <Textarea
                      id="lesson-content"
                      value={formState.content}
                      onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                      placeholder="Escribe el contenido de la lección aquí...&#10;&#10;Puedes usar saltos de línea y el formato se mantendrá."
                      rows={8}
                    />
                  </div>
                </>
              )}

              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Crear lección
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  )
}

function EditLessonDialog({
  lesson,
  modules,
  onUpdated,
}: {
  lesson: LessonWithModule
  modules: ModuleOption[]
  onUpdated: (lesson: LessonWithModule) => void
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const { toast } = useToast()
  const [state, setState] = useState({
    title: lesson.title,
    lessonType: lesson.lesson_type,
    moduleId: lesson.module_id,
    orderIndex: lesson.order_index?.toString() || "",
    duration: lesson.duration_minutes?.toString() || "",
    videoUrl: lesson.video_url || "",
    content: lesson.content || "",
    contentTitle: (lesson as any).content_title || "",
  })

  // Sincronizar estado cuando cambia la lección
  useEffect(() => {
    setState({
      title: lesson.title,
      lessonType: lesson.lesson_type,
      moduleId: lesson.module_id,
      orderIndex: lesson.order_index?.toString() || "",
      duration: lesson.duration_minutes?.toString() || "",
      videoUrl: lesson.video_url || "",
      content: lesson.content || "",
      contentTitle: (lesson as any).content_title || "",
    })
  }, [lesson])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten archivos PDF",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB",
      })
      return
    }

    setIsUploadingFile(true)
    const supabase = createClient()

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `lessons/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      setState((prev) => ({ ...prev, videoUrl: publicUrl }))

      toast({
        title: "Archivo subido",
        description: "El PDF se ha cargado correctamente",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir archivo",
        description: error.message,
      })
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('Submit iniciado', state) // Debug
    setIsSaving(true)
    const supabase = createClient()

    try {
      const payload = {
        title: state.title,
        lesson_type: state.lessonType,
        module_id: state.moduleId,
        order_index: state.orderIndex ? Number(state.orderIndex) : null,
        duration_minutes: state.duration ? Number(state.duration) : null,
        video_url: state.videoUrl ? convertToYouTubeEmbed(state.videoUrl) : null,
        content: state.content || null,
        content_title: state.contentTitle || null,
      }

      console.log('Payload a enviar:', payload) // Debug

      const { data, error } = await supabase
        .from("lessons")
        .update(payload)
        .eq("id", lesson.id)
        .select("*, modules(id, title, courses(title))")
        .single()

      console.log('Respuesta:', { data, error }) // Debug

      // Verificar si hay un error real (no un objeto vacío)
      const hasRealError = error && (error.message || error.code || error.details)
      
      if (hasRealError) {
        console.error('Error al actualizar:', error) // Debug
        
        // Mensaje de error más específico para constraint de tipo
        if (error.message && error.message.includes('lessons_lesson_type_check')) {
          throw new Error('Tipo de lección no válido. Tipos permitidos: video, reading, exercise')
        }
        
        throw new Error(error.message || 'Error al actualizar la lección')
      }

      if (data) {
        console.log('Datos actualizados correctamente:', data) // Debug
        onUpdated(data)
        toast({
          title: "Lección actualizada",
          description: "Los cambios se guardaron correctamente.",
        })
        setIsOpen(false)
      } else {
        // Si no hay data pero tampoco error, igual cerramos y refrescamos
        console.warn('No se recibieron datos, pero no hay error. Refrescando...') // Debug
        router.refresh()
        toast({
          title: "Cambios guardados",
          description: "La lección se actualizó correctamente.",
        })
        setIsOpen(false)
      }
    } catch (err: any) {
      console.error('Excepción capturada:', err)
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: err.message || 'Ocurrió un error inesperado',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar lección</DialogTitle>
          <DialogDescription>Modifica el contenido y los metadatos de la lección seleccionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-lesson-title-${lesson.id}`}>Título</Label>
            <Input
              id={`edit-lesson-title-${lesson.id}`}
              value={state.title}
              onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-lesson-module-${lesson.id}`}>Módulo</Label>
              <select
                id={`edit-lesson-module-${lesson.id}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={state.moduleId}
                onChange={(event) => setState((prev) => ({ ...prev, moduleId: event.target.value }))}
                required
              >
                {modules.map((moduleOption) => (
                  <option key={moduleOption.id} value={moduleOption.id}>
                    {moduleOption.title} {moduleOption.courses?.title ? `- ${moduleOption.courses.title}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-lesson-type-${lesson.id}`}>Tipo</Label>
              <select
                id={`edit-lesson-type-${lesson.id}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={state.lessonType}
                onChange={(event) => setState((prev) => ({ ...prev, lessonType: event.target.value }))}
                required
              >
                {lessonTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-lesson-order-${lesson.id}`}>Orden</Label>
              <Input
                id={`edit-lesson-order-${lesson.id}`}
                type="number"
                value={state.orderIndex}
                onChange={(event) => setState((prev) => ({ ...prev, orderIndex: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-lesson-duration-${lesson.id}`}>Duración (min)</Label>
              <Input
                id={`edit-lesson-duration-${lesson.id}`}
                type="number"
                value={state.duration}
                onChange={(event) => setState((prev) => ({ ...prev, duration: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-lesson-video-${lesson.id}`}>
              {state.lessonType === "video" 
                ? "URL del video" 
                : state.lessonType === "pdf" 
                ? "URL del PDF" 
                : "URL (opcional)"}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`edit-lesson-video-${lesson.id}`}
                value={state.videoUrl}
                onChange={(event) => setState((prev) => ({ ...prev, videoUrl: event.target.value }))}
                placeholder={
                  state.lessonType === "video" 
                    ? "https://www.youtube.com/embed/..." 
                    : state.lessonType === "pdf" 
                    ? "https://example.com/document.pdf o sube un archivo" 
                    : "URL del recurso"
                }
                className="flex-1"
              />
              {state.lessonType === "pdf" && (
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id={`pdf-upload-edit-${lesson.id}`}
                    disabled={isUploadingFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(`pdf-upload-edit-${lesson.id}`)?.click()}
                    disabled={isUploadingFile}
                    title="Subir PDF"
                  >
                    {isUploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            {state.videoUrl && (
              <p className="text-xs text-muted-foreground">
                ✓ Recurso cargado correctamente
              </p>
            )}
          </div>

          {(state.lessonType === "reading" || state.lessonType === "exercise") && (
            <>
              <div className="space-y-2">
                <Label htmlFor={`edit-lesson-content-title-${lesson.id}`}>Título del Contenido (opcional)</Label>
                <Input
                  id={`edit-lesson-content-title-${lesson.id}`}
                  value={state.contentTitle}
                  onChange={(event) => setState((prev) => ({ ...prev, contentTitle: event.target.value }))}
                  placeholder="Ej: Introducción al tema, Conceptos básicos, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Si no agregas un título, no se mostrará ningún encabezado sobre el contenido
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-lesson-content-${lesson.id}`}>Contenido</Label>
                <Textarea
                  id={`edit-lesson-content-${lesson.id}`}
                  value={state.content}
                  onChange={(event) => setState((prev) => ({ ...prev, content: event.target.value }))}
                  rows={8}
                  placeholder="Escribe el contenido aquí...&#10;&#10;Puedes usar saltos de línea y el formato se mantendrá."
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Guardando...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" /> 
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLessonDialog({
  lesson,
  onDeleted,
}: {
  lesson: LessonWithModule
  onDeleted: (lessonId: string) => void
}) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("lessons").delete().eq("id", lesson.id)
    setIsDeleting(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message,
      })
      return
    }

    onDeleted(lesson.id)
    toast({
      title: "Lección eliminada",
      description: `Se eliminó "${lesson.title}" correctamente.`,
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-1 h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta lección?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará la lección "{lesson.title}" de forma permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}