"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, CreditCard, TrendingUp, FileQuestion, Package } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SubscriptionPlan {
  id: string
  course_id: string
  duration_months: number
  price: number
  name: string | null
  description: string | null
  is_popular: boolean
  display_order: number
  is_active: boolean
}

interface CourseAddon {
  id: string
  addon_course_id: string
  price: number | null
  addon_course: {
    id: string
    title: string
    short_description: string | null
    one_time_price: number | null
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [availableAddons, setAvailableAddons] = useState<CourseAddon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [addonPlans, setAddonPlans] = useState<Record<string, SubscriptionPlan[]>>({})
  const [selectedAddonPlans, setSelectedAddonPlans] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState("")
  const [guestFirstName, setGuestFirstName] = useState("")
  const [guestLastName, setGuestLastName] = useState("")

  useEffect(() => {
    // Get plan from URL
    const planParam = searchParams.get("plan")
    if (planParam) {
      setSelectedPlanId(planParam)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Validar que courseId exista
      if (!params?.courseId) {
        console.error("No courseId provided")
        router.push("/courses")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .eq("published", true)
        .single()

      if (courseError || !courseData) {
        console.error("Course not found:", courseError)
        router.push("/courses")
        return
      }

      // Check if already enrolled and active
      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("*, expires_at")
          .eq("user_id", user.id)
          .eq("course_id", params.courseId)
          .single()

        // Verificar si la inscripción está activa y no ha expirado
        if (enrollment) {
          const isExpired = enrollment.expires_at && new Date(enrollment.expires_at) < new Date()
          if (enrollment.is_active && !isExpired) {
            router.push("/dashboard")
            return
          }
        }
      }

      // Cargar planes de suscripción o configurar pago único
      let loadedPlans: SubscriptionPlan[] = []

      if (courseData.payment_type === 'one_time' || courseData.type === 'ebook') {
        // Usar one_time_price si existe, o un valor por defecto si es necesario
        const price = courseData.one_time_price || 0
        
        loadedPlans = [{
          id: 'one-time',
          course_id: courseData.id,
          duration_months: 0, // 0 para indicar vida útil/pago único
          price: price,
          name: 'Pago Único',
          description: 'Acceso completo de por vida',
          is_popular: true,
          display_order: 1,
          is_active: true
        }]
      } else {
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("course_id", params.courseId)
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        if (plansData) {
          loadedPlans = plansData
        }
      }

      setPlans(loadedPlans)

      // Si no hay plan seleccionado, seleccionar el popular o el primero
      if (!selectedPlanId && loadedPlans.length > 0) {
        const popularPlan = loadedPlans.find(p => p.is_popular)
        setSelectedPlanId(popularPlan?.id || loadedPlans[0].id)
      }

      // 🎁 Cargar complementos opcionales (add-ons)
      const { data: addonsData } = await supabase
        .from("course_addons")
        .select(`
          id,
          addon_course_id,
          price,
          addon_course:courses!course_addons_addon_course_id_fkey(id, title, short_description, one_time_price)
        `)
        .eq("course_id", params.courseId)
        .order("order_index", { ascending: true })

      if (addonsData) {
        setAvailableAddons(addonsData as any)

        // Fetch plans for addons
        const addonCourseIds = addonsData.map(a => a.addon_course_id)
        if (addonCourseIds.length > 0) {
          const { data: addonPlansData } = await supabase
            .from("subscription_plans")
            .select("*")
            .in("course_id", addonCourseIds)
            .eq("is_active", true)
            .order("display_order", { ascending: true })
          
          if (addonPlansData) {
            const plansByCourse: Record<string, SubscriptionPlan[]> = {}
            addonPlansData.forEach(plan => {
              if (!plansByCourse[plan.course_id]) {
                plansByCourse[plan.course_id] = []
              }
              plansByCourse[plan.course_id].push(plan)
            })
            setAddonPlans(plansByCourse)
          }
        }
      }

      setCourse(courseData)
      setIsLoading(false)
    }

    loadData().catch(error => {
      console.error("Error loading checkout data:", error)
      setIsLoading(false)
    })
  }, [params.courseId, router, selectedPlanId])

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  // Calculate totals
  const addonsTotal = Array.from(selectedAddons).reduce((total, addonId) => {
    const addon = availableAddons.find(a => a.id === addonId)
    if (!addon) return total
    
    // Check for selected plan
    const selectedPlanId = selectedAddonPlans[addonId]
    const plans = addon.addon_course_id ? addonPlans[addon.addon_course_id] : []
    const selectedPlan = plans?.find(p => p.id === selectedPlanId)
    
    const addonPrice = selectedPlan 
        ? selectedPlan.price 
        : (addon.price ?? addon.addon_course?.one_time_price ?? 0)
        
    return total + addonPrice
  }, 0)

  const totalPrice = (selectedPlan?.price || 0) + addonsTotal

  const calculateSavings = (plan: SubscriptionPlan) => {
    if (plan.duration_months === 0) return null
    
    // Filtrar planes con duración 0 para el cálculo
    const validPlans = plans.filter(p => p.duration_months > 0)
    if (validPlans.length === 0) return null

    // Calcular precio mensual más barato entre todos los planes válidos
    const cheapestMonthlyRate = Math.min(...validPlans.map(p => p.price / p.duration_months))
    const regularTotal = cheapestMonthlyRate * plan.duration_months
    const savings = regularTotal - plan.price
    const savingsPercent = Math.round((savings / regularTotal) * 100)

    return savings > 0 ? { savings, savingsPercent } : null
  }

  const handlePayment = async () => {
    if (!selectedPlan) return

    if (!user) {
      if (!guestEmail || !guestFirstName || !guestLastName) {
        alert("Por favor completa todos los datos personales para continuar.")
        return
      }
    }

    setIsProcessing(true)

    try {
      // Preparar lista de add-ons seleccionados
      const selectedAddonsList = Array.from(selectedAddons).map(addonId => {
        const addon = availableAddons.find(a => a.id === addonId)
        
        // Check for selected plan
        const selectedPlanId = selectedAddonPlans[addonId]
        const plans = addon?.addon_course_id ? addonPlans[addon.addon_course_id] : []
        const selectedPlan = plans?.find(p => p.id === selectedPlanId)
        
        const addonPrice = selectedPlan 
            ? selectedPlan.price 
            : (addon?.price ?? addon?.addon_course?.one_time_price ?? 0)
            
        return {
          addonId: addon?.id,
          courseId: addon?.addon_course?.id,
          title: addon?.addon_course?.title,
          price: addonPrice,
          planId: selectedPlan?.id,
          months: selectedPlan?.duration_months
        }
      })

      // Create Webpay transaction
      const response = await fetch("/api/webpay/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: params.courseId,
          userId: user?.id,
          guestEmail: !user ? guestEmail : undefined,
          guestName: !user ? guestFirstName : undefined,
          guestSurname: !user ? guestLastName : undefined,
          planId: selectedPlan.id,
          price: selectedPlan.price,
          months: selectedPlan.duration_months,
          selectedAddons: selectedAddonsList,
          addonsTotal: addonsTotal,
          totalPrice: totalPrice,
        }),
      })

