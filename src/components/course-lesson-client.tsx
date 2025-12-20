"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CourseSidebar } from "@/components/course-sidebar"
import { LessonContent } from "@/components/lesson-content"
import { LessonNotesPanel } from "@/components/lesson-notes-panel"
import { LessonResources, type LessonResource } from "@/components/lesson-resources"
import { LessonQuiz, type LessonQuizQuestion } from "@/components/lesson-quiz"
import { LessonDiscussion } from "@/components/lesson-discussion"
import { ReviewForm } from "@/components/review-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useProgressTracker } from "@/hooks/use-progress-tracker"

interface Lesson {
  id: string
  title: string
  lesson_type: string
  duration_minutes: number | null
  content: string | null
  video_url: string | null
  capsules?: unknown
  summary?: string | null
  additional_resources?: unknown
  resources?: unknown
  quiz_questions?: unknown
  order_index?: number | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface CourseLessonClientProps {
  courseId: string
  courseTitle?: string | null
  modules: Module[]
  lesson: Lesson
  userId: string
  userDisplayName: string
  initialCompletedLessonIds: string[]
  initialProgressPercentage: number
  existingReview: boolean
}

function parseResources(lesson: Lesson): LessonResource[] {
  const raw = lesson.additional_resources ?? lesson.resources

  if (!raw) {
    return []
  }

  if (Array.isArray(raw)) {
    return raw as LessonResource[]
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as LessonResource[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (error) {
      console.warn("No se pudo parsear el listado de recursos de la lección", error)
    }
  }

  return []
}

function parseQuizQuestions(lesson: Lesson): LessonQuizQuestion[] {
  const raw = lesson.quiz_questions

  if (!raw) {
    return []
  }

  if (Array.isArray(raw)) {
    return raw as LessonQuizQuestion[]
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as LessonQuizQuestion[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (error) {
      console.warn("No se pudo parsear el quiz de la lección", error)
    }
  }

  return []
}

function flattenLessons(modules: Module[]) {
  return modules.flatMap((module) => module.lessons)
}

export function CourseLessonClient({
  courseId,
  courseTitle,
  modules,
  lesson,
  userId,
  userDisplayName,
  initialCompletedLessonIds,
  initialProgressPercentage,
  existingReview,
}: CourseLessonClientProps) {
  const router = useRouter()
  const [hasReview, setHasReview] = useState(existingReview)
  const [showReviewPrompt, setShowReviewPrompt] = useState(!existingReview && initialProgressPercentage === 100)

  const orderedModules = useMemo(
    () =>
      modules.map((module) => ({
        ...module,
        lessons: [...module.lessons].sort((a, b) => {
          const aIndex = typeof a.order_index === "number" ? a.order_index : 0
          const bIndex = typeof b.order_index === "number" ? b.order_index : 0
          return aIndex - bIndex
        }),
      })),
    [modules],
  )

  const flattenedLessons = useMemo(() => flattenLessons(orderedModules), [orderedModules])

  const {
    completedLessonIds,
    progress,
    markLessonComplete,
    isUpdating,
    isLessonCompleted,
  } = useProgressTracker({
    userId,
    courseId,
    lessons: flattenedLessons,
    initialCompletedLessonIds,
    initialProgressPercentage,
  })

  const currentLessonIndex = useMemo(
    () => flattenedLessons.findIndex((item) => item.id === lesson.id),
    [flattenedLessons, lesson.id],
  )

  const previousLesson = currentLessonIndex > 0 ? flattenedLessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < flattenedLessons.length - 1 ? flattenedLessons[currentLessonIndex + 1] : null

  const modulesWithProgress = useMemo(
    () =>
      orderedModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((moduleLesson) => ({
          ...moduleLesson,
          completed: completedLessonIds.has(moduleLesson.id),
        })),
      })),
    [completedLessonIds, orderedModules],
  )

  const lessonResources = useMemo(() => parseResources(lesson), [lesson])
  const quizQuestions = useMemo(() => parseQuizQuestions(lesson), [lesson])

  const handleNavigate = useCallback(
    (lessonId: string) => {
      if (lessonId === lesson.id) {
        return
      }
      router.push(`/learn/${courseId}/${lessonId}`)
    },
    [courseId, lesson.id, router],
  )

  const handleMarkComplete = useCallback(async () => {
    await markLessonComplete(lesson.id)
  }, [lesson.id, markLessonComplete])

  useEffect(() => {
    if (!hasReview && progress === 100) {
      setShowReviewPrompt(true)
    }
  }, [hasReview, progress])

  return (
    <div className="flex min-h-screen">
      <CourseSidebar
        courseId={courseId}
        modules={modulesWithProgress}
        progress={progress}
        currentLessonId={lesson.id}
        onNavigateLesson={handleNavigate}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
      />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Link>
            </Button>
            {courseTitle && (
              <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:text-foreground">
                {courseTitle}
              </Link>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(300px,1fr)]">
            <div className="space-y-6">
              <LessonContent
                lesson={lesson}
                isCompleted={isLessonCompleted(lesson.id)}
                isMarking={isUpdating}
                onMarkComplete={handleMarkComplete}
                previousLesson={previousLesson ? { id: previousLesson.id, title: previousLesson.title } : null}
                nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
                onNavigatePrevious={() => previousLesson && handleNavigate(previousLesson.id)}
                onNavigateNext={() => nextLesson && handleNavigate(nextLesson.id)}
              />

              {quizQuestions.length > 0 && <LessonQuiz questions={quizQuestions} />}

              <LessonDiscussion lessonId={lesson.id} userId={userId} userDisplayName={userDisplayName} />

              {showReviewPrompt && !hasReview && (
                <ReviewForm
                  courseId={courseId}
                  userId={userId}
                  onReviewSubmitted={() => {
                    setHasReview(true)
                    setShowReviewPrompt(false)
                  }}
                />
              )}
            </div>

            <aside className="space-y-6">
              <LessonNotesPanel lessonId={lesson.id} userId={userId} />
              <LessonResources resources={lessonResources} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}