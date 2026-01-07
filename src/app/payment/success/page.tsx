"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { trackPurchase } from "../actions"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("course_id")
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    async function processPayment() {
      if (!courseId) {
        router.push("/courses")
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get course details
      const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single()

      if (!course) {
        router.push("/courses")
        return
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single()

      if (!existingEnrollment) {
        // Create enrollment
        await supabase.from("enrollments").insert({
          user_id: user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
        })

        // Create payment record
        await supabase.from("payments").insert({
          user_id: user.id,
          course_id: courseId,
          amount: course.price,
          currency: "ARS",
          status: "completed",
          payment_method: "mercadopago",
        })

        // Track Purchase Event server-side
        const price = course.price ?? course.one_time_price ?? 0
        await trackPurchase(user.id, course.id, course.title, Number(price))
      }

      setIsProcessing(false)
    }

    processPayment()
  }, [courseId, router])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Procesando tu pago...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu pago ha sido procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Tu inscripción ha sido activada. Ya puedes acceder al curso.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">Ir a Mis Cursos</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">Explorar Más Cursos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
