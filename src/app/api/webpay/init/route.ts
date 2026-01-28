import { NextRequest, NextResponse } from "next/server"
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { sendMetaEvent } from "@/lib/meta-conversions"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, userId: providedUserId, planId, price, months, selectedAddons, addonsTotal, totalPrice, guestEmail, guestName, guestSurname } = body

    console.log("Creating Webpay transaction:", { courseId, userId: providedUserId, planId, price, months, selectedAddons, addonsTotal, totalPrice })

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

    // Configure Transbank options
    const buyOrder = "O-" + Math.floor(Math.random() * 100000000).toString();
    const sessionId = "S-" + Math.floor(Math.random() * 100000000).toString();
    const amount = Number(totalPrice || price); // Use total price including addons

    const returnUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/webpay/return`);
    // Minimal data in URL to avoid length limits.
    // We will rely on a secure cookie for the full payload,
    // but keep buyOrder in URL to look up the correct cookie.
    returnUrl.searchParams.append("buyOrder", buyOrder);

    // Store transaction metadata in a cookie
    const transactionData = {
        courseId,
        userId,
        planId,
        months,
        selectedAddons,
        addonsTotal
    };

    const cookieStore = await cookies();
    cookieStore.set(`tb_pending_${buyOrder}`, JSON.stringify(transactionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
    });

    const txOptions = new Options(
        process.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS, 
        process.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY, 
        process.env.TRANSBANK_ENV === 'PRODUCTION' ? Environment.Production : Environment.Integration
    );

    const tx = new WebpayPlus.Transaction(txOptions);

    const response = await tx.create(
        buyOrder, 
        sessionId, 
        amount, 
        returnUrl.toString()
    );

    console.log("Webpay transaction created:", response);

    // Send InitiateCheckout event to Meta
    try {
      await sendMetaEvent("InitiateCheckout", {
        external_id: userId,
      }, {
        content_ids: [courseId, ...(selectedAddons?.map((a: any) => a.courseId) || [])],
        currency: "CLP",
        value: amount,
        num_items: 1 + (selectedAddons?.length || 0)
      })
    } catch (e) {
      console.error("Failed to send Meta InitiateCheckout event", e)
    }

    return NextResponse.json({
      url: response.url,
      token: response.token,
      session: sessionData // Return session if created
    })

  } catch (error: any) {
    console.error("Error creating Webpay transaction:", error)
    console.error("Error details:", error.message)

    return NextResponse.json(
      {
        error: "Error al iniciar el pago",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
