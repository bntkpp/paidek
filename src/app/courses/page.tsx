import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CoursesCatalog } from "@/components/courses-catalog"
import { createAdminClient } from "@/lib/supabase/admin"
import { Sparkles, GraduationCap } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Catálogo de Cursos | Paidek",
  description: "Explora nuestros cursos y recursos educativos para preparar tus exámenes libres.",
}

interface SubscriptionPlan {
  id: string
  duration_months: number
  price: number
  name: string | null
  is_popular: boolean
  course_id: string
}

export default async function CoursesPage() {
  const supabase = createAdminClient()

  // 1. Fetch Courses
  const { data: coursesData, error } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
  }

  const courses = coursesData || []

  // 2. Fetch Plans
  let plansByCourse: Record<string, SubscriptionPlan[]> = {}

  if (courses.length > 0) {
    const courseIds = courses.map(c => c.id)
    const { data: plansData } = await supabase
      .from("subscription_plans")
      .select("*")
      .in("course_id", courseIds)
      .eq("is_active", true)
      .order("price", { ascending: true })

    if (plansData) {
      plansData.forEach((plan) => {
        if (!plansByCourse[plan.course_id]) {
          plansByCourse[plan.course_id] = []
        }
        plansByCourse[plan.course_id].push(plan)
      })
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <section className="pt-16 pb-6 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Aprende a tu ritmo</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Catálogo de Cursos
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                Explora nuestra colección completa de cursos para exámenes libres. Elige el plan que mejor se adapte a tus necesidades.
              </p>
              
              {/* Stats - Rendered Server Side */}
              <div className="flex justify-center gap-8 mt-8">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{courses.length}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Cursos disponibles</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-2 pb-12 relative">
          <div className="container mx-auto px-4">
            <CoursesCatalog courses={courses} plans={plansByCourse} />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
