'use client'

import { useAuth } from './AuthProvider'
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
  const router = useRouter()
  const pathname = usePathname()
  const [hasChecked, setHasChecked] = useState(false)

  console.log('🛡️ ProtectedRoute -', {
    pathname,
    user: user?.email,
    role: user?.role,
    isLoading,
    hasChecked,
    requiredRole
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

      // Check role requirement
      if (requiredRole && user.role !== requiredRole) {
        console.log('🛡️ ProtectedRoute - Wrong role, redirecting')
        if (user.role === 'admin') {
          router.replace('/admin-dashboard')
        } else {
          router.replace('/user-dashboard')
        }
        return
      }

      // For user dashboard, be more lenient with verification requirements
      if (pathname === '/user-dashboard') {
        console.log('🛡️ ProtectedRoute - User dashboard access allowed')
        return
      }

      // Check email verification requirement for other routes
      if (requireEmailVerified && !user.emailVerified) {
        console.log('🛡️ ProtectedRoute - Email not verified, redirecting to user dashboard')
        router.replace('/user-dashboard')
        return
      }

      // Check admin approval requirement (except for admins)
      if (requireAdminApproved && user.role !== 'admin' && !user.adminApproved) {
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

  if (requiredRole && user.role !== requiredRole) {
    console.log('🛡️ ProtectedRoute - Role mismatch, not rendering content')
    return null
  }

  // For non-user-dashboard routes, check verification requirements
  if (pathname !== '/user-dashboard') {
    if (requireEmailVerified && !user.emailVerified) {
      console.log('🛡️ ProtectedRoute - Email not verified, not rendering content')
      return null
    }
    
    if (requireAdminApproved && user.role !== 'admin' && !user.adminApproved) {
      console.log('🛡️ ProtectedRoute - Not approved, not rendering content')
      return null
    }
  }

  console.log('🛡️ ProtectedRoute - Rendering protected content')
  return <>{children}</>
}