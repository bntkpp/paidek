"use client"

import { useMemo, type ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, FileText, Headphones, PlayCircle } from "lucide-react"
import { PDFViewerSimple } from "@/components/pdf-viewer-simple"
import { StudentIntakeForm } from "@/components/student-intake-form"

// Función para convertir texto enriquecido a HTML
function formatRichText(text: string): string {
  let formatted = text
  
  // Paso 1: Proteger URLs y enlaces markdown guardándolos temporalmente
  const urlPlaceholders: string[] = []
  const markdownLinkPlaceholders: string[] = []
  
  // Guardar enlaces markdown [texto](url)
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      const placeholder = `§§§MDLINK${markdownLinkPlaceholders.length}§§§`
      markdownLinkPlaceholders.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${text}</a>`)
      return placeholder
    }
  )
  
  // Guardar URLs simples (captura TODO hasta un espacio o fin de línea)
  formatted = formatted.replace(
    /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g,
    (match) => {
      const placeholder = `§§§URL${urlPlaceholders.length}§§§`
      // Limpiar posibles tags HTML que se hayan metido en la URL
      const cleanUrl = match.replace(/<[^>]+>/g, '')
      urlPlaceholders.push(`<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 break-all">${cleanUrl}</a>`)
      return placeholder
    }
  )
  
  // Paso 2: Aplicar formatos de texto (ahora las URLs están protegidas)
  // Negritas **texto** o __texto__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>')
  
  // Cursivas *texto* o _texto_ (solo con espacios alrededor para evitar conflictos)
  formatted = formatted.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/(^|\s)_([^_\s][^_]*?)_(\s|$)/gm, '$1<em>$2</em>$3')
  
  // Tachado ~~texto~~
  formatted = formatted.replace(/~~(.+?)~~/g, '<del>$1</del>')
  
  // Títulos
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
  formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')
  
  // Listas numeradas
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-6">$1</li>')
  formatted = formatted.replace(/(<li class="ml-6">.*<\/li>\n?)+/g, '<ol class="list-decimal ml-4 space-y-2 my-4">$&</ol>')
  
  // Listas con viñetas
  formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-6">$1</li>')
  formatted = formatted.replace(/(<li class="ml-6">.*<\/li>\n?)+/g, match => {
    if (!match.includes('list-decimal')) {
      return `<ul class="list-disc ml-4 space-y-2 my-4">${match}</ul>`
    }
    return match
  })
  
  // Saltos de línea
  formatted = formatted.replace(/\n/g, '<br />')
  
  // Paso 3: Restaurar URLs
  markdownLinkPlaceholders.forEach((link, i) => {
    formatted = formatted.replace(`§§§MDLINK${i}§§§`, link)
  })
  
  urlPlaceholders.forEach((link, i) => {
    formatted = formatted.replace(`§§§URL${i}§§§`, link)
  })
  
  return formatted
}

interface LessonCapsule {
  id?: string
  type: "video" | "text" | "pdf" | "audio"
  title?: string | null
  description?: string | null
  url?: string | null
  content?: string | null
}

interface LessonContentProps {
  lesson: {
    id: string
    title: string
    content: string | null
    content_title?: string | null
    video_url: string | null
    lesson_type: string
    capsules?: LessonCapsule[] | string | null
    summary?: string | null
  }
  isCompleted: boolean
  isMarking: boolean
  onMarkComplete: () => void
  previousLesson?: { id: string; title: string } | null
  nextLesson?: { id: string; title: string } | null
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  isCourseCompleted?: boolean
  hasExistingReview?: boolean
  courseId?: string
  userId?: string
  onReviewSubmitted?: () => void
  intakeForm?: any
}

const capsuleTypeLabel: Record<LessonCapsule["type"], string> = {
  video: "Video",
  text: "Lectura",
  pdf: "Documento",
  audio: "Audio",
}

const capsuleIcons: Record<LessonCapsule["type"], ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  text: FileText,
  pdf: FileText,
  audio: Headphones,
}

