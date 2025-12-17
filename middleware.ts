import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar la sesión
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Proteger rutas de administrador
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Proteger rutas de aprendizaje (learn)
  if (path.startsWith('/learn/')) {
    if (!user) {
      const encodedPath = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/auth/login?redirect=${encodedPath}`, request.url))
    }

    // Extraer courseId de la URL: /learn/[courseId] o /learn/[courseId]/[lessonId]
    const pathParts = path.split('/')
    const courseId = pathParts[2]

    if (courseId) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (!enrollment) {
        return NextResponse.redirect(new URL(`/courses/${courseId}`, request.url))
      }
    }
  }

  // Proteger rutas de dashboard (requieren autenticación)
  if (path.startsWith('/dashboard') || path.startsWith('/checkout')) {
    if (!user) {
      const encodedPath = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/auth/login?redirect=${encodedPath}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhook (webhooks)
     * - api/create-preference (payment API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api/webhook|api/create-preference|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}