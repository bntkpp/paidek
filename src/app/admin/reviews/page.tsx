import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin-layout"
import { AdminReviewsManager } from "@/components/admin-reviews-manager"

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:reviews_user_id_fkey (full_name, email),
      courses:reviews_course_id_fkey (title)
    `)
    .order("created_at", { ascending: false })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent p-6 rounded-xl border">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
            Gestión de Reseñas
          </h1>
          <p className="text-muted-foreground">Revisa, edita o elimina las calificaciones y reseñas de los estudiantes.</p>
        </div>

        <AdminReviewsManager initialReviews={reviews as any || []} />
      </div>
    </AdminLayout>
  )
}
