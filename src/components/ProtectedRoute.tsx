'use client'

import { useAuth } from './AuthProvider'
import { useView } from './ViewProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'admin'
  requireEmailVerified?: boolean
  requireAdminApproved?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireEmailVerified = true,
  requireAdminApproved = true
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const { currentView } = useView()
  const router = useRouter()
  const pathname = usePathname()
  const [hasChecked, setHasChecked] = useState(false)

  console.log('🛡️ ProtectedRoute -', {
    pathname,
    user: user?.email,
    role: user?.role,
    currentView,
    isLoading,
    hasChecked,
    requiredRole,
    emailVerified: user?.emailVerified,
    adminApproved: user?.adminApproved
  })

  useEffect(() => {
    if (!isLoading && !hasChecked) {
      setHasChecked(true)
      
      // No user logged in
      if (!user) {
        console.log('🛡️ ProtectedRoute - No user, redirecting to login')
        router.replace('/')
        return
      }

      // ADMINS CAN ACCESS EVERYTHING - no role restrictions for admins
      if (user.role === 'admin') {
        console.log('🛡️ ProtectedRoute - Admin user, access granted to all routes')
        return
      }

      // For regular users, check role requirements
      if (requiredRole === 'admin') {
        console.log('🛡️ ProtectedRoute - Admin role required but user is not admin, redirecting to user dashboard')
        router.replace('/user-dashboard')
        return
      }

      // For user dashboard, be more lenient with verification requirements
      if (pathname === '/user-dashboard') {
        console.log('🛡️ ProtectedRoute - User dashboard access allowed')
        return
      }

      // Check email verification requirement for regular users
      if (requireEmailVerified && !user.emailVerified) {
        console.log('🛡️ ProtectedRoute - Email not verified, redirecting to user dashboard')
        router.replace('/user-dashboard')
        return
      }

      // Check admin approval requirement for regular users
      if (requireAdminApproved && !user.adminApproved) {
        console.log('🛡️ ProtectedRoute - Not approved, redirecting to user dashboard')
        router.replace('/user-dashboard')
        return
      }
      
      console.log('🛡️ ProtectedRoute - All checks passed')
    }
  }, [user, isLoading, router, requiredRole, requireEmailVerified, requireAdminApproved, pathname, hasChecked])

  // Show loading while checking authentication
  if (isLoading || !hasChecked) {
    console.log('🛡️ ProtectedRoute - Showing loading state')
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if user doesn't meet requirements
  if (!user) {
    console.log('🛡️ ProtectedRoute - No user, not rendering content')
    return null
  }

  // ADMINS CAN ACCESS EVERYTHING - no restrictions in render
  if (user.role === 'admin') {
    console.log('🛡️ ProtectedRoute - Admin user, rendering content')
    return <>{children}</>
  }

  // For regular users, check requirements
  if (requiredRole === 'admin') {
    console.log('🛡️ ProtectedRoute - Admin role required but user is not admin, not rendering content')
    return null
  }

  // For non-user-dashboard routes, check verification requirements for regular users
  if (pathname !== '/user-dashboard') {
    if (requireEmailVerified && !user.emailVerified) {
      console.log('🛡️ ProtectedRoute - Email not verified, not rendering content')
      return null
    }
    
    if (requireAdminApproved && !user.adminApproved) {
      console.log('🛡️ ProtectedRoute - Not approved, not rendering content')
      return null
    }
  }

  console.log('🛡️ ProtectedRoute - Rendering protected content')
  return <>{children}</>
}