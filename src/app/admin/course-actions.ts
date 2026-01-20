"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function reorderCourses(orderedIds: string[]) {
  const supabase = await createClient()

  // Actualizar cada curso con su nuevo índice
  const updates = orderedIds.map((id, index) => {
    return supabase
      .from("courses")
      .update({ position: index })
      .eq("id", id)
  })

  // Ejecutar todas las actualizaciones
  await Promise.all(updates)

  revalidatePath("/admin/courses")
  revalidatePath("/courses")
}
