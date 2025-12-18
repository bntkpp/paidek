import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const {
      user_id,
      course_id,
      full_name,
      phone,
      email,
      comuna,
      guardian,
      comments,
      sex,
      age,
      how_found_us,
      how_found_us_other,
      why_exams_libres,
    } = body

    // Validar que el user_id coincida con el usuario autenticado
    if (user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Validar campos requeridos
    if (!full_name || !phone || !email || !comuna || !sex || !age || !how_found_us || !why_exams_libres) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el usuario esté inscrito en el curso
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user_id)
      .eq("course_id", course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: "No estás inscrito en este curso" },
        { status: 403 }
      )
    }

    // Insertar o actualizar el formulario (upsert)
    const { data, error } = await supabase
      .from("student_intake_forms")
      .upsert(
        {
          user_id,
          course_id,
          full_name,
          phone,
          email,
          comuna,
          guardian: guardian || null,
          comments: comments || null,
          sex,
          age: parseInt(age),
          how_found_us,
          how_found_us_other: how_found_us === "otro" ? how_found_us_other : null,
          why_exams_libres,
        },
        {
          onConflict: "user_id,course_id",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving intake form:", error)
      return NextResponse.json(
        { error: "Error al guardar el formulario", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in intake form API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

// GET para obtener el formulario del usuario
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "courseId requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("student_intake_forms")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching intake form:", error)
      return NextResponse.json(
        { error: "Error al obtener el formulario" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Error in GET intake form:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
