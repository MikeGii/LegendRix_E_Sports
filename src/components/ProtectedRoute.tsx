'use client'

import { useAuth } from './AuthProvider'
import { useView } from './ViewProvider'  // Add this import
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
  const { currentView } = useView()  // Add this
  const router = useRouter()
  const pathname = usePathname()
  const [hasChecked, setHasChecked] = useState(false)

  console.log('🛡️ ProtectedRoute -', {
    pathname,
    user: user?.email,
    role: user?.role,
    currentView,  // Add this
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

      // Special handling for admin in driver mode accessing user routes
      const isAdminAsDriver = user.role === 'admin' && currentView === 'user'
      
      // Check role requirement with admin-as-driver logic
      if (requiredRole) {
        if (requiredRole === 'user' && !isAdminAsDriver && user.role !== 'user') {
          console.log('🛡️ ProtectedRoute - User role required, redirecting admin to admin dashboard')
          router.replace('/admin-dashboard')
          return
        }
        
        if (requiredRole === 'admin' && user.role !== 'admin') {
          console.log('🛡️ ProtectedRoute - Admin role required, redirecting to user dashboard')
          router.replace('/user-dashboard')
          return
        }
      }

      // For user dashboard, be more lenient with verification requirements
      if (pathname === '/user-dashboard') {
        console.log('🛡️ ProtectedRoute - User dashboard access allowed')
        return
      }

      // Special handling for admin as driver - they bypass verification requirements
      if (isAdminAsDriver) {
        console.log('🛡️ ProtectedRoute - Admin as driver, bypassing verification requirements')
        return
      }

      // Check email verification requirement for other routes (non-admins)
      if (requireEmailVerified && user.role !== 'admin' && !user.emailVerified) {
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
  }, [user, isLoading, router, requiredRole, requireEmailVerified, requireAdminApproved, pathname, hasChecked, currentView])

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

  // Special handling for admin in driver mode
  const isAdminAsDriver = user.role === 'admin' && currentView === 'user'

  // Check role requirements with admin-as-driver logic
  if (requiredRole) {
    if (requiredRole === 'user' && !isAdminAsDriver && user.role !== 'user') {
      console.log('🛡️ ProtectedRoute - Role mismatch (need user), not rendering content')
      return null
    }
    
    if (requiredRole === 'admin' && user.role !== 'admin') {
      console.log('🛡️ ProtectedRoute - Role mismatch (need admin), not rendering content')
      return null
    }
  }

  // For non-user-dashboard routes, check verification requirements
  if (pathname !== '/user-dashboard' && !isAdminAsDriver) {
    if (requireEmailVerified && user.role !== 'admin' && !user.emailVerified) {
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