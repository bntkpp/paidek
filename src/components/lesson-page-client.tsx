"use client"

import { LessonContent } from "@/components/lesson-content"
import { ReviewForm } from "@/components/review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface LessonPageClientProps {
  courseId: string
  courseTitle: string
  lesson: any
  isLessonCompleted: boolean
  isCourseCompleted: boolean
  hasExistingReview: boolean
  userId: string
  previousLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string } | null
  intakeForm?: any
}

export function LessonPageClient({
  courseId,
  courseTitle,
  lesson,
  isLessonCompleted,
  isCourseCompleted,
  hasExistingReview,
  userId,
  previousLesson,
  nextLesson,
  intakeForm,
}: LessonPageClientProps) {
  const router = useRouter()
  const [isMarking, setIsMarking] = useState(false)

  const handleMarkComplete = async () => {
    setIsMarking(true)
    const supabase = createClient()

    try {
      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lesson_id", lesson.id)
        .maybeSingle()

      if (existingProgress) {
        // Update existing record
        await supabase
          .from("progress")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("lesson_id", lesson.id)
      } else {
        // Insert new record
        await supabase.from("progress").insert({
          user_id: userId,
          lesson_id: lesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        })
      }

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error marking lesson as complete:", error)
    } finally {
      setIsMarking(false)
    }
  }

  const handleNavigatePrevious = () => {
    if (previousLesson) {
      router.push(`/learn/${courseId}/${previousLesson.id}`)
    }
  }

  const handleNavigateNext = () => {
    if (nextLesson) {
      router.push(`/learn/${courseId}/${nextLesson.id}`)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header fijo con navegación */}
      <div className="border-b border-border bg-background flex-shrink-0">
        <div className="px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild size="sm" className="h-8 px-2 sm:px-3">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
              </Link>
            </Button>

            <div className="text-sm text-muted-foreground text-center flex-1 mx-4">
              <Link href={`/courses/${courseId}`} className="hover:text-foreground">
                {courseTitle}
              </Link>
            </div>

            <div className="w-[100px]"></div>
          </div>
        </div>
      </div>

      {/* Área de contenido - el video y descripción en columnas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <LessonContent
          lesson={lesson}
          isCompleted={isLessonCompleted}
          isMarking={isMarking}
          onMarkComplete={handleMarkComplete}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          onNavigatePrevious={handleNavigatePrevious}
          onNavigateNext={handleNavigateNext}
          isCourseCompleted={isCourseCompleted}
          hasExistingReview={hasExistingReview}
          courseId={courseId}
          userId={userId}
          onReviewSubmitted={() => router.refresh()}
          intakeForm={intakeForm}
        />
      </div>
    </div>
  )
}
