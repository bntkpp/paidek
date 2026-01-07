"use server"

import { sendMetaEvent } from "@/lib/meta-conversions"

export async function trackPurchase(userId: string, courseId: string, title: string, price: number) {
  try {
    await sendMetaEvent(
      "Purchase",
      {
        external_id: userId,
      },
      {
        content_ids: [courseId],
        content_name: title,
        content_type: "product",
        value: price,
        currency: "CLP",
      }
    )
  } catch (error) {
    console.error("Failed to track purchase event:", error)
  }
}
