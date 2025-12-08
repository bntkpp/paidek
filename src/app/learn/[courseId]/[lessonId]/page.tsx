import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { LessonPageWrapper } from "@/components/lesson-page-wrapper"

export default async function LessonPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string; lessonId: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { courseId, lessonId } = await params
  const { preview } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin for preview mode
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdminPreview = preview === "true" && profile?.role === "admin"

  // Check if user is enrolled (skip for admin preview)
  if (!isAdminPreview) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single()

    if (!enrollment) {
      redirect("/courses")
    }

    // Check if enrollment has expired
    if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
      redirect("/dashboard?expired=true")
    }
  }

  // Use admin client to bypass RLS for enrolled users
  // This allows access to unpublished courses (like addons) if user has valid enrollment
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  // Get course details - use admin client for unpublished courses
  const { data: course } = await supabaseAdmin.from("courses").select("*").eq("id", courseId).single()

  // Get modules with lessons - use admin client
  const { data: modules } = await supabaseAdmin
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  // Get current lesson - use admin client
  const { data: lesson } = await supabaseAdmin.from("lessons").select("*").eq("id", lessonId).single()

  if (!lesson) {
    redirect(`/learn/${courseId}`)
  }

  // Get user progress for all lessons
  const { data: progressData } = await supabase.from("progress").select("*").eq("user_id", user.id)

  // Calculate progress - ordenar todas las lecciones por módulo y luego por order_index
  const allLessons = modules
    ?.flatMap((module) =>
      module.lessons
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((lesson: any) => ({ ...lesson, module_order: module.order_index }))
    )
    .sort((a: any, b: any) => {
      // Primero ordenar por módulo, luego por lección
      if (a.module_order !== b.module_order) {
        return (a.module_order || 0) - (b.module_order || 0)
      }
      return (a.order_index || 0) - (b.order_index || 0)
    }) || []

  const completedLessonIds = progressData?.filter((record) => record.completed).map((record) => record.lesson_id) || []
  const progressPercentage = allLessons.length > 0 ? Math.round((completedLessonIds.length / allLessons.length) * 100) : 0

  // Check if current lesson is completed
  const isLessonCompleted = progressData?.some((p) => p.lesson_id === lessonId && p.completed) || false

  // Check if course is completed
  const isCourseCompleted = allLessons.length > 0 && completedLessonIds.length === allLessons.length

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle()

  // Format modules with lessons
  const modulesWithLessons = modules?.map((module) => ({
    ...module,
    lessons: module.lessons
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((l: any) => ({
        ...l,
        completed: progressData?.some((p) => p.lesson_id === l.id && p.completed) || false,
      })),
  }))

  // Find previous and next lessons
  let previousLesson = null
  let nextLesson = null

  for (let i = 0; i < allLessons.length; i++) {
    if (allLessons[i].id === lessonId) {
      if (i > 0) {
        previousLesson = allLessons[i - 1]
      }
      if (i < allLessons.length - 1) {
        nextLesson = allLessons[i + 1]
      }
      break
    }
  }

  return (
    <LessonPageWrapper
      courseId={courseId}
      courseTitle={course?.title || ""}
      lesson={lesson}
      isLessonCompleted={isLessonCompleted}
      isCourseCompleted={isCourseCompleted}
      hasExistingReview={!!existingReview}
      userId={user.id}
      previousLesson={previousLesson}
      nextLesson={nextLesson}
      modules={modulesWithLessons || []}
      progressPercentage={progressPercentage}
    />
  )
}
