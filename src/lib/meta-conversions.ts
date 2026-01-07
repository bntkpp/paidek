import { headers } from "next/headers"

type UserData = {
  em?: string // Email (hashed SHA-256)
  ph?: string // Phone (hashed SHA-256)
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string // Click ID from cookie
  fbp?: string // Browser ID from cookie
  external_id?: string // User ID in your DB
  [key: string]: any
}

type CustomData = {
  value?: number
  currency?: string
  content_name?: string
  content_ids?: string[]
  content_type?: string
  [key: string]: any
}

type MetaEvent = {
  event_name: "Purchase" | "Lead" | "CompleteRegistration" | "ViewContent" | "InitiateCheckout" | "AddToCart" | string
  event_time: number
  event_source_url: string
  action_source: "website"
  user_data: UserData
  custom_data?: CustomData
}

/**
 * Envia un evento a la API de Conversiones de Meta
 */
export async function sendMetaEvent(
  eventName: MetaEvent["event_name"],
  userData: Omit<UserData, "client_ip_address" | "client_user_agent">,
  customData?: CustomData
) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN
  const testEventCode = process.env.META_TEST_EVENT_CODE

  if (!pixelId || !accessToken) {
    console.warn("Meta Pixel ID or Access Token is missing")
    return
  }

  // Obtener headers de la solicitud actual (Server Component / Action)
  const headersList = await headers()
  
  // IP y User Agent son obligatorios para una buena puntuación de coincidencia
  // En Vercel/Next.js 'x-forwarded-for' suele tener la IP real
  const clientIp = headersList.get("x-forwarded-for")?.split(",")[0] || "0.0.0.0"
  const userAgent = headersList.get("user-agent") || ""
  const referer = headersList.get("referer") || ""

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: referer,
        action_source: "website",
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          ...userData,
        },
        custom_data: customData,
      },
    ],
    ...(testEventCode && { test_event_code: testEventCode }),
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error sending Meta event:", JSON.stringify(errorData, null, 2))
    } else {
      // console.log("Meta event sent successfully:", eventName)
    }
  } catch (error) {
    console.error("Network error sending Meta event:", error)
  }
}
