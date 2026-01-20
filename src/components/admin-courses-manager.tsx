"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCourse, updateCourse, deleteCourse } from "@/app/admin/actions"
import { reorderCourses } from "@/app/admin/course-actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, Plus, DollarSign, Clock, BookOpen, Video, Settings, Package, Upload, Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { AdminSubscriptionPlansManager } from "@/components/admin-subscription-plans-manager"
import { AdminCourseAddons } from "@/components/admin-course-addons"

interface AdminCoursesManagerProps {
  initialCourses: any[]
}

export function AdminCoursesManager({ initialCourses }: AdminCoursesManagerProps) {
  const [courses, setCourses] = useState(initialCourses)
  const router = useRouter()

  const handleCourseCreated = (course: any) => {
    setCourses((prev) => [course, ...prev])
    router.refresh()
  }

  const handleCourseUpdated = (course: any) => {
    setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)))
    router.refresh()
  }

  const handleCourseDeleted = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId))
    setTimeout(() => {
      router.refresh()
      window.location.href = "/admin/courses"
    }, 100)
  }

  const handleMoveCourse = async (index: number, direction: 'prev' | 'next') => {
    if (direction === 'prev' && index === 0) return
    if (direction === 'next' && index === courses.length - 1) return

    const newCourses = [...courses]
    const targetIndex = direction === 'prev' ? index - 1 : index + 1
    
    // Swap
    const temp = newCourses[index]
    newCourses[index] = newCourses[targetIndex]
    newCourses[targetIndex] = temp

    // Optimistic update
    setCourses(newCourses)

    // Server update
    try {
      const orderedIds = newCourses.map(c => c.id)
      await reorderCourses(orderedIds)
    } catch (error) {
      console.error("Error reordering courses:", error)
      // Revert on error could be implemented here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">Gestiona los cursos de la plataforma</p>
        </div>
        <CreateCourseDialog onCreated={handleCourseCreated} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            index={index}
            isFirst={index === 0}
            isLast={index === courses.length - 1}
            onUpdated={handleCourseUpdated}
            onDeleted={handleCourseDeleted}
            onMove={handleMoveCourse}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay cursos creados aún</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== COURSE CARD ====================
function CourseCard({
  course,
  index,
  isFirst,
  isLast,
  onUpdated,
  onDeleted,
  onMove
}: {
  course: any
  index: number,
  isFirst: boolean,
  isLast: boolean,
  onUpdated: (course: any) => void
  onDeleted: (courseId: string) => void
  onMove: (index: number, direction: 'prev' | 'next') => void
}) {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  // Cargar planes de suscripción si el curso es de tipo subscription
  useEffect(() => {
    if (course.payment_type === "subscription") {
      loadPlans()
    } else {
      setIsLoadingPlans(false)
    }
  }, [course.id, course.payment_type])

  const loadPlans = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!error && data) {
        setPlans(data)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {course.type === "ebook" && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-200 font-medium">
                  Ebook
                </span>
              )}
              <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            </div>
            <CardDescription className="line-clamp-2 mt-1">
              {course.short_description || course.description}
            </CardDescription>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-0 mr-1 bg-secondary/30 rounded-lg border">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-secondary/80" 
                disabled={isFirst}
                onClick={() => onMove(index, 'prev')}
                title="Mover antes"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-[1px] h-4 bg-border"></div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-secondary/80" 
                disabled={isLast}
                onClick={() => onMove(index, 'next')}
                title="Mover después"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <EditCourseDialog course={course} onUpdated={onUpdated} />
              <DeleteCourseDialog course={course} onDeleted={onDeleted} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {course.payment_type === "subscription" && (
            <ManageSubscriptionPlansDialog
              courseId={course.id}
              courseName={course.title}
              key={`plans-${course.id}-${plans.length}`}
            />
          )}

          <div className="space-y-2 pt-2 border-t">
            {course.payment_type === "one_time" && course.one_time_price && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Pago único: ${course.one_time_price?.toLocaleString("es-CL")}</span>
              </div>
            )}

            {course.payment_type === "subscription" && !isLoadingPlans && (
              <>
                {plans.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">
                    Sin planes configurados
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {plan.name || `${plan.duration_months} ${plan.duration_months === 1 ? 'mes' : 'meses'}`}: ${plan.price?.toLocaleString("es-CL")}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {course.duration_hours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{course.duration_hours} horas</span>
              </div>
            )}
            {course.video_url && (
              <div className="flex items-center gap-2 text-sm">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-green-600">Video añadido</span>
              </div>
            )}
            {course.type === "ebook" && course.download_url && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-blue-600 truncate max-w-[200px]">PDF: {course.download_url}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs px-2 py-1 rounded-full ${course.published
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
          >
            {course.published ? "Publicado" : "Borrador"}
          </span>
          {course.level && (
            <span className="text-xs text-muted-foreground capitalize">{course.level}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// ==================== CREATE DIALOG ====================
function CreateCourseDialog({ onCreated }: { onCreated: (course: any) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [productType, setProductType] = useState<"course" | "ebook">("course")
  const [paymentType, setPaymentType] = useState<"one_time" | "subscription">("subscription")
  const [hasQuestionsPack, setHasQuestionsPack] = useState(false)
  const [questionPackCourse, setQuestionPackCourse] = useState<string>("")
  const [questionPackPrice, setQuestionPackPrice] = useState<string>("")
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadAvailableCourses()
    }
  }, [isOpen])

  // Reset payment type when switching to ebook
  useEffect(() => {
    if (productType === "ebook") {
      setPaymentType("one_time")
    }
  }, [productType])

  const loadAvailableCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .order("title", { ascending: true })
    
    if (data) {
      setAvailableCourses(data)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)

    const formData = new FormData(event.currentTarget)

    const currentPaymentType = productType === "ebook" ? "one_time" : (formData.get("payment_type") as string)
    const videoUrl = formData.get("video_url") as string
    let downloadUrl = formData.get("download_url") as string || null

    try {
      // Upload Image if selected
      let imageUrl = formData.get("image_url") as string
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `course-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('courses')
          .upload(fileName, imageFile)

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage
          .from('courses')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrl
      }

      // Upload PDF if selected
      if (productType === "ebook" && pdfFile) {
        const fileExt = pdfFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('ebooks')
          .upload(fileName, pdfFile)

        if (uploadError) throw new Error(`Error al subir PDF: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage
          .from('ebooks')
          .getPublicUrl(fileName)
          
        downloadUrl = publicUrl
      }

      const published = formData.get("published") === "on"
      const payload = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        short_description: formData.get("short_description") as string,
        image_url: imageUrl,
        video_url: convertToYouTubeEmbed(videoUrl),
        payment_type: currentPaymentType,
        one_time_price: currentPaymentType === "one_time" ? parseFloat(formData.get("one_time_price") as string) || null : null,
        duration_hours: parseInt(formData.get("duration_hours") as string) || null,
        position: parseInt(formData.get("position") as string) || 0,
        level: formData.get("level") as string,
        published: published,
        is_published: published,
        status: published ? 'published' : 'draft',
        type: productType,
        download_url: downloadUrl,
      }

      const course = await createCourse(payload)
      
      // Si se seleccionó un pack de preguntas, crearlo como addon
      if (hasQuestionsPack && questionPackCourse && questionPackPrice) {
        const price = parseFloat(questionPackPrice)
        if (!isNaN(price)) {
          await supabase.from("course_addons").insert({
            course_id: course.id,
            addon_course_id: questionPackCourse,
            price: price,
            order_index: 0
          })
        }
      }
      
      onCreated(course)
      toast({
        title: productType === "ebook" ? "Ebook creado" : "Curso creado",
        description: "El producto se creó correctamente.",
      })
      setIsOpen(false)
      setHasQuestionsPack(false)
      setQuestionPackCourse("")
      setQuestionPackPrice("")
      setProductType("course")
      setPdfFile(null)
      setImageFile(null)
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
          Crear Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>Completa los datos del nuevo curso o ebook</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Producto</Label>
            <Select 
              name="type" 
              value={productType} 
              onValueChange={(v: "course" | "ebook") => setProductType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Curso Online</SelectItem>
                <SelectItem value="ebook">Ebook (Descargable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" name="title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Descripción Corta</Label>
            <Input id="short_description" name="short_description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción Completa *</Label>
            <Textarea id="description" name="description" rows={4} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Imagen de Portada</Label>
            <div className="flex gap-2 items-center">
              <Input 
                id="image_file" 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sube una imagen para la portada del curso.
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O ingresa una URL externa
                </span>
              </div>
            </div>
            <Input id="image_url" name="image_url" type="url" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>

          {productType === "ebook" && (
            <div className="space-y-2">
              <Label htmlFor="download_url">Archivo PDF del Ebook *</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="pdf_file" 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sube el archivo PDF. Se generará un enlace de descarga automáticamente.
              </p>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O ingresa una URL externa
                  </span>
                </div>
              </div>
              <Input id="download_url" name="download_url" type="url" placeholder="https://..." />
            </div>
          )}

          {productType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="video_url">URL del Video (YouTube/Vimeo)</Label>
              <Input id="video_url" name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=VIDEO_ID o https://youtu.be/VIDEO_ID" />
              <p className="text-xs text-muted-foreground">
                Pega cualquier link de YouTube y se convertirá automáticamente al formato correcto
              </p>
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_type">Tipo de Pago</Label>
              <Select 
                name="payment_type" 
                value={paymentType} 
                onValueChange={(value: "one_time" | "subscription") => setPaymentType(value)}
                disabled={productType === "ebook"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Pago Único</SelectItem>
                  <SelectItem value="subscription">Suscripción (múltiples planes)</SelectItem>
                </SelectContent>
              </Select>
              {productType === "ebook" && (
                <p className="text-xs text-muted-foreground">
                  Los ebooks son siempre de pago único.
                </p>
              )}
            </div>

            {paymentType === "one_time" ? (
              <div className="space-y-2">
                <Label htmlFor="one_time_price">Precio Único (CLP)</Label>
                <Input
                  id="one_time_price"
                  name="one_time_price"
                  type="number"
                  defaultValue={50000}
                  step="1000"
                  required
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Nuevo sistema de planes flexible:</strong>
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Después de crear el curso, podrás agregar planes de suscripción con cualquier duración (1, 2, 3, 6, 12 meses, etc.) desde el botón "Gestionar Planes".
                  </p>
                </div>
              </div>
            )}
          </div>

          {productType === "course" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duración (horas)</Label>
                <Input id="duration_hours" name="duration_hours" type="number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select name="level" defaultValue="beginner">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="create-position">Posición (Orden)</Label>
              <Input
                id="create-position"
                name="position"
                type="number"
                defaultValue={0}
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Define el orden de visualización. Menor número = aparece primero.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="published" name="published" />
              <Label htmlFor="published">Publicado</Label>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="has_questions_pack" 
                checked={hasQuestionsPack}
                onCheckedChange={setHasQuestionsPack}
              />
              <Label htmlFor="has_questions_pack">Ofrecer banco de preguntas adicional</Label>
            </div>

            {hasQuestionsPack && (
              <div className="space-y-4 ml-8">
                <div className="space-y-2">
                  <Label htmlFor="question_pack_course">Seleccionar Pack de Preguntas</Label>
                  <Select value={questionPackCourse} onValueChange={setQuestionPackCourse}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un curso..." />
                    </SelectTrigger>
                    <SelectContent className="max-w-[90vw] sm:max-w-[700px]">
                      <div className="max-h-[300px] overflow-y-auto">
                        {availableCourses.map(course => (
                          <SelectItem key={course.id} value={course.id} className="py-3">
                            <div className="max-w-full">
                              <p className="text-sm leading-tight break-words whitespace-normal">
                                {course.title}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question_pack_price">Precio del Banco de Preguntas (CLP)</Label>
                  <Input
                    id="question_pack_price"
                    type="number"
                    step="1000"
                    placeholder="25000"
                    value={questionPackPrice}
                    onChange={(e) => setQuestionPackPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este precio se agregará al checkout como una opción adicional
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT DIALOG ====================
function EditCourseDialog({
  course,
  onUpdated,
}: {
  course: any
  onUpdated: (course: any) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [productType, setProductType] = useState<"course" | "ebook">(course.type || "course")
  const [paymentType, setPaymentType] = useState<"one_time" | "subscription">(course.payment_type || "subscription")
  const [hasQuestionsPack, setHasQuestionsPack] = useState(false)
  const [questionPackCourse, setQuestionPackCourse] = useState<string>("")
  const [questionPackPrice, setQuestionPackPrice] = useState<string>("")
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [existingAddonId, setExistingAddonId] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadAvailableCourses()
      loadExistingAddon()
    }
  }, [isOpen])

  // Reset payment type when switching to ebook
  useEffect(() => {
    if (productType === "ebook") {
      setPaymentType("one_time")
    }
  }, [productType])

  const loadAvailableCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .neq("id", course.id)
      .order("title", { ascending: true })
    
    if (data) {
      setAvailableCourses(data)
    }
  }

  const loadExistingAddon = async () => {
    const { data } = await supabase
      .from("course_addons")
      .select("id, addon_course_id, price")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setHasQuestionsPack(true)
      setQuestionPackCourse(data.addon_course_id)
      setQuestionPackPrice(data.price?.toString() || "")
      setExistingAddonId(data.id)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)

    const currentPaymentType = productType === "ebook" ? "one_time" : (formData.get("payment_type") as string)
    const videoUrl = formData.get("video_url") as string
    let downloadUrl = formData.get("download_url") as string || null

    try {
      // Upload Image if selected
      let imageUrl = formData.get("image_url") as string
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `course-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('courses')
          .upload(fileName, imageFile)

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage
          .from('courses')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrl
      }

      // Upload PDF if selected
      if (productType === "ebook" && pdfFile) {
        const fileExt = pdfFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('ebooks')
          .upload(fileName, pdfFile)

        if (uploadError) throw new Error(`Error al subir PDF: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage
          .from('ebooks')
          .getPublicUrl(fileName)
          
        downloadUrl = publicUrl
      }

      const published = formData.get("published") === "on"
      const payload = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        short_description: formData.get("short_description") as string,
        image_url: imageUrl,
        video_url: convertToYouTubeEmbed(videoUrl),
        payment_type: currentPaymentType,
        one_time_price: currentPaymentType === "one_time" ? parseFloat(formData.get("one_time_price") as string) || null : null,
        duration_hours: parseInt(formData.get("duration_hours") as string) || null,
        position: parseInt(formData.get("position") as string) || 0,
        level: formData.get("level") as string,
        published: published,
        is_published: published,
        status: published ? 'published' : 'draft',
        type: productType,
        download_url: downloadUrl,
      }

      const updatedCourse = await updateCourse(course.id, payload)
      
      // Gestionar el addon del pack de preguntas
      if (hasQuestionsPack && questionPackCourse && questionPackPrice) {
        const price = parseFloat(questionPackPrice)
        if (!isNaN(price)) {
          if (existingAddonId) {
            // Actualizar addon existente
            await supabase.from("course_addons").update({
              addon_course_id: questionPackCourse,
              price: price
            }).eq("id", existingAddonId)
          } else {
            // Crear nuevo addon
            await supabase.from("course_addons").insert({
              course_id: course.id,
              addon_course_id: questionPackCourse,
              price: price,
              order_index: 0
            })
          }
        }
      } else if (!hasQuestionsPack && existingAddonId) {
        // Eliminar addon si se desactivó
        await supabase.from("course_addons").delete().eq("id", existingAddonId)
      }
      
      onUpdated(updatedCourse)
      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente.",
      })
      setIsOpen(false)
      setPdfFile(null)
      setImageFile(null)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>Modifica los datos del curso o ebook</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-type">Tipo de Producto</Label>
            <Select 
              name="type" 
              value={productType} 
              onValueChange={(v: "course" | "ebook") => setProductType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Curso Online</SelectItem>
                <SelectItem value="ebook">Ebook (Descargable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input id="edit-title" name="title" defaultValue={course.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-short_description">Descripción Corta</Label>
            <Input
              id="edit-short_description"
              name="short_description"
              defaultValue={course.short_description || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción Completa</Label>
            <Textarea
              id="edit-description"
              name="description"
              rows={4}
              defaultValue={course.description}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-image_url">Imagen de Portada</Label>
            <div className="flex gap-2 items-center">
              <Input 
                id="edit-image_file" 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sube una nueva imagen para reemplazar la actual.
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O actualiza la URL externa
                </span>
              </div>
            </div>
            <Input
              id="edit-image_url"
              name="image_url"
              type="url"
              defaultValue={course.image_url || ""}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {productType === "ebook" && (
            <div className="space-y-2">
              <Label htmlFor="edit-download_url">Archivo PDF del Ebook *</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="edit-pdf_file" 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sube un nuevo archivo para reemplazar el actual.
              </p>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O actualiza la URL externa
                  </span>
                </div>
              </div>
              <Input 
                id="edit-download_url" 
                name="download_url" 
                type="url" 
                defaultValue={course.download_url || ""}
                placeholder="https://..." 
              />
            </div>
          )}

          {productType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="edit-video_url">URL del Video (YouTube/Vimeo)</Label>
              <Input
                id="edit-video_url"
                name="video_url"
                type="url"
                defaultValue={course.video_url || ""}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID o https://youtu.be/VIDEO_ID"
              />
              <p className="text-xs text-muted-foreground">
                Pega cualquier link de YouTube y se convertirá automáticamente al formato correcto
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-payment_type">Tipo de Pago</Label>
            <Select
              name="payment_type"
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as "one_time" | "subscription")}
              disabled={productType === "ebook"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">Pago Único</SelectItem>
                <SelectItem value="subscription">Suscripción (múltiples planes)</SelectItem>
              </SelectContent>
            </Select>
            {productType === "ebook" && (
              <p className="text-xs text-muted-foreground">
                Los ebooks son siempre de pago único.
              </p>
            )}
          </div>

          {paymentType === "one_time" ? (
            <div className="space-y-2">
              <Label htmlFor="edit-one_time_price">Precio (CLP)</Label>
              <Input
                id="edit-one_time_price"
                name="one_time_price"
                type="number"
                defaultValue={course.one_time_price || 35000}
                step="1000"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 <strong>Gestión de planes de suscripción:</strong>
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Los planes de suscripción ahora se gestionan desde el botón "Gestionar Planes" en la tarjeta del curso. Puedes crear planes con cualquier duración.
                </p>
              </div>
            </div>
          )}

          {productType === "course" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration_hours">Duración (horas)</Label>
                <Input
                  id="edit-duration_hours"
                  name="duration_hours"
                  type="number"
                  defaultValue={course.duration_hours || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-level">Nivel</Label>
                <Select name="level" defaultValue={course.level || "beginner"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
               <Label htmlFor="edit-position">Posición (Orden)</Label>
               <Input
                 id="edit-position"
                 name="position"
                 type="number"
                 defaultValue={course.position || 0}
                 step="1"
               />
                <p className="text-xs text-muted-foreground">
                  Define el orden de visualización. Menor número = aparece primero.
                </p>
            </div>

            <div className="flex items-center space-x-2">
               <Switch id="edit-published" name="published" defaultChecked={course.published} />
               <Label htmlFor="edit-published">Publicado</Label>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-has_questions_pack" 
                checked={hasQuestionsPack}
                onCheckedChange={setHasQuestionsPack}
              />
              <Label htmlFor="edit-has_questions_pack">Ofrecer banco de preguntas adicional</Label>
            </div>

            {hasQuestionsPack && (
              <div className="space-y-4 ml-8">
                <div className="space-y-2">
                  <Label htmlFor="edit-question_pack_course">Seleccionar Pack de Preguntas</Label>
                  <Select value={questionPackCourse} onValueChange={setQuestionPackCourse}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un curso..." />
                    </SelectTrigger>
                    <SelectContent className="max-w-[90vw] sm:max-w-[700px]">
                      <div className="max-h-[300px] overflow-y-auto">
                        {availableCourses.map(c => (
                          <SelectItem key={c.id} value={c.id} className="py-3">
                            <div className="max-w-full">
                              <p className="text-sm leading-tight break-words whitespace-normal">
                                {c.title}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-question_pack_price">Precio del Banco de Preguntas (CLP)</Label>
                  <Input
                    id="edit-question_pack_price"
                    type="number"
                    step="1000"
                    placeholder="25000"
                    value={questionPackPrice}
                    onChange={(e) => setQuestionPackPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este precio se agregará al checkout como una opción adicional
                  </p>
                </div>
              </div>
            )}
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
function DeleteCourseDialog({
  course,
  onDeleted,
}: {
  course: any
  onDeleted: (courseId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteCourse(course.id)

      toast({
        title: "Curso eliminado",
        description: `Se eliminó "${course.title}" correctamente.`,
      })

      setIsOpen(false)
      onDeleted(course.id)

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message,
      })
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
          <DialogTitle>¿Eliminar curso?</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar "{course.title}". Esta acción no se puede deshacer.
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

// ==================== MANAGE SUBSCRIPTION PLANS DIALOG ====================
function ManageSubscriptionPlansDialog({
  courseId,
  courseName,
}: {
  courseId: string
  courseName: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const loadPlans = async () => {
    setIsLoading(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadPlans()
    } else {
      // Cuando se cierra el diálogo, refrescar la página para actualizar los planes en las tarjetas
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Gestionar Planes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Planes de Suscripción</DialogTitle>
          <DialogDescription>
            {courseName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando planes...
          </div>
        ) : (
          <AdminSubscriptionPlansManager
            courseId={courseId}
            courseName={courseName}
            plans={plans}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== MANAGE ADDONS DIALOG ====================
function ManageAddonsDialog({
  courseId,
  courseTitle
}: {
  courseId: string
  courseTitle: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Complementos Opcionales
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complementos/Add-ons</DialogTitle>
          <DialogDescription>
            {courseTitle}
          </DialogDescription>
        </DialogHeader>

        <AdminCourseAddons
          courseId={courseId}
          courseTitle={courseTitle}
        />
      </DialogContent>
    </Dialog>
  )
}