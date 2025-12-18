"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Plus, 
  Pencil, 
  Trash2,
  Video,
  FileText,
  File,
  Dumbbell,
  GripVertical,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  Eye
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useRef } from "react"

// Componente de editor de texto enriquecido
function RichTextEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (before: string, after: string = before, placeholder: string = "texto") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || placeholder
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Restaurar el foco y la selección
    setTimeout(() => {
      textarea.focus()
      const newStart = start + before.length
      const newEnd = newStart + selectedText.length
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  const insertHeading = (level: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const prefix = '#'.repeat(level) + ' '
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart)
    
    onChange(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const insertList = (type: 'ul' | 'ol') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const prefix = type === 'ol' ? '1. ' : '- '
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart)
    
    onChange(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  return (
    <div className="space-y-3 border rounded-lg overflow-hidden">
      {/* Barra de herramientas mejorada */}
      <div className="bg-muted/30 border-b">
        <div className="flex flex-wrap items-center gap-0.5 p-2">
          {/* Grupo: Formato de texto */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertFormat('**', '**', 'negrita')}
              title="Negrita (Ctrl+B)"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertFormat('*', '*', 'cursiva')}
              title="Cursiva (Ctrl+I)"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertFormat('~~', '~~', 'tachado')}
              title="Tachado"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Grupo: Títulos */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertHeading(1)}
              title="Título Grande"
              className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
            >
              H1
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertHeading(2)}
              title="Título Mediano"
              className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
            >
              H2
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertHeading(3)}
              title="Título Pequeño"
              className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
            >
              H3
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Grupo: Listas */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertList('ul')}
              title="Lista con viñetas"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => insertList('ol')}
              title="Lista numerada"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Grupo: Enlaces */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => insertFormat('[', '](url)', 'texto del enlace')}
            title="Insertar enlace"
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Ayuda rápida */}
        <div className="px-3 pb-2 text-xs text-muted-foreground">
          💡 Selecciona texto y haz clic en los botones para dar formato, o escribe directamente usando la sintaxis
        </div>
      </div>
      
      {/* Área de texto */}
      <div className="p-3 pt-0">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe aquí el contenido de tu lección...&#10;&#10;Ejemplos de formato:&#10;**Este texto estará en negrita**&#10;*Este texto estará en cursiva*&#10;# Este será un título grande&#10;- Elemento de lista&#10;1. Lista numerada&#10;&#10;Las URLs como https://ejemplo.com se convierten automáticamente en enlaces"
          rows={14}
          className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          required
        />
      </div>
    </div>
  )
}

interface Course {
  id: string
  title: string
}

interface Lesson {
  id: string
  title: string
  lesson_type: string
  order_index: number
  duration_minutes: number | null
  content: string | null
  content_title: string | null
  video_url: string | null
}

interface Module {
  id: string
  title: string
  description: string | null
  order_index: number
  course_id: string
  lessons: Lesson[]
}

interface CourseWithModules extends Course {
  modules: Module[]
}

interface AdminCourseStructureProps {
  courses: CourseWithModules[]
}

const lessonTypeOptions = [
  { value: "video", label: "Video", icon: Video },
  { value: "reading", label: "Lectura", icon: FileText },
  { value: "pdf", label: "PDF", icon: File },
  { value: "exercise", label: "Ejercicio", icon: Dumbbell },
  { value: "intake_form", label: "Ficha de Alumno", icon: FileText },
]

