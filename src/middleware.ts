import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session before checking auth status
  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes
  const publicPaths = ['/login'] // Add any other public routes here

  // If user is not logged in and trying to access a protected route
  if (!user && !publicPaths.includes(request.nextUrl.pathname)) {
    console.log('Redirecting unauthenticated user to /login from:', request.nextUrl.pathname)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in and trying to access a public-only route (e.g., login page)
  if (user && publicPaths.includes(request.nextUrl.pathname)) {
    console.log('Redirecting authenticated user to / from:', request.nextUrl.pathname)
    return NextResponse.redirect(new URL('/', request.url)) // Redirect to home page or dashboard
  }

  // IMPORTANT: Avoid multiple await supabase.auth.getSession() calls
  // The user session is already refreshed by supabase.auth.getUser()
  // await supabase.auth.getSession() // This line is removed/commented out

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 