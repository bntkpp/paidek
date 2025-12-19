"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ==================== COURSES ====================
export async function createCourse(data: any) {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from("courses")
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error("Error creating course:", error)
    throw new Error(`Error al crear curso: ${error.message}`)
  }

  revalidatePath("/admin/courses")
  revalidatePath("/courses")
  return course
}

export async function updateCourse(courseId: string, data: any) {
  console.log("🔄 Updating course:", courseId, data)
  
  const supabase = await createClient()
  
  // Primero verificar que el curso existe
  const { data: existingCourse, error: checkError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle()

  if (checkError) {
    console.error("Error checking course:", checkError)
    throw new Error(`Error al verificar curso: ${checkError.message}`)
  }

  if (!existingCourse) {
    console.error("Course not found:", courseId)
    throw new Error(`No se encontró el curso con ID: ${courseId}`)
  }

  // Ahora actualizar
  const { data: course, error } = await supabase
    .from("courses")
    .update(data)
    .eq("id", courseId)
    .select()
    .maybeSingle()

  if (error) {
    console.error("Error updating course:", error)
    throw new Error(`Error al actualizar curso: ${error.message}`)
  }

  if (!course) {
    console.error("No course returned after update")
    throw new Error("No se pudo actualizar el curso")
  }

  console.log("✅ Course updated successfully:", course)

  revalidatePath("/admin/courses")
  revalidatePath("/courses")
  revalidatePath(`/courses/${courseId}`)
  
  return course
}

export async function deleteCourse(courseId: string) {
  console.log("🗑️ Deleting course:", courseId)
  
  const supabase = await createClient()
  
  // Verificar si hay módulos asociados
  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .limit(1)

  if (modulesError) {
    console.error("Error checking modules:", modulesError)
    throw new Error(`Error al verificar módulos: ${modulesError.message}`)
  }

  if (modules && modules.length > 0) {
    throw new Error("No puedes eliminar un curso que tiene módulos asociados. Elimina primero los módulos.")
  }

  // Verificar si hay inscripciones asociadas
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .limit(1)

  if (enrollmentsError) {
    console.error("Error checking enrollments:", enrollmentsError)
    throw new Error(`Error al verificar inscripciones: ${enrollmentsError.message}`)
  }

  if (enrollments && enrollments.length > 0) {
    throw new Error("No puedes eliminar un curso que tiene inscripciones. Elimina primero las inscripciones.")
  }

  // Ahora sí eliminar
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)

  if (error) {
    console.error("Error deleting course:", error)
    throw new Error(`Error al eliminar curso: ${error.message}`)
  }

  console.log("✅ Course deleted successfully")

  revalidatePath("/admin/courses")
  revalidatePath("/courses")
}

// ==================== MODULES ====================
export async function createModule(data: any) {
  const supabase = await createClient()
  
  const { data: module, error } = await supabase
    .from("modules")
    .insert(data)
    .select("*, courses(title)")
    .maybeSingle()

  if (error) {
    console.error("Error creating module:", error)
    throw new Error(`Error al crear módulo: ${error.message}`)
  }

  revalidatePath("/admin/modules")
  return module
}

export async function updateModule(moduleId: string, data: any) {
  const supabase = await createClient()
  
  const { data: module, error } = await supabase
    .from("modules")
    .update(data)
    .eq("id", moduleId)
    .select("*, courses(title)")
    .maybeSingle()

  if (error) {
    console.error("Error updating module:", error)
    throw new Error(`Error al actualizar módulo: ${error.message}`)
  }

  if (!module) {
    throw new Error("No se encontró el módulo")
  }

  revalidatePath("/admin/modules")
  return module
}

