"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseProgressTrackerOptions {
  userId: string
  courseId: string
  lessons: { id: string }[]
  initialCompletedLessonIds: string[]
  initialProgressPercentage?: number
}

export function useProgressTracker({
  userId,
  courseId,
  lessons,
  initialCompletedLessonIds,
  initialProgressPercentage,
}: UseProgressTrackerOptions) {
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set(initialCompletedLessonIds))
  const [isUpdating, setIsUpdating] = useState(false)

  const totalLessons = lessons.length

  const progress = useMemo(() => {
    if (totalLessons === 0) {
      return 0
    }
    return Math.round((completedLessonIds.size / totalLessons) * 100)
  }, [completedLessonIds, totalLessons])

  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      if (completedLessonIds.has(lessonId)) {
        return
      }

      setIsUpdating(true)
      const supabase = createClient()
      const { error } = await supabase.from("progress").upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      )

      if (!error) {
        const newSize = completedLessonIds.size + 1
        const newProgress = Math.round((newSize / totalLessons) * 100)

        setCompletedLessonIds((current) => new Set(current).add(lessonId))

        await supabase
          .from("enrollments")
          .update({
            progress_percentage: newProgress,
            last_accessed_at: new Date().toISOString(),
          })
          .match({ user_id: userId, course_id: courseId })
      }

      setIsUpdating(false)
    },
    [completedLessonIds, userId, courseId, totalLessons],
  )

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`progress-tracking-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress", filter: `user_id=eq.${userId}` },
        (payload) => {
          const newProgress = payload.new as { lesson_id?: string; completed?: boolean } | null
          const oldProgress = payload.old as { lesson_id?: string; completed?: boolean } | null

          setCompletedLessonIds((current) => {
            const next = new Set(current)

            if (newProgress?.lesson_id) {
              if (newProgress.completed) {
                next.add(newProgress.lesson_id)
              } else {
                next.delete(newProgress.lesson_id)
              }
            } else if (oldProgress?.lesson_id) {
              next.delete(oldProgress.lesson_id)
            }

            return next
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const isLessonCompleted = useCallback(
    (lessonId: string) => completedLessonIds.has(lessonId),
    [completedLessonIds],
  )

  useEffect(() => {
    if (
      initialProgressPercentage !== undefined &&
      progress !== initialProgressPercentage &&
      totalLessons > 0
    ) {
      const supabase = createClient()
      supabase
        .from("enrollments")
        .update({
          progress_percentage: progress,
        })
        .match({ user_id: userId, course_id: courseId })
        .then(({ error }) => {
          if (error) {
            console.error("Error syncing progress:", error)
          }
        })
    }
  }, []) // Run only once on mount to sync if needed

  return {
    completedLessonIds,
    progress,
    markLessonComplete,
    isUpdating,
    isLessonCompleted,
  }
}