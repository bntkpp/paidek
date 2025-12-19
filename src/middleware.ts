import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Permitir webhooks y APIs de pago sin autenticación
  if (pathname.startsWith('/api/webhook') || pathname.startsWith('/api/create-preference')) {
    return NextResponse.next()
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  const { data: { user } } = await supabase.auth.getUser()

  // Verificar si es una sesión de recuperación de contraseña
  // Esto previene que el usuario navegue por el sitio con una sesión de recuperación
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    try {
      const base64Url = session.access_token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload)
      
      const amr = payload.amr || []
      const isRecovery = Array.isArray(amr) && amr.some((a: any) => a.method === 'recovery')

      if (isRecovery) {
        // Permitir solo la página de actualización de contraseña y endpoints necesarios
        const allowedPaths = [
          '/auth/update-password',
          '/auth/sign-out',
          '/_next',
          '/favicon.ico'
        ]
        
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/api/auth')

        if (!isAllowed) {
          return NextResponse.redirect(new URL('/auth/update-password', request.url))
        }
      }
    } catch (e) {
      // Error silencioso al decodificar, continuar normal
    }
  }

  // Proteger rutas de admin
  if (pathname.startsWith('/admin')) {
    // Si no hay usuario, redirigir a login
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar que el usuario tenga rol de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Proteger rutas de dashboard y learn (requieren autenticación)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/learn')) {
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhook (webhooks)
     * - api/create-preference (payment creation)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/webhook|api/create-preference|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}