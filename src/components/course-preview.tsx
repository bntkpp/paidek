"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, TrendingUp, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
}

interface SubscriptionPlan {
  id: string
  duration_months: number
  price: number
  name: string | null
  is_popular: boolean
}

export function CoursePreview() {
  const [courses, setCourses] = useState<Course[]>([])
  const [coursePlans, setCoursePlans] = useState<Record<string, SubscriptionPlan[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient()
      
      // Obtener cursos publicados
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3)

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData)
        
        // Obtener planes de suscripción para cada curso
        const courseIds = coursesData.map(c => c.id)
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .in("course_id", courseIds)
          .eq("is_active", true)
          .order("price", { ascending: true })
        
        // Agrupar planes por curso
        const plansByCourse: Record<string, SubscriptionPlan[]> = {}
        plansData?.forEach((plan) => {
          if (!plansByCourse[plan.course_id]) {
            plansByCourse[plan.course_id] = []
          }
          plansByCourse[plan.course_id].push(plan)
        })
        
        setCoursePlans(plansByCourse)
      } else {
        setCourses([])
      }

      setIsLoading(false)
    }

    fetchCourses()
  }, [])

  if (isLoading) {
    return (
      <section id="courses" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Cargando cursos...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <section id="courses" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Cursos Destacados</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Próximamente tendremos cursos disponibles
            </p>
          </div>
        </div>
      </section>
    )
  }

  const calculateSavings = (monthlyPrice: number | null, totalPrice: number | null, months: number) => {
    if (!monthlyPrice || !totalPrice) return 0
    const regularTotal = monthlyPrice * months
    const savings = regularTotal - totalPrice
    const savingsPercent = Math.round((savings / regularTotal) * 100)
    return savingsPercent
  }

  return (
    <section id="courses" className="py-20 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Nuestros Cursos</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Cursos Destacados</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Explora nuestra selección de cursos diseñados para tu éxito
          </p>
        </motion.div >

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const isOneTimePayment = course.payment_type === "one_time"
            const plans = coursePlans[course.id] || []
            const cheapestPlan = plans[0] // Ya están ordenados por precio
            const mostExpensivePlan = plans[plans.length - 1]
            
            // Calcular ahorro si hay múltiples planes
            let bestSavings = 0
            if (plans.length > 1 && cheapestPlan && mostExpensivePlan) {
              const pricePerMonth = cheapestPlan.price / cheapestPlan.duration_months
              const regularTotal = pricePerMonth * mostExpensivePlan.duration_months
              const savings = regularTotal - mostExpensivePlan.price
              bestSavings = Math.round((savings / regularTotal) * 100)
            }

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="overflow-hidden flex flex-col h-full border-2 hover:border-primary/20 transition-colors duration-200 group">
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {course.image_url ? (
                      <Image
                        src={course.image_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {bestSavings > 0 && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-green-600 to-green-500 border-0">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Ahorra hasta {bestSavings}%
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <CardContent className="pt-6 flex-1">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                      {course.short_description || course.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {course.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{course.duration_hours} horas</span>
                        </div>
                      )}
                      {course.level && (
                        <Badge variant="secondary" className="capitalize">
                          {course.level === "beginner" && "Principiante"}
                          {course.level === "intermediate" && "Intermedio"}
                          {course.level === "advanced" && "Avanzado"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-0 bg-muted/30 group-hover:bg-muted/50 transition-colors duration-200">
                    <div className="w-full">
                      {isOneTimePayment ? (
                        <div className="mb-2">
                          <p className="text-2xl font-bold text-primary text-center">
                            ${course.one_time_price?.toLocaleString("es-CL")}
                          </p>
                          <p className="text-sm text-muted-foreground text-center mt-1">Pago único</p>
                        </div>
                      ) : cheapestPlan ? (
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Desde</span>
                            <p className="text-2xl font-bold text-primary">
                              ${cheapestPlan.price.toLocaleString("es-CL")}
                              <span className="text-sm font-normal text-muted-foreground">/mes</span>
                            </p>
                            <p className="text-xs text-muted-foreground">Renovación mensual</p>
                          </div>
                          {mostExpensivePlan && mostExpensivePlan.id !== cheapestPlan.id && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {mostExpensivePlan.name || `Plan ${mostExpensivePlan.duration_months} meses`}
                              </p>
                              <p className="text-lg font-semibold">
                                ${mostExpensivePlan.price.toLocaleString("es-CL")}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-2 text-center">
                          <p className="text-sm text-muted-foreground">Consultar precio</p>
                        </div>
                      )}
                    </div>

                    <Button asChild className="w-full transition-transform duration-200 active:scale-95">
                      <Link href={`/courses/${course.id}`} className="flex items-center justify-center gap-2">
                        Ver Detalles
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Button variant="outline" size="lg" asChild className="group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
            <Link href="/courses" className="flex items-center gap-2">
              Ver Todos los Cursos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </motion.div>
      </div >
    </section >
  )
}
