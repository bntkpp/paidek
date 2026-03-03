import { NextRequest, NextResponse } from "next/server";
import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/emails/send";
import { getPurchaseConfirmationTemplate, getWelcomeEmailTemplate } from "@/lib/emails/templates";

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
    const isProduction = process.env.TRANSBANK_ENV === 'PRODUCTION';
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;
    const apiKey = process.env.TRANSBANK_API_KEY;

    if (isProduction && (!commerceCode || !apiKey)) {
        console.error('Missing Transbank production credentials');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=config_error`, 303);
    }

    console.log('Transbank Environment:', isProduction ? 'PRODUCTION' : 'INTEGRATION');

    const tx = new WebpayPlus.Transaction(new Options(
        isProduction ? commerceCode! : IntegrationCommerceCodes.WEBPAY_PLUS, 
        isProduction ? apiKey! : IntegrationApiKeys.WEBPAY, 
        isProduction ? Environment.Production : Environment.Integration
    ));

    // 3. Commit transaction
    // Important: check if token was already used or handled
    const commitResponse = await tx.commit(token);
    
    console.log("Webpay commit response:", commitResponse);

    if (commitResponse.status === 'AUTHORIZED' && commitResponse.response_code === 0) {
        // Payment successful
        
        // Extract metadata: try DB first, then cookie fallback
        // Cookies are unreliable on cross-site POST from Transbank
        const buyOrder = commitResponse.buy_order;

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: { autoRefreshToken: false, persistSession: false },
          }
        );

        let pendingData: any = null;

        // Primary: read from DB (pending_webpay_transactions table)
        try {
            const { data: dbPending } = await supabaseAdmin
              .from("pending_webpay_transactions")
              .select("transaction_data")
              .eq("buy_order", buyOrder)
              .single();

            if (dbPending?.transaction_data) {
                pendingData = dbPending.transaction_data;
                console.log("✅ Transaction data recovered from DB");

                // Cleanup DB record
                await supabaseAdmin
                  .from("pending_webpay_transactions")
                  .delete()
                  .eq("buy_order", buyOrder);
            }
        } catch (dbError) {
            console.warn("⚠️ Could not read from pending_webpay_transactions:", dbError);
        }

        // Fallback: cookie
        if (!pendingData) {
            const cookieStore = await cookies();
            const cookieName = `tb_pending_${buyOrder}`;
            const pendingDataStr = cookieStore.get(cookieName)?.value;
            if (pendingDataStr) {
                pendingData = JSON.parse(pendingDataStr);
                cookieStore.delete(cookieName);
                console.log("✅ Transaction data recovered from cookie (DB fallback)");
            }
        }

        if (!pendingData) {
             console.error(`❌ Missing pending transaction data for buyOrder: ${buyOrder}. Neither DB nor cookie available.`);
             return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?reason=session_expired`, 303);
        }

        const { courseId, userId, planId, months, selectedAddons, addonsTotal } = pendingData;

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
                  
                  // Enviar emails de confirmación
                  try {
                    const { data: userData } = await supabaseAdmin
                      .from("profiles")
                      .select("full_name, email")
                      .eq("id", userId)
                      .single();

                    const { data: courseData } = await supabaseAdmin
                      .from("courses")
                      .select("title")
                      .eq("id", courseId)
                      .single();

                    if (userData && courseData) {
                      const userEmail = userData.email || "";
                      const userName = userData.full_name || "";
                      const courseTitle = courseData.title || "";
                      const planLabel = months > 0 ? `Plan ${months} ${months === 1 ? 'mes' : 'meses'}` : 'De por vida';

                      const purchaseHtml = getPurchaseConfirmationTemplate({
                        userName,
                        userEmail,
                        courseTitle,
                        courseId,
                        amount: commitResponse.amount,
                        plan: planLabel,
                        includesQuestions: false,
                        paymentId: token || "webpay",
                        purchaseDate: new Date().toISOString(),
                      });

                      await sendEmail({
                        to: userEmail,
                        subject: `✅ Confirmación de compra - ${courseTitle}`,
                        html: purchaseHtml,
                      });

                      // Enviar copia al admin
                      const adminEmail = process.env.ADMIN_EMAIL;
                      if (adminEmail) {
                        await sendEmail({
                          to: adminEmail,
                          subject: `💰 Nueva compra: ${courseTitle} - ${userName}`,
                          html: purchaseHtml,
                        });
                      }

                      if (!existingEnrollment) {
                        const welcomeHtml = getWelcomeEmailTemplate({
                          userName,
                          userEmail,
                          courseTitle,
                          courseId,
                        });

                        await sendEmail({
                          to: userEmail,
                          subject: `🎉 Bienvenido a ${courseTitle}`,
                          html: welcomeHtml,
                        });
                      }
                    }
                  } catch (emailError) {
                    console.error("❌ Error enviando emails Webpay:", emailError);
                  }
              }
        }
        
        // Redirect to success (use course_id to match what the success page expects)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?course_id=${courseId}&planId=${planId}`, 303);

    } else {
        console.error("Webpay transaction failed/rejected:", commitResponse);
        
        // Attempt to record the rejected payment
        try {
            const buyOrder = commitResponse.buy_order;
            
            // Try DB first, then cookie fallback
            let rejectedData: any = null;
            
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            try {
                const { data: dbPending } = await supabaseAdmin
                  .from("pending_webpay_transactions")
                  .select("transaction_data")
                  .eq("buy_order", buyOrder)
                  .single();

                if (dbPending?.transaction_data) {
                    rejectedData = dbPending.transaction_data;
                    await supabaseAdmin
                      .from("pending_webpay_transactions")
                      .delete()
                      .eq("buy_order", buyOrder);
                }
            } catch (e) { /* DB table might not exist */ }

            if (!rejectedData) {
                const cookieStore = await cookies();
                const cookieName = `tb_pending_${buyOrder}`;
                const pendingDataStr = cookieStore.get(cookieName)?.value;
                if (pendingDataStr) {
                     rejectedData = JSON.parse(pendingDataStr);
                     cookieStore.delete(cookieName);
                }
            }
            
            if (rejectedData) {
                 const { courseId, userId } = rejectedData;
                  
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