export async function deleteModule(moduleId: string) {
  console.log("🗑️ Deleting module:", moduleId)
  
  const supabase = await createClient()
  
  // Verificar si hay lecciones asociadas
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId)
    .limit(1)

  if (lessonsError) {
    console.error("Error checking lessons:", lessonsError)
    throw new Error(`Error al verificar lecciones: ${lessonsError.message}`)
  }

  if (lessons && lessons.length > 0) {
    throw new Error("No puedes eliminar un módulo que tiene lecciones. Elimina primero las lecciones.")
  }

  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", moduleId)

  if (error) {
    console.error("Error deleting module:", error)
    throw new Error(`Error al eliminar módulo: ${error.message}`)
  }

  console.log("✅ Module deleted successfully")

  revalidatePath("/admin/modules")
}

// ==================== LESSONS ====================
export async function createLesson(data: any) {
  const supabase = await createClient()
  
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert(data)
    .select("*, modules(title, course_id, courses(title))")
    .maybeSingle()

  if (error) {
    console.error("Error creating lesson:", error)
    throw new Error(`Error al crear lección: ${error.message}`)
  }

  revalidatePath("/admin/lessons")
  return lesson
}

export async function updateLesson(lessonId: string, data: any) {
  const supabase = await createClient()
  
  const { data: lesson, error } = await supabase
    .from("lessons")
    .update(data)
    .eq("id", lessonId)
    .select("*, modules(title, course_id, courses(title))")
    .maybeSingle()

  if (error) {
    console.error("Error updating lesson:", error)
    throw new Error(`Error al actualizar lección: ${error.message}`)
  }

  if (!lesson) {
    throw new Error("No se encontró la lección")
  }

  revalidatePath("/admin/lessons")
  return lesson
}

export async function deleteLesson(lessonId: string) {
  console.log("🗑️ Deleting lesson:", lessonId)
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId)

  if (error) {
    console.error("Error deleting lesson:", error)
    throw new Error(`Error al eliminar lección: ${error.message}`)
  }

  console.log("✅ Lesson deleted successfully")

  revalidatePath("/admin/lessons")
}

// ==================== ENROLLMENTS ====================

export async function createEnrollment(data: {
  user_id: string
  course_id: string
  is_active: boolean
  plan_type: string | null
  expires_at: string | null
  enrolled_at: string
}) {
  const supabase = await createClient()

  // Verificar si el usuario ya está inscrito en este curso
  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id, expires_at, is_active")
    .eq("user_id", data.user_id)
    .eq("course_id", data.course_id)
    .single()

  let enrollment

  if (existingEnrollment) {
    // Si ya existe, renovar/extender la inscripción
    const { data: updatedEnrollment, error } = await supabase
      .from("enrollments")
      .update({
        is_active: data.is_active,
        plan_type: data.plan_type,
        expires_at: data.expires_at,
        enrolled_at: data.enrolled_at, // Actualizar fecha de inscripción
      })
      .eq("id", existingEnrollment.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating enrollment:", error)
      throw new Error(error.message)
    }

    enrollment = updatedEnrollment
  } else {
    // Crear nueva inscripción
    const { data: newEnrollment, error } = await supabase
      .from("enrollments")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Error creating enrollment:", error)
      throw new Error(error.message)
    }

    enrollment = newEnrollment
  }

  // Obtener los datos relacionados (usuario y curso)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", data.user_id)
    .single()

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", data.course_id)
    .single()

  // Combinar los datos
  const enrollmentWithDetails = {
    ...enrollment,
    profiles: userProfile || { full_name: "", email: "" },
    courses: course || { title: "" },
  }

  // Nota: Los add-ons opcionales se manejan en el webhook de Mercado Pago
  // cuando el usuario los selecciona en el checkout

  revalidatePath("/admin/enrollments")
  return enrollmentWithDetails
}

