import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { sendMetaEvent } from "@/lib/meta-conversions"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@supabase/supabase-js" // To sign in user

const planLabels: Record<string, string> = {
  "1_month": "Plan Mensual",
  "4_months": "Plan 4 Meses",
  "8_months": "Plan 8 Meses",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, userId: providedUserId, planId, price, months, selectedAddons, addonsTotal, totalPrice, guestEmail, guestName, guestSurname } = body

    console.log("Creating preference:", { courseId, userId: providedUserId, planId, price, months, selectedAddons, addonsTotal, totalPrice })

    let userId = providedUserId
    let sessionData = null

    // Handle guest checkout - create or find user
    if (!userId && guestEmail) {
      if (!guestName || !guestSurname) {
        return NextResponse.json({ error: "Missing guest details" }, { status: 400 })
      }

      const supabaseAdmin = createAdminClient()

      // Generate a temporary secure password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "Aa1!"

      // Attempt to create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: guestEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${guestName} ${guestSurname}`,
          first_name: guestName,
          last_name: guestSurname
        }
      })

      if (newUser && newUser.user) {
        userId = newUser.user.id
        
        // Sign in the user to get session tokens
        const supabaseAnon = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        const { data: session } = await supabaseAnon.auth.signInWithPassword({
          email: guestEmail,
          password: tempPassword
        })

        if (session.session) {
          sessionData = session.session
        }
      } else if (createError) {
        // If user already exists, try to find their ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', guestEmail)
          .single()

        if (profile) {
          userId = profile.id
        } else {
          return NextResponse.json(
            { error: "El correo ya está registrado. Por favor inicia sesión para continuar." },
            { status: 400 }
          )
        }
      }
    }

    if (!courseId || !userId || !planId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Usar la variable que ya tienes
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured")
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    })

    // Get course name from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Get course name and plan info from Supabase
    const courseResponse = await fetch(
      `${supabaseUrl}/rest/v1/courses?id=eq.${courseId}&select=title,image_url`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const courses = await courseResponse.json()
    const courseTitle = courses[0]?.title || "Curso"
    const courseImage = courses[0]?.image_url || null

    // Get plan info
    let planName = ""
    
    if (planId === 'one-time') {
      planName = "Pago Único"
    } else {
      const planResponse = await fetch(
        `${supabaseUrl}/rest/v1/subscription_plans?id=eq.${planId}&select=name,duration_months`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      )

      const plans = await planResponse.json()
      const planInfo = plans[0]
      planName = planInfo?.name || `Plan ${months} ${months === 1 ? 'Mes' : 'Meses'}`
    }

    const preference = new Preference(client)

    // Build items array with course and optional addons
    const mainItem: any = {
      id: courseId,
      title: `${courseTitle}`,
      description: `${planName} - ${months === 0 ? "Acceso de por vida" : `Acceso por ${months} ${months === 1 ? "mes" : "meses"}`}`,
      category_id: "education",
      quantity: 1,
      unit_price: Number(price),
      currency_id: "CLP",
    }

    // Add picture if available
    if (courseImage) {
      mainItem.picture_url = courseImage
    }

    const items = [mainItem]

    // Add course addons if selected
    if (selectedAddons && selectedAddons.length > 0) {
      for (const addon of selectedAddons) {
        items.push({
          id: addon.courseId,
          title: addon.title,
          description: "Material complementario adicional",
          category_id: "education",
          quantity: 1,
          unit_price: Number(addon.price),
          currency_id: "CLP",
        })
      }
    }

    const preferenceData = {
      items: items,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?courseId=${courseId}&planId=${planId}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/mercadopago`,
      statement_descriptor: "PAIDEK",
      external_reference: `${courseId}-${Date.now()}`,
      payment_methods: {
        installments: 1,
      },
      metadata: {
        course_id: courseId,
        user_id: userId,
        plan_id: planId,
        // Si es 0 (pago único/ebook), enviamos 62 meses para asegurar que no expire pronto
        months: months === 0 ? "62" : months.toString(),
        addon_course_ids: selectedAddons && selectedAddons.length > 0 
          ? selectedAddons.map((a: any) => a.courseId).join(',') 
          : "",
        addon_durations: selectedAddons && selectedAddons.length > 0
          ? selectedAddons.map((a: any) => `${a.courseId}:${a.months !== undefined ? a.months : 'default'}`).join(',')
          : "",
        addons_total: addonsTotal ? addonsTotal.toString() : "0",
      },
    }

    console.log("Preference data:", JSON.stringify(preferenceData, null, 2))

    const response = await preference.create({
      body: preferenceData,
    })

    console.log("Preference created:", response.id)

    // Send InitiateCheckout event to Meta
    try {
      await sendMetaEvent("InitiateCheckout", {
        external_id: userId,
      }, {
        content_ids: items.map((item: any) => item.id),
        content_name: items.map((item: any) => item.title).join(", "),
        content_type: "product",
        currency: "CLP",
        value: Number(totalPrice),
        num_items: items.length
      })
    } catch (e) {
      console.error("Failed to send Meta InitiateCheckout event", e)
    }

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      session: sessionData // Return session if created
    })
  } catch (error: any) {
    console.error("Error creating preference:", error)
    console.error("Error details:", error.message, error.cause)

    return NextResponse.json(
      {
        error: "Error al crear la preferencia de pago",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