function parseCapsules(lesson: LessonContentProps["lesson"]): LessonCapsule[] {
  if (Array.isArray(lesson.capsules)) {
    return lesson.capsules as LessonCapsule[]
  }

  if (typeof lesson.capsules === "string") {
    try {
      const parsed = JSON.parse(lesson.capsules) as LessonCapsule[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (error) {
      console.warn("No se pudo parsear el campo capsules de la lección", error)
    }
  }

  const fallbackCapsules: LessonCapsule[] = []

  if (lesson.video_url) {
    // Detectar si es PDF
    if (lesson.video_url.toLowerCase().endsWith('.pdf')) {
      fallbackCapsules.push({
        id: `${lesson.id}-pdf`,
        type: "pdf",
        url: lesson.video_url,
        title: lesson.title,
      })
    } else {
      // Es video
      fallbackCapsules.push({
        id: `${lesson.id}-video`,
        type: "video",
        url: lesson.video_url,
        title: lesson.title,
      })
    }
  }

  if (lesson.content) {
    fallbackCapsules.push({
      id: `${lesson.id}-text`,
      type: "text",
      content: lesson.content,
      title: lesson.content_title || null,
    })
  }

  return fallbackCapsules
}

export function LessonContent({
  lesson,
  isCompleted,
  isMarking,
  onMarkComplete,
  previousLesson,
  nextLesson,
  onNavigatePrevious,
  onNavigateNext,
  intakeForm,
  courseId,
  userId,
}: LessonContentProps) {
  const capsules = useMemo(() => parseCapsules(lesson), [lesson])

  const hasCapsules = capsules.length > 0
  
  // Determinar el tipo de contenido principal basado en lesson_type
  const isPdfLesson = lesson.lesson_type === 'pdf'
  const isVideoLesson = lesson.lesson_type === 'video'
  const isReadingLesson = lesson.lesson_type === 'reading'
  const isIntakeForm = lesson.lesson_type === 'intake_form'
  
  // Validar si una URL es un video válido
  const isValidVideoUrl = (url: string | null) => {
    if (!url) return false
    const lowerUrl = url.toLowerCase()
    return lowerUrl.includes('youtube.com') || 
           lowerUrl.includes('youtu.be') || 
           lowerUrl.includes('vimeo.com') || 
           lowerUrl.includes('drive.google.com')
  }
  
  // Función para renderizar solo el contenido apropiado según el tipo de lección
  const renderMainContent = () => {
    // Si es formulario de ficha de alumno
    if (isIntakeForm) {
      if (courseId && userId) {
        return (
          <div className="flex-1 w-full overflow-y-auto p-6 bg-muted/20">
            <div className="max-w-3xl mx-auto">
              <StudentIntakeForm 
                courseId={courseId} 
                userId={userId} 
                onSuccess={onMarkComplete}
                existingForm={intakeForm}
              />
            </div>
          </div>
        )
      } else {
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-destructive">
              <p>Error: Faltan datos del usuario o curso para cargar el formulario.</p>
            </div>
          </div>
        )
      }
    }

    // Si es lección PDF, mostrar solo PDF
    if (isPdfLesson) {
      const pdfCapsule = capsules.find(c => c.type === "pdf")
      if (pdfCapsule?.url) {
        return (
          <div className="flex-1 w-full overflow-hidden min-h-0">
            <PDFViewerSimple url={pdfCapsule.url} />
          </div>
        )
      }
      // Fallback si no hay capsule pero hay video_url con PDF
      if (lesson.video_url?.toLowerCase().endsWith('.pdf')) {
        return (
          <div className="flex-1 w-full overflow-hidden min-h-0">
            <PDFViewerSimple url={lesson.video_url} />
          </div>
        )
      }
    }
    
    // Si es lección de video, mostrar solo video
    if (isVideoLesson) {
      const videoCapsule = capsules.find(c => c.type === "video")
      const videoUrl = videoCapsule?.url || lesson.video_url
      
      // Validar que la URL sea correcta
      if (videoUrl && !isValidVideoUrl(videoUrl)) {
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mb-4 text-destructive">
                <PlayCircle className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold mb-2">El enlace del video es incorrecto</h3>
              <p className="text-sm text-muted-foreground mb-4">
                El formato del enlace no es válido. Por favor, usa enlaces de YouTube, Vimeo o Google Drive.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                {videoUrl}
              </p>
            </div>
          </div>
        )
      }
      
      if (videoCapsule?.url) {
        return (
          <div className="flex-1 w-full overflow-y-auto min-h-0">
            <div className="min-h-full bg-black flex items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-5xl">
                <div className="w-full bg-black rounded-lg overflow-hidden">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={videoCapsule.url}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
      // Fallback si no hay capsule pero hay video_url
      if (videoUrl && isValidVideoUrl(videoUrl)) {
        return (
          <div className="flex-1 w-full overflow-y-auto min-h-0">
            <div className="min-h-full bg-black flex items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-5xl">
                <div className="w-full bg-black rounded-lg overflow-hidden">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={videoUrl}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      // Si no hay URL válida
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <PlayCircle className="h-16 w-16 mx-auto mb-4" />
            <p>No hay video disponible para esta lección</p>
          </div>
        </div>
      )
    }
    
    // Si es lección de lectura, mostrar solo contenido de texto
    if (isReadingLesson || lesson.content) {
      const textCapsule = capsules.find(c => c.type === "text")
      if (textCapsule?.content || lesson.content) {
        return (
          <div className="flex-1 w-full overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
              {(textCapsule?.title || lesson.content_title) && (
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  {textCapsule?.title || lesson.content_title}
                </h2>
              )}
              <div className="prose prose-base max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-a:text-primary prose-a:underline prose-strong:font-bold">
                <div 
                  className="leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: formatRichText(textCapsule?.content || lesson.content || '') 
                  }}
                />
              </div>
            </div>
          </div>
        )
      }
    }
    
    // Fallback: mostrar mensaje de que no hay contenido
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p>No hay contenido disponible para esta lección</p>
          <p className="text-xs mt-2 opacity-50">
            Type: {lesson.lesson_type} | ID: {lesson.id}
          </p>
        </div>
      </div>
    )
  }

  const renderCapsule = (capsule: LessonCapsule) => {
    switch (capsule.type) {
      case "video":
        return (
          <div className="w-full bg-black rounded-lg overflow-hidden">
            {capsule.url ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={capsule.url}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex items-center justify-center bg-muted" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Video no disponible</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case "pdf":
        return capsule.url ? (
          <PDFViewerSimple url={capsule.url} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Documento no disponible
          </div>
        )
      case "audio":
        return capsule.url ? (
          <audio controls className="w-full">
            <source src={capsule.url} />
          </audio>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Audio no disponible
          </div>
        )
      case "text":
      default:
        return (
          <div className="prose prose-base max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-a:text-primary prose-a:underline prose-strong:font-bold">
            <div 
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: formatRichText(capsule.content || '') 
              }}
            />
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Contenido principal */}
      {renderMainContent()}

      {/* Botones de navegación principales - mejorados para móvil */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-40">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          {/* Versión móvil - Botones apilados */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!previousLesson}
                onClick={onNavigatePrevious}
                size="sm"
                className="flex-1"
              >
                ← ANTERIOR
              </Button>
              <Button
                disabled={!nextLesson || (isIntakeForm && !isCompleted)}
                onClick={onNavigateNext}
                size="sm"
                className="flex-1"
              >
                SIGUIENTE →
              </Button>
            </div>
            {!isIntakeForm && (
              <Button
                variant={isCompleted ? "outline" : "default"}
                disabled={isMarking || isCompleted}
                onClick={onMarkComplete}
                size="sm"
                className="w-full"
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    COMPLETADA
                  </>
                ) : isMarking ? (
                  "GUARDANDO..."
                ) : (
                  "COMPLETAR LECCIÓN"
                )}
              </Button>
            )}
            {isIntakeForm && isCompleted && (
              <Button
                variant="outline"
                disabled={true}
                size="sm"
                className="w-full"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                COMPLETADA
              </Button>
            )}
          </div>

          {/* Versión desktop - Botones en línea */}
          <div className="hidden md:flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <Button
              variant="outline"
              disabled={!previousLesson}
              onClick={onNavigatePrevious}
              size="lg"
              className="min-w-[140px]"
            >
              ← ANTERIOR
            </Button>
            
            {!isIntakeForm && (
              <Button
                variant={isCompleted ? "outline" : "default"}
                disabled={isMarking || isCompleted}
                onClick={onMarkComplete}
                size="lg"
                className="min-w-[180px]"
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    COMPLETADA
                  </>
                ) : isMarking ? (
                  "GUARDANDO..."
                ) : (
                  "COMPLETAR"
                )}
              </Button>
            )}
            {isIntakeForm && isCompleted && (
              <Button
                variant="outline"
                disabled={true}
                size="lg"
                className="min-w-[180px]"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                COMPLETADA
              </Button>
            )}

            <Button
              disabled={!nextLesson || (isIntakeForm && !isCompleted)}
              onClick={onNavigateNext}
              size="lg"
              className="min-w-[140px]"
            >
              SIGUIENTE →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}