export async function updateEnrollment(
  id: string,
  data: {
    is_active?: boolean
    plan_type?: string | null
    expires_at?: string | null
  }
) {
  const supabase = await createClient()

  // Actualizar la inscripción
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating enrollment:", error)
    throw new Error(error.message)
  }

  // Obtener los datos relacionados
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", enrollment.user_id)
    .single()

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", enrollment.course_id)
    .single()

  // Combinar los datos
  const enrollmentWithDetails = {
    ...enrollment,
    profiles: userProfile || { full_name: "", email: "" },
    courses: course || { title: "" },
  }

  revalidatePath("/admin/enrollments")
  return enrollmentWithDetails
}

export async function deleteEnrollment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("enrollments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting enrollment:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin/enrollments")
}

export async function extendEnrollment(id: string, months: number) {
  const supabase = await createClient()

  // Obtener la inscripción actual
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("id", id)
    .single()

  if (!enrollment) {
    throw new Error("Inscripción no encontrada")
  }

  // Calcular nueva fecha de expiración
  const currentExpiry = enrollment.expires_at ? new Date(enrollment.expires_at) : new Date()
  const newExpiry = new Date(currentExpiry)
  newExpiry.setMonth(newExpiry.getMonth() + months)

  // Actualizar la inscripción
  const { data: updatedEnrollment, error } = await supabase
    .from("enrollments")
    .update({
      expires_at: newExpiry.toISOString(),
      is_active: true,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error extending enrollment:", error)
    throw new Error(error.message)
  }

  // Obtener los datos relacionados
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", updatedEnrollment.user_id)
    .single()

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", updatedEnrollment.course_id)
    .single()

  // Combinar los datos
  const enrollmentWithDetails = {
    ...updatedEnrollment,
    profiles: userProfile || { full_name: "", email: "" },
    courses: course || { title: "" },
  }

  revalidatePath("/admin/enrollments")
  return enrollmentWithDetails
}

// ==================== USERS ====================
export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .maybeSingle()

  if (error) {
    console.error("Error updating user role:", error)
    throw new Error(`Error al actualizar rol: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return data
}

// ==================== USER ACTIONS ====================
export async function updateUser(userId: string, data: { full_name?: string; role?: string }) {
  const supabase = await createClient()

  const { data: updatedUser, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  return updatedUser
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  // Crear admin client para poder eliminar el usuario de Auth
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 1. Eliminar datos relacionados (para evitar errores de Foreign Key)
  
  // Eliminar progreso
  await supabase.from("progress").delete().eq("user_id", userId)
  
  // Eliminar formularios de ingreso
  await supabase.from("student_intake_forms").delete().eq("user_id", userId)
  
  // Eliminar inscripciones
  await supabase.from("enrollments").delete().eq("user_id", userId)
  
  // Eliminar pagos
  await supabase.from("payments").delete().eq("user_id", userId)

  // 2. Eliminar de la tabla profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)

  if (profileError) {
    throw new Error(`Error al eliminar perfil: ${profileError.message}`)
  }

  // 3. Eliminar del sistema de autenticación de Supabase
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    console.error("Error deleting user from auth:", authError)
    // No lanzamos error aquí porque el perfil ya fue eliminado
    // y queremos que la operación continúe
  }

  revalidatePath("/admin/users")
}

// Función para limpiar usuarios huérfanos (que existen en Auth pero no en profiles)
export async function cleanOrphanAuthUsers() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Obtener todos los usuarios de Auth
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (authError) {
    throw new Error(`Error al obtener usuarios de Auth: ${authError.message}`)
  }

  // Obtener todos los profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id")

  if (profilesError) {
    throw new Error(`Error al obtener profiles: ${profilesError.message}`)
  }

  const profileIds = new Set(profiles?.map(p => p.id) || [])
  const orphanUsers = authUsers.users.filter(user => !profileIds.has(user.id))

  // Eliminar usuarios huérfanos
  const results = {
    total: orphanUsers.length,
    deleted: 0,
    errors: [] as string[]
  }

  for (const user of orphanUsers) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (error) {
      results.errors.push(`${user.email}: ${error.message}`)
    } else {
      results.deleted++
    }
  }

  revalidatePath("/admin/users")
  return results
}