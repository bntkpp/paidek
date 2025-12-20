import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/emails/send"
import { getSubscriptionExpiringTemplate } from "@/lib/emails/templates"

// Inicializar cliente admin para acceder a todos los datos y actualizar registros
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // Verificar autorización simple (Bearer token o query param)
    // En producción, Vercel Cron envía un header de autorización
    const authHeader = request.headers.get("authorization")
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    
    const CRON_SECRET = process.env.CRON_SECRET || "dev-cron-secret"

    if (authHeader !== `Bearer ${CRON_SECRET}` && key !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calcular rango de fechas (ej: expira en los próximos 3 días)
    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(now.getDate() + 3)

    // Buscar inscripciones que:
    // 1. Estén activas
    // 2. Expiren pronto (entre ahora y 3 días)
    // 3. No hayan recibido recordatorio aún
    const { data: enrollments, error } = await supabaseAdmin
      .from("enrollments")
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        courses (
          title
        )
      `)
      .eq("is_active", true)
      .gt("expires_at", now.toISOString()) // Que no haya expirado todavía
      .lt("expires_at", threeDaysFromNow.toISOString()) // Que expire en menos de 3 días
      .is("reminder_sent_at", null) // Que no se haya enviado ya

    if (error) {
      console.error("Error fetching expiring enrollments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No expiring subscriptions found" })
    }

    console.log(`Found ${enrollments.length} expiring subscriptions`)

    const results = []

    for (const enrollment of enrollments) {
      const profile = enrollment.profiles as any
      const course = enrollment.courses as any
      
      if (!profile?.email) continue

      const expiresAt = new Date(enrollment.expires_at)
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // 1. Enviar correo
      const emailHtml = getSubscriptionExpiringTemplate({
        userName: profile.full_name || "Estudiante",
        courseTitle: course?.title || "Curso",
        courseId: enrollment.course_id,
        daysLeft: Math.max(0, daysLeft),
        expiresAt: enrollment.expires_at
      })

      const { success, error: emailError } = await sendEmail({
        to: profile.email,
        subject: `⚠️ Tu suscripción a ${course?.title || "tu curso"} vence pronto`,
        html: emailHtml
      })

      if (success) {
        // 2. Marcar como enviado
        const { error: updateError } = await supabaseAdmin
          .from("enrollments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", enrollment.id)

        if (updateError) {
          console.error(`Failed to update enrollment ${enrollment.id}:`, updateError)
          results.push({ id: enrollment.id, status: "email_sent_but_update_failed", error: updateError })
        } else {
          results.push({ id: enrollment.id, status: "success" })
        }
      } else {
        console.error(`Failed to send email to ${profile.email}:`, emailError)
        results.push({ id: enrollment.id, status: "email_failed", error: emailError })
      }
    }

    return NextResponse.json({ 
      message: "Process completed", 
      processed: results.length, 
      details: results 
    })

  } catch (error: any) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
