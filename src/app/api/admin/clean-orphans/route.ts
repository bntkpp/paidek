import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cleanOrphanAuthUsers } from "@/app/admin/actions"

export async function POST() {
  try {
    const supabase = await createClient()

    // Verificar que el usuario sea admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Ejecutar limpieza
    const results = await cleanOrphanAuthUsers()

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${results.deleted} de ${results.total} usuarios huérfanos`,
      results,
    })
  } catch (error: any) {
    console.error("Error cleaning orphan users:", error)
    return NextResponse.json(
      { error: error.message || "Error al limpiar usuarios huérfanos" },
      { status: 500 }
    )
  }
}