export function AdminCourseStructure({ courses }: AdminCourseStructureProps) {
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set())
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [draggedLesson, setDraggedLesson] = useState<{ lessonId: string; moduleId: string; currentIndex: number } | null>(null)
  const [draggedModule, setDraggedModule] = useState<{ moduleId: string; courseId: string; currentIndex: number } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const toggleCourse = (courseId: string) => {
    const newOpen = new Set(openCourses)
    if (newOpen.has(courseId)) {
      newOpen.delete(courseId)
    } else {
      newOpen.add(courseId)
    }
    setOpenCourses(newOpen)
  }

  const toggleModule = (moduleId: string) => {
    const newOpen = new Set(openModules)
    if (newOpen.has(moduleId)) {
      newOpen.delete(moduleId)
    } else {
      newOpen.add(moduleId)
    }
    setOpenModules(newOpen)
  }

  const expandAll = () => {
    const allCourseIds = courses.map(c => c.id)
    const allModuleIds = courses.flatMap(c => c.modules.map(m => m.id))
    setOpenCourses(new Set(allCourseIds))
    setOpenModules(new Set(allModuleIds))
  }

  const collapseAll = () => {
    setOpenCourses(new Set())
    setOpenModules(new Set())
  }

  // Función optimizada para reordenar elementos por lotes
  const reorderItems = async (
    table: 'courses' | 'modules' | 'lessons',
    items: Array<{ id: string; order_index: number }>,
    successMessage: string
  ) => {
    try {
      // Actualizar todos los elementos en paralelo
      const updates = items.map(item => 
        supabase
          .from(table)
          .update({ order_index: item.order_index })
          .eq('id', item.id)
      )
      
      await Promise.all(updates)
      
      toast({ description: successMessage })
      router.refresh()
    } catch (error) {
      toast({ 
        variant: "destructive", 
        description: `Error al reordenar ${table === 'courses' ? 'cursos' : table === 'modules' ? 'módulos' : 'lecciones'}` 
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Estructura de Cursos</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir Todo
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Colapsar Todo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3">
          {courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No hay cursos disponibles</p>
              <p className="text-sm">Los cursos aparecerán aquí cuando se creen desde la sección de Cursos</p>
            </div>
          ) : (
            courses.map((course) => (
                <div 
                  key={course.id} 
                  className="border rounded-lg"
                >
              {/* Curso */}
              <div className="bg-muted/30">
                <div
                  onClick={() => toggleCourse(course.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleCourse(course.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {openCourses.has(course.id) ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''} • {' '}
                        {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lección{course.modules.reduce((sum, m) => sum + m.lessons.length, 0) !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/learn/${course.id}?preview=true`, '_blank')}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Vista Previa</span>
                    </Button>
                    <CreateModuleDialog courseId={course.id} courseTitle={course.title} onCreated={() => router.refresh()} />
                  </div>
                </div>
              </div>

              {/* Módulos del Curso */}
              {openCourses.has(course.id) && (
                <div className="p-2 space-y-2">
                  {course.modules.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No hay módulos en este curso
                    </div>
                  ) : (
                    course.modules
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((module, moduleIndex, sortedModules) => {
                        const isDraggingModule = draggedModule?.moduleId === module.id
                        const isDragOverModule = draggedModule && draggedModule.courseId === course.id && draggedModule.moduleId !== module.id

                        const handleModuleDragStart = (e: React.DragEvent) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.stopPropagation()
                          setDraggedModule({ moduleId: module.id, courseId: course.id, currentIndex: moduleIndex })
                        }

                        const handleModuleDragEnd = () => {
                          setDraggedModule(null)
                        }

                        const handleModuleDragOver = (e: React.DragEvent) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                        }

                        const handleModuleDrop = async (e: React.DragEvent) => {
                          e.preventDefault()
                          e.stopPropagation()

                          if (!draggedModule || draggedModule.courseId !== course.id || draggedModule.moduleId === module.id) {
                            setDraggedModule(null)
                            return
                          }

                          const draggedModuleData = sortedModules[draggedModule.currentIndex]
                          
                          // Intercambiar índices
                          const tempOrder = module.order_index
                          await reorderItems('modules', [
                            { id: draggedModuleData.id, order_index: tempOrder },
                            { id: module.id, order_index: draggedModuleData.order_index }
                          ], 'Módulo reordenado correctamente')

                          setDraggedModule(null)
                        }

                        return (
                          <div 
                            key={module.id} 
                            className={`border rounded-md bg-background transition-all ${
                              isDraggingModule ? 'opacity-50 scale-95' : ''
                            } ${
                              isDragOverModule ? 'border-2 border-dashed border-primary' : ''
                            }`}
                            draggable
                            onDragStart={handleModuleDragStart}
                            onDragEnd={handleModuleDragEnd}
                            onDragOver={handleModuleDragOver}
                            onDrop={handleModuleDrop}
                          >
                        {/* Módulo */}
                        <div className="bg-muted/20">
                          <div
                            onClick={() => toggleModule(module.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleModule(module.id)}
                            className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                              {openModules.has(module.id) ? (
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing" />
                              <div className="text-left flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-xs sm:text-sm truncate">{module.title}</span>
                                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    Orden: {module.order_index}
                                  </Badge>
                                </div>
                                {module.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{module.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {module.lessons.length} lección{module.lessons.length !== 1 ? 'es' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <CreateLessonDialog moduleId={module.id} moduleTitle={module.title} onCreated={() => router.refresh()} />
                              <EditModuleDialog module={module} onUpdated={() => router.refresh()} />
                              <DeleteModuleDialog module={module} onDeleted={() => router.refresh()} />
                            </div>
                          </div>
                        </div>

                        {/* Lecciones del Módulo */}
                        {openModules.has(module.id) && (
                          <div className="p-2 space-y-1">
                            {module.lessons.length === 0 ? (
                              <div className="text-center py-4 text-xs text-muted-foreground">
                                No hay lecciones en este módulo
                              </div>
                            ) : (
                              module.lessons
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((lesson, index, sortedLessons) => {
                                  const typeInfo = lessonTypeOptions.find(opt => opt.value === lesson.lesson_type)
                                  const TypeIcon = typeInfo?.icon || FileText
                                  const isDragging = draggedLesson?.lessonId === lesson.id
                                  const isDragOver = draggedLesson && draggedLesson.moduleId === module.id && draggedLesson.lessonId !== lesson.id
                                  
                                  const handleDragStart = (e: React.DragEvent) => {
                                    e.dataTransfer.effectAllowed = 'move'
                                    setDraggedLesson({ lessonId: lesson.id, moduleId: module.id, currentIndex: index })
                                  }
                                  
                                  const handleDragEnd = () => {
                                    setDraggedLesson(null)
                                  }
                                  
                                  const handleDragOver = (e: React.DragEvent) => {
                                    e.preventDefault()
                                    e.dataTransfer.dropEffect = 'move'
                                  }
                                  
                                  const handleDrop = async (e: React.DragEvent) => {
                                    e.preventDefault()
                                    if (!draggedLesson || draggedLesson.moduleId !== module.id || draggedLesson.lessonId === lesson.id) {
                                      setDraggedLesson(null)
                                      return
                                    }
                                    
                                    const supabase = createClient()
                                    const draggedLessonData = sortedLessons[draggedLesson.currentIndex]
                                    const targetIndex = index
                                    
                                    try {
                                      // Intercambiar order_index
                                      await supabase.from("lessons").update({ order_index: lesson.order_index }).eq("id", draggedLessonData.id)
                                      await supabase.from("lessons").update({ order_index: draggedLessonData.order_index }).eq("id", lesson.id)
                                      
                                      toast({ description: "Lección reordenada correctamente" })
                                      router.refresh()
                                    } catch (error) {
                                      toast({ variant: "destructive", description: "Error al reordenar la lección" })
                                    }
                                    
                                    setDraggedLesson(null)
                                  }
                                  
                                  return (
                                    <div
                                      key={lesson.id}
                                      draggable
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={handleDragOver}
                                      onDrop={handleDrop}
                                      className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 group gap-2 transition-all ${
                                        isDragging ? 'opacity-50 scale-95' : ''
                                      } ${
                                        isDragOver ? 'border-2 border-dashed border-primary' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                        <GripVertical className="h-3 w-3 text-muted-foreground group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing opacity-40 sm:opacity-0" />
                                        <TypeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-xs sm:text-sm truncate">{lesson.title}</span>
                                        <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                                          {lesson.order_index}
                                        </Badge>
                                        {lesson.duration_minutes && (
                                          <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline">
                                            {lesson.duration_minutes} min
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <EditLessonDialog lesson={lesson} moduleId={module.id} onUpdated={() => router.refresh()} />
                                        <DeleteLessonDialog lesson={lesson} onDeleted={() => router.refresh()} />
                                      </div>
                                    </div>
                                  )
                                })
                            )}
                          </div>
                        )}
                          </div>
                        )
                      })
                  )}
                </div>
              )}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Dialogs para crear/editar/eliminar módulos
function CreateModuleDialog({ courseId, courseTitle, onCreated }: { courseId: string, courseTitle: string, onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nextOrderIndex, setNextOrderIndex] = useState(1)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const { toast } = useToast()
  const supabase = createClient()

  // Calcular el siguiente order_index cuando se abre el diálogo
  const fetchNextOrderIndex = async () => {
    const { data: modules } = await supabase
      .from("modules")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1)

    const maxOrder = modules?.[0]?.order_index || 0
    setNextOrderIndex(maxOrder + 1)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchNextOrderIndex()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("modules").insert({
        title: formData.title,
        description: formData.description || null,
        order_index: nextOrderIndex,
        course_id: courseId,
      })

      if (error) throw error

      toast({ description: "Módulo creado exitosamente" })
      setOpen(false)
      setFormData({ title: "", description: "" })
      onCreated()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al crear el módulo" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Agregar Módulo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Módulo</DialogTitle>
            <DialogDescription>Curso: {courseTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label className="mb-2 block">Orden</Label>
              <Input
                type="number"
                value={nextOrderIndex}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se asigna automáticamente
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Módulo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditModuleDialog({ module, onUpdated }: { module: Module, onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    title: module.title, 
    description: module.description || "", 
    order_index: module.order_index 
  })
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("modules")
        .update({
          title: formData.title,
          description: formData.description || null,
          order_index: formData.order_index,
        })
        .eq("id", module.id)

      if (error) throw error

      toast({ description: "Módulo actualizado exitosamente" })
      setOpen(false)
      onUpdated()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al actualizar el módulo" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label className="mb-2 block">Orden</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteModuleDialog({ module, onDeleted }: { module: Module, onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("modules").delete().eq("id", module.id)

      if (error) throw error

      toast({ description: "Módulo eliminado exitosamente" })
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al eliminar el módulo" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Módulo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar "{module.title}"? Esta acción también eliminará todas sus lecciones.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dialogs para lecciones (simplificados, puedes expandirlos con todos los campos)
function CreateLessonDialog({ moduleId, moduleTitle, onCreated }: { moduleId: string, moduleTitle: string, onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPDF, setIsUploadingPDF] = useState(false)
  const [nextOrderIndex, setNextOrderIndex] = useState(1)
  const [formData, setFormData] = useState({ 
    title: "", 
    lesson_type: "video",
    duration_minutes: null as number | null,
    video_url: "",
    content: "",
    content_title: "",
  })
  const { toast } = useToast()
  const supabase = createClient()

  // Calcular el siguiente order_index cuando se abre el diálogo
  const fetchNextOrderIndex = async () => {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: false })
      .limit(1)

    const maxOrder = lessons?.[0]?.order_index || 0
    setNextOrderIndex(maxOrder + 1)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchNextOrderIndex()
    }
  }

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes('pdf')) {
      toast({ variant: "destructive", description: "Solo se permiten archivos PDF" })
      return
    }

    setIsUploadingPDF(true)
    try {
      const fileExt = 'pdf'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `lessons/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      setFormData({ ...formData, video_url: publicUrl })
      toast({ description: "PDF subido exitosamente" })
    } catch (error) {
      toast({ variant: "destructive", description: "Error al subir el PDF" })
    } finally {
      setIsUploadingPDF(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("lessons").insert({
        title: formData.title,
        lesson_type: formData.lesson_type,
        order_index: nextOrderIndex,
        duration_minutes: formData.duration_minutes,
        video_url: formData.video_url || null,
        content: formData.content || null,
        content_title: formData.content_title || null,
        module_id: moduleId,
      })

      if (error) throw error

      toast({ description: "Lección creada exitosamente" })
      setOpen(false)
      setFormData({ title: "", lesson_type: "video", duration_minutes: null, video_url: "", content: "", content_title: "" })
      onCreated()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al crear la lección" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost">
          <Plus className="h-3 w-3 mr-1" />
          Lección
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Lección</DialogTitle>
            <DialogDescription>Módulo: {moduleTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Tipo *</Label>
                <Select value={formData.lesson_type} onValueChange={(v) => setFormData({ ...formData, lesson_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Orden</Label>
                <Input
                  type="number"
                  value={nextOrderIndex}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se asigna automáticamente
                </p>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Duración (minutos)</Label>
              <Input
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                min={0}
              />
            </div>

            {/* Campos específicos según el tipo */}
            {formData.lesson_type === "video" && (
              <div>
                <Label className="mb-2 block">URL del Video *</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL embebida de YouTube, Vimeo, etc.
                </p>
              </div>
            )}

            {formData.lesson_type === "intake_form" && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="text-sm text-blue-700">
                  Esta lección mostrará el formulario de "Ficha de Alumno". 
                  El estudiante deberá completarlo obligatoriamente para continuar.
                </p>
              </div>
            )}

            {formData.lesson_type === "pdf" && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Subir PDF</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    disabled={isUploadingPDF}
                  />
                  {isUploadingPDF && (
                    <p className="text-xs text-muted-foreground mt-1">Subiendo PDF...</p>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">URL del PDF</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si ya tienes el PDF alojado en otro lugar
                  </p>
                </div>
              </div>
            )}

            {formData.lesson_type === "reading" && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Título del Contenido (opcional)</Label>
                  <Input
                    value={formData.content_title}
                    onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                    placeholder="Ej: Introducción al tema, Conceptos básicos, etc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si no agregas un título, no se mostrará ningún encabezado
                  </p>
                </div>
                <div>
                  <Label className="mb-2 block">Contenido *</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                  />
                </div>
              </div>
            )}

            {formData.lesson_type === "exercise" && (
              <div>
                <Label className="mb-2 block">Instrucciones del Ejercicio</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe el ejercicio que los estudiantes deben completar..."
                  rows={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingPDF}>
              {isLoading ? "Creando..." : "Crear Lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditLessonDialog({ lesson, moduleId, onUpdated }: { lesson: Lesson, moduleId: string, onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPDF, setIsUploadingPDF] = useState(false)
  const [formData, setFormData] = useState({ 
    title: lesson.title, 
    order_index: lesson.order_index,
    duration_minutes: lesson.duration_minutes,
    lesson_type: lesson.lesson_type || "reading",
    video_url: lesson.video_url || "",
    content: lesson.content || "",
    content_title: lesson.content_title || "",
  })
  const { toast } = useToast()
  const supabase = createClient()

  // Limpiar campos al cambiar el tipo de lección
  const handleLessonTypeChange = async (newType: string) => {
    // Primero actualizar el formulario
    setFormData(prev => {
      // Preservar solo título, orden y duración
      const baseData = {
        title: prev.title,
        order_index: prev.order_index,
        duration_minutes: prev.duration_minutes,
        lesson_type: newType,
      }

      // Agregar campos específicos según el tipo, todos vacíos
      return { ...baseData, video_url: "", content: "", content_title: "" }
    })

    // Luego limpiar los campos en la base de datos inmediatamente
    try {
      const updateData: any = {
        lesson_type: newType,
      }

      // Limpiar campos según el tipo
      if (newType === "video") {
        // Solo mantener video_url, limpiar content
        updateData.content = null
        updateData.content_title = null
      } else if (newType === "pdf") {
        // Solo mantener video_url (para el PDF), limpiar content
        updateData.content = null
        updateData.content_title = null
      } else if (newType === "reading") {
        // Solo mantener content, limpiar video_url
        updateData.video_url = null
      } else if (newType === "exercise") {
        // Mantener content, limpiar video_url
        updateData.video_url = null
      }

      await supabase
        .from("lessons")
        .update(updateData)
        .eq("id", lesson.id)

      toast({ description: "Tipo de lección cambiado. Los campos incompatibles se han limpiado." })
      onUpdated() // Refrescar la vista
    } catch (error) {
      console.error("Error al limpiar campos:", error)
    }
  }

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPDF(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from("course-assets")
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("course-assets")
        .getPublicUrl(fileName)

      setFormData({ ...formData, video_url: publicUrl })
      toast({ description: "PDF subido exitosamente" })
    } catch (error) {
      toast({ variant: "destructive", description: "Error al subir el PDF" })
    } finally {
      setIsUploadingPDF(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: formData.title,
          order_index: formData.order_index,
          duration_minutes: formData.duration_minutes,
          lesson_type: formData.lesson_type,
          video_url: formData.video_url || null,
          content: formData.content || null,
          content_title: formData.content_title || null,
        })
        .eq("id", lesson.id)

      if (error) throw error

      toast({ description: "Lección actualizada exitosamente" })
      setOpen(false)
      onUpdated()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al actualizar la lección" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Lección</DialogTitle>
            <DialogDescription>Modifica el contenido y los metadatos de la lección seleccionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Tipo *</Label>
                <Select 
                  value={formData.lesson_type} 
                  onValueChange={handleLessonTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Orden</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Duración (minutos)</Label>
              <Input
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                min={0}
              />
            </div>

            {/* Campos específicos según el tipo */}
            {formData.lesson_type === "video" && (
              <div>
                <Label className="mb-2 block">URL del Video *</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL embebida de YouTube, Vimeo, etc.
                </p>
              </div>
            )}

            {formData.lesson_type === "intake_form" && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="text-sm text-blue-700">
                  Esta lección mostrará el formulario de "Ficha de Alumno". 
                  El estudiante deberá completarlo obligatoriamente para continuar.
                </p>
              </div>
            )}

            {formData.lesson_type === "pdf" && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Subir PDF</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    disabled={isUploadingPDF}
                  />
                  {isUploadingPDF && (
                    <p className="text-xs text-muted-foreground mt-1">Subiendo PDF...</p>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">URL del PDF</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si ya tienes el PDF alojado en otro lugar
                  </p>
                </div>
              </div>
            )}

            {formData.lesson_type === "reading" && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Título del Contenido (opcional)</Label>
                  <Input
                    value={formData.content_title}
                    onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                    placeholder="Ej: Introducción al tema, Conceptos básicos, etc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si no agregas un título, no se mostrará ningún encabezado sobre el contenido
                  </p>
                </div>
                <div>
                  <Label className="mb-2 block">Contenido *</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                  />
                </div>
              </div>
            )}

            {formData.lesson_type === "exercise" && (
              <div>
                <Label className="mb-2 block">Instrucciones del Ejercicio</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe el ejercicio que los estudiantes deben completar..."
                  rows={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingPDF}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLessonDialog({ lesson, onDeleted }: { lesson: Lesson, onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lesson.id)

      if (error) throw error

      toast({ description: "Lección eliminada exitosamente" })
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast({ variant: "destructive", description: "Error al eliminar la lección" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Lección</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar "{lesson.title}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
