"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, TrendingUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface CourseCardProps {
  id: string
  title: string
  description: string
  image_url: string | null
  payment_type: string | null
  one_time_price: number | null
  duration_hours: number | null
  level: string | null
  type?: string
  initialPlans?: SubscriptionPlan[]
}

interface SubscriptionPlan {
  id: string
  duration_months: number
  price: number
  name: string | null
  is_popular: boolean
}

const levelLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export function CourseCard({
  id,
  title,
  description,
  image_url,
  payment_type,
  one_time_price,
  duration_hours,
  level,
  type = "course",
  initialPlans = [],
}: CourseCardProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans)
  const [isLoadingPlans, setIsLoadingPlans] = useState(initialPlans.length === 0 && payment_type === "subscription")
  
  // Detectar si es pago único
  const isOneTimePayment = payment_type === "one_time"
  const isEbook = type === "ebook"

  useEffect(() => {
    if (payment_type === "subscription" && plans.length === 0) {
      loadPlans()
    } else {
      setIsLoadingPlans(false)
    }
  }, [id, payment_type, plans.length])

  const loadPlans = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("course_id", id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!error && data) {
        setPlans(data)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const calculateSavings = (cheapestMonthlyRate: number, totalPrice: number, months: number) => {
    const regularTotal = cheapestMonthlyRate * months
    const savings = regularTotal - totalPrice
    const savingsPercent = Math.round((savings / regularTotal) * 100)
    return { savings, savingsPercent }
  }

  // Calcular la tarifa mensual más baja
  const cheapestMonthlyRate = plans.length > 0 
    ? Math.min(...plans.map(p => p.price / p.duration_months))
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
        <motion.div 
          className="relative h-48 w-full overflow-hidden bg-muted"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {level && (
            <Badge className="absolute top-2 right-2 capitalize">
              {levelLabels[level] || level}
            </Badge>
          )}
          {isEbook && (
            <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700">
              Ebook
            </Badge>
          )}
        </motion.div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {isEbook ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <BookOpen className="h-4 w-4" />
            <span>Formato PDF Descargable</span>
          </div>
        ) : duration_hours && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span>{duration_hours} horas de contenido</span>
          </div>
        )}

        <div className="mt-auto">
          {isOneTimePayment ? (
            // Mostrar precio único
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">
                  ${one_time_price?.toLocaleString("es-CL")}
                </span>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Pago único
              </p>
            </div>
          ) : isLoadingPlans ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Cargando planes...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Consultar precio
            </div>
          ) : (
            // Mostrar tabs con planes dinámicos
            <Tabs defaultValue={plans[0]?.id || "plan-1"} className="w-full">
              <TabsList className={`grid w-full ${plans.length === 1 ? 'grid-cols-1' : plans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {plans.map((plan) => (
                  <TabsTrigger key={plan.id} value={plan.id} className="text-xs">
                    {plan.duration_months} {plan.duration_months === 1 ? 'Mes' : 'Meses'}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {plans.map((plan) => {
                const monthlyRate = plan.price / plan.duration_months
                const savings = plan.duration_months > 1 
                  ? calculateSavings(cheapestMonthlyRate, plan.price, plan.duration_months)
                  : { savings: 0, savingsPercent: 0 }

                return (
                  <TabsContent key={plan.id} value={plan.id} className="space-y-2 mt-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          ${plan.price.toLocaleString("es-CL")}
                        </span>
                      </div>
                      {plan.duration_months > 1 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            ${Math.round(monthlyRate).toLocaleString("es-CL")}/mes
                          </span>
                          {savings.savingsPercent > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              -{savings.savingsPercent}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {plan.name || (plan.duration_months === 1 
                        ? "Renovación mensual" 
                        : `Pago único por ${plan.duration_months} meses`)}
                    </p>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/courses/${id}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
    </motion.div>
  )
}
