"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function fixStorage() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const buckets = ["courses", "ebooks"]
    const results = []

    for (const bucket of buckets) {
      const { data, error } = await supabaseAdmin.storage.getBucket(bucket)

      if (error && error.message.includes("not found")) {
        // Create bucket if it doesn't exist
        const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        })

        if (createError) {
          console.error(`Error creating bucket ${bucket}:`, createError)
          results.push({ bucket, status: "error", message: createError.message })
        } else {
          results.push({ bucket, status: "created" })
        }
      } else if (data) {
        results.push({ bucket, status: "exists" })
      } else {
        results.push({ bucket, status: "error", message: error?.message })
      }
    }

    revalidatePath("/admin/status")
    return { success: true, results }
  } catch (error: any) {
    console.error("Error fixing storage:", error)
    return { success: false, error: error.message }
  }
}
