import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

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
          <p className="text-muted-foreground">Revisa todas las reseñas de los cursos</p>
        </div>

        <div className="space-y-4">
          {!reviews || reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">No hay reseñas disponibles</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{review.courses?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {review.profiles?.full_name || review.profiles?.email}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm leading-relaxed">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