      const data = await response.json()

      if (data.session) {
        // If we got a session back (guest checkout), sign them in
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }

      if (data.url && data.token) {
        // Redirect to Transbank Webpay
        const form = document.createElement("form");
        form.action = data.url;
        form.method = "POST";
        form.style.display = "none";
        
        const tokenInput = document.createElement("input");
        tokenInput.name = "token_ws";
        tokenInput.value = data.token;
        form.appendChild(tokenInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        console.error("Payment init failed:", data);
        alert("Error al procesar el pago. Por favor intenta nuevamente.")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Error al procesar el pago. Por favor intenta nuevamente.")
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!selectedPlan || plans.length === 0) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No hay planes disponibles para este curso.</p>
        </div>
        <Footer />
      </main>
    )
  }

  const currentSavings = calculateSavings(selectedPlan)

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {!user && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Datos personales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo*</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Correo"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre*</Label>
                        <Input
                          id="firstName"
                          placeholder="Nombre"
                          value={guestFirstName}
                          onChange={(e) => setGuestFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido*</Label>
                        <Input
                          id="lastName"
                          placeholder="Apellido"
                          value={guestLastName}
                          onChange={(e) => setGuestLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.short_description || course.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Selecciona tu Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plans.map((plan) => {
                      const savings = calculateSavings(plan)
                      const monthlyRate = plan.duration_months > 0 ? plan.price / plan.duration_months : 0

                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${selectedPlanId === plan.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          {plan.is_popular && (
                            <Badge className="absolute -top-2 -left-2 bg-orange-600 hover:bg-orange-700">
                              Más Popular
                            </Badge>
                          )}
                          {savings && (
                            <Badge className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-700">
                              Ahorra {savings.savingsPercent}%
                            </Badge>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {plan.name || (plan.duration_months === 0 ? 'Acceso de por vida' : `Plan ${plan.duration_months} ${plan.duration_months === 1 ? 'Mes' : 'Meses'}`)}
                              </p>
                              {plan.description ? (
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {plan.duration_months === 0 
                                    ? 'Pago único' 
                                    : plan.duration_months === 1 
                                      ? 'Renovación mensual' 
                                      : `$${Math.round(monthlyRate).toLocaleString("es-CL")}/mes`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">${plan.price.toLocaleString("es-CL")}</p>
                              <p className="text-xs text-muted-foreground">
                                {plan.duration_months === 1 ? '/mes' : 'Pago único'}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Complementos opcionales (Add-ons) */}
              {availableAddons.length > 0 && availableAddons.map(addon => {
                const plans = addonPlans[addon.addon_course_id] || []
                const hasPlans = plans.length > 0
                
                // Determine selected plan for this addon
                const selectedPlanId = selectedAddonPlans[addon.id]
                const selectedPlan = hasPlans ? plans.find(p => p.id === selectedPlanId) : null
                
                // Calculate price: use selected plan price if available, otherwise fallback to fixed price
                const addonPrice = selectedPlan 
                  ? selectedPlan.price 
                  : (addon.price ?? addon.addon_course?.one_time_price ?? 0)
                  
                const isSelected = selectedAddons.has(addon.id)
                
                return (
                  <Card key={addon.id} className={`mt-6 relative overflow-hidden border-2 transition-all ${isSelected ? 'border-purple-500 shadow-lg' : 'border-gray-200 dark:border-gray-800'}`}>
                    {/* Fondo decorativo */}
                    <div className={`absolute inset-0 ${isSelected ? 'bg-gradient-to-br from-purple-50 via-purple-500/10 to-transparent dark:from-purple-950/30 dark:via-purple-500/10' : 'bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-900/30'}`} />

                    <CardContent className="relative pt-6 pb-6">
                      <div className="flex gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 ${isSelected ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-gray-600 to-gray-700'} rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
                            <FileQuestion className="h-8 w-8 text-white" />
                          </div>
                        </div>

                        {/* Contenido principal */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-purple-600' : 'text-foreground'}`}>
                              {addon.addon_course?.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {addon.addon_course?.short_description || 'Complemento adicional para mejorar tu aprendizaje'}
                            </p>
                          </div>

                          {/* Plan Selector for Addon */}
                          {hasPlans && (
                            <div className="mt-4 space-y-3">
                              {plans.map(plan => {
                                const isPlanSelected = selectedPlanId === plan.id
                                const monthlyRate = plan.duration_months > 0 ? plan.price / plan.duration_months : 0
                                
                                return (
                                  <button
                                    key={plan.id}
                                    onClick={() => {
                                      setSelectedAddonPlans(prev => ({
                                        ...prev,
                                        [addon.id]: plan.id
                                      }))
                                      // Auto-select the addon if a plan is chosen
                                      if (!isSelected) {
                                        const newSet = new Set(selectedAddons)
                                        newSet.add(addon.id)
                                        setSelectedAddons(newSet)
                                      }
                                    }}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left relative ${isPlanSelected
                                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                        : "border-border hover:border-purple-200 dark:hover:border-purple-800"
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold text-sm">
                                          {plan.name || (plan.duration_months === 0 ? 'Acceso de por vida' : `Plan ${plan.duration_months} ${plan.duration_months === 1 ? 'Mes' : 'Meses'}`)}
                                        </p>
                                        {plan.description ? (
                                          <p className="text-xs text-muted-foreground">{plan.description}</p>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            {plan.duration_months === 0 
                                              ? 'Pago único' 
                                              : plan.duration_months === 1 
                                                ? 'Renovación mensual' 
                                                : `$${Math.round(monthlyRate).toLocaleString("es-CL")}/mes`}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-purple-600">${plan.price.toLocaleString("es-CL")}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {plan.duration_months === 1 ? '/mes' : 'Pago único'}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Call to action */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`addon-${addon.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSet = new Set(selectedAddons)
                                  if (checked) {
                                    newSet.add(addon.id)
                                    // If has plans and none selected, select the first one
                                    if (hasPlans && !selectedPlanId && plans.length > 0) {
                                        setSelectedAddonPlans(prev => ({
                                            ...prev,
                                            [addon.id]: plans[0].id
                                        }))
                                    }
                                  } else {
                                    newSet.delete(addon.id)
                                  }
                                  setSelectedAddons(newSet)
                                }}
                                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 w-5 h-5"
                              />
                              <Label htmlFor={`addon-${addon.id}`} className="cursor-pointer">
                                <span className="text-sm font-semibold text-foreground">
                                  {isSelected ? 'Agregado al carrito' : 'Agregar al carrito'}
                                </span>
                              </Label>
                            </div>
                            <div className="text-right">
                              {hasPlans && !selectedPlan ? (
                                <p className="text-sm font-medium text-muted-foreground">
                                  Selecciona un plan
                                </p>
                              ) : (
                                <p className="text-2xl font-bold text-purple-600">
                                  +${addonPrice.toLocaleString("es-CL")}
                                </p>
                              )}
                              {selectedPlan && (
                                <p className="text-xs text-muted-foreground">
                                  {selectedPlan.duration_months === 1 ? '/mes' : 'Pago único'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Lo que incluye</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>
                        {selectedPlan.duration_months === 0 
                          ? "Acceso completo de por vida" 
                          : `Acceso completo durante ${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? "mes" : "meses"}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>Material descargable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>Soporte de profesores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>Actualizaciones incluidas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Resumen de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan seleccionado</span>
                      <span className="font-medium">
                        {selectedPlan.name || `${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? 'Mes' : 'Meses'}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">
                        {selectedPlan.duration_months === 0 
                          ? "De por vida" 
                          : `${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? "mes" : "meses"}`}
                      </span>
                    </div>
                    {selectedPlan.duration_months > 0 && selectedPlan.duration_months > 1 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Precio mensual equivalente</span>
                        <span className="font-medium">
                          ${Math.round(selectedPlan.price / selectedPlan.duration_months).toLocaleString("es-CL")}/mes
                        </span>
                      </div>
                    )}
                  </div>

                  {currentSavings && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          Ahorras ${Math.round(currentSavings.savings).toLocaleString("es-CL")} ({currentSavings.savingsPercent}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Curso ({selectedPlan.name || `${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? 'Mes' : 'Meses'}`})
                      </span>
                      <span className="font-medium">${selectedPlan.price.toLocaleString("es-CL")}</span>
                    </div>

                    {Array.from(selectedAddons).map(addonId => {
                      const addon = availableAddons.find(a => a.id === addonId)
                      if (!addon) return null
                      
                      // Check for selected plan
                      const selectedPlanId = selectedAddonPlans[addonId]
                      const plans = addon.addon_course_id ? addonPlans[addon.addon_course_id] : []
                      const selectedPlan = plans?.find(p => p.id === selectedPlanId)
                      
                      const price = selectedPlan 
                          ? selectedPlan.price 
                          : (addon.price ?? addon.addon_course?.one_time_price ?? 0)

                      return (
                        <div key={addonId} className="flex items-center justify-between text-sm bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex flex-col">
                              <span className="text-purple-700 dark:text-purple-300 font-medium">✓ {addon.addon_course?.title}</span>
                              {selectedPlan && (
                                  <span className="text-xs text-purple-600 dark:text-purple-400">
                                      {selectedPlan.name || (selectedPlan.duration_months === 0 ? 'Acceso de por vida' : `Plan ${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? 'Mes' : 'Meses'}`)}
                                  </span>
                              )}
                          </div>
                          <span className="font-bold text-purple-700 dark:text-purple-300">${price.toLocaleString("es-CL")}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold">Total a Pagar</span>
                      <span className="text-2xl font-bold text-primary">
                        ${totalPrice.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <Button className="w-full bg-black hover:bg-zinc-800 text-white transition-colors" size="lg" onClick={handlePayment} disabled={isProcessing}>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {isProcessing ? "Procesando..." : "Pagar con Webpay Plus"}
                    </Button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-3 opacity-90">
                    <div className="flex items-center justify-center pointer-events-none select-none" aria-label="Webpay Plus">
                       <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tighter">web</span>
                       <span className="text-2xl font-bold text-[#FF5D00] tracking-tighter">pay</span>
                       <div className="ml-1 bg-[#D6001C] text-white text-sm font-bold px-1.5 py-0.5 rounded-sm transform -skew-x-12 flex items-center shadow-sm">
                         plus
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-1.5 opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
                       <div className="h-5 px-1.5 bg-white border border-slate-200 rounded flex items-center justify-center" title="Visa">
                          <span className="text-[10px] font-black italic text-blue-800">VISA</span>
                       </div>
                       <div className="h-5 px-1.5 bg-white border border-slate-200 rounded flex items-center justify-center" title="Mastercard">
                          <div className="flex -space-x-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-600 opacity-80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-80"></div>
                          </div>
                       </div>
                       <div className="h-5 px-1.5 bg-white border border-slate-200 rounded flex items-center justify-center" title="American Express">
                          <span className="text-[8px] font-bold text-blue-600 tracking-tighter">AMEX</span>
                       </div>
                       <div className="h-5 px-1.5 bg-[#00175F] border border-[#00175F] rounded flex items-center justify-center" title="Redcompra">
                          <span className="text-[8px] font-bold text-white italic">Redcompra</span>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
