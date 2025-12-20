"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function completeLesson(courseId: string, lessonId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 1. Mark lesson as complete
  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  )

  if (progressError) {
    throw new Error("Failed to update progress")
  }

  // 2. Calculate new progress
  // Use admin client to ensure we see all lessons (even if unpublished/restricted)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )

  // Get all lessons for the course
  const { data: modules } = await supabaseAdmin
    .from("modules")
    .select("lessons(id)")
    .eq("course_id", courseId)

  const allLessonIds = modules?.flatMap((m) => m.lessons.map((l: any) => l.id)) || []
  const totalLessons = allLessonIds.length

  if (totalLessons === 0) return

  // Get completed lessons
  const { count } = await supabase
    .from("progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true)
    .in("lesson_id", allLessonIds)

  const completedCount = count || 0
  const progressPercentage = Math.round((completedCount / totalLessons) * 100)

  // 3. Update enrollment
  await supabaseAdmin
    .from("enrollments")
    .update({
      progress_percentage: progressPercentage,
      last_accessed_at: new Date().toISOString(),
    })
    .match({ user_id: user.id, course_id: courseId })

  revalidatePath(`/learn/${courseId}`)
  revalidatePath(`/dashboard`)
}

export async function syncProgress(courseId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )

  // Get all lessons for the course
  const { data: modules } = await supabaseAdmin
    .from("modules")
    .select("lessons(id)")
    .eq("course_id", courseId)

  const allLessonIds = modules?.flatMap((m) => m.lessons.map((l: any) => l.id)) || []
  const totalLessons = allLessonIds.length

  if (totalLessons === 0) return

  // Get completed lessons
  const { count } = await supabase
    .from("progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true)
    .in("lesson_id", allLessonIds)

  const completedCount = count || 0
  const progressPercentage = Math.round((completedCount / totalLessons) * 100)

  // Update enrollment
  await supabaseAdmin
    .from("enrollments")
    .update({
      progress_percentage: progressPercentage,
    })
    .match({ user_id: user.id, course_id: courseId })

  revalidatePath(`/learn/${courseId}`)
  revalidatePath(`/dashboard`)
}
