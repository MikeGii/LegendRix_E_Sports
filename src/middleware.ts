import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🛡️ Middleware - checking path:', pathname)

  // Only protect API routes that need authentication
  const protectedApiRoutes = ['/api/admin']
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))

  if (isProtectedApiRoute) {
    console.log('🛡️ Middleware - protected API route:', pathname)
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🛡️ Middleware - no auth header for API route')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🛡️ Middleware - API route has auth header')
  }

  // Allow all page routes - protection will be handled by ProtectedRoute component
  console.log('🛡️ Middleware - allowing page route:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}