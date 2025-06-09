// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/verify-email']
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Protected dashboard routes
  const protectedRoutes = ['/user-dashboard', '/admin-dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.cookies.get('auth_token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
      
      // Check role-based access
      if (pathname.startsWith('/admin-dashboard') && decoded.role !== 'admin') {
        // Non-admin trying to access admin dashboard
        return NextResponse.redirect(new URL('/user-dashboard', request.url))
      }

      if (pathname.startsWith('/user-dashboard') && decoded.role === 'admin') {
        // Admin accessing user dashboard, redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin-dashboard', request.url))
      }

      return NextResponse.next()
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}