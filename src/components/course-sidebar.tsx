"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CheckCircle2, Circle, PlayCircle, FileText, PenTool, File, ChevronDown, ChevronUp, Menu, BookOpen, MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

interface Lesson {
  id: string
  title: string
  lesson_type: string
  duration_minutes: number | null
  completed?: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface CourseSidebarProps {
  courseId: string
  modules: Module[]
  progress: number
  onOpenChat?: () => void
}

const lessonIcons = {
  video: PlayCircle,
  reading: FileText,
  pdf: File,
  exercise: PenTool,
  quiz: PenTool,
}

function SidebarContent({
  courseId,
  modules,
  progress,
  onLessonClick
}: {
  courseId: string
  modules: Module[]
  progress: number
  onLessonClick?: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const previewParam = isPreview ? '?preview=true' : ''
  
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const currentModuleId = modules.find(module =>
      module.lessons.some(lesson => pathname.includes(lesson.id))
    )?.id
    return new Set(currentModuleId ? [currentModuleId] : [modules[0]?.id])
  })

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const getModuleProgress = (module: Module) => {
    const completedCount = module.lessons.filter(l => l.completed).length
    const totalCount = module.lessons.length
    return { completed: completedCount, total: totalCount }
  }

  return (
    <>
      {/* Header fijo */}
      <div className="p-4 border-b border-border flex-shrink-0 bg-background">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progreso del Curso</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {modules.map((module) => {
            const isOpen = openModules.has(module.id)
            const moduleProgress = getModuleProgress(module)

            return (
              <div key={module.id} className="space-y-1">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {moduleProgress.completed}/{moduleProgress.total}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 text-left">
                        {module.title}
                      </h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-1 pl-2">
                    {module.lessons.map((lesson) => {
                      const Icon = lessonIcons[lesson.lesson_type as keyof typeof lessonIcons] || FileText
                      const isActive = pathname.includes(lesson.id)

                      return (
                        <Link
                          key={lesson.id}
                          href={`/learn/${courseId}/${lesson.id}${previewParam}`}
                          onClick={onLessonClick}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-md transition-all text-sm border ${isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : lesson.completed
                                ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-foreground border-green-200 dark:border-green-800"
                                : "bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                            }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="h-4 w-4 flex-shrink-0" />
                          )}
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate">{lesson.title}</span>
                          {lesson.duration_minutes && (
                            <span className="text-xs flex-shrink-0 opacity-70">{lesson.duration_minutes}min</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function CourseSidebar({ courseId, modules, progress, onOpenChat }: CourseSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - Oculto en móvil */}
      <div className="hidden md:flex w-80 bg-muted/30 border-r border-border flex-col h-screen">
        <SidebarContent courseId={courseId} modules={modules} progress={progress} />
      </div>

      {/* Mobile Header - Visible solo en móvil */}
      <div className="md:hidden sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Contenido del Curso</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChat && (
              <Button variant="outline" size="sm" onClick={onOpenChat}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Módulos
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <SidebarContent
                    courseId={courseId}
                    modules={modules}
                    progress={progress}
                    onLessonClick={() => setOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  )
}
