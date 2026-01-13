import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, status, created_at, course_id, courses(title)")
    .eq("status", "approved")

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, enrolled_at, courses(title)")
    .order("enrolled_at", { ascending: false })

  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: reviewsCount } = await supabase.from("reviews").select("*", { count: "exact", head: true })

  const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

  const activeThreshold = new Date()
  activeThreshold.setDate(activeThreshold.getDate() - 30)

  const activeUsers = enrollments
    ? new Set(
        enrollments
          .filter((enrollment) => enrollment.enrolled_at && new Date(enrollment.enrolled_at) >= activeThreshold)
          .map((enrollment) => enrollment.user_id),
      ).size
    : 0

  const uniqueEnrollmentUsers = enrollments ? new Set(enrollments.map((enrollment) => enrollment.user_id)).size : 0

  const conversionRate = usersCount ? Math.round(((payments?.length || 0) / usersCount) * 1000) / 10 : 0

  const topCourseMap = new Map<string, { title: string; count: number }>()
  enrollments?.forEach((enrollment) => {
    if (!enrollment.course_id) return
    const current =
      topCourseMap.get(enrollment.course_id) || {
        title: enrollment.courses?.title || "Curso",
        count: 0,
      }
    topCourseMap.set(enrollment.course_id, { title: current.title, count: current.count + 1 })
  })

  const topCourses = Array.from(topCourseMap.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ course: item.title, enrollments: item.count }))

  const revenueByMonth = new Map<string, number>()
  const dateFormatter = new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" })
  const current = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    revenueByMonth.set(key, 0)
  }

  payments?.forEach((payment) => {
    if (!payment.created_at) return
    const created = new Date(payment.created_at)
    const key = `${created.getFullYear()}-${created.getMonth()}`
    if (!revenueByMonth.has(key)) {
      revenueByMonth.set(key, 0)
    }
    revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(payment.amount))
  })

  const revenueSeries = Array.from(revenueByMonth.entries()).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number)
    const label = dateFormatter.format(new Date(year, month))
    return { period: label, revenue: Math.round(value * 100) / 100 }
  })

  const funnelSeries = [
    { stage: "Usuarios Registrados", value: usersCount || 0 },
    { stage: "Usuarios con Curso", value: uniqueEnrollmentUsers },
    { stage: "Pagos Completados", value: payments?.length || 0 },
    { stage: "Reseñas Emitidas", value: reviewsCount || 0 },
  ].map((item) => ({ ...item, value: Number(item.value || 0) }))

  return NextResponse.json({
    totalRevenue,
    activeUsers,
    conversionRate,
    topCourses,
    revenueSeries,
    funnelSeries,
  })
}