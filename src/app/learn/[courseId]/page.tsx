import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export default async function LearnCoursePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { courseId } = await params
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

    // Check if user has completed Module 0 (intake form)
    const { data: intakeForm } = await supabase
      .from("student_intake_forms")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()

    // If intake form not completed, redirect to module 0
    // if (!intakeForm) {
    //   redirect(`/learn/${courseId}/modulo-0`)
    // }
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

  // Get first lesson using admin client
  const { data: modules, error: modulesError } = await supabaseAdmin
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  if (modules && modules.length > 0 && modules[0].lessons && modules[0].lessons.length > 0) {
    const firstLesson = modules[0].lessons.sort((a, b) => a.order_index - b.order_index)[0]
    const previewParam = isAdminPreview ? "?preview=true" : ""
    redirect(`/learn/${courseId}/${firstLesson.id}${previewParam}`)
  }

  redirect("/dashboard")
}
