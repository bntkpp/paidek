import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin-layout"
import { AdminIntakeFormsManager } from "@/components/admin-intake-forms-manager"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminIntakeFormsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Obtener todas las fichas
  const { data: formsRaw } = await supabase
    .from("student_intake_forms")
    .select("*")
    .order("created_at", { ascending: false })

  // Obtener todos los usuarios
  const { data: allUsers } = await supabase.from("profiles").select("id, full_name, email")

  // Obtener todos los cursos
  const { data: allCourses } = await supabase.from("courses").select("id, title")

  // Mapear fichas con datos de usuario y curso
  const forms =
    formsRaw?.map((form) => {
      const user = allUsers?.find((u) => u.id === form.user_id)
      const course = allCourses?.find((c) => c.id === form.course_id)

      return {
        ...form,
        user: {
          full_name: user?.full_name || "Usuario desconocido",
          email: user?.email || "email@desconocido.com",
        },
        course: {
          title: course?.title || "Curso desconocido",
        },
      }
    }) || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 rounded-xl border">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Fichas de Alumnos
          </h1>
          <p className="text-muted-foreground">
            Módulo 0 - Información de registro de estudiantes
          </p>
        </div>

        <AdminIntakeFormsManager initialForms={forms} />
      </div>
    </AdminLayout>
  )
}
