import { Resend } from 'resend';

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("=== EMAIL MOCK (Falta RESEND_API_KEY) ===")
    console.log("Debug: process.env.RESEND_API_KEY is", typeof process.env.RESEND_API_KEY)
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("=============")
    return { success: true, id: 'mock-id' };
  }

  const resend = new Resend(apiKey);

  try {
    const data = await resend.emails.send({
      from: 'Paidek <paidek@institutopaidek.com>',
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
