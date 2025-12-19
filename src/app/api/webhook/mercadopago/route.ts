export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Aumentar el tiempo máximo de ejecución (importante para Vercel)
export const maxDuration = 30; // segundos

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { sendEmail } from "@/lib/emails/send";
import { getPurchaseConfirmationTemplate, getWelcomeEmailTemplate } from "@/lib/emails/templates";

// Usar la misma variable de entorno que en create-preference
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
  accessToken: accessToken!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Agregar soporte para GET (MercadoPago a veces hace GET para validar)
export async function GET(req: Request) {
  console.log("✅ Webhook endpoint disponible");
  return NextResponse.json({ status: "ok" });
}

export async function POST(req: Request) {
  console.log("🚀 POST request received at webhook endpoint");
  console.log("📍 Request URL:", req.url);
  console.log("🔑 Environment check:", {
    hasAccessToken: !!accessToken,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL
  });
  
  try {
    const body = await req.json();
    console.log("🔔 Webhook completo recibido:", JSON.stringify(body, null, 2));

    const { type, data, action } = body;

    // MercadoPago puede enviar diferentes tipos de notificaciones
    let paymentId = data?.id;
    
    // Si es una notificación de merchant_order, extraer el payment ID
    if (type === "merchant_order" || body.topic === "merchant_order") {
      console.log("📦 Es una merchant_order, ignorando (esperamos payment notification)");
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      console.log("❌ Sin paymentId en:", body);
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    console.log("💳 Procesando pago:", paymentId, "Topic:", type || body.topic);

    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    const metadata = paymentInfo.metadata;
    const courseId = metadata?.course_id;
    const userId = metadata?.user_id;
    const planId = metadata?.plan_id;
    // Parse months safely. If it's "0", parseInt returns 0. If undefined/null, default to 1.
    const months = metadata?.months !== undefined && metadata?.months !== null 
      ? parseInt(metadata.months) 
      : 1;
    const addonCourseIds = metadata?.addon_course_ids || "";
    const addonsTotal = metadata?.addons_total ? parseFloat(metadata.addons_total) : 0;

    // Parse addon course IDs
    let addonCourseIdList: string[] = [];
    if (addonCourseIds && addonCourseIds.trim() !== "") {
      addonCourseIdList = addonCourseIds.split(',').filter((id: string) => id.trim() !== "");
    }

    if (!courseId || !userId) {
      console.log("❌ Faltan metadatos:", { courseId, userId });
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    console.log("📊 Procesando - Curso:", courseId, "Plan:", planId, "Add-ons:", addonCourseIdList.length);

    // Verificar si el pago ya fue procesado
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("mercadopago_payment_id", String(paymentId))
      .single();

    if (existing) {
      console.log("⚠️ Pago ya procesado");
      return NextResponse.json({ received: true });
    }

    // Guardar el pago
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      course_id: courseId,
      amount: paymentInfo.transaction_amount || 0,
      currency: paymentInfo.currency_id || "CLP",
      status: paymentInfo.status || "pending",
      mercadopago_payment_id: String(paymentId),
      payment_method: paymentInfo.payment_method_id || null,
      payment_type: paymentInfo.payment_type_id || null,
    });

    if (insertError) {
      console.error("❌ Error guardando pago:", insertError);
      return NextResponse.json({ error: "DB insert error" }, { status: 500 });
    }

    console.log("✅ Pago guardado correctamente");

    // Si el pago fue aprobado, crear o actualizar la inscripción
    if (paymentInfo.status === "approved") {
      console.log("💰 Pago aprobado, creando inscripción...");

      // Obtener información del usuario y curso para el email
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

      // Verificar si ya existe una inscripción
      const { data: existingEnrollment } = await supabaseAdmin
        .from("enrollments")
        .select("id, expires_at, is_active")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      const isNewEnrollment = !existingEnrollment;

      if (existingEnrollment) {
        console.log("📝 Inscripción existente encontrada, extendiendo...");

        let newExpiryISO: string | null = null;

        if (months > 0) {
          // Calcular nueva fecha de expiración
          const currentExpiry = existingEnrollment.expires_at
            ? new Date(existingEnrollment.expires_at)
            : new Date();

          // Si la fecha actual ya pasó, usar la fecha actual como base
          const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
          const newExpiry = new Date(baseDate);
          newExpiry.setMonth(newExpiry.getMonth() + months);
          newExpiryISO = newExpiry.toISOString();
        } else {
          // Si months es 0, establecer expiración a 100 años en el futuro (simular de por vida)
          // Esto evita problemas con valores NULL si la base de datos tiene defaults
          const newExpiry = new Date();
          newExpiry.setFullYear(newExpiry.getFullYear() + 100);
          newExpiryISO = newExpiry.toISOString();
        }

        const { error: updateError } = await supabaseAdmin
          .from("enrollments")
          .update({
            expires_at: newExpiryISO,
            is_active: true,
          })
          .eq("id", existingEnrollment.id);

        if (updateError) {
          console.error("❌ Error actualizando inscripción:", updateError);
        } else {
          console.log("✅ Inscripción extendida hasta:", newExpiryISO || "Para siempre");
        }
      } else {
        console.log("🆕 Creando nueva inscripción...");

        // Calcular fecha de expiración
        let expiresAtISO: string | null = null;
        
        if (months > 0) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + months);
          expiresAtISO = expiresAt.toISOString();
        } else {
          // Si months es 0, establecer expiración a 100 años en el futuro (simular de por vida)
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 100);
          expiresAtISO = expiresAt.toISOString();
        }

        const { error: enrollError } = await supabaseAdmin
          .from("enrollments")
          .insert({
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            expires_at: expiresAtISO,
            is_active: true,
            progress_percentage: 0,
          });

        if (enrollError) {
          console.error("❌ Error creando inscripción:", enrollError);
        } else {
          console.log("✅ Inscripción creada exitosamente, expira:", expiresAtISO || "Para siempre");
        }
      }

      // 🎁 Crear enrollments para add-ons seleccionados
      if (addonCourseIdList && addonCourseIdList.length > 0) {
        console.log(`🎁 Procesando ${addonCourseIdList.length} add-ons...`);
        
        for (const addonCourseId of addonCourseIdList) {
          try {
            if (!addonCourseId || addonCourseId.trim() === "") {
              console.error("❌ Add-on ID inválido:", addonCourseId);
              continue;
            }
            
            // Verificar que el curso addon existe
            const { data: addonCourse, error: addonCourseError } = await supabaseAdmin
              .from("courses")
              .select("id, title")
              .eq("id", addonCourseId)
              .single();
            
            if (addonCourseError || !addonCourse) {
              console.error(`❌ Addon no encontrado: ${addonCourseId}`);
              continue;
            }
            
            // Calcular fecha de expiración para el add-on (misma que el curso principal)
            let addonExpiresAtISO: string | null = null;
            if (months > 0) {
              const addonExpiresAt = new Date();
              addonExpiresAt.setMonth(addonExpiresAt.getMonth() + months);
              addonExpiresAtISO = addonExpiresAt.toISOString();
            } else {
              // 100 años para add-ons también
              const addonExpiresAt = new Date();
              addonExpiresAt.setFullYear(addonExpiresAt.getFullYear() + 100);
              addonExpiresAtISO = addonExpiresAt.toISOString();
            }

            // Verificar si ya existe enrollment para este add-on
            const { data: existingAddonEnrollment } = await supabaseAdmin
              .from("enrollments")
              .select("id, expires_at, is_active")
              .eq("user_id", userId)
              .eq("course_id", addonCourseId)
              .maybeSingle();

            if (existingAddonEnrollment) {
              // Extender enrollment existente
              let newExpiryISO: string | null = null;
              
              if (months > 0) {
                const currentExpiry = existingAddonEnrollment.expires_at
                  ? new Date(existingAddonEnrollment.expires_at)
                  : new Date();
                const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                const newExpiry = new Date(baseDate);
                newExpiry.setMonth(newExpiry.getMonth() + months);
                newExpiryISO = newExpiry.toISOString();
              } else {
                const newExpiry = new Date();
                newExpiry.setFullYear(newExpiry.getFullYear() + 100);
                newExpiryISO = newExpiry.toISOString();
              }

              await supabaseAdmin
                .from("enrollments")
                .update({
                  expires_at: newExpiryISO,
                  is_active: true,
                })
                .eq("id", existingAddonEnrollment.id);

              console.log(`✅ Add-on extendido: ${addonCourse.title}`);
            } else {
              // Crear nuevo enrollment para el add-on
              const { data: insertedEnrollment, error: addonEnrollError } = await supabaseAdmin
                .from("enrollments")
                .insert({
                  user_id: userId,
                  course_id: addonCourseId,
                  enrolled_at: new Date().toISOString(),
                  expires_at: addonExpiresAtISO,
                  is_active: true,
                  progress_percentage: 0,
                })
                .select();

              if (addonEnrollError) {
                console.error(`❌ Error creando enrollment:`, addonEnrollError.message);
              } else {
                console.log(`✅ Add-on inscrito: ${addonCourse.title}`);
              }
            }
          } catch (addonError) {
            console.error(`❌ Error procesando addon:`, addonError instanceof Error ? addonError.message : addonError);
          }
        }
      }

      // Enviar emails de confirmación
      if (userData && courseData) {
        const userEmail = userData.email || "";
        const userName = userData.full_name || "";
        const courseTitle = courseData.title || "";

        try {
          // Email de confirmación de compra
          const planLabel = `Plan ${months} ${months === 1 ? 'mes' : 'meses'}`;

          const purchaseHtml = getPurchaseConfirmationTemplate({
            userName,
            userEmail,
            courseTitle,
            courseId,
            amount: paymentInfo.transaction_amount || 0,
            plan: planLabel,
            includesQuestions: false,
            paymentId: String(paymentId),
            purchaseDate: new Date().toISOString(),
          });

          await sendEmail({
            to: userEmail,
            subject: `✅ Confirmación de compra - ${courseTitle}`,
            html: purchaseHtml,
          });

          console.log("✅ Email de confirmación enviado");

          // Email de bienvenida solo si es nueva inscripción
          if (isNewEnrollment) {
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

            console.log("✅ Email de bienvenida enviado");
          }
        } catch (emailError) {
          console.error("❌ Error enviando emails:", emailError);
          // No fallar el webhook por error de email
        }
      }
    } else {
      console.log("⏳ Pago no aprobado aún, estado:", paymentInfo.status);
    }

    return NextResponse.json({ received: true, status: paymentInfo.status });
  } catch (err: any) {
    console.error("❌ Error en webhook:", err);
    console.error("Stack:", err.stack);

    // Retornar 200 para que MercadoPago no reintente inmediatamente
    // pero logear el error para debugging
    return NextResponse.json({
      received: true,
      error: err.message,
      warning: "Error procesado pero confirmado para evitar reintentos"
    }, { status: 200 });
  }
}

