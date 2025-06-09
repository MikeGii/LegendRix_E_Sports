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

  // Calculate if admin is in driver mode
  const isAdminAsDriver = user?.role === 'admin' && currentView === 'user'

  console.log('🛡️ ProtectedRoute -', {
    pathname,
    user: user?.email,
    role: user?.role,
    currentView,
    isAdminAsDriver,
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

        // Check role requirement with admin-as-driver logic
        if (requiredRole) {
        // If requiring user role
        if (requiredRole === 'user') {
            // Allow if user is actually a user OR admin in driver mode
            if (user.role !== 'user' && !isAdminAsDriver) {
            console.log('🛡️ ProtectedRoute - User role required but user is admin not in driver mode, redirecting')
            router.replace('/admin-dashboard')
            return
            }
        }
        
        // If requiring admin role - always allow actual admins regardless of current view
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
  }, [user, isLoading, router, requiredRole, requireEmailVerified, requireAdminApproved, pathname, hasChecked, currentView, isAdminAsDriver])

  // Show loading while checking authentication or view state
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

  // Check role requirements with admin-as-driver logic
    if (requiredRole) {
    if (requiredRole === 'user') {
        // Allow if user is actually a user OR admin in driver mode
        if (user.role !== 'user' && !isAdminAsDriver) {
        console.log('🛡️ ProtectedRoute - Role mismatch (need user), not rendering content', {
            userRole: user.role,
            isAdminAsDriver,
            currentView
        })
        return null
        }
    }
    
    // For admin role requirement - always allow actual admins regardless of current view
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