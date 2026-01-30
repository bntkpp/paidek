import { NextRequest, NextResponse } from "next/server";
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function handleWebpayReturn(req: NextRequest) {
  try {
    let token: string | null = null;
    let tbkToken: string | null = null;
    let tbkOrdenCompra: string | null = null;
    let tbkIdSesion: string | null = null;

    // Determine method and extract params
    if (req.method === 'POST') {
        try {
            const formData = await req.formData();
            token = formData.get('token_ws') as string;
            tbkToken = formData.get('TBK_TOKEN') as string;
            tbkOrdenCompra = formData.get('TBK_ORDEN_COMPRA') as string;
            tbkIdSesion = formData.get('TBK_ID_SESION') as string;
        } catch (e) {
            console.warn("Error reading POST formData, falling back to URL params", e);
        }
    } 
    
    // Check URL params if not found in POST or if it's GET
    if (!token) {
        const searchParams = req.nextUrl.searchParams;
        token = searchParams.get('token_ws');
        if (!tbkToken) tbkToken = searchParams.get('TBK_TOKEN');
        if (!tbkOrdenCompra) tbkOrdenCompra = searchParams.get('TBK_ORDEN_COMPRA');
        if (!tbkIdSesion) tbkIdSesion = searchParams.get('TBK_ID_SESION');
    }

    console.log("Webpay return processing. Token:", token, "TBK_TOKEN:", tbkToken);

    // 1. Abort scenario / Error en formulario
    // Si TBK_TOKEN está presente, se considera una transacción abortada o con error en el formulario
    // (incluso si token_ws viene presente en algunos casos de error/reintento).
    if (tbkToken) {
        console.log("Webpay aborted/error (TBK_TOKEN present). Order:", tbkOrdenCompra);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=aborted`, 303);
    }
    
    // 2. Timeout scenario
    // Cuando el usuario deja pasar más de 10 min en el formulario sin pagar.
    // Transbank devuelve TBK_ID_SESION y TBK_ORDEN_COMPRA, pero NO token_ws ni TBK_TOKEN.
    if (!token && !tbkToken && tbkOrdenCompra) {
        console.log("Webpay timeout (no token, but order present). Order:", tbkOrdenCompra);
        // Podríamos intentar registrar el rechazo por timeout aquí si quisiéramos, 
        // pero al no haber token de transacción no podemos confirmar nada.
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=timeout`, 303);
    }

    // 3. Invalid params (General case)
    if (!token) {
        console.error("No token_ws received in return");
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=no_token`, 303);
    }

    // Configure Transbank options
    const tx = new WebpayPlus.Transaction(new Options(
        process.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS, 
        process.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY, 
        process.env.TRANSBANK_ENV === 'PRODUCTION' ? Environment.Production : Environment.Integration
    ));

    // 3. Commit transaction
    // Important: check if token was already used or handled
    const commitResponse = await tx.commit(token);
    
    console.log("Webpay commit response:", commitResponse);

    if (commitResponse.status === 'AUTHORIZED' && commitResponse.response_code === 0) {
        // Payment successful
        
        // Extract metadata from Cookie using buyOrder from commit response
        const buyOrder = commitResponse.buy_order;
        const cookieStore = await cookies();
        const cookieName = `tb_pending_${buyOrder}`;
        const pendingDataStr = cookieStore.get(cookieName)?.value;

        if (!pendingDataStr) {
             console.error(`Missing pending transaction data for buyOrder: ${buyOrder}`);
             // If we can't find metadata, we can't fulfill. Critical error.
             // We could redirect to failure or try to recover if we had DB persistence.
             // For now, fail safely.
             return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=session_expired`, 303);
        }

        const pendingData = JSON.parse(pendingDataStr);
        const { courseId, userId, planId, months, selectedAddons, addonsTotal } = pendingData;
        
        // Cleanup cookie
        cookieStore.delete(cookieName);

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: { autoRefreshToken: false, persistSession: false },
          }
        );

        // Check if payment already recorded (idempotency using token as payment_id)
        // Store Webpay Token in mercadopago_payment_id to avoid schema change
        const { data: existing } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("mercadopago_payment_id", token)
          .single();

        if (!existing) {
             // Saving Payment
             // We map Webpay response to our schema
             const { error: insertError } = await supabaseAdmin.from("payments").insert({
                user_id: userId,
                course_id: courseId,
                amount: commitResponse.amount,
                currency: "CLP",
                status: "approved", // Map AUTHORIZED to approved
                mercadopago_payment_id: token,
                payment_method: commitResponse.payment_type_code, // e.g. VD, VN
                payment_type: "webpay",
              });

              if (insertError) {
                  console.error("❌ Error saving payment:", insertError);
              } else {
                  // Enroll User
                  // Reusing logic from webhook/mercadopago

                  // Check for existing enrollment
                  const { data: existingEnrollment } = await supabaseAdmin
                    .from("enrollments")
                    .select("id, expires_at, is_active")
                    .eq("user_id", userId)
                    .eq("course_id", courseId)
                    .maybeSingle();

                  let newExpiryISO: string | null = null;
                  
                  if (months > 0) {
                      const baseDate = existingEnrollment && existingEnrollment.expires_at && new Date(existingEnrollment.expires_at) > new Date()
                        ? new Date(existingEnrollment.expires_at) 
                        : new Date();
                      
                      const newExpiry = new Date(baseDate);
                      newExpiry.setMonth(newExpiry.getMonth() + months);
                      newExpiryISO = newExpiry.toISOString();
                  } else {
                      // Lifetime
                      const newExpiry = new Date();
                      newExpiry.setFullYear(newExpiry.getFullYear() + 100);
                      newExpiryISO = newExpiry.toISOString(); 
                  }

                  if (existingEnrollment) {
                      await supabaseAdmin
                          .from("enrollments")
                          .update({
                            expires_at: newExpiryISO,
                            is_active: true,
                          })
                          .eq("id", existingEnrollment.id);
                  } else {
                      await supabaseAdmin
                          .from("enrollments")
                          .insert({
                            user_id: userId,
                            course_id: courseId,
                            enrolled_at: new Date().toISOString(),
                            expires_at: newExpiryISO,
                            is_active: true,
                            progress_percentage: 0,
                          });
                  }

                  // Handle Addons
                  if (selectedAddons && selectedAddons.length > 0) {
                     // const addonIds = addonCourseIds.split(','); // Use data from cookie
                     
                     for (const addon of selectedAddons) {
                         const addonId = addon.courseId;
                         // Check existing
                         const { data: existingAddon } = await supabaseAdmin
                            .from("enrollments")
                            .select("id")
                            .eq("user_id", userId)
                            .eq("course_id", addonId)
                            .maybeSingle();
                        
                         if (!existingAddon) {
                             await supabaseAdmin.from("enrollments").insert({
                                user_id: userId,
                                course_id: addonId,
                                enrolled_at: new Date().toISOString(),
                                expires_at: newExpiryISO, // Assuming same duration for addons for now
                                is_active: true,
                                progress_percentage: 0,
                             });
                         }
                     }
                  }
              }
        }
        
        // Redirect to success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?courseId=${courseId}&planId=${planId}`, 303);

    } else {
        console.error("Webpay transaction failed/rejected:", commitResponse);
        
        // Attempt to record the rejected payment
        try {
            const buyOrder = commitResponse.buy_order;
            const cookieStore = await cookies();
            const cookieName = `tb_pending_${buyOrder}`;
            const pendingDataStr = cookieStore.get(cookieName)?.value;
            
            if (pendingDataStr) {
                 const pendingData = JSON.parse(pendingDataStr);
                 const { courseId, userId } = pendingData;
                 
                 // Cleanup cookie
                 cookieStore.delete(cookieName);
                 
                 const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    {
                      auth: { autoRefreshToken: false, persistSession: false },
                    }
                  );
                  
                  await supabaseAdmin.from("payments").insert({
                    user_id: userId,
                    course_id: courseId,
                    amount: commitResponse.amount,
                    currency: "CLP",
                    status: "rejected", 
                    mercadopago_payment_id: token,
                    payment_method: commitResponse.payment_type_code,
                    payment_type: "webpay",
                  });
            }
        } catch (e) {
            console.error("Error saving rejected payment:", e);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=rejected`, 303);
    }

  } catch (error: any) {
    console.error("Error in Webpay return:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=error`, 303);
  }
}

export async function POST(req: NextRequest) {
    return handleWebpayReturn(req);
}

export async function GET(req: NextRequest) {
    return handleWebpayReturn(req);
}
