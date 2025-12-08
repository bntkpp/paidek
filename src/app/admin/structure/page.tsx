import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin-layout"
import { AdminCourseStructure } from "@/components/admin-course-structure"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminStructurePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Obtener todos los cursos con sus módulos y lecciones
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      modules (
        id,
        title,
        description,
        order_index,
        course_id,
        lessons (
          id,
          title,
          lesson_type,
          order_index,
          duration_minutes,
          content,
          content_title,
          video_url
        )
      )
    `)
    .order("title", { ascending: true })

  // Si hay error, mostrar mensaje
  if (error) {
    console.error("Error fetching courses:", error)
  }

  // Ordenar módulos por order_index
  const coursesWithSortedModules = (courses || [])
    .map(course => ({
      ...course,
      modules: (course.modules || []).sort((a, b) => a.order_index - b.order_index)
    }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 rounded-xl border">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Estructura de Cursos
          </h1>
          <p className="text-muted-foreground">Vista jerárquica completa: Cursos → Módulos → Lecciones</p>
        </div>

        <AdminCourseStructure courses={coursesWithSortedModules} />
      </div>
    </AdminLayout>
  )
}
