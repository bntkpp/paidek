"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CourseCard } from "@/components/course-card"
import { CourseFilters } from "@/components/course-filters"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { GraduationCap, Sparkles } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  short_description: string | null
  image_url: string | null
  payment_type: string | null
  one_time_price: number | null
  duration_hours: number | null
  level: string | null
  published: boolean
  type?: string
}

interface SubscriptionPlan {
  id: string
  duration_months: number
  price: number
  name: string | null
  is_popular: boolean
  course_id: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [coursePlans, setCoursePlans] = useState<Record<string, SubscriptionPlan[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient()
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching courses:", error)
      } else {
        setCourses(coursesData || [])
        setFilteredCourses(coursesData || [])

        // Fetch plans for all courses
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(c => c.id)
          const { data: plansData } = await supabase
            .from("subscription_plans")
            .select("*")
            .in("course_id", courseIds)
            .eq("is_active", true)
            .order("price", { ascending: true })

          const plansByCourse: Record<string, SubscriptionPlan[]> = {}
          plansData?.forEach((plan) => {
            if (!plansByCourse[plan.course_id]) {
              plansByCourse[plan.course_id] = []
            }
            plansByCourse[plan.course_id].push(plan)
          })
          setCoursePlans(plansByCourse)
        }
      }
      setIsLoading(false)
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    // Filter by level
    if (levelFilter !== "all") {
      filtered = filtered.filter((course) => course.level === levelFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredCourses(filtered)
  }, [levelFilter, searchQuery, courses])

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <section className="py-16 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
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
              
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex justify-center gap-8 mt-8"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{courses.length}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Cursos disponibles</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 relative">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <CourseFilters onLevelChange={setLevelFilter} onSearchChange={setSearchQuery} />
            </motion.div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-muted-foreground mt-4">Cargando cursos...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-muted/30 rounded-lg border border-dashed"
              >
                <p className="text-muted-foreground text-lg">No se encontraron cursos con los filtros seleccionados.</p>
                <p className="text-sm text-muted-foreground mt-2">Intenta ajustar tus filtros de búsqueda</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    className="h-full"
                  >
                    <CourseCard
                      id={course.id}
                      title={course.title}
                      description={course.short_description || course.description}
                      image_url={course.image_url}
                      payment_type={course.payment_type}
                      one_time_price={course.one_time_price}
                      duration_hours={course.duration_hours}
                      level={course.level}
                      type={course.type}
                      initialPlans={coursePlans[course.id] || []}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
