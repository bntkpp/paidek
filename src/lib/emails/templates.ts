interface WelcomeEmailParams {
  userName: string
  userEmail: string
  courseTitle: string
  courseId: string
}

export function getWelcomeEmailTemplate({ userName, userEmail, courseTitle, courseId }: WelcomeEmailParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const courseUrl = `${baseUrl}/learn/${courseId}`
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a ${courseTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #18181b;
      font-size: 24px;
      margin-top: 0;
    }
    .content p {
      color: #52525b;
      font-size: 16px;
      margin: 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 24px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f4f4f5;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #71717a;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Bienvenido a Paidek!</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName || userEmail.split('@')[0]},</h2>
      <p>
        ¡Estamos emocionados de tenerte en <strong>${courseTitle}</strong>! Has dado el primer paso hacia 
        alcanzar tus metas de aprendizaje.
      </p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>📚 Curso:</strong> ${courseTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>✉️ Email:</strong> ${userEmail}</p>
      </div>

      <p>
        Ya tienes acceso completo al contenido del curso. Puedes comenzar a aprender inmediatamente 
        haciendo clic en el botón de abajo:
      </p>

      <center>
        <a href="${courseUrl}" class="button">Comenzar a Aprender 🚀</a>
      </center>

      <p style="margin-top: 32px; font-size: 14px; color: #71717a;">
        <strong>Consejos para aprovechar al máximo tu curso:</strong>
      </p>
      <ul style="color: #52525b; font-size: 14px;">
        <li>Establece un horario regular de estudio</li>
        <li>Completa las lecciones en orden</li>
        <li>Usa el chatbot para resolver tus dudas</li>
        <li>Marca las lecciones como completadas</li>
      </ul>
    </div>
    <div class="footer">
      <p>¿Necesitas ayuda? Contáctanos en <a href="mailto:hola@institutopaidek.com">hola@institutopaidek.com</a></p>
      <p style="margin-top: 16px;">
        © ${new Date().getFullYear()} Paidek. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

interface PurchaseConfirmationParams {
  userName: string
  userEmail: string
  courseTitle: string
  courseId: string
  amount: number
  plan?: string
  includesQuestions: boolean
  paymentId: string
  purchaseDate: string
}

export function getPurchaseConfirmationTemplate({
  userName,
  userEmail,
  courseTitle,
  courseId,
  amount,
  plan,
  includesQuestions,
  paymentId,
  purchaseDate,
}: PurchaseConfirmationParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const courseUrl = `${baseUrl}/learn/${courseId}`
  const dashboardUrl = `${baseUrl}/dashboard`
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Compra - ${courseTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .checkmark {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #18181b;
      font-size: 24px;
      margin-top: 0;
    }
    .content p {
      color: #52525b;
      font-size: 16px;
      margin: 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 24px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background-color: #fafafa;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e4e4e7;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #18181b;
      width: 40%;
    }
    .details-table td:last-child {
      color: #52525b;
    }
    .details-table tr:last-child td {
      border-bottom: none;
    }
    .total-row {
      background-color: #f0fdf4 !important;
    }
    .total-row td {
      font-size: 18px;
      font-weight: 700;
      color: #059669 !important;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #dbeafe;
      color: #1e40af;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #71717a;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Compra Exitosa!</h1>
    </div>
    <div class="content">
      <h2>Gracias por tu compra, ${userName || userEmail.split('@')[0]}</h2>
      <p>
        Tu pago ha sido procesado exitosamente. Ya tienes acceso completo a <strong>${courseTitle}</strong>.
      </p>

      <table class="details-table">
        <tr>
          <td>Curso</td>
          <td>${courseTitle}</td>
        </tr>
        ${plan ? `<tr><td>Plan</td><td>${plan}</td></tr>` : ''}
        ${includesQuestions ? `<tr><td>Extras</td><td>Preguntas tipo prueba <span class="badge">INCLUIDO</span></td></tr>` : ''}
        <tr>
          <td>Email</td>
          <td>${userEmail}</td>
        </tr>
        <tr>
          <td>Fecha</td>
          <td>${new Date(purchaseDate).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
        <tr>
          <td>ID de Pago</td>
          <td>${paymentId}</td>
        </tr>
        <tr class="total-row">
          <td>Total Pagado</td>
          <td>$${amount.toLocaleString('es-ES')}</td>
        </tr>
      </table>

      <center>
        <a href="${courseUrl}" class="button">Acceder al Curso 🎓</a>
      </center>

      <p style="margin-top: 32px; font-size: 14px; color: #71717a;">
        También puedes acceder a todos tus cursos desde tu <a href="${dashboardUrl}" style="color: #10b981;">panel de control</a>.
      </p>
    </div>
    <div class="footer">
      <p><strong>Recibo de compra</strong></p>
      <p style="margin-top: 8px;">Este correo sirve como confirmación de tu compra.</p>
      <p style="margin-top: 16px;">¿Preguntas? Escríbenos a <a href="mailto:hola@institutopaidek.com">hola@institutopaidek.com</a></p>
      <p style="margin-top: 16px;">
        © ${new Date().getFullYear()} Paidek. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
