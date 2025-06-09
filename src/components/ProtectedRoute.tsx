// src/components/ProtectedRoute.tsx
'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!isLoading) {
      // No user logged in
      if (!user) {
        router.push('/')
        return
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'admin') {
          router.push('/admin-dashboard')
        } else {
          router.push('/user-dashboard')
        }
        return
      }

      // Check email verification requirement
      if (requireEmailVerified && !user.emailVerified) {
        router.push('/')
        return
      }

      // Check admin approval requirement (except for admins)
      if (requireAdminApproved && user.role !== 'admin' && !user.adminApproved) {
        router.push('/')
        return
      }
    }
  }, [user, isLoading, router, requiredRole, requireEmailVerified, requireAdminApproved])

  // Show loading while checking authentication
  if (isLoading) {
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
  if (!user || 
      (requiredRole && user.role !== requiredRole) ||
      (requireEmailVerified && !user.emailVerified) ||
      (requireAdminApproved && user.role !== 'admin' && !user.adminApproved)) {
    return null
  }

  return <>{children}</>
}