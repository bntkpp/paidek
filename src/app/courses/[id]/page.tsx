import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, BookOpen, Award, CheckCircle2, TrendingUp, Home, Brain, Target, Star, Download } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CourseReviews } from "@/components/course-reviews"
import { sendMetaEvent } from "@/lib/meta-conversions"

const levelLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

const levelColors: Record<string, string> = {
  beginner: "bg-accent/20 text-accent-foreground",
  intermediate: "bg-primary/20 text-primary-foreground",
  advanced: "bg-destructive/20 text-destructive-foreground",
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single()

  if (error || !course) {
    redirect("/courses")
  }

  // Check if user is logged in and enrolled
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isEnrolled = false
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .eq("is_active", true)
      .single()
    isEnrolled = !!enrollment
  }

  // Get modules for this course
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", id)
    .order("order_index", { ascending: true })

  // Get subscription plans for this course
  const { data: subscriptionPlans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("course_id", id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  // Detect payment type and product type
  const isOneTimePayment = course.payment_type === "one_time"
  const isEbook = course.type === "ebook"

  // Calculate savings for subscription plans
  const calculateSavings = (cheapestMonthlyRate: number, totalPrice: number, months: number) => {
    if (!cheapestMonthlyRate || !totalPrice) return { savings: 0, savingsPercent: 0, savingsAmount: 0 }
    const regularTotal = cheapestMonthlyRate * months
    const savings = regularTotal - totalPrice
    const savingsPercent = Math.round((savings / regularTotal) * 100)
    return { savings, savingsPercent, savingsAmount: savings }
  }

  // Get the cheapest monthly rate for calculating savings
  const cheapestMonthlyRate = subscriptionPlans && subscriptionPlans.length > 0
    ? Math.min(...subscriptionPlans.map(p => p.price / p.duration_months))
    : 0

  // Send ViewContent event to Meta CAPI
  await sendMetaEvent(
    "ViewContent",
    {
      external_id: user?.id,
    },
    {
      content_name: course.title,
      content_ids: [course.id],
      content_type: "product",
      value: isOneTimePayment ? (course.one_time_price || 0) : (subscriptionPlans?.[0]?.price || 0),
      currency: "CLP",
    }
  )

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  {isEbook && (
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      Ebook
                    </Badge>
                  )}
                  {course.level && (
                    <Badge variant="secondary" className={levelColors[course.level]}>
                      {levelLabels[course.level]}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{course.title}</h1>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {course.short_description || course.description}
                </p>

                {/* Video del curso */}
                {course.video_url && (
                  <div className="mb-6">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={course.video_url}
                        title={course.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 text-sm">
                  {course.duration_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>
                        <strong>{course.duration_hours}</strong> horas de contenido
                      </span>
                    </div>
                  )}
                  {!isEbook && modules && modules.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>
                        <strong>{modules.length}</strong> módulos
                      </span>
                    </div>
                  )}
                  {isEbook && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>
                        Formato <strong>PDF Descargable</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle className="text-center">{isOneTimePayment ? (isEbook ? "Precio del Ebook" : "Precio del Curso") : "Elige tu Plan"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-lg mb-6"
                      />
                    )}

                    {isOneTimePayment ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-primary mb-2">
                            ${course.one_time_price?.toLocaleString("es-CL")}
                          </p>
                          <p className="text-sm text-muted-foreground">Pago único - Acceso de por vida</p>
                        </div>
                        {isEnrolled ? (
                          isEbook ? (
                            <Button size="lg" className="w-full" asChild>
                              <a href={course.download_url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Descargar Ebook
                              </a>
                            </Button>
                          ) : (
                            <Button size="lg" className="w-full" asChild>
                              <Link href={`/learn/${id}`}>Ir al Curso</Link>
                            </Button>
                          )
                        ) : (
                          <Button size="lg" className="w-full" asChild>
                            <Link href={user ? `/checkout/${id}` : "/auth/sign-up"}>
                              {user ? (isEbook ? "Comprar Ebook" : "Comprar Curso") : "Registrarse"}
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : subscriptionPlans && subscriptionPlans.length > 0 ? (
                      <Tabs defaultValue={subscriptionPlans[0]?.id} className="w-full mb-6">
                        <TabsList className={`grid w-full ${subscriptionPlans.length === 1 ? 'grid-cols-1' : subscriptionPlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {subscriptionPlans.map((plan) => {
                            const monthlyRate = plan.price / plan.duration_months
                            const savings = plan.duration_months > 1 
                              ? calculateSavings(cheapestMonthlyRate, plan.price, plan.duration_months)
                              : { savings: 0, savingsPercent: 0, savingsAmount: 0 }

                            return (
                              <TabsTrigger key={plan.id} value={plan.id} className="text-xs">
                                <div className="flex flex-col items-center">
                                  <span>{plan.duration_months} {plan.duration_months === 1 ? 'Mes' : 'Meses'}</span>
                                  {savings.savingsPercent > 0 && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      -{savings.savingsPercent}%
                                    </Badge>
                                  )}
                                </div>
                              </TabsTrigger>
                            )
                          })}
                        </TabsList>

                        {subscriptionPlans.map((plan) => {
                          const monthlyRate = plan.price / plan.duration_months
                          const savings = plan.duration_months > 1 
                            ? calculateSavings(cheapestMonthlyRate, plan.price, plan.duration_months)
                            : { savings: 0, savingsPercent: 0, savingsAmount: 0 }

                          return (
                            <TabsContent key={plan.id} value={plan.id} className="space-y-4 mt-6">
                              <div className="text-center">
                                <p className="text-4xl font-bold text-primary mb-1">
                                  ${plan.price.toLocaleString("es-CL")}
                                </p>
                                {plan.duration_months > 1 && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    ${Math.round(monthlyRate).toLocaleString("es-CL")}/mes
                                  </p>
                                )}
                                {savings.savingsPercent > 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Ahorras ${savings.savingsAmount.toLocaleString("es-CL")} ({savings.savingsPercent}%)
                                  </Badge>
                                )}
                              </div>
                              {isEnrolled ? (
                                <Button size="lg" className="w-full" asChild>
                                  <Link href={`/learn/${id}`}>Ir al Curso</Link>
                                </Button>
                              ) : (
                                <Button size="lg" className="w-full" asChild>
                                  <Link href={user ? `/checkout/${id}?plan=${plan.id}` : "/auth/sign-up"}>
                                    {user ? `Comprar ${plan.name || `Plan ${plan.duration_months} ${plan.duration_months === 1 ? 'Mes' : 'Meses'}`}` : "Registrarse"}
                                  </Link>
                                </Button>
                              )}
                              {plan.is_popular && (
                                <p className="text-xs text-center text-muted-foreground">
                                  Plan Popular - Mejor relación precio/duración
                                </p>
                              )}
                              {plan.description && (
                                <p className="text-xs text-center text-muted-foreground">
                                  {plan.description}
                                </p>
                              )}
                            </TabsContent>
                          )
                        })}
                      </Tabs>
                    ) : (
                      <div className="space-y-4 text-center py-4">
                        <p className="text-muted-foreground">No hay planes disponibles</p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm border-t pt-4">
                      {isEbook ? (
                        <>
                          <p className="font-semibold mb-3">Este ebook incluye:</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Descarga inmediata en PDF</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Acceso de por vida</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold mb-3">Este plan incluye:</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Acceso completo al curso</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Material descargable</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Soporte de profesores</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                            <span>Actualizaciones incluidas</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ¿Por qué elegir este curso? */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">¿Por qué elegir este curso?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Estudia desde casa, sin horarios y a tu ritmo</h3>
                      <p className="text-sm text-muted-foreground">
                        Accede al contenido cuando quieras, desde cualquier dispositivo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Aprenderás de manera fácil, ordenada y súper intuitiva</h3>
                      <p className="text-sm text-muted-foreground">
                        Contenido estructurado paso a paso para facilitar tu aprendizaje.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Obtendrás las herramientas necesarias para rendir tus exámenes libres</h3>
                      <p className="text-sm text-muted-foreground">
                        Todo el material y práctica que necesitas para aprobar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Accederás a contenido exclusivo y experiencias únicas</h3>
                      <p className="text-sm text-muted-foreground">
                        Recursos premium diseñados específicamente para tu éxito.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Descripción del curso */}
        {course.description && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6">Descripción del Curso</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Lo que incluye el programa */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Te brindamos las herramientas para que puedas preparar tus exámenes libres</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-lg font-semibold mb-6">Este programa incluye:</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Material de preparación para exámenes libres</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Contenido educativo (videos, textos, guías y mucho más)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Acceso a grabaciones de clases</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Preguntas al profesor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      5
                    </div>
                    <div>
                      <p className="font-medium">Bono 1: Taller de técnicas de estudios</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      6
                    </div>
                    <div>
                      <p className="font-medium">Bono 2: Taller orientación vocacional</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      7
                    </div>
                    <div>
                      <p className="font-medium">Bono 3: Homeschool Planner</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contenido del curso (módulos) */}
        {modules && modules.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6">Contenido del Curso</h2>
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <Card key={module.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                          {module.description && (
                            <p className="text-muted-foreground leading-relaxed">{module.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reseñas del curso */}
        <section className="py-12 relative overflow-hidden">
          {/* Fondo sutil para separar */}
          <div className="absolute inset-0 bg-muted/10" />
          <div className="container mx-auto px-4 relative">
             <CourseReviews 
               courseId={id} 
               userId={user?.id}
               isEnrolled={isEnrolled}
             />
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
