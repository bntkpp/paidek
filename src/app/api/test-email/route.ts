import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emails/send";
import { getWelcomeEmailTemplate, getPurchaseConfirmationTemplate } from "@/lib/emails/templates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const type = searchParams.get("type"); // 'welcome' | 'purchase' | null

  if (!email) {
    return NextResponse.json({ error: "Falta el parametro email. Usa: /api/test-email?email=tu@email.com" }, { status: 400 });
  }

  try {
    let subject = "Test de configuración Paidek 🚀";
    let html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h1>¡Funciona! 🎉</h1>
          <p>Si estás leyendo esto, la configuración de Resend y tu dominio <strong>institutopaidek.com</strong> está correcta.</p>
          <p>Los correos automáticos de compra y bienvenida ya deberían funcionar.</p>
        </div>
      `;

    if (type === 'welcome') {
      subject = "🎉 Bienvenido a Curso de Prueba";
      html = getWelcomeEmailTemplate({
        userName: "Estudiante de Prueba",
        userEmail: email,
        courseTitle: "Curso de Matemáticas Avanzadas",
        courseId: "demo-course-id"
      });
    } else if (type === 'purchase') {
      subject = "✅ Confirmación de compra - Curso de Prueba";
      html = getPurchaseConfirmationTemplate({
        userName: "Estudiante de Prueba",
        userEmail: email,
        courseTitle: "Curso de Matemáticas Avanzadas",
        courseId: "demo-course-id",
        amount: 29990,
        plan: "Plan Anual",
        includesQuestions: true,
        paymentId: "1234567890",
        purchaseDate: new Date().toISOString()
      });
    }

    const result = await sendEmail({
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true, type: type || 'simple', result });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
