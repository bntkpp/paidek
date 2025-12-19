import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const userId = searchParams.get("userId")

  if (!email && !userId) {
    return NextResponse.json({ error: "Se requiere 'email' o 'userId'" }, { status: 400 })
  }

  // Cliente con permisos de Admin (Service Role)
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

  try {
    let targetId = userId

    // Si nos dieron email, buscamos el ID
    if (!targetId && email) {
      // Listamos usuarios (paginado, pero buscamos en la primera pagina por simplicidad o iteramos)
      // Nota: listUsers no tiene filtro por email directo en todas las versiones, 
      // pero podemos buscar en los resultados.
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000
      })
      
      if (listError) throw listError

      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado en Auth con ese email" }, { status: 404 })
      }
      
      targetId = user.id
    }

    if (!targetId) {
       return NextResponse.json({ error: "No se pudo determinar el ID del usuario" }, { status: 400 })
    }

    console.log(`🗑️ Eliminando usuario: ${targetId}`)

    // 1. Limpiar tablas públicas (por si quedó algo)
    const tables = ["progress", "student_intake_forms", "enrollments", "payments", "profiles"]
    const cleanupResults = {}

    for (const table of tables) {
      // Usamos user_id para la mayoría, pero id para profiles
      const key = table === "profiles" ? "id" : "user_id"
      const { count, error } = await supabaseAdmin
        .from(table)
        .delete({ count: "exact" })
        .eq(key, targetId)
      
      // @ts-ignore
      cleanupResults[table] = error ? `Error: ${error.message}` : `Eliminados: ${count}`
    }

    // 2. Eliminar de Auth Users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetId)

    if (authError) {
      throw new Error(`Error eliminando de Auth: ${authError.message}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Usuario eliminado completamente",
      userId: targetId,
      cleanupDetails: cleanupResults
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
