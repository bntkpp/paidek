import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Clock, TrendingUp, Download, Calendar, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ExpiredSubscriptionAlert } from "@/components/expired-subscription-alert"
import { Suspense } from "react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get enrolled courses - Incluye cursos publicados y no publicados
  // Si tienes enrollment, puedes acceder sin importar el estado de publicación
  const { data: allEnrollments } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false })

  // Filtrar en el servidor las que están activas Y no expiradas
  const activeEnrollments = allEnrollments?.filter((enrollment) => {
    if (!enrollment.is_active) return false

    // Si tiene fecha de expiración, verificar que no haya expirado
    if (enrollment.expires_at) {
      return new Date(enrollment.expires_at) > new Date()
    }

    return true
  }) || []

  // Separar cursos y ebooks
  const courseEnrollments = activeEnrollments.filter(e => e.courses?.type !== 'ebook')
  const ebookEnrollments = activeEnrollments.filter(e => e.courses?.type === 'ebook')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Suspense fallback={null}>
          <ExpiredSubscriptionAlert />
        </Suspense>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Bienvenido, {profile?.full_name || user.email}</h1>
          <p className="text-sm md:text-base text-muted-foreground">Aquí puedes ver tu progreso y gestionar tus cursos</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseEnrollments.length}</div>
              <p className="text-xs text-muted-foreground">Cursos en los que estás inscrito</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courseEnrollments.length
                  ? Math.round(
                    courseEnrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) /
                    courseEnrollments.length
                  )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">En todos tus cursos</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Sección de Cursos */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Mis Cursos</h2>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/courses">Explorar Cursos</Link>
              </Button>
            </div>

            {courseEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden flex flex-col h-full">
                  <div className="h-56 relative bg-muted flex-shrink-0 overflow-hidden">
                    {enrollment.courses?.image_url ? (
                      <img
                        src={enrollment.courses.image_url}
                        alt={enrollment.courses.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="line-clamp-2 min-h-[3.5rem]">{enrollment.courses?.title}</CardTitle>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {enrollment.courses?.duration_hours
                            ? `${enrollment.courses.duration_hours} horas`
                            : "Duración no especificada"}
                        </span>
                      </div>
                      {enrollment.expires_at && (
                        <div className={`flex items-center gap-2 text-sm ${
                          Math.ceil((new Date(enrollment.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 5 
                            ? "text-amber-600 font-medium" 
                            : "text-muted-foreground"
                        }`}>
                          {Math.ceil((new Date(enrollment.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 5 
                            ? <AlertTriangle className="h-4 w-4" /> 
                            : <Calendar className="h-4 w-4" />
                          }
                          <span>
                            {Math.ceil((new Date(enrollment.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">
                          {enrollment.progress_percentage || 0}%
                        </span>
                      </div>
                      <Progress value={enrollment.progress_percentage || 0} />
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/learn/${enrollment.course_id}`}>
                        {enrollment.progress_percentage > 0 ? "Continuar" : "Comenzar"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes cursos activos</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Explora nuestro catálogo y comienza a aprender hoy
                </p>
                <Button asChild>
                  <Link href="/courses">Ver Cursos Disponibles</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          </div>

          {/* Sección de Ebooks */}
          {ebookEnrollments.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-xl md:text-2xl font-bold">Mis Ebooks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ebookEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden flex flex-col h-full border-purple-200 dark:border-purple-900">
                    <div className="h-56 relative bg-muted flex-shrink-0 overflow-hidden">
                      {enrollment.courses?.image_url ? (
                        <img
                          src={enrollment.courses.image_url}
                          alt={enrollment.courses.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-purple-50 dark:bg-purple-950/20">
                          <BookOpen className="h-12 w-12 text-purple-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          Ebook
                        </span>
                      </div>
                    </div>
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="line-clamp-2 min-h-[3.5rem]">{enrollment.courses?.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Acceso de por vida</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                      <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                        <a 
                          href={enrollment.courses?.download_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